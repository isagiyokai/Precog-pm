import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { connectWallet, disconnectWallet, getWalletState } from '../lib/wallet-mock';
import { toast } from 'sonner@2.0.3';

export function WalletConnect() {
  const [wallet, setWallet] = useState(getWalletState());
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setWallet(getWalletState());
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const publicKey = await connectWallet();
      toast.success(`Connected: ${publicKey}`);
      setWallet(getWalletState());
    } catch (error) {
      toast.error('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setWallet(getWalletState());
    toast.success('Wallet disconnected');
  };

  if (wallet.connected && wallet.publicKey) {
    return (
      <Button
        variant="outline"
        onClick={handleDisconnect}
        className="gap-2"
      >
        <Wallet className="w-4 h-4" />
        {wallet.publicKey}
        <LogOut className="w-3 h-3 ml-1" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      className="gap-2"
    >
      <Wallet className="w-4 h-4" />
      {connecting ? 'Connecting...' : 'Connect Phantom'}
    </Button>
  );
}
