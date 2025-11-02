import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';
import { Wallet, MoreHorizontal, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export function WalletConnect() {
  const { connecting } = useWallet();
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
      <div className="relative">
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !text-white">
          <Wallet className="w-4 h-4 mr-1" />
          {connecting ? (
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Connecting...
            </span>
          ) : (
            'Connect Wallet'
          )}
        </WalletMultiButton>
      </div>
      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More options">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={connectMetaMask}>Connect MetaMask</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
