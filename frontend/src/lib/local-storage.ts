/**
 * Local storage for user's bet records
 * Stores bet details client-side so users can view their private positions
 * WARNING: Data is stored locally - clearing browser data will delete records
 */

import { Bet } from '../types';

const STORAGE_KEY = 'arcium_market_bets';

export interface LocalBetRecord extends Bet {
  // Additional local-only metadata
  localNote?: string;
}

/**
 * Save a bet record to local storage
 */
export function saveBetLocally(bet: LocalBetRecord): void {
  try {
    const existing = getLocalBets();
    const updated = [bet, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save bet locally:', error);
    throw new Error('Could not save bet to local storage');
  }
}

/**
 * Get all locally stored bets
 */
export function getLocalBets(): LocalBetRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    // Deserialize dates
    return parsed.map((bet: any) => ({
      ...bet,
      timestamp: new Date(bet.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load local bets:', error);
    return [];
  }
}

/**
 * Get a specific bet by ID
 */
export function getLocalBet(betId: string): LocalBetRecord | null {
  const bets = getLocalBets();
  return bets.find(b => b.id === betId) || null;
}

/**
 * Update bet status (e.g., when settled)
 */
export function updateBetStatus(betId: string, status: Bet['status'], payout?: number): void {
  try {
    const bets = getLocalBets();
    const updated = bets.map(bet => 
      bet.id === betId 
        ? { ...bet, status, ...(payout !== undefined && { payout }) }
        : bet
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update bet status:', error);
  }
}

/**
 * Clear all local bet records
 */
export function clearLocalBets(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get storage size estimate
 */
export function getStorageInfo(): { betCount: number; estimatedSizeKB: number } {
  const data = localStorage.getItem(STORAGE_KEY);
  return {
    betCount: getLocalBets().length,
    estimatedSizeKB: data ? Math.ceil(data.length / 1024) : 0
  };
}
