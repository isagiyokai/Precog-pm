export enum MarketState {
  Open = 'Open',
  Enqueued = 'Enqueued',
  Settling = 'Settling',
  Settled = 'Settled',
  Cancelled = 'Cancelled',
}

export enum JobStatus {
  Pending = 'Pending',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
}

export interface Market {
  address: string;
  creator: string;
  question: string;
  deadline: number;
  mxeProgramId: string;
  escrowVault: string;
  totalPool: number;
  state: MarketState;
  resultHash: string;
  betCount: number;
}

export interface BetLog {
  market: string;
  depositor: string;
  amount: number;
  encryptedBlob: Buffer;
  timestamp: number;
  choiceHint: number;
}

export interface MXEResult {
  marketId: string;
  winningChoice: number;
  totalPool: number;
  feeAmount: number;
  payouts: Payout[];
  timestamp: number;
}

export interface Payout {
  recipient: string;
  payout: number;
}

export interface CreateMarketRequest {
  question: string;
  deadline: number;
  creatorPubkey: string;
}

export interface PlaceBetRequest {
  choice: number;
  stake: number;
  userPubkey: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
