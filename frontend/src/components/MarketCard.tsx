import { useState } from 'react';
import { Market } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Lock, Clock, Users, Play } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { enqueueResolution } from '../lib/solana-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner@2.0.3';

interface MarketCardProps {
  market: Market;
  onClick: (market: Market) => void;
  onStatusChange?: (market: Market) => void;
}

export function MarketCard({ market, onClick, onStatusChange }: MarketCardProps) {
  const [enqueueing, setEnqueueing] = useState(false);
  const { connected, publicKey } = useWallet();

  const getStatusColor = (status: Market['status']) => {
    switch (status) {
      case 'Open': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Enqueued': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Settling': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Settled': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const isDeadlinePassed = new Date() > market.deadline;
  const showPool = market.status === 'Settled' && market.result;
  const canEnqueue = market.status === 'Open' && isDeadlinePassed;

  const handleEnqueue = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setEnqueueing(true);
    
    try {
      if (!connected || !publicKey) {
        toast.error('Please connect your wallet first');
        return;
      }

      const { jobId } = await enqueueResolution({
        marketId: market.id,
        caller: publicKey.toBase58(),
      });

      toast.success(`Market enqueued for resolution! Job ID: ${jobId.slice(0, 12)}...`);
      
      // Trigger status change if callback provided
      if (onStatusChange) {
        onStatusChange({ ...market, status: 'Enqueued' });
      }
    } catch (error) {
      toast.error('Failed to enqueue market');
    } finally {
      setEnqueueing(false);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:border-purple-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
      onClick={() => onClick(market)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{market.question}</CardTitle>
            {market.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {market.description}
              </CardDescription>
            )}
          </div>
          <Badge className={getStatusColor(market.status)}>
            {market.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {isDeadlinePassed ? (
                <>Deadline: {format(market.deadline, 'MMM d, yyyy HH:mm')}</>
              ) : (
                <>Closes {formatDistanceToNow(market.deadline, { addSuffix: true })}</>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {showPool ? (
              <>
                <Users className="w-4 h-4" />
                <span>Pool: ${market.result.yesPool + market.result.noPool} ({market.result.totalParticipants} participants)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span className="italic">Private pool — encrypted until settlement</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {market.resolutionMechanism === 'Oracle' ? '🔮 Oracle' : '👤 Manual'} Resolution
            </span>
            {market.result && (
              <Badge variant="outline" className="text-xs">
                Winner: {market.result.winningSide}
              </Badge>
            )}
          </div>
          {canEnqueue && (
            <div className="pt-3 border-t mt-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 text-xs"
                onClick={handleEnqueue}
                disabled={enqueueing}
              >
                <Play className="w-3 h-3" />
                {enqueueing ? 'Enqueueing...' : 'Enqueue Resolution'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
