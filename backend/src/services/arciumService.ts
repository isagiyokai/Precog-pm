import { logger } from '../utils/logger';
import { connection } from './solanaService';
import { PublicKey } from '@solana/web3.js';

const ARCIUM_API_KEY = process.env.ARCIUM_API_KEY || '';
const ARCIUM_ENDPOINT = process.env.ARCIUM_ENDPOINT || 'https://testnet.api.arcium.com';
const MXE_PROGRAM_ID = process.env.MXE_PROGRAM_ID || '';

interface MXEJobInput {
  marketId: string;
  encryptedBets: Array<{
    depositorPubkey: string;
    encryptedBlob: Buffer;
    amount: number;
  }>;
  encryptedOracle?: Buffer;
  feeBps: number;
}

/**
 * Trigger an Arcium MXE job for market resolution
 */
export async function triggerMXEJob(marketId: string): Promise<{ jobId: string }> {
  try {
    // Step 1: Fetch all bets for this market from Solana
    const bets = await fetchMarketBets(marketId);
    
    // Step 2: Prepare MXE input
    const mxeInput: MXEJobInput = {
      marketId,
      encryptedBets: bets,
      feeBps: 50, // 0.5% fee
    };

    // Step 3: Call Arcium API to create MXE job
    const response = await fetch(`${ARCIUM_ENDPOINT}/v1/jobs/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARCIUM_API_KEY}`,
      },
      body: JSON.stringify({
        mxeProgramId: MXE_PROGRAM_ID,
        input: mxeInput,
        callbackUrl: `${process.env.BACKEND_URL}/api/markets/${marketId}/mxe-callback`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Arcium API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const jobId = data.jobId;

    logger.info(`MXE job created: ${jobId} for market ${marketId}`);
    
    return { jobId };
  } catch (error: any) {
    logger.error(`Arcium trigger MXE error: ${error.message}`);
    throw error;
  }
}

/**
 * Get MXE job status
 */
export async function getMXEJobStatus(marketId: string): Promise<any> {
  try {
    // TODO: Store jobId mapping in database
    // For now, return mock status
    
    const response = await fetch(`${ARCIUM_ENDPOINT}/v1/jobs/status/${marketId}`, {
      headers: {
        'Authorization': `Bearer ${ARCIUM_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Arcium API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    
    return {
      jobId: data.jobId,
      status: data.status, // 'pending', 'running', 'completed', 'failed'
      result: data.result,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
    };
  } catch (error: any) {
    logger.error(`Arcium get job status error: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch all bets for a market from Solana
 */
async function fetchMarketBets(marketId: string): Promise<any[]> {
  try {
    const market = new PublicKey(marketId);
    
    // TODO: Query all bet_log accounts for this market
    // Use getProgramAccounts with filters
    
    const bets: any[] = [
      // Example structure
      // {
      //   depositorPubkey: 'xxx',
      //   encryptedBlob: Buffer.from('...'),
      //   amount: 100
      // }
    ];

    logger.info(`Fetched ${bets.length} bets for market ${marketId}`);
    
    return bets;
  } catch (error: any) {
    logger.error(`Error fetching market bets: ${error.message}`);
    throw error;
  }
}

/**
 * Poll MXE job until completion
 */
export async function pollMXEJob(
  jobId: string,
  maxAttempts: number = 60,
  interval: number = 5000
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${ARCIUM_ENDPOINT}/v1/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${ARCIUM_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Arcium API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      
      if (data.status === 'completed') {
        logger.info(`MXE job ${jobId} completed`);
        return data.result;
      }
      
      if (data.status === 'failed') {
        throw new Error(`MXE job ${jobId} failed: ${data.error}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
      
    } catch (error: any) {
      logger.error(`Error polling MXE job: ${error.message}`);
      throw error;
    }
  }
  
  throw new Error(`MXE job ${jobId} timeout`);
}
