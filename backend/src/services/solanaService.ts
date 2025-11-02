import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AnchorProvider, Program, web3, BN, Idl } from '@coral-xyz/anchor';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { logger } from '../utils/logger';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { env } from '../utils/env';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// Load environment variables
const RPC_URL = env.RPC_URL;
const PROGRAM_ID = env.PROGRAM_ID;
const MXE_PROGRAM_ID = env.MXE_PROGRAM_ID;

// Initialize connection
const finalRpcUrl = process.env.HELIUS_KEY ? `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_KEY}` : RPC_URL;
const connection = new Connection(finalRpcUrl, 'confirmed');

function resolveIdlPath(): string {
  if (process.env.IDL_PATH && existsSync(process.env.IDL_PATH)) return process.env.IDL_PATH;
  const paths = [
    // common local build outputs
    `${process.cwd()}${require('path').sep}target${require('path').sep}idl${require('path').sep}market_factory.json`,
    `${process.cwd()}${require('path').sep}programs${require('path').sep}market_factory${require('path').sep}target${require('path').sep}idl${require('path').sep}market_factory.json`,
    `${process.cwd()}${require('path').sep}backend${require('path').sep}src${require('path').sep}idl${require('path').sep}market_factory.json`,
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  throw new Error('IDL not found. Set IDL_PATH env or run `anchor build` and ensure IDL is accessible.');
}

function loadIdl(): Idl {
  const idlPath = resolveIdlPath();
  const raw = readFileSync(idlPath, 'utf-8');
  return JSON.parse(raw);
}

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
  const kp = loadWallet();
  const wallet = new NodeWallet(kp);
  const provider = new AnchorProvider(
    connection,
    wallet,
    { commitment: 'confirmed' }
  );

  const idl = loadIdl();
  return new Program(idl as Idl, new PublicKey(PROGRAM_ID), provider);
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

    // Build instruction
    const ix = await program.methods
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
      .instruction();

    // Use latest blockhash to avoid recentBlockhash RPC issues
    const latest = await connection.getLatestBlockhash('confirmed');
    const tx = new web3.Transaction({
      feePayer: (program.provider as AnchorProvider).wallet.publicKey,
      recentBlockhash: latest.blockhash,
    }).add(ix);

    const sig = await (program.provider as AnchorProvider).sendAndConfirm(tx, [], {
      skipPreflight: false,
      commitment: 'confirmed',
    });

    logger.info(`Market created: ${marketPda.toString()}`);
    
    return {
      marketAddress: marketPda.toString(),
      signature: sig
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
  encryptedBlob: Buffer | string,
  choice: number,
  stake: number,
  userPubkey: string
): Promise<{ tx: string }> {
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

    // Use native wSOL mint for demo
    const mint = NATIVE_MINT;
    const userTokenAccount = getAssociatedTokenAddressSync(mint, user, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    const blob = typeof encryptedBlob === 'string' ? Buffer.from(encryptedBlob, 'hex') : encryptedBlob;

    // Build instructions: ensure ATA exists, wrap SOL, sync native, then deposit
    const ixs: web3.TransactionInstruction[] = [];
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        user, // payer
        userTokenAccount,
        user, // owner
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );

    const lamports = BigInt(Math.floor(stake * LAMPORTS_PER_SOL));
    ixs.push(
      SystemProgram.transfer({ fromPubkey: user, toPubkey: userTokenAccount, lamports: Number(lamports) }),
    );
    ixs.push(createSyncNativeInstruction(userTokenAccount));

    const depositIx = await program.methods
      .depositBet(Array.from(blob), choice, new BN(lamports.toString()))
      .accounts({
        market,
        betLog: betLogPda,
        escrowVault: escrowPda,
        userTokenAccount,
        user,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();
    ixs.push(depositIx);

    // Build unsigned tx for client to sign (user must sign)
    const latest = await connection.getLatestBlockhash('confirmed');
    const tx = new Transaction({ feePayer: user, recentBlockhash: latest.blockhash });
    for (const ix of ixs) tx.add(ix);

    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');

    return { tx: serialized };
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
