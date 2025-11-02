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
  USE_HELIUS?: boolean;
  USDC_MINT?: string;
}

/**
 * Validate and export environment variables
 */
const s = (v?: string, d: string = '') => (v ?? d).trim();

export const env: EnvConfig = {
  PORT: parseInt(s(process.env.PORT, '5000'), 10),
  NODE_ENV: s(process.env.NODE_ENV, 'development'),
  RPC_URL: s(process.env.RPC_URL, 'https://api.devnet.solana.com'),
  PROGRAM_ID: s(process.env.PROGRAM_ID),
  WALLET_KEYPAIR_PATH: s(process.env.WALLET_KEYPAIR_PATH, '~/.config/solana/id.json'),
  ARCIUM_API_KEY: s(process.env.ARCIUM_API_KEY),
  ARCIUM_ENDPOINT: s(process.env.ARCIUM_ENDPOINT, 'https://testnet.api.arcium.com'),
  MXE_PROGRAM_ID: s(process.env.MXE_PROGRAM_ID),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: s(process.env.CORS_ORIGIN, 'http://127.0.0.1:5173'),
  USE_HELIUS: /^true$/i.test(s(process.env.USE_HELIUS, '')),
  USDC_MINT: s(process.env.USDC_MINT, ''),
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
