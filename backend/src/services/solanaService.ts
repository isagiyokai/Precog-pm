import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, web3, BN } from '@coral-xyz/anchor';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { logger } from '../utils/logger';

// Load environment variables
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.PROGRAM_ID || '';
const MXE_PROGRAM_ID = process.env.MXE_PROGRAM_ID || '';

// Initialize connection
const connection = new Connection(RPC_URL, 'confirmed');

/**
 * Load wallet keypair from file
 */
function loadWallet(): Keypair {
  const keypairPath = process.env.WALLET_KEYPAIR_PATH?.replace('~', homedir()) || '';
  try {
    const keypairData = JSON.parse(readFileSync(keypairPath, 'utf-8'));
    return Keypair.fromSecretKey(new Uint8Array(keypairData));
  } catch (error) {
    logger.error(`Failed to load wallet: ${error}`);
    throw new Error('Wallet loading failed');
  }
}

/**
 * Get Anchor program instance
 */
async function getProgram(): Promise<Program> {
  const wallet = loadWallet();
  const provider = new AnchorProvider(
    connection,
    wallet as any,
    { commitment: 'confirmed' }
  );

  // TODO: Load IDL from file or program
  const idl: any = {}; // Replace with actual IDL
  
  return new Program(idl, new PublicKey(PROGRAM_ID), provider);
}

/**
 * Create a new prediction market
 */
export async function createMarket(
  question: string,
  deadline: number,
  creatorPubkey: string
): Promise<{ marketAddress: string; signature: string }> {
  try {
    const program = await getProgram();
    const creator = new PublicKey(creatorPubkey);
    
    // Derive market PDA
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('market'), creator.toBuffer()],
      program.programId
    );

    // Derive escrow vault PDA
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), marketPda.toBuffer()],
      program.programId
    );

    // TODO: Add token mint parameter
    const tokenMint = new PublicKey('So11111111111111111111111111111111111111112'); // SOL mint

    const tx = await program.methods
      .createMarket(question, new BN(deadline), new PublicKey(MXE_PROGRAM_ID))
      .accounts({
        market: marketPda,
        escrowVault: escrowPda,
        tokenMint,
        creator,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    logger.info(`Market created: ${marketPda.toString()}`);
    
    return {
      marketAddress: marketPda.toString(),
      signature: tx
    };
  } catch (error: any) {
    logger.error(`Solana create market error: ${error.message}`);
    throw error;
  }
}

/**
 * Place an encrypted bet on a market
 */
export async function placeBet(
  marketId: string,
  encryptedBlob: Buffer,
  choice: number,
  stake: number,
  userPubkey: string
): Promise<{ betId: string; signature: string }> {
  try {
    const program = await getProgram();
    const market = new PublicKey(marketId);
    const user = new PublicKey(userPubkey);

    // Get market account to determine bet count
    const marketAccount: any = await program.account.market.fetch(market);
    
    // Derive bet log PDA
    const [betLogPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('bet'),
        market.toBuffer(),
        user.toBuffer(),
        Buffer.from(marketAccount.betCount.toArrayLike(Buffer, 'le', 8))
      ],
      program.programId
    );

    // Derive escrow vault PDA
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), market.toBuffer()],
      program.programId
    );

    // TODO: Get user token account
    const userTokenAccount = new PublicKey('...'); // Replace with actual ATA derivation

    const tx = await program.methods
      .depositBet(Array.from(encryptedBlob), choice, new BN(stake))
      .accounts({
        market,
        betLog: betLogPda,
        escrowVault: escrowPda,
        userTokenAccount,
        user,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    logger.info(`Bet placed: ${betLogPda.toString()}`);
    
    return {
      betId: betLogPda.toString(),
      signature: tx
    };
  } catch (error: any) {
    logger.error(`Solana place bet error: ${error.message}`);
    throw error;
  }
}

/**
 * Enqueue market for resolution
 */
export async function enqueueResolution(
  marketId: string
): Promise<{ signature: string }> {
  try {
    const program = await getProgram();
    const market = new PublicKey(marketId);
    const wallet = loadWallet();

    // Derive resolution job PDA
    const [resolutionJobPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('rqueue'), market.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .enqueueResolution()
      .accounts({
        market,
        resolutionJob: resolutionJobPda,
        payer: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    logger.info(`Market ${marketId} enqueued for resolution`);
    
    return { signature: tx };
  } catch (error: any) {
    logger.error(`Solana enqueue resolution error: ${error.message}`);
    throw error;
  }
}

/**
 * Get market details
 */
export async function getMarketDetails(marketId: string): Promise<any> {
  try {
    const program = await getProgram();
    const market = new PublicKey(marketId);
    
    const marketAccount: any = await program.account.market.fetch(market);
    
    return {
      address: marketId,
      creator: marketAccount.creator.toString(),
      question: marketAccount.question,
      deadline: marketAccount.deadline.toNumber(),
      totalPool: marketAccount.totalPool.toNumber(),
      state: marketAccount.state,
      betCount: marketAccount.betCount.toNumber()
    };
  } catch (error: any) {
    logger.error(`Solana get market error: ${error.message}`);
    throw error;
  }
}

/**
 * Submit MXE result for settlement
 */
export async function submitSettlement(
  marketId: string,
  mxeResult: Buffer,
  signature: Buffer
): Promise<{ signature: string }> {
  try {
    const program = await getProgram();
    const market = new PublicKey(marketId);
    const wallet = loadWallet();

    // Derive escrow vault PDA
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), market.toBuffer()],
      program.programId
    );

    // TODO: Derive winner token accounts from MXE result
    const winnerTokenAccount = new PublicKey('...'); // Parse from result

    const tx = await program.methods
      .callbackSettle(Array.from(mxeResult), Array.from(signature))
      .accounts({
        market,
        escrowVault: escrowPda,
        winnerTokenAccount,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc();

    logger.info(`Market ${marketId} settled`);
    
    return { signature: tx };
  } catch (error: any) {
    logger.error(`Solana submit settlement error: ${error.message}`);
    throw error;
  }
}

export { connection };
