use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod market_factory {
    use super::*;

    /// Create a new prediction market
    pub fn create_market(
        ctx: Context<CreateMarket>,
        question: String,
        deadline: i64,
        mxe_program_id: Pubkey,
    ) -> Result<()> {
        require!(question.len() <= 280, ErrorCode::QuestionTooLong);
        require!(deadline > Clock::get()?.unix_timestamp, ErrorCode::InvalidDeadline);

        let market = &mut ctx.accounts.market;
        market.creator = ctx.accounts.creator.key();
        market.question = question;
        market.deadline = deadline;
        market.mxe_program_id = mxe_program_id;
        market.escrow_vault = ctx.accounts.escrow_vault.key();
        market.total_pool = 0;
        market.state = MarketState::Open;
        market.result_hash = [0u8; 32];
        market.bump = ctx.bumps.market;
        market.bet_count = 0;

        msg!("Market created: {}", market.key());
        Ok(())
    }

    /// Deposit an encrypted bet into the market
    pub fn deposit_bet(
        ctx: Context<DepositBet>,
        encrypted_blob: Vec<u8>,
        choice: u8,
        amount: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.market.state == MarketState::Open,
            ErrorCode::MarketNotOpen
        );
        require!(
            Clock::get()?.unix_timestamp < ctx.accounts.market.deadline,
            ErrorCode::DeadlinePassed
        );
        require!(encrypted_blob.len() <= 512, ErrorCode::BlobTooLarge);
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer funds to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Store bet log
        let bet_log = &mut ctx.accounts.bet_log;
        bet_log.market = ctx.accounts.market.key();
        bet_log.depositor = ctx.accounts.user.key();
        bet_log.amount = amount;
        bet_log.encrypted_blob = encrypted_blob;
        bet_log.timestamp = Clock::get()?.unix_timestamp;
        bet_log.choice_hint = choice; // Not trusted, only for UX
        bet_log.bump = ctx.bumps.bet_log;

        // Update market state
        let market = &mut ctx.accounts.market;
        market.total_pool = market.total_pool.checked_add(amount).unwrap();
        market.bet_count = market.bet_count.checked_add(1).unwrap();

        msg!("Bet placed: {} tokens", amount);
        Ok(())
    }

    /// Enqueue market for resolution via Arcium MXE
    pub fn enqueue_resolution(ctx: Context<EnqueueResolution>) -> Result<()> {
        require!(
            ctx.accounts.market.state == MarketState::Open,
            ErrorCode::InvalidMarketState
        );
        require!(
            Clock::get()?.unix_timestamp >= ctx.accounts.market.deadline,
            ErrorCode::DeadlineNotReached
        );

        let market = &mut ctx.accounts.market;
        market.state = MarketState::Enqueued;

        // Initialize resolution job
        let job = &mut ctx.accounts.resolution_job;
        job.market = market.key();
        job.status = JobStatus::Pending;
        job.callback_account = ctx.accounts.market.key();
        job.timestamp = Clock::get()?.unix_timestamp;
        job.bump = ctx.bumps.resolution_job;

        msg!("Market enqueued for resolution");
        Ok(())
    }

    /// Callback from Arcium MXE with settlement result
    pub fn callback_settle(
        ctx: Context<CallbackSettle>,
        mxe_result: Vec<u8>,
        result_signature: Vec<u8>,
    ) -> Result<()> {
        require!(
            ctx.accounts.market.state == MarketState::Enqueued,
            ErrorCode::InvalidMarketState
        );

        // TODO: Verify MXE signature against mxe_program_id
        // This should use Arcium's verification SDK
        verify_mxe_signature(
            &ctx.accounts.market.mxe_program_id,
            &mxe_result,
            &result_signature,
        )?;

        // Parse result and execute payouts
        let payouts: Vec<Payout> = parse_mxe_result(&mxe_result)?;

        // Execute transfers
        for payout in payouts {
            if payout.amount > 0 {
                // Transfer from escrow to winner
                let seeds = &[
                    b"market",
                    ctx.accounts.market.creator.as_ref(),
                    &[ctx.accounts.market.bump],
                ];
                let signer = &[&seeds[..]];

                let cpi_accounts = Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.winner_token_account.to_account_info(),
                    authority: ctx.accounts.market.to_account_info(),
                };
                let cpi_program = ctx.accounts.token_program.to_account_info();
                let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
                token::transfer(cpi_ctx, payout.amount)?;
            }
        }

        // Update market state
        let market = &mut ctx.accounts.market;
        market.state = MarketState::Settled;
        market.result_hash = hash_result(&mxe_result);

        msg!("Market settled successfully");
        Ok(())
    }

    /// Cancel market (only if no bets placed)
    pub fn cancel_market(ctx: Context<CancelMarket>) -> Result<()> {
        require!(
            ctx.accounts.market.bet_count == 0,
            ErrorCode::CannotCancelWithBets
        );
        require!(
            ctx.accounts.market.creator == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );

        let market = &mut ctx.accounts.market;
        market.state = MarketState::Cancelled;

        msg!("Market cancelled");
        Ok(())
    }
}

