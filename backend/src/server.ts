import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import marketRoutes from './routes/market';
import userRoutes from './routes/user';
import indexRoutes from './routes/index';
import { env, validateEnv } from './utils/env';

// Load environment variables
dotenv.config();
validateEnv();

const app: Application = express();
const PORT = env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN || 'http://127.0.0.1:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Routes
app.use('/', indexRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 Solana RPC: ${env.RPC_URL}`);
  logger.info(`🔐 Arcium Endpoint: ${env.ARCIUM_ENDPOINT}`);
});

export default app;
