import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/users/:pubkey/bets
 * Get all bets for a user
 */
router.get('/:pubkey/bets', async (req: Request, res: Response) => {
  try {
    const { pubkey } = req.params;
    
    // TODO: Implement user bet history retrieval
    // This would query Solana for all bet_log accounts owned by this user
    
    res.json({
      pubkey,
      bets: []
    });
  } catch (error: any) {
    logger.error(`Error fetching user bets: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:pubkey/markets
 * Get all markets created by a user
 */
router.get('/:pubkey/markets', async (req: Request, res: Response) => {
  try {
    const { pubkey } = req.params;
    
    // TODO: Implement user market retrieval
    
    res.json({
      pubkey,
      markets: []
    });
  } catch (error: any) {
    logger.error(`Error fetching user markets: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
