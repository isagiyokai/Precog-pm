import { useState } from 'react';
import { Market } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { ArrowLeft, Clock, Lock, TrendingUp, Users, Shield, ExternalLink, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { copyToClipboard } from '../lib/clipboard';
import { verifyMxeProof, getExplorerUrl } from '../lib/solana-client';
import { toast } from 'sonner@2.0.3';

interface MarketDetailViewProps {
  market: Market;
  onBack: () => void;
  onPlaceBet: () => void;
}

export function MarketDetailView({ market, onBack, onPlaceBet }: MarketDetailViewProps) {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; verifier: string } | null>(null);

  const isDeadlinePassed = isPast(market.deadline);
  const showResults = market.status === 'Settled' && market.result;

  const handleVerifyProof = async () => {
    if (!market.result) return;
    
    setVerifying(true);
    try {
      const result = await verifyMxeProof(market.id, market.result.mxeProof);
      setVerificationResult(result);
      
      if (result.valid) {
        toast.success('MXE proof verified successfully!');
      } else {
        toast.error('Proof verification failed');
      }
    } catch (error) {
      toast.error('Failed to verify proof');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status: Market['status']) => {
    switch (status) {
      case 'Open': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Enqueued': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Settling': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Settled': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markets
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl mb-2">{market.question}</h1>
            {market.description && (
              <p className="text-muted-foreground">{market.description}</p>
            )}
          </div>
          <Badge className={getStatusColor(market.status)}>
            {market.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Deadline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{format(market.deadline, 'MMM d, yyyy')}</p>
            <p className="text-sm text-muted-foreground">
              {format(market.deadline, 'HH:mm:ss')} UTC
            </p>
            {!isDeadlinePassed && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(market.deadline, { addSuffix: true })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {showResults ? <TrendingUp className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Total Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showResults ? (
              <>
                <p className="text-lg">${(market.result.yesPool + market.result.noPool).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">USDC</p>
              </>
            ) : (
              <>
                <p className="text-lg italic">Private</p>
                <p className="text-xs text-muted-foreground">Encrypted until settlement</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              {market.resolutionMechanism === 'Oracle' ? '🔮 Oracle' : '👤 Manual'}
            </p>
            <p className="text-sm text-muted-foreground">
              {market.resolutionMechanism === 'Oracle' ? 'Automated' : 'By Creator'}
            </p>
          </CardContent>
        </Card>
      </div>

      {showResults && market.result && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Settlement Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Winning Side</span>
                <Badge className={market.result.winningSide === 'Yes' ? 'bg-green-600' : 'bg-red-600'}>
                  {market.result.winningSide}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span>YES Pool</span>
                  <span>${market.result.yesPool.toLocaleString()}</span>
                </div>
                <Progress 
                  value={(market.result.yesPool / (market.result.yesPool + market.result.noPool)) * 100} 
                  className="h-2 bg-green-900/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span>NO Pool</span>
                  <span>${market.result.noPool.toLocaleString()}</span>
                </div>
                <Progress 
                  value={(market.result.noPool / (market.result.yesPool + market.result.noPool)) * 100} 
                  className="h-2 bg-red-900/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t">
              <Users className="w-4 h-4" />
              <span>{market.result.totalParticipants} total participants</span>
            </div>

            <div className="space-y-2 pt-3 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">MXE Signed Proof</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs flex-1 bg-background px-3 py-2 rounded border break-all">
                    {market.result.mxeProof}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(market.result!.mxeProof)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleVerifyProof}
                  disabled={verifying}
                >
                  {verifying ? (
                    <>Verifying...</>
                  ) : verificationResult ? (
                    verificationResult.valid ? (
                      <><CheckCircle2 className="w-4 h-4 text-green-500" /> Verified</>
                    ) : (
                      <><AlertCircle className="w-4 h-4 text-red-500" /> Invalid</>
                    )
                  ) : (
                    <>Verify Proof</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const url = getExplorerUrl(market.result!.txHash);
                    window.open(url, '_blank');
                    toast.success('Opening Solana Explorer...');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  View Onchain
                </Button>
              </div>
              
              {verificationResult && (
                <div className={`text-xs p-2 rounded ${verificationResult.valid ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {verificationResult.valid ? (
                    <>✓ Result signed by Arcium MXE — settlement executed on Solana</>
                  ) : (
                    <>✗ Verification failed — proof invalid</>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {market.status === 'Enqueued' && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Market Resolution Enqueued
              </h3>
              <p className="text-sm text-muted-foreground">
                Waiting for Arcium MXE to process encrypted bets...
              </p>
              <Progress value={45} className="max-w-xs mx-auto" />
            </div>
          </CardContent>
        </Card>
      )}

      {market.status === 'Settling' && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-blue-500 animate-pulse" />
                Settlement in Progress
              </h3>
              <p className="text-sm text-muted-foreground">
                MXE computation complete. Finalizing onchain settlement...
              </p>
              <Progress value={75} className="max-w-xs mx-auto" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Bets are encrypted & private — nobody sees sizes or positions until settlement.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-purple-400">🔒</span>
              <span>Local encryption via Arcium SDK before onchain submission</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">🔄</span>
              <span>MPC computation across Arcium network nodes</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">✅</span>
              <span>Cryptographic proof verified onchain at settlement</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {market.status === 'Open' && !isDeadlinePassed && (
        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={onPlaceBet} className="gap-2">
            <Lock className="w-4 h-4" />
            Stake in Private
          </Button>
        </div>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
