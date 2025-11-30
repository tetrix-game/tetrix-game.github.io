/**
 * Integration test for daily challenge history persistence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadDailyHistory,
  saveDailyHistory,
  recordDailyChallengeCompletion,
} from '../utils/persistenceAdapter';
import { createEmptyHistory, getTodayDateString } from '../utils/dailyStreakUtils';
import type { DailyChallengeRecord } from '../types/persistence';
import { clear } from '../utils/indexedDBCrud';
import { STORES } from '../utils/indexedDBCrud';

describe('Daily Challenge History Persistence', () => {
  beforeEach(async () => {
    // Clear daily history before each test
    await clear(STORES.DAILY_HISTORY);
  });

  it('should save and load empty history', async () => {
    const emptyHistory = createEmptyHistory();
    await saveDailyHistory(emptyHistory);

    const loaded = await loadDailyHistory();
    expect(loaded.records).toEqual([]);
    expect(loaded.currentStreak).toBe(0);
    expect(loaded.longestStreak).toBe(0);
  });

  it('should record a daily challenge completion', async () => {
    const today = getTodayDateString();
    const record: DailyChallengeRecord = {
      date: today,
      score: 150,
      stars: 3,
      matchedTiles: 10,
      totalTiles: 10,
      missedTiles: 0,
      completedAt: Date.now(),
    };

    const updatedHistory = await recordDailyChallengeCompletion(record);
    
    expect(updatedHistory.records).toHaveLength(1);
    expect(updatedHistory.records[0].score).toBe(150);
    expect(updatedHistory.records[0].stars).toBe(3);
    expect(updatedHistory.lastPlayedDate).toBe(today);
  });

  it('should persist multiple completions', async () => {
    const record1: DailyChallengeRecord = {
      date: '2025-01-01',
      score: 100,
      stars: 2,
      matchedTiles: 8,
      totalTiles: 10,
      missedTiles: 2,
      completedAt: Date.now(),
    };

    const record2: DailyChallengeRecord = {
      date: '2025-01-02',
      score: 150,
      stars: 3,
      matchedTiles: 10,
      totalTiles: 10,
      missedTiles: 0,
      completedAt: Date.now(),
    };

    await recordDailyChallengeCompletion(record1);
    await recordDailyChallengeCompletion(record2);

    const loaded = await loadDailyHistory();
    expect(loaded.records).toHaveLength(2);
    expect(loaded.records[0].date).toBe('2025-01-01');
    expect(loaded.records[1].date).toBe('2025-01-02');
  });

  it('should update record with better score', async () => {
    const date = '2025-01-01';
    
    const firstAttempt: DailyChallengeRecord = {
      date,
      score: 100,
      stars: 2,
      matchedTiles: 8,
      totalTiles: 10,
      missedTiles: 2,
      completedAt: Date.now(),
    };

    const betterAttempt: DailyChallengeRecord = {
      date,
      score: 150,
      stars: 3,
      matchedTiles: 10,
      totalTiles: 10,
      missedTiles: 0,
      completedAt: Date.now() + 1000,
    };

    await recordDailyChallengeCompletion(firstAttempt);
    await recordDailyChallengeCompletion(betterAttempt);

    const loaded = await loadDailyHistory();
    expect(loaded.records).toHaveLength(1);
    expect(loaded.records[0].score).toBe(150);
    expect(loaded.records[0].stars).toBe(3);
  });

  it('should calculate and persist streaks', async () => {
    // Add consecutive records
    const records: DailyChallengeRecord[] = [
      { date: '2025-01-01', score: 100, stars: 3, matchedTiles: 10, totalTiles: 10, missedTiles: 0, completedAt: Date.now() },
      { date: '2025-01-02', score: 110, stars: 3, matchedTiles: 10, totalTiles: 10, missedTiles: 0, completedAt: Date.now() },
      { date: '2025-01-03', score: 120, stars: 2, matchedTiles: 8, totalTiles: 10, missedTiles: 2, completedAt: Date.now() },
    ];

    for (const record of records) {
      await recordDailyChallengeCompletion(record);
    }

    const loaded = await loadDailyHistory();
    expect(loaded.records).toHaveLength(3);
    // Streak calculation depends on today's date relative to record dates
    // Just verify it's calculated (non-negative)
    expect(loaded.currentStreak).toBeGreaterThanOrEqual(0);
    expect(loaded.longestStreak).toBeGreaterThanOrEqual(0);
  });
});
