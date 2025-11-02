import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Precog Prediction Market API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      markets: '/api/markets',
      users: '/api/users',
      health: '/health'
    }
  });
});

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
