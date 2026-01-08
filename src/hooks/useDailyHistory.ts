/**
 * Hook to load and display daily challenge history
 * DEPRECATED: Daily challenges removed in single-mode refactor
 */

import { useState } from 'react';

// Stub types for daily challenges (removed)
type DailyChallengeHistory = {
  records: [];
  currentStreak: 0;
  longestStreak: 0;
  lastPlayedDate: null;
  lastUpdated: number;
};

export function useDailyHistory() {
  const [history] = useState<DailyChallengeHistory>({
    records: [],
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    lastUpdated: Date.now()
  });
  const [isLoading] = useState(false);

  return { history, isLoading };
}
