import { Market, Bet } from '../types';

export const mockMarkets: Market[] = [
  {
    id: 'mkt_1',
    question: 'Will Bitcoin reach $100,000 by end of 2025?',
    description: 'Market resolves YES if BTC/USD reaches or exceeds $100,000 on any major exchange before December 31, 2025 23:59:59 UTC.',
    deadline: new Date('2025-12-31T23:59:59Z'),
    totalPool: 0, // Private until reveal
    status: 'Open',
    resolutionMechanism: 'Oracle',
    mxeProgramId: 'mxe_7Kx9...',
    createdAt: new Date('2025-10-15'),
    creator: 'DfKx...7Rz2'
  },
  {
    id: 'mkt_2',
    question: 'Will Ethereum upgrade successfully complete in Q1 2026?',
    description: 'Resolves YES if the scheduled Ethereum network upgrade completes without rollback.',
    deadline: new Date('2026-03-31T23:59:59Z'),
    totalPool: 0,
    status: 'Open',
    resolutionMechanism: 'Manual',
    createdAt: new Date('2025-10-20'),
    creator: 'AbCd...3Xy9'
  },
  {
    id: 'mkt_3',
    question: 'Will SOL price exceed $200 in November 2025?',
    description: 'Market resolves based on Pyth oracle price feeds.',
    deadline: new Date('2025-11-30T23:59:59Z'),
    totalPool: 0,
    status: 'Enqueued',
    resolutionMechanism: 'Oracle',
    mxeProgramId: 'mxe_9Jk2...',
    createdAt: new Date('2025-10-01'),
    creator: 'Gh7x...4Pq1'
  },
  {
    id: 'mkt_4',
    question: 'Will Arcium TVL exceed $1B by end of year?',
    description: 'Based on official Arcium protocol metrics.',
    deadline: new Date('2025-10-15T00:00:00Z'),
    totalPool: 45230.50,
    status: 'Settled',
    resolutionMechanism: 'Manual',
    createdAt: new Date('2025-09-01'),
    creator: 'Mn3v...8Lk5',
    result: {
      winningSide: 'Yes',
      yesPool: 28450.25,
      noPool: 16780.25,
      totalParticipants: 47,
      mxeProof: '0x8f3a...d2c1',
      txHash: '3KpX...9Zf7'
    }
  }
];

export const mockUserBets: Bet[] = [
  {
    id: 'bet_1',
    marketId: 'mkt_1',
    choice: 'Yes',
    amount: 500,
    depositor: 'Your_Wallet',
    timestamp: new Date('2025-10-25'),
    encryptedBlob: '0x4f2a9b3c8d1e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
    txHash: '2Hx9...3Kp2',
    status: 'confirmed'
  },
  {
    id: 'bet_2',
    marketId: 'mkt_2',
    choice: 'No',
    amount: 250,
    depositor: 'Your_Wallet',
    timestamp: new Date('2025-10-28'),
    encryptedBlob: '0x7a3f2c9e1b4d8a6c3f9e2b5d8a1c4f7e3b6d9a2c5e8f1b4d7a0c3e6f9b2d5a8',
    txHash: '9Gf4...7Lm1',
    status: 'confirmed'
  }
];
