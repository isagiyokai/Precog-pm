/**
 * Mock Phantom wallet integration
 * In production, this would use @solana/wallet-adapter-react
 */

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
}

let walletState: WalletState = {
  connected: false,
  publicKey: null
};

export const connectWallet = async (): Promise<string> => {
  // Simulate wallet connection
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const mockPublicKey = `${Array.from({ length: 4 }, () => 
    Math.random().toString(36).substring(2, 6)
  ).join('')}...${Math.random().toString(36).substring(2, 6)}`;
  
  walletState = {
    connected: true,
    publicKey: mockPublicKey
  };
  
  return mockPublicKey;
};

export const disconnectWallet = () => {
  walletState = {
    connected: false,
    publicKey: null
  };
};

export const getWalletState = (): WalletState => {
  return walletState;
};

export const submitTransaction = async (type: string, data: any): Promise<string> => {
  // Simulate transaction submission
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock transaction hash
  const txHash = `${Array.from({ length: 4 }, () => 
    Math.random().toString(36).substring(2, 5).toUpperCase()
  ).join('...')}`;
  
  return txHash;
};
