import { describe, it, expect } from 'vitest';
import {
  convertPointsToCurrency,
  formatCurrencyBreakdown,
  getHighestCurrencyColor,
  CURRENCY_DENOMINATIONS
} from '../utils/currencyUtils';

describe('Currency System', () => {
  describe('convertPointsToCurrency', () => {
    it('should return empty array for 0 points', () => {
      expect(convertPointsToCurrency(0)).toEqual([]);
    });

    it('should convert bronze coins (ones place)', () => {
      const result = convertPointsToCurrency(42);
      expect(result).toEqual([
        { denomination: CURRENCY_DENOMINATIONS[5], count: 42 } // Bronze
      ]);
    });

    it('should convert silver coins (thousands place)', () => {
      const result = convertPointsToCurrency(5000);
      expect(result).toEqual([
        { denomination: CURRENCY_DENOMINATIONS[4], count: 5 } // Silver
      ]);
    });

    it('should convert mixed denominations', () => {
      const result = convertPointsToCurrency(1234567);
      expect(result).toEqual([
        { denomination: CURRENCY_DENOMINATIONS[3], count: 1 }, // 1 Gold (1,000,000)
        { denomination: CURRENCY_DENOMINATIONS[4], count: 234 }, // 234 Silver (234,000)
        { denomination: CURRENCY_DENOMINATIONS[5], count: 567 } // 567 Bronze
      ]);
    });

    it('should handle large numbers with all denominations', () => {
      const result = convertPointsToCurrency(1234567890123456);
      expect(result).toEqual([
        { denomination: CURRENCY_DENOMINATIONS[0], count: 1 }, // 1 Diamond
        { denomination: CURRENCY_DENOMINATIONS[1], count: 234 }, // 234 Sapphire
        { denomination: CURRENCY_DENOMINATIONS[2], count: 567 }, // 567 Ruby
        { denomination: CURRENCY_DENOMINATIONS[3], count: 890 }, // 890 Gold
        { denomination: CURRENCY_DENOMINATIONS[4], count: 123 }, // 123 Silver
        { denomination: CURRENCY_DENOMINATIONS[5], count: 456 } // 456 Bronze
      ]);
    });

    it('should skip denominations with 0 count', () => {
      const result = convertPointsToCurrency(1000001);
      expect(result).toEqual([
        { denomination: CURRENCY_DENOMINATIONS[3], count: 1 }, // 1 Gold (1,000,000)
        { denomination: CURRENCY_DENOMINATIONS[5], count: 1 } // 1 Bronze (skip silver)
      ]);
    });
  });

  describe('formatCurrencyBreakdown', () => {
    it('should return "0" for empty breakdown', () => {
      expect(formatCurrencyBreakdown([])).toBe('0');
    });

    it('should format single denomination', () => {
      const breakdown = convertPointsToCurrency(42);
      expect(formatCurrencyBreakdown(breakdown)).toBe('42🥉');
    });

    it('should format multiple denominations', () => {
      const breakdown = convertPointsToCurrency(1234567);
      expect(formatCurrencyBreakdown(breakdown)).toBe('1🥇 234🥈');
    });

    it('should format with thousand separators for large counts', () => {
      const breakdown = convertPointsToCurrency(123000000);
      expect(formatCurrencyBreakdown(breakdown)).toBe('123🥇');
    });

    it('should show "lots💎" when user has more than 999 diamonds', () => {
      // 1000 diamonds = 1,000,000,000,000,000,000 points
      const breakdown = convertPointsToCurrency(1000000000000000000);
      expect(formatCurrencyBreakdown(breakdown)).toBe('lots💎');
    });

    it('should show normal format when user has exactly 999 diamonds', () => {
      // 999 diamonds = 999,000,000,000,000,000 points
      const breakdown = convertPointsToCurrency(999000000000000000);
      expect(formatCurrencyBreakdown(breakdown)).toBe('999💎');
    });

    it('should show normal format when user has fewer than 1000 diamonds', () => {
      // 500 diamonds with some other currencies = 500 * 1e15 + 123 * 1e12 + 456 * 1e9
      const breakdown = convertPointsToCurrency(500000000000000000 + 123000000000000 + 456000000000);
      expect(formatCurrencyBreakdown(breakdown)).toBe('500💎 123💙');
    });
  });

  describe('getHighestCurrencyColor', () => {
    it('should return default color for 0 points', () => {
      expect(getHighestCurrencyColor(0)).toBe('#00ff88');
    });

    it('should return bronze color for small amounts', () => {
      expect(getHighestCurrencyColor(42)).toBe('#cd7f32');
    });

    it('should return silver color for thousands', () => {
      expect(getHighestCurrencyColor(5000)).toBe('#c0c0c0');
    });

    it('should return gold color for millions', () => {
      expect(getHighestCurrencyColor(1234567)).toBe('#ffd700');
    });

    it('should return diamond color for quadrillions', () => {
      expect(getHighestCurrencyColor(1234567890123456)).toBe('#b9f2ff');
    });
  });

  describe('Currency Denominations', () => {
    it('should have correct values for each denomination', () => {
      expect(CURRENCY_DENOMINATIONS[0].value).toBe(1000000000000000); // Diamond - Quadrillions
      expect(CURRENCY_DENOMINATIONS[1].value).toBe(1000000000000); // Sapphire - Trillions
      expect(CURRENCY_DENOMINATIONS[2].value).toBe(1000000000); // Ruby - Billions
      expect(CURRENCY_DENOMINATIONS[3].value).toBe(1000000); // Gold - Millions
      expect(CURRENCY_DENOMINATIONS[4].value).toBe(1000); // Silver - Thousands
      expect(CURRENCY_DENOMINATIONS[5].value).toBe(1); // Bronze - Ones
    });

    it('should be ordered from highest to lowest value', () => {
      for (let i = 0; i < CURRENCY_DENOMINATIONS.length - 1; i++) {
        expect(CURRENCY_DENOMINATIONS[i].value).toBeGreaterThan(CURRENCY_DENOMINATIONS[i + 1].value);
      }
    });
  });
});