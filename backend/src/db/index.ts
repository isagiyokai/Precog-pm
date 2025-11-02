import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient | null = null;

/**
 * Get Prisma client instance (singleton)
 */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    logger.info('Prisma client initialized');
  }
  return prisma;
}

/**
 * Initialize database connection
 */
export async function initDB(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set - database features disabled');
    return;
  }

  try {
    const client = getPrisma();
    await client.$connect();
    logger.info('Database connected successfully');
  } catch (error: any) {
    logger.error(`Database connection failed: ${error.message}`);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
}

// Handle process exit
process.on('beforeExit', async () => {
  await closeDB();
});

export { prisma };
