/**
 * Daily Challenge Streak Utilities
 * 
 * Manages daily challenge completion history and streak tracking.
 */

import type { DailyChallengeHistory, DailyChallengeRecord } from '../types/persistence';

/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the difference in days between two date strings
 */
export function getDaysDifference(date1Str: string, date2Str: string): number {
  const date1 = parseDateString(date1Str);
  const date2 = parseDateString(date2Str);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date string is consecutive (exactly 1 day after another)
 */
export function isConsecutiveDay(previousDate: string, currentDate: string): boolean {
  return getDaysDifference(previousDate, currentDate) === 1;
}

/**
 * Calculate current streak from completion history
 * Streak is broken if a day is missed (not consecutive)
 */
export function calculateStreak(records: DailyChallengeRecord[]): number {
  if (records.length === 0) return 0;

  // Sort records by date (most recent first)
  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));
  
  const today = getTodayDateString();
  const mostRecentDate = sortedRecords[0].date;

  // If most recent completion is not today or yesterday, streak is broken
  const daysSinceLastPlay = getDaysDifference(mostRecentDate, today);
  if (daysSinceLastPlay > 1) {
    return 0;
  }

  // Count consecutive days backwards from most recent
  let streak = 1;
  for (let i = 1; i < sortedRecords.length; i++) {
    const currentDate = sortedRecords[i - 1].date;
    const previousDate = sortedRecords[i].date;
    
    if (isConsecutiveDay(previousDate, currentDate)) {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}

/**
 * Find the longest streak in the history
 */
export function findLongestStreak(records: DailyChallengeRecord[]): number {
  if (records.length === 0) return 0;

  // Sort records by date (oldest first)
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedRecords.length; i++) {
    const previousDate = sortedRecords[i - 1].date;
    const currentDate = sortedRecords[i].date;

    if (isConsecutiveDay(previousDate, currentDate)) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Add a new daily challenge completion record
 */
export function addCompletionRecord(
  history: DailyChallengeHistory,
  record: DailyChallengeRecord
): DailyChallengeHistory {
  // Check if we already have a record for this date
  const existingIndex = history.records.findIndex(r => r.date === record.date);
  
  let updatedRecords: DailyChallengeRecord[];
  if (existingIndex >= 0) {
    // Update existing record if new score is better
    const existing = history.records[existingIndex];
    if (record.score > existing.score || record.stars > existing.stars) {
      updatedRecords = [...history.records];
      updatedRecords[existingIndex] = record;
    } else {
      // Keep existing record
      updatedRecords = history.records;
    }
  } else {
    // Add new record
    updatedRecords = [...history.records, record].sort((a, b) => a.date.localeCompare(b.date));
  }

  // Recalculate streaks
  const currentStreak = calculateStreak(updatedRecords);
  const longestStreak = Math.max(
    findLongestStreak(updatedRecords),
    history.longestStreak // Don't decrease longest streak
  );

  return {
    records: updatedRecords,
    currentStreak,
    longestStreak,
    lastPlayedDate: record.date,
    lastUpdated: Date.now(),
  };
}

/**
 * Create initial empty history
 */
export function createEmptyHistory(): DailyChallengeHistory {
  return {
    records: [],
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    lastUpdated: Date.now(),
  };
}

/**
 * Get record for a specific date
 */
export function getRecordForDate(
  history: DailyChallengeHistory,
  dateStr: string
): DailyChallengeRecord | null {
  return history.records.find(r => r.date === dateStr) || null;
}

/**
 * Check if user has completed today's challenge
 */
export function hasCompletedToday(history: DailyChallengeHistory): boolean {
  const today = getTodayDateString();
  return history.records.some(r => r.date === today);
}

/**
 * Get user's best score across all challenges
 */
export function getBestScore(history: DailyChallengeHistory): number {
  if (history.records.length === 0) return 0;
  return Math.max(...history.records.map(r => r.score));
}

/**
 * Get total number of challenges completed
 */
export function getTotalChallengesCompleted(history: DailyChallengeHistory): number {
  return history.records.length;
}

/**
 * Get total 3-star completions
 */
export function getPerfectCompletions(history: DailyChallengeHistory): number {
  return history.records.filter(r => r.stars === 3).length;
}
