import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { MarketCard } from './components/MarketCard';
import { CreateMarketDialog } from './components/CreateMarketDialog';
import { PlaceBetDialog } from './components/PlaceBetDialog';
import { MarketDetailView } from './components/MarketDetailView';
import { MyBetsView } from './components/MyBetsView';
import { WalletConnect } from './components/WalletConnect';
import { Market, Bet } from './types';
import { mockMarkets, mockUserBets } from './lib/mock-data';
import { getLocalBets } from './lib/local-storage';
import { Shield, Sparkles } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [markets, setMarkets] = useState<Market[]>(mockMarkets);
  const [userBets, setUserBets] = useState<Bet[]>(mockUserBets);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [placeBetMarket, setPlaceBetMarket] = useState<Market | null>(null);
  const [activeTab, setActiveTab] = useState('open');

  // Load bets from local storage on mount
  useEffect(() => {
    const localBets = getLocalBets();
    if (localBets.length > 0) {
      // Merge with mock bets, preferring local storage
      const localBetIds = new Set(localBets.map(b => b.id));
      const mockBetsFiltered = mockUserBets.filter(b => !localBetIds.has(b.id));
      setUserBets([...localBets, ...mockBetsFiltered]);
    }
  }, []);

  const handleMarketCreated = (market: Market) => {
    setMarkets([market, ...markets]);
  };

  const handleBetPlaced = (bet: Bet) => {
    setUserBets([bet, ...userBets]);
  };

  const openMarkets = markets.filter(m => m.status === 'Open');
  const resolvedMarkets = markets.filter(m => m.status === 'Settled');
  const activeMarkets = markets.filter(m => m.status === 'Enqueued' || m.status === 'Settling');

  const marketsMap = new Map(markets.map(m => [m.id, m]));

  if (selectedMarket) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-500" />
                <div>
                  <h1 className="text-xl">Precog Markets</h1>
                  <p className="text-xs text-muted-foreground">Predict. Protect. Prevail.</p>
                </div>
              </div>
              <WalletConnect />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <MarketDetailView
            market={selectedMarket}
            onBack={() => setSelectedMarket(null)}
            onPlaceBet={() => setPlaceBetMarket(selectedMarket)}
          />
        </main>

        <PlaceBetDialog
          market={placeBetMarket}
          open={!!placeBetMarket}
          onOpenChange={(open) => !open && setPlaceBetMarket(null)}
          onBetPlaced={handleBetPlaced}
        />

        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-xl">Precog Markets</h1>
                <p className="text-xs text-muted-foreground">Predict. Protect. Prevail.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreateMarketDialog onMarketCreated={handleMarketCreated} />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-2xl">Private Prediction Markets</h2>
            </div>
            <p className="text-muted-foreground">
              Bet on future events with complete privacy. Your positions are encrypted using Arcium's MPC network — 
              only revealed at settlement with cryptographic proof.
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="open">
              Open Markets
              {openMarkets.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500/20 rounded-full">
                  {openMarkets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-bets">
              My Bets
              {userBets.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 rounded-full">
                  {userBets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved
              {resolvedMarkets.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-500/20 rounded-full">
                  {resolvedMarkets.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6 space-y-4">
            {activeMarkets.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm text-muted-foreground">Settling</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeMarkets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      onClick={setSelectedMarket}
                    />
                  ))}
                </div>
              </div>
            )}

            {openMarkets.length > 0 ? (
              <div className="space-y-4">
                {activeMarkets.length > 0 && (
                  <h3 className="text-sm text-muted-foreground mt-8">Open for Betting</h3>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {openMarkets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      onClick={setSelectedMarket}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No open markets. Create one to get started!
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-bets" className="mt-6">
            <MyBetsView bets={userBets} markets={marketsMap} />
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            {resolvedMarkets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resolvedMarkets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    onClick={setSelectedMarket}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No resolved markets yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <PlaceBetDialog
        market={placeBetMarket}
        open={!!placeBetMarket}
        onOpenChange={(open) => !open && setPlaceBetMarket(null)}
        onBetPlaced={handleBetPlaced}
      />

      <Toaster />
    </div>
  );
}
