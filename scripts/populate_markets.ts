import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.PROGRAM_ID || '';

/**
 * Populate test markets for demo purposes
 */
async function main() {
  console.log('🌱 Populating test markets...\n');

  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Load wallet
  const keypairPath = process.env.WALLET_KEYPAIR_PATH || '';
  const keypairData = JSON.parse(readFileSync(keypairPath.replace('~', require('os').homedir()), 'utf-8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(keypairData));

  console.log(`Wallet: ${wallet.publicKey.toString()}\n`);

  // Test market questions
  const testMarkets = [
    {
      question: 'Will Bitcoin reach $100k by end of 2024?',
      deadline: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
    },
    {
      question: 'Will Solana TPS exceed 100k this year?',
      deadline: Math.floor(Date.now() / 1000) + 86400 * 60, // 60 days
    },
    {
      question: 'Will there be a major crypto regulation in US in 2024?',
      deadline: Math.floor(Date.now() / 1000) + 86400 * 90, // 90 days
    },
  ];

  // TODO: Load program IDL and create markets
  console.log('TODO: Implement market creation');
  console.log('Markets to create:');
  testMarkets.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.question}`);
    console.log(`     Deadline: ${new Date(m.deadline * 1000).toISOString()}`);
  });

  console.log('\n✅ Done!');
}

main().catch(console.error);
