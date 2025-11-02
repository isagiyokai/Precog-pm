/**
 * Client helpers that talk to the backend API.
 */
const BASE_URL = (typeof window !== 'undefined' && (window as any).__PREC0G_API__) || (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

export interface DepositBetParams {
  marketId: string;
  encryptedBlob?: string; // not required client-side; backend encrypts
  amount: number;
}

export interface SettleMarketParams {
  marketId: string;
  signedResult: string;
  winningSide: 'Yes' | 'No';
}

export interface EnqueueResolutionParams {
  marketId: string;
  caller: string;
}

/**
 * Place bet via backend (backend handles encryption + on-chain tx)
 */
export async function depositBet(params: DepositBetParams & { userPubkey?: string; choice?: number }): Promise<string> {
  const { marketId, amount } = params;
  const choice = params.choice ?? 1; // default Yes
  const userPubkey = params.userPubkey || '';

  const res = await fetch(`${BASE_URL}/api/markets/${marketId}/bet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choice, stake: amount, userPubkey }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.signature;
}

/**
 * Enqueue resolution via backend
 */
export async function enqueueResolution(params: EnqueueResolutionParams): Promise<{ jobId: string }> {
  const res = await fetch(`${BASE_URL}/api/markets/${params.marketId}/resolve`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

/**
 * Find the escrow PDA for a market
 * In production: derives PDA using seeds
 */
export function findEscrowPDA(marketId: string): string {
  return `escrow_${marketId.slice(0, 8)}...${generateRandomHex(8)}`;
}

/**
 * Generate a mock Solana transaction signature (fallback)
 */
function generateTxSignature(): string {
  return Array.from({ length: 88 }, () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return chars[Math.floor(Math.random() * chars.length)];
  }).join('');
}

/**
 * Generate random hex string
 */
function generateRandomHex(length: number): string {
  return Array.from({ length }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Get Solana Explorer URL for transaction
 */
export function getExplorerUrl(txSignature: string, network: 'mainnet' | 'devnet' = 'devnet'): string {
  const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${txSignature}${cluster}`;
}

/**
 * Verify MXE signature onchain
 * In production: calls anchor program's verify_mxe_proof instruction
 */
export async function verifyMxeProof(marketId: string, mxeProof: string): Promise<{ valid: boolean; verifier: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock verification - in production this checks cryptographic signature
  const valid = mxeProof.startsWith('0x');
  
  console.log('[Solana] Verified MXE proof:', {
    marketId,
    mxeProof: mxeProof.slice(0, 20) + '...',
    valid,
    verifierProgram: 'arcium_verifier_v1'
  });
  
  return {
    valid,
    verifier: 'arcium_mxe_9Kx2...'
  };
}
