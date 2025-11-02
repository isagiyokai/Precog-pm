import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Lock, RefreshCw, Link2 } from 'lucide-react';
import { ResolutionMechanism } from '../types';
import { getMxeProgramId } from '../lib/arcium-mock';
import { useWallet } from '@solana/wallet-adapter-react';
import { copyToClipboard } from '../lib/clipboard';
import { toast } from 'sonner@2.0.3';

interface CreateMarketDialogProps {
  onMarketCreated: (market: any) => void;
}

export function CreateMarketDialog({ onMarketCreated }: CreateMarketDialogProps) {
  const [open, setOpen] = useState(false);
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [marketId, setMarketId] = useState('');
  const [mxeLink, setMxeLink] = useState('');
  
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    deadline: '',
    resolutionMechanism: 'Manual' as ResolutionMechanism
  });

  const handleCreate = async () => {
    if (!formData.question || !formData.deadline) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    
    try {
      if (!connected || !publicKey) {
        toast.error('Please connect your wallet first');
        return;
      }
      const mxeProgramId = getMxeProgramId();
      // simulate submit tx
      await new Promise(res => setTimeout(res, 1000));
      const txHash = Math.random().toString(16).slice(2);
      
      const newMarketId = `mkt_${Math.random().toString(36).substring(2, 9)}`;
      setMarketId(newMarketId);
      setMxeLink(`arcium://mxe/${mxeProgramId}`);
      
      const newMarket = {
        id: newMarketId,
        question: formData.question,
        description: formData.description,
        deadline: new Date(formData.deadline),
        totalPool: 0,
        status: 'Open' as const,
        resolutionMechanism: formData.resolutionMechanism,
        mxeProgramId: mxeProgramId,
        createdAt: new Date(),
        creator: 'You'
      };
      
      onMarketCreated(newMarket);
      setCreated(true);
      toast.success('Market created successfully!');
    } catch (error) {
      toast.error('Failed to create market');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setCreated(false);
      setMarketId('');
      setMxeLink('');
      setFormData({
        question: '',
        description: '',
        deadline: '',
        resolutionMechanism: 'Manual'
      });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) handleClose();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Market
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Prediction Market</DialogTitle>
          <DialogDescription>
            Create a new encrypted prediction market. All bets will be private until settlement.
          </DialogDescription>
        </DialogHeader>

        {!created ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">Market Question *</Label>
              <Input
                id="question"
                placeholder="Will Bitcoin reach $100,000 by end of 2025?"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional context and resolution criteria..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Mechanism</Label>
              <Select
                value={formData.resolutionMechanism}
                onValueChange={(value) => 
                  setFormData({ ...formData, resolutionMechanism: value as ResolutionMechanism })
                }
              >
                <SelectTrigger id="resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">👤 Manual (Market Creator)</SelectItem>
                  <SelectItem value="Oracle">🔮 Oracle (Automated)</SelectItem>
                </SelectContent>
              </Select>
              {formData.resolutionMechanism === 'Oracle' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Oracle will need to upload encrypted reports for automated resolution.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Create Market
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg">Market Created Successfully!</h3>
            </div>

            <div className="space-y-4 bg-muted/50 rounded-lg p-4">
              <div>
                <Label className="text-xs text-muted-foreground">Market ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm flex-1 bg-background px-3 py-2 rounded border">
                    {marketId}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(marketId)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">MXE Program Link</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm flex-1 bg-background px-3 py-2 rounded border truncate">
                    {mxeLink}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(mxeLink)}
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-2">
              <h4 className="text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Privacy Flow
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <span>1. 🔒 Lock: Bets encrypted locally</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>2. 🔄 MXE: Processing via Arcium network</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>3. 🤝 Settlement: Onchain with proof</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
