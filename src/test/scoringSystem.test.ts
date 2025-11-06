import { describe, it, expect } from 'vitest';
import { calculateScore, formatScore, getScoreMessage } from '../utils/scoringUtils';

describe('Scoring System', () => {
  describe('calculateScore', () => {
    it('should calculate exponential scoring correctly', () => {
      // Test single row clearing
      expect(calculateScore(1, 0)).toEqual({
        rowsCleared: 1,
        columnsCleared: 0,
        pointsEarned: 1, // 1²
      });

      // Test multiple rows clearing
      expect(calculateScore(2, 0)).toEqual({
        rowsCleared: 2,
        columnsCleared: 0,
        pointsEarned: 4, // 2²
      });

      // Test single column clearing
      expect(calculateScore(0, 1)).toEqual({
        rowsCleared: 0,
        columnsCleared: 1,
        pointsEarned: 1, // 1²
      });

      // Test multiple columns clearing
      expect(calculateScore(0, 3)).toEqual({
        rowsCleared: 0,
        columnsCleared: 3,
        pointsEarned: 9, // 3²
      });

      // Test mixed row and column clearing (with multiplier bonus)
      expect(calculateScore(1, 1)).toEqual({
        rowsCleared: 1,
        columnsCleared: 1,
        pointsEarned: 4, // 1² + 1² + (1×1×2)
      });

      // Test larger mixed clearing
      expect(calculateScore(2, 2)).toEqual({
        rowsCleared: 2,
        columnsCleared: 2,
        pointsEarned: 16, // 2² + 2² + (2×2×2) = 4 + 4 + 8
      });

      // Test complex scenario from documentation
      expect(calculateScore(3, 2)).toEqual({
        rowsCleared: 3,
        columnsCleared: 2,
        pointsEarned: 25, // 3² + 2² + (3×2×2) = 9 + 4 + 12
      });

      // Test no clearing
      expect(calculateScore(0, 0)).toEqual({
        rowsCleared: 0,
        columnsCleared: 0,
        pointsEarned: 0,
      });
    });
  });

  describe('formatScore', () => {
    it('should format scores with thousand separators', () => {
      expect(formatScore(0)).toBe('0');
      expect(formatScore(42)).toBe('42');
      expect(formatScore(1000)).toBe('1,000');
      expect(formatScore(12345)).toBe('12,345');
      expect(formatScore(999999)).toBe('999,999');
    });
  });

  describe('getScoreMessage', () => {
    it('should generate appropriate score messages', () => {
      expect(getScoreMessage({
        rowsCleared: 1,
        columnsCleared: 0,
        pointsEarned: 1,
      })).toBe('Cleared 1 row! +1 point');

      expect(getScoreMessage({
        rowsCleared: 2,
        columnsCleared: 0,
        pointsEarned: 4,
      })).toBe('Cleared 2 rows! +4 points');

      expect(getScoreMessage({
        rowsCleared: 0,
        columnsCleared: 1,
        pointsEarned: 1,
      })).toBe('Cleared 1 column! +1 point');

      expect(getScoreMessage({
        rowsCleared: 0,
        columnsCleared: 3,
        pointsEarned: 9,
      })).toBe('Cleared 3 columns! +9 points');

      expect(getScoreMessage({
        rowsCleared: 1,
        columnsCleared: 1,
        pointsEarned: 4,
      })).toBe('Cleared 1 row and 1 column! +4 points');

      expect(getScoreMessage({
        rowsCleared: 2,
        columnsCleared: 3,
        pointsEarned: 25,
      })).toBe('Cleared 2 rows and 3 columns! +25 points');

      expect(getScoreMessage({
        rowsCleared: 0,
        columnsCleared: 0,
        pointsEarned: 0,
      })).toBe('');
    });
  });
});