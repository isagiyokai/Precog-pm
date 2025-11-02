import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  RPC_URL: string;
  PROGRAM_ID: string;
  WALLET_KEYPAIR_PATH: string;
  ARCIUM_API_KEY: string;
  ARCIUM_ENDPOINT: string;
  MXE_PROGRAM_ID: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  CORS_ORIGIN: string;
}

/**
 * Validate and export environment variables
 */
export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  RPC_URL: process.env.RPC_URL || 'https://api.devnet.solana.com',
  PROGRAM_ID: process.env.PROGRAM_ID || '',
  WALLET_KEYPAIR_PATH: process.env.WALLET_KEYPAIR_PATH || '~/.config/solana/id.json',
  ARCIUM_API_KEY: process.env.ARCIUM_API_KEY || '',
  ARCIUM_ENDPOINT: process.env.ARCIUM_ENDPOINT || 'https://testnet.api.arcium.com',
  MXE_PROGRAM_ID: process.env.MXE_PROGRAM_ID || '',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://127.0.0.1:5173',
};

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = [
    'RPC_URL',
    'PROGRAM_ID',
    'ARCIUM_API_KEY',
    'MXE_PROGRAM_ID',
    'WALLET_KEYPAIR_PATH',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
