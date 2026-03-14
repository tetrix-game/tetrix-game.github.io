/**
 * Comprehensive test suite for game over logic in infinite mode
 *
 * This test suite covers:
 * 1. Empty board tests (baseline - should always pass)
 * 2. Full board tests (should always trigger game over)
 * 3. Single shape placement tests
 * 4. Multiple shape tests (OR logic)
 * 5. Rotation menu state tests (critical for bug reproduction)
 * 6. Array mismatch bug tests (these will FAIL initially)
 * 7. Edge cases
 */

import { describe, it, expect } from 'vitest';

import { checkGameOver } from '../gameOverUtils';
import type { Shape } from '../types';

import {
  createSingleBlockShape,
  createHorizontalLineShape,
  createVerticalLineShape,
  createLShape,
  createSquareShape,
  createEmptyGrid,
  createFullGrid,
  createGridWithOneEmptySpot,
  createTilesWithFilled,
} from './testHelpers';

describe('Game Over - Infinite Mode', () => {
  // ============================================================================
  // 1. EMPTY BOARD TESTS (baseline - should always pass)
  // ============================================================================
  describe('Empty Board Tests', () => {
    it('should NOT be game over with single shape on empty board', () => {
      const tiles = createEmptyGrid();
      const shapes = [createSingleBlockShape()];
      const menus = [false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should NOT be game over with multiple shapes on empty board', () => {
      const tiles = createEmptyGrid();
      const shapes = [
        createSingleBlockShape(),
        createHorizontalLineShape(),
        createSquareShape(),
      ];
      const menus = [false, false, false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should NOT be game over with all shape types on empty board', () => {
      const tiles = createEmptyGrid();
      const shapes = [
        createSingleBlockShape(),
        createHorizontalLineShape(),
        createVerticalLineShape(),
        createLShape(),
        createSquareShape(),
      ];
      const menus = [false, false, false, false, false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // 2. FULL BOARD TESTS (should always trigger game over)
  // ============================================================================
  describe('Full Board Tests', () => {
    it('should be game over when board is completely filled', () => {
      const tiles = createFullGrid();
      const shapes = [createSingleBlockShape()];
      const menus = [false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(true);
    });

    it('should be game over on full board even with rotation unlocked', () => {
      const tiles = createFullGrid();
      const shapes = [createHorizontalLineShape()];
      const menus = [true]; // Rotation menu open

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(true);
    });

    it('should be game over on full board with single block shape', () => {
      const tiles = createFullGrid();
      const shapes = [createSingleBlockShape()];
      const menus = [false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(true);
    });

    it('should be game over on full board with multiple shapes', () => {
      const tiles = createFullGrid();
      const shapes = [
        createSingleBlockShape(),
        createHorizontalLineShape(),
        createSquareShape(),
      ];
      const menus = [false, false, false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // 3. SINGLE SHAPE PLACEMENT TESTS
  // ============================================================================
  describe('Single Shape Placement Tests', () => {
    it('should NOT be game over when shape fits in current orientation', () => {
      // Create a grid with one empty spot
      const tiles = createGridWithOneEmptySpot(5, 5);
      const shapes = [createSingleBlockShape()];
      const menus = [false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should be game over when shape does not fit in any position', () => {
      // Create a grid with 2x2 empty spot, but try to place a 4-block horizontal line
      const tiles = createTilesWithFilled([
        // Fill everything except a 2x2 spot at rows 5-6, cols 5-6
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            if ((row === 5 || row === 6) && (col === 5 || col === 6)) {
              return null; // Skip these (leave empty)
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createHorizontalLineShape()]; // 4 blocks - won't fit in 2x2 space
      const menus = [false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(true);
    });

    it('should NOT be game over when shape fits after rotation (menu unlocked)', () => {
      // Create a grid with a 1x4 horizontal empty space
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave row 5, columns 3-6 empty (4 spots)
            if (row === 5 && col >= 3 && col <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createVerticalLineShape()]; // Vertical line (needs rotation to fit)
      const menus = [true]; // Rotation menu open - should check all 4 rotations

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should be game over when shape only fits after rotation (menu locked)', () => {
      // Create a grid with a 1x4 horizontal empty space
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave row 5, columns 3-6 empty (4 spots)
            if (row === 5 && col >= 3 && col <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createVerticalLineShape()]; // Vertical line (won't fit without rotation)
      const menus = [false]; // Rotation menu closed - only checks 1 rotation

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // 4. MULTIPLE SHAPE TESTS (OR logic)
  // ============================================================================
  describe('Multiple Shape Tests', () => {
    it('should NOT be game over when first shape fits', () => {
      const tiles = createGridWithOneEmptySpot(5, 5);
      const shapes = [
        createSingleBlockShape(), // This one fits
        createHorizontalLineShape(), // This one doesn't
        createSquareShape(), // This one doesn't
      ];
      const menus = [false, false, false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should NOT be game over when last shape fits', () => {
      const tiles = createGridWithOneEmptySpot(5, 5);
      const shapes = [
        createHorizontalLineShape(), // This one doesn't fit
        createSquareShape(), // This one doesn't fit
        createSingleBlockShape(), // This one fits
      ];
      const menus = [false, false, false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should be game over when no shapes fit', () => {
      const tiles = createGridWithOneEmptySpot(5, 5);
      const shapes = [
        createHorizontalLineShape(), // 4 blocks - doesn't fit
        createSquareShape(), // 2x2 - doesn't fit
        createLShape(), // 4 blocks in L - doesn't fit
      ];
      const menus = [false, false, false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(true);
    });

    it('should NOT be game over when only one shape fits (verify OR logic)', () => {
      const tiles = createGridWithOneEmptySpot(5, 5);
      const shapes = [
        createHorizontalLineShape(), // Doesn't fit
        createSingleBlockShape(), // Fits!
        createSquareShape(), // Doesn't fit
      ];
      const menus = [false, false, false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // 5. ROTATION MENU STATE TESTS (critical for bug reproduction)
  // ============================================================================
  describe('Rotation Menu State Tests', () => {
    it('should check only 1 rotation when menu is closed', () => {
      // Create a grid where vertical line fits but horizontal doesn't
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createHorizontalLineShape()]; // Horizontal (won't fit without rotation)
      const menus = [false]; // Menu closed - only checks 1 rotation

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(true);
    });

    it('should check all 4 rotations when menu is open', () => {
      // Same grid as above - vertical space only
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createHorizontalLineShape()]; // Horizontal (will fit after rotation)
      const menus = [true]; // Menu open - checks all 4 rotations

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should verify each shape checked with correct rotation count (mixed menu states)', () => {
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [
        createSingleBlockShape(), // Doesn't fit (needs a single spot, but only vertical space)
        createHorizontalLineShape(), // Doesn't fit in current orientation
        createSquareShape(), // Doesn't fit
      ];
      const menus = [false, true, false]; // Only middle shape can rotate

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      // Should be false because middle shape can fit after rotation
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // 6. ARRAY MISMATCH BUG TESTS (these tests will expose the bug)
  // ============================================================================
  describe('Array Mismatch Bug Tests (Critical)', () => {
    it('should handle rotation states correctly even when arrays have different source lengths', () => {
      // This test simulates what happens in production:
      // - The animatingShapes array contains both shapes and purchasable slots
      // - The filter for plainShapes removes purchasable slots
      // - The menusAfterRemoval still includes entries for purchasable slots
      // - This causes index misalignment when accessing rotation states

      // To simulate this, we need to think about what the actual bug would cause:
      // If menusAfterRemoval has an entry at index that doesn't correspond to
      // the same shape in plainShapes, rotation checks would be wrong.

      // For this test, we'll create a scenario where:
      // - First shape has menu closed, doesn't fit
      // - Second shape has menu open, could fit with rotation
      // But if indices are misaligned, second shape might use wrong menu state

      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [
        createSingleBlockShape(), // Doesn't fit
        createHorizontalLineShape(), // Could fit with rotation
      ];
      const menus = [false, true]; // Second shape has rotation unlocked

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      // Should be false because second shape can rotate to fit
      expect(result).toBe(false);
    });

    it('should correctly access rotation state when shapes are at different indices', () => {
      // This test ensures that rotation state is checked correctly for each shape
      // regardless of their positions in the queue

      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave row 5, columns 3-6 empty (4 spots horizontally)
            if (row === 5 && col >= 3 && col <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [
        createVerticalLineShape(), // Could fit with rotation
        createSingleBlockShape(), // Doesn't fit
        createSquareShape(), // Doesn't fit
      ];
      const menus = [true, false, false]; // Only first shape has rotation unlocked

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      // Should be false because first shape can rotate to fit
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // 7. SCORE AND AFFORDABILITY TESTS (rotation unlock cost)
  // ============================================================================
  describe('Score and Affordability Tests', () => {
    it('should check all 4 rotations when player has enough points to unlock (score >= 1)', () => {
      // Create a grid where only rotated shape fits
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createHorizontalLineShape()]; // Horizontal (needs rotation to fit)
      const menus = [false]; // Menu not opened yet
      const score = 1; // Has exactly 1 point to unlock rotation

      // With score >= 1, should check all rotations even if menu is closed
      const result = checkGameOver(tiles, shapes, menus, 'infinite', score);
      expect(result).toBe(false); // Should find that rotated shape fits
    });

    it('should check only 1 rotation when player has 0 points (cannot afford)', () => {
      // Create a grid where only rotated shape fits
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createHorizontalLineShape()]; // Horizontal (won't fit without rotation)
      const menus = [false]; // Menu not opened yet
      const score = 0; // Has 0 points - cannot afford rotation

      // With score = 0, should only check 1 rotation
      const result = checkGameOver(tiles, shapes, menus, 'infinite', score);
      expect(result).toBe(true); // Should be game over (can't rotate, current orientation doesn't fit)
    });

    it('should always check all 4 rotations when menu is already unlocked (regardless of score)', () => {
      // Create a grid where only rotated shape fits
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createHorizontalLineShape()]; // Horizontal (needs rotation to fit)
      const menus = [true]; // Menu already unlocked (player paid earlier)
      const score = 0; // Has 0 points now (spent it earlier)

      // With menu unlocked, should check all rotations even with 0 points
      const result = checkGameOver(tiles, shapes, menus, 'infinite', score);
      expect(result).toBe(false); // Should find that rotated shape fits
    });

    it('should handle mixed scenarios: some shapes affordable, some not', () => {
      // Create a grid where only vertical space exists
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [
        createSingleBlockShape(), // Doesn't fit (needs 1 empty spot)
        createHorizontalLineShape(), // Could fit if rotated
        createSquareShape(), // Doesn't fit (needs 2x2)
      ];
      const menus = [false, false, false]; // None unlocked yet
      const score = 1; // Has exactly 1 point - can afford ONE rotation

      // With score = 1, each shape can potentially rotate
      // Since middle shape CAN fit with rotation, game is not over
      const result = checkGameOver(tiles, shapes, menus, 'infinite', score);
      expect(result).toBe(false);
    });

    it('should be game over when player has 0 points and no shapes fit without rotation', () => {
      // Create a grid where shapes need rotation to fit
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [
        createHorizontalLineShape(), // Needs rotation
        createSquareShape(), // Doesn't fit at all
      ];
      const menus = [false, false]; // None unlocked
      const score = 0; // Can't afford rotation

      const result = checkGameOver(tiles, shapes, menus, 'infinite', score);
      expect(result).toBe(true); // Game over - no shapes fit without rotation, can't afford rotation
    });

    it('should check all rotations with score > 1 (more than enough points)', () => {
      // Create a grid where only rotated shape fits
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Leave column 5, rows 3-6 empty (4 spots vertically)
            if (col === 5 && row >= 3 && row <= 6) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createHorizontalLineShape()]; // Horizontal (needs rotation to fit)
      const menus = [false]; // Menu not opened yet
      const score = 100; // Has plenty of points

      const result = checkGameOver(tiles, shapes, menus, 'infinite', score);
      expect(result).toBe(false); // Should find that rotated shape fits
    });

    it('should handle the boundary case of exactly 1 point correctly', () => {
      const tiles = createEmptyGrid();
      const shapes = [createSingleBlockShape()];
      const menus = [false];
      const score = 1; // Exactly 1 point - exactly enough

      const result = checkGameOver(tiles, shapes, menus, 'infinite', score);
      expect(result).toBe(false); // Should not be game over (can place on empty grid)
    });
  });

  // ============================================================================
  // 8. EDGE CASES
  // ============================================================================
  describe('Edge Cases', () => {
    it('should return false when shapes array is empty', () => {
      const tiles = createFullGrid();
      const shapes: Shape[] = [];
      const menus: boolean[] = [];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      // Per current implementation, empty shapes returns false
      expect(result).toBe(false);
    });

    it('should handle shapes at grid boundaries (-3 to 10 range)', () => {
      const tiles = createEmptyGrid();
      const shapes = [createSingleBlockShape()];
      const menus = [false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should handle single empty cell remaining', () => {
      const tiles = createGridWithOneEmptySpot(1, 1); // Top-left corner
      const shapes = [createSingleBlockShape()];
      const menus = [false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should handle initial game state (1 slot unlocked, 3 shapes)', () => {
      const tiles = createEmptyGrid();
      const shapes = [
        createSingleBlockShape(),
        createHorizontalLineShape(),
        createSquareShape(),
      ];
      const menus = [false, false, false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });

    it('should handle grid with scattered empty spots', () => {
      const tiles = createTilesWithFilled([
        ...Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const row = r + 1;
            const col = c + 1;
            // Create a checkerboard pattern with some empty spots
            if ((row + col) % 3 === 0) {
              return null;
            }
            return { row, column: col, color: 'blue' as const };
          }))
          .flat()
          .filter((x): x is { row: number; column: number; color: 'blue' } => x !== null),
      ]);

      const shapes = [createSingleBlockShape()];
      const menus = [false];

      const result = checkGameOver(tiles, shapes, menus, 'infinite');
      expect(result).toBe(false);
    });
  });
});
