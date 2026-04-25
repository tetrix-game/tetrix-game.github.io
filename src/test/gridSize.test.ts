/**
 * Grid Size Configuration Tests
 *
 * Tests for dynamic grid size functionality, verifying that the grid can be
 * configured to different sizes beyond the default 10x10.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { GRID_SIZE, GRID_ADDRESSES, setGridSize, makeTileKey } from '../gridConstants';

import { createTilesWithFilled } from './testHelpers';

describe('Dynamic Grid Size', () => {
  // Store original size to restore after tests
  const originalSize = GRID_SIZE;

  // Reset to default size after each test
  beforeEach(() => {
    if (GRID_SIZE !== originalSize) {
      setGridSize(originalSize);
    }
  });

  describe('setGridSize', () => {
    it('should change GRID_SIZE to 8', () => {
      setGridSize(8);
      expect(GRID_SIZE).toBe(8);
    });

    it('should change GRID_SIZE to 12', () => {
      setGridSize(12);
      expect(GRID_SIZE).toBe(12);
    });

    it('should change GRID_SIZE to 15', () => {
      setGridSize(15);
      expect(GRID_SIZE).toBe(15);
    });

    it('should reject sizes below 4', () => {
      expect(() => setGridSize(3)).toThrow('Grid size must be between 4 and 20');
    });

    it('should reject sizes above 20', () => {
      expect(() => setGridSize(21)).toThrow('Grid size must be between 4 and 20');
    });

    it('should accept minimum valid size of 4', () => {
      setGridSize(4);
      expect(GRID_SIZE).toBe(4);
    });

    it('should accept maximum valid size of 20', () => {
      setGridSize(20);
      expect(GRID_SIZE).toBe(20);
    });
  });

  describe('GRID_ADDRESSES regeneration', () => {
    it('should generate 64 addresses for 8x8 grid', () => {
      setGridSize(8);
      expect(GRID_ADDRESSES.length).toBe(64);
      expect(GRID_ADDRESSES[0]).toBe('R0C0');
      expect(GRID_ADDRESSES[63]).toBe('R7C7');
    });

    it('should generate 144 addresses for 12x12 grid', () => {
      setGridSize(12);
      expect(GRID_ADDRESSES.length).toBe(144);
      expect(GRID_ADDRESSES[0]).toBe('R0C0');
      expect(GRID_ADDRESSES[143]).toBe('R11C11');
    });

    it('should generate 225 addresses for 15x15 grid', () => {
      setGridSize(15);
      expect(GRID_ADDRESSES.length).toBe(225);
      expect(GRID_ADDRESSES[0]).toBe('R0C0');
      expect(GRID_ADDRESSES[224]).toBe('R14C14');
    });

    it('should contain all correct addresses in row-major order for 5x5', () => {
      setGridSize(5);
      expect(GRID_ADDRESSES.length).toBe(25);

      // Check first row
      expect(GRID_ADDRESSES[0]).toBe('R0C0');
      expect(GRID_ADDRESSES[4]).toBe('R0C4');

      // Check last row
      expect(GRID_ADDRESSES[20]).toBe('R4C0');
      expect(GRID_ADDRESSES[24]).toBe('R4C4');
    });
  });

  describe('Tile key generation with different sizes', () => {
    it('should generate valid keys for 8x8 grid', () => {
      setGridSize(8);
      expect(makeTileKey(0, 0)).toBe('R0C0');
      expect(makeTileKey(7, 7)).toBe('R7C7');
      expect(makeTileKey(3, 5)).toBe('R3C5');
    });

    it('should generate valid keys for 15x15 grid', () => {
      setGridSize(15);
      expect(makeTileKey(0, 0)).toBe('R0C0');
      expect(makeTileKey(14, 14)).toBe('R14C14');
      expect(makeTileKey(9, 11)).toBe('R9C11');
    });
  });

  describe('Test helpers with different grid sizes', () => {
    it('should create correct tile set for 6x6 grid', () => {
      setGridSize(6);
      const tiles = createTilesWithFilled([
        { row: 0, column: 0, color: 'blue' },
        { row: 4, column: 4, color: 'red' },
      ]);

      expect(tiles.size).toBe(36);
      expect(tiles.get('R0C0')?.block.isFilled).toBe(true);
      expect(tiles.get('R5C5')?.block.isFilled).toBe(true);
      expect(tiles.get('R2C2')?.block.isFilled).toBe(false);
    });

    it('should create correct tile set for 12x12 grid', () => {
      setGridSize(12);
      const tiles = createTilesWithFilled([
        { row: 0, column: 0, color: 'blue' },
        { row: 11, column: 11, color: 'red' },
      ]);

      expect(tiles.size).toBe(144);
      expect(tiles.get('R0C0')?.block.isFilled).toBe(true);
      expect(tiles.get('R11C11')?.block.isFilled).toBe(true);
    });
  });

  describe('Grid size persistence across changes', () => {
    it('should maintain new size after multiple operations', () => {
      setGridSize(7);
      expect(GRID_SIZE).toBe(7);
      expect(GRID_ADDRESSES.length).toBe(49);

      // Perform some operations
      const key = makeTileKey(3, 4);
      expect(key).toBe('R3C4');

      // Size should still be 7
      expect(GRID_SIZE).toBe(7);
    });

    it('should properly reset to default 10x10', () => {
      setGridSize(8);
      expect(GRID_SIZE).toBe(8);

      setGridSize(10);
      expect(GRID_SIZE).toBe(10);
      expect(GRID_ADDRESSES.length).toBe(100);
    });
  });
});
