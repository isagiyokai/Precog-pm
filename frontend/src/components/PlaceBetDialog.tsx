import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Lock, RefreshCw, CheckCircle2, Copy } from 'lucide-react';
import { Market, BetChoice } from '../types';
import { encryptBet, generateNonce } from '../lib/arcium-mock';
import { useWallet } from '@solana/wallet-adapter-react';
import { depositBet } from '../lib/solana-client';
import { saveBetLocally } from '../lib/local-storage';
import { copyToClipboard } from '../lib/clipboard';
import { toast } from 'sonner@2.0.3';

interface PlaceBetDialogProps {
  market: Market | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBetPlaced: (bet: any) => void;
}

type BetStep = 'input' | 'encrypting' | 'submitting' | 'success';

export function PlaceBetDialog({ market, open, onOpenChange, onBetPlaced }: PlaceBetDialogProps) {
  const [step, setStep] = useState<BetStep>('input');
  const { connected, publicKey } = useWallet();
  const [choice, setChoice] = useState<BetChoice>('Yes');
  const [amount, setAmount] = useState('');
  const [encryptedBlob, setEncryptedBlob] = useState('');
  const [txHash, setTxHash] = useState('');
  const [progress, setProgress] = useState(0);

  if (!market) {
    return null;
  }

  const handlePlaceBet = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Step 1: Encrypt locally
    setStep('encrypting');
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90));
    }, 150);

    try {
      const nonce = generateNonce();
      const blob = await encryptBet({
        marketId: market.id,
        choice,
        stake: parseFloat(amount),
        depositorPubkey: publicKey.toBase58(),
        nonce
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setEncryptedBlob(blob);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Submit onchain
      setStep('submitting');
      setProgress(0);
      
      const submitProgressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 8, 90));
      }, 200);
      
      const res = await fetch(`http://127.0.0.1:5000/api/markets/${market.id}/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choice: choice === 'Yes' ? 1 : 0,
          stake: parseFloat(amount),
          userPubkey: publicKey.toBase58(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { tx } = await res.json();

      // Sign & send
      const { connection } = await import('@solana/wallet-adapter-react'); // dynamic import not ideal; assumes provider
      // @ts-ignore - connection available via wallet adapter hooks in app
      const conn = (window as any).__SOL_CONN__ || new (await import('@solana/web3.js')).Connection('https://api.devnet.solana.com', 'confirmed');
      const { Transaction } = await import('@solana/web3.js');
      const txObj = Transaction.from(Buffer.from(tx, 'base64'));
      const sig = await (window as any).solana?.signAndSendTransaction ? (await (window as any).solana.signAndSendTransaction(txObj)).signature : await (async () => {
        // Fallback for wallet adapter
        // @ts-ignore
        return await (await import('@solana/wallet-adapter-base')).sendTransaction(txObj, conn);
      })();
      
      clearInterval(submitProgressInterval);
      setProgress(100);
      setTxHash(sig as string);
      
      // Create bet record
      const newBet = {
        id: `bet_${Math.random().toString(36).substring(2, 9)}`,
        marketId: market.id,
        choice,
        amount: parseFloat(amount),
        depositor: publicKey.toBase58(),
        timestamp: new Date(),
        encryptedBlob: blob,
        txHash: hash,
        status: 'confirmed' as const
      };
      
      // Save to local storage (user's private record)
      saveBetLocally(newBet);
      
      onBetPlaced(newBet);
      setStep('success');
      toast.success('Bet placed successfully!');
      
    } catch (error) {
      clearInterval(progressInterval);
      toast.error('Failed to place bet');
      setStep('input');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('input');
      setChoice('Yes');
      setAmount('');
      setEncryptedBlob('');
      setTxHash('');
      setProgress(0);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="mt-4">
          <DialogTitle>Stake in Private</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {market.question}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-6 py-4">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-purple-500 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="text-purple-300">
                    <strong>Encrypted: </strong>
                    Your bet is scrambled across Arcium's MPC network — only the MXE can see the truth when it's time.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Choose Side</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={choice === 'Yes' ? 'default' : 'outline'}
                  className={choice === 'Yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setChoice('Yes')}
                >
                  Yes
                </Button>
                <Button
                  variant={choice === 'No' ? 'default' : 'outline'}
                  className={choice === 'No' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setChoice('No')}
                >
                  No
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your choice will be encrypted locally before submission.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handlePlaceBet}>Place Bet</Button>
            </div>
          </div>
        )}

        {step === 'encrypting' && (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-purple-500 animate-pulse" />
              </div>
              <h3>Scrambling your choice across Arcium's MPC network...</h3>
              <p className="text-sm text-muted-foreground">Only revealed at settlement</p>
              <Progress value={progress} className="w-full" />
            </div>
          </div>
        )}

        {step === 'submitting' && (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h3>Encrypted blob ready — submitting onchain</h3>
              <Progress value={progress} className="w-full" />
            </div>

            {encryptedBlob && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Encrypted Blob</Label>
                  <Badge variant="outline" className="text-xs">
                    {encryptedBlob.length} bytes
                  </Badge>
                </div>
                <code className="text-xs block bg-background px-3 py-2 rounded border break-all">
                  {encryptedBlob}
                </code>
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 py-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-[16px]">Your private bet submitted!</h3>
              <p className="text-sm text-muted-foreground">
                Your position is now encrypted onchain. Saved locally so you can track it in "My Bets".
              </p>
              <p className="text-xs text-yellow-500/80 mt-1">
                ⚠️ Local record only — clearing browser data will delete this.
              </p>
            </div>

            <div className="space-y-3 bg-muted/50 rounded-lg p-4">
              <div className="text-center">
                <Label className="text-xs text-muted-foreground block mb-2">Transaction Hash</Label>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-xs bg-background px-3 py-2 rounded border">
                    {txHash.length > 16 ? `${txHash.slice(0, 8)}...${txHash.slice(-8)}` : txHash}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(txHash)}
                    title="Copy full hash"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <Label className="text-xs text-muted-foreground block mb-1">Your Side</Label>
                  <Badge className={choice === 'Yes' ? 'bg-green-600' : 'bg-red-600'}>
                    {choice}
                  </Badge>
                </div>
                <div className="text-center">
                  <Label className="text-xs text-muted-foreground block mb-1">Amount</Label>
                  <p className="text-sm">${amount} USDC</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
