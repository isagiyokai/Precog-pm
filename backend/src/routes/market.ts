import { Router, Request, Response } from 'express';
import { createMarket, placeBet, enqueueResolution, getMarketDetails } from '../services/solanaService';
import { triggerMXEJob, getMXEJobStatus } from '../services/arciumService';
import { encryptBetData } from '../services/encryptionService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/markets/create
 * Create a new prediction market
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { question, deadline, creatorPubkey } = req.body;

    if (!question || !deadline || !creatorPubkey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const deadlineTs = typeof deadline === 'string' ? Math.floor(new Date(deadline).getTime() / 1000) : Number(deadline);
    const result = await createMarket(question, deadlineTs, creatorPubkey);
    
    logger.info(`Market created: ${result.marketAddress}`);
    res.json({
      success: true,
      marketAddress: result.marketAddress,
      signature: result.signature
    });
  } catch (error: any) {
    logger.error(`Error creating market: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/markets/:marketId/bet
 * Place an encrypted bet on a market
 */
router.post('/:marketId/bet', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;
    const { choice, stake, userPubkey } = req.body;

    if (!choice || !stake || !userPubkey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Encrypt bet data
    const encryptedBlob = await encryptBetData({ marketId, choice, stake, userPubkey });

    // Submit to Solana
    const result = await placeBet(marketId, encryptedBlob, choice, stake, userPubkey);

    logger.info(`Bet tx built for market ${marketId} by ${userPubkey}`);
    res.json({
      success: true,
      tx: result.tx
    });
  } catch (error: any) {
    logger.error(`Error placing bet: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/markets/:marketId/resolve
 * Trigger market resolution via Arcium MXE
 */
router.post('/:marketId/resolve', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;

    // First, enqueue on Solana
    const solanaResult = await enqueueResolution(marketId);
    
    // Then trigger Arcium MXE job
    const mxeResult = await triggerMXEJob(marketId);

    logger.info(`Market ${marketId} resolution initiated. Job ID: ${mxeResult.jobId}`);
    res.json({
      success: true,
      jobId: mxeResult.jobId,
      signature: solanaResult.signature
    });
  } catch (error: any) {
    logger.error(`Error resolving market: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/markets/:marketId
 * Get market details
 */
router.get('/:marketId', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;
    const market = await getMarketDetails(marketId);
    res.json(market);
  } catch (error: any) {
    logger.error(`Error fetching market: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/markets/:marketId/job-status
 * Get MXE job status for market resolution
 */
router.get('/:marketId/job-status', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;
    const status = await getMXEJobStatus(marketId);
    res.json(status);
  } catch (error: any) {
    logger.error(`Error fetching job status: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
