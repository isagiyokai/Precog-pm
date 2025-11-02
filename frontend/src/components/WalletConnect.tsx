import { useCallback } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function WalletConnect() {
  const connectMetaMask = useCallback(async () => {
    try {
      // Basic EVM connect for MetaMask
      const eth = (window as any).ethereum;
      if (!eth) {
        toast.error('MetaMask not found');
        return;
      }
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts[0]) {
        const addr = accounts[0] as string;
        toast.success(`MetaMask connected: ${addr.slice(0,6)}...${addr.slice(-4)}`);
      }
    } catch (e) {
      toast.error('Failed to connect MetaMask');
    }
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Solana wallets (Phantom, Solflare, etc.) */}
      <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !text-white">
        <Wallet className="w-4 h-4 mr-1" />
        Connect Wallet
      </WalletMultiButton>
      {/* Optional EVM wallet */}
      <Button variant="outline" onClick={connectMetaMask} className="hidden sm:flex">
        MetaMask
      </Button>
    </div>
  );
}
