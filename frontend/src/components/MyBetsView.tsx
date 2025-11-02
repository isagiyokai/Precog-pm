import { Bet } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format } from 'date-fns';
import { CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface MyBetsViewProps {
  bets: Bet[];
  markets: Map<string, any>;
}

export function MyBetsView({ bets, markets }: MyBetsViewProps) {
  if (bets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">You haven't placed any bets yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Private Bets</CardTitle>
        <p className="text-sm text-muted-foreground">
          Only you can see this information. It's stored locally and derived from your encrypted onchain data.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bets.map((bet) => {
              const market = markets.get(bet.marketId);
              const isWinner = market?.result?.winningSide === bet.choice;
              
              return (
                <TableRow key={bet.id}>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{market?.question || bet.marketId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={bet.choice === 'Yes' ? 'bg-green-600' : 'bg-red-600'}>
                      {bet.choice}
                    </Badge>
                  </TableCell>
                  <TableCell>${bet.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(bet.timestamp, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {bet.status === 'confirmed' && (
                      <div className="flex items-center gap-1 text-sm text-green-500">
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmed
                      </div>
                    )}
                    {bet.status === 'pending' && (
                      <div className="flex items-center gap-1 text-sm text-yellow-500">
                        <Clock className="w-4 h-4" />
                        Pending
                      </div>
                    )}
                    {bet.status === 'settled' && (
                      <div className="flex items-center gap-1 text-sm text-blue-500">
                        <TrendingUp className="w-4 h-4" />
                        Settled
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {bet.payout ? (
                      <span className={isWinner ? 'text-green-500' : 'text-red-500'}>
                        ${bet.payout.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">TBD</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
