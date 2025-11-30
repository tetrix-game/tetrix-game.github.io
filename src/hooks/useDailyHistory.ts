/**
 * Hook to load and display daily challenge history
 */

import { useState, useEffect } from 'react';
import { loadDailyHistory } from '../utils/persistenceAdapter';
import type { DailyChallengeHistory } from '../types/persistence';
import { createEmptyHistory } from '../utils/dailyStreakUtils';

export function useDailyHistory() {
  const [history, setHistory] = useState<DailyChallengeHistory>(createEmptyHistory());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const loadedHistory = await loadDailyHistory();
        if (isMounted) {
          setHistory(loadedHistory);
        }
      } catch (error) {
        console.error('Failed to load daily history:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { history, isLoading };
}
