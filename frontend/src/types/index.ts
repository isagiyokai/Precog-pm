export type MarketStatus = 'Open' | 'Enqueued' | 'Settling' | 'Settled';

export type ResolutionMechanism = 'Manual' | 'Oracle';

export type BetChoice = 'Yes' | 'No';

export interface Market {
  id: string;
  question: string;
  description?: string;
  deadline: Date;
  totalPool: number;
  status: MarketStatus;
  resolutionMechanism: ResolutionMechanism;
  mxeProgramId?: string;
  createdAt: Date;
  creator: string;
  result?: {
    winningSide: BetChoice;
    yesPool: number;
    noPool: number;
    totalParticipants: number;
    mxeProof: string;
    txHash: string;
  };
}

export interface Bet {
  id: string;
  marketId: string;
  choice: BetChoice;
  amount: number;
  depositor: string;
  timestamp: Date;
  encryptedBlob: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'settled';
  payout?: number;
}

export interface EncryptedBetData {
  marketId: string;
  choice: BetChoice;
  stake: number;
  depositorPubkey: string;
  nonce: string;
}