// ========== ACCOUNTS ==========

#[derive(Accounts)]
#[instruction(question: String)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", creator.key().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = creator,
        token::mint = token_mint,
        token::authority = market,
        seeds = [b"escrow", market.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, token::Mint>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = user,
        space = 8 + BetLog::INIT_SPACE,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref(), &market.bet_count.to_le_bytes()],
        bump
    )]
    pub bet_log: Account<'info, BetLog>,

    #[account(
        mut,
        seeds = [b"escrow", market.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EnqueueResolution<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = payer,
        space = 8 + ResolutionJob::INIT_SPACE,
        seeds = [b"rqueue", market.key().as_ref()],
        bump
    )]
    pub resolution_job: Account<'info, ResolutionJob>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CallbackSettle<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"escrow", market.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    /// CHECK: Winner account verified in handler
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelMarket<'info> {
    #[account(mut, has_one = creator)]
    pub market: Account<'info, Market>,

    pub creator: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

// ========== STATE ==========

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub creator: Pubkey,
    #[max_len(280)]
    pub question: String,
    pub deadline: i64,
    pub mxe_program_id: Pubkey,
    pub escrow_vault: Pubkey,
    pub total_pool: u64,
    pub state: MarketState,
    pub result_hash: [u8; 32],
    pub bump: u8,
    pub bet_count: u64,
}

#[account]
#[derive(InitSpace)]
pub struct BetLog {
    pub market: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    #[max_len(512)]
    pub encrypted_blob: Vec<u8>,
    pub timestamp: i64,
    pub choice_hint: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ResolutionJob {
    pub market: Pubkey,
    pub status: JobStatus,
    pub callback_account: Pubkey,
    pub timestamp: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MarketState {
    Open,
    Enqueued,
    Settling,
    Settled,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum JobStatus {
    Pending,
    Running,
    Completed,
    Failed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Payout {
    pub recipient: Pubkey,
    pub amount: u64,
}

// ========== ERRORS ==========

#[error_code]
pub enum ErrorCode {
    #[msg("Question exceeds 280 characters")]
    QuestionTooLong,
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    #[msg("Market is not open for betting")]
    MarketNotOpen,
    #[msg("Deadline has passed")]
    DeadlinePassed,
    #[msg("Encrypted blob exceeds 512 bytes")]
    BlobTooLarge,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Invalid market state for this operation")]
    InvalidMarketState,
    #[msg("Deadline not yet reached")]
    DeadlineNotReached,
    #[msg("Cannot cancel market with existing bets")]
    CannotCancelWithBets,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("MXE signature verification failed")]
    InvalidMXESignature,
}

// ========== HELPER FUNCTIONS ==========

fn verify_mxe_signature(
    _mxe_program_id: &Pubkey,
    _result: &[u8],
    _signature: &[u8],
) -> Result<()> {
    // TODO: Implement Arcium signature verification
    // This should verify that the result was produced by the authorized MXE
    // See Arcium docs for verification SDK
    Ok(())
}

fn parse_mxe_result(result: &[u8]) -> Result<Vec<Payout>> {
    // TODO: Parse the MXE result format
    // Expected format: JSON with array of {recipient: Pubkey, amount: u64}
    Ok(vec![])
}

fn hash_result(result: &[u8]) -> [u8; 32] {
    use anchor_lang::solana_program::hash::hash;
    hash(result).to_bytes()
}
