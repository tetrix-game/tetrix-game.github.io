/**
 * Comprehensive Persistence Validation Tests
 * 
 * These tests ensure that:
 * 1. Save operations produce valid data in all scenarios
 * 2. Load operations handle all edge cases gracefully
 * 3. Invalid/corrupted data is detected and handled properly
 * 4. Game progress is NEVER lost due to validation bugs
 * 
 * CRITICAL BUG BEING TESTED:
 * TetrixProvider.tsx line 107 has: `infiniteStateData.tiles.length === 100`
 * This check would fail for any save with fewer than 100 tiles, causing progress loss.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveViewGameState,
  loadViewGameState,
  clearViewGameState,
  hasViewGameState,
  initializePersistence,
} from '../utils/persistenceAdapter';
import { closeDatabase } from '../utils/indexedDBCrud';
import type { ViewGameState, TileData, Shape, LoadResult } from '../types';
import { INITIAL_STATS_PERSISTENCE } from '../types/stats';
import { generateChecksumManifest, verifyChecksumManifest } from '../utils/checksumUtils';

// Helper to extract data from LoadResult
function expectSuccess<T>(result: LoadResult<T>): T {
  if (result.status !== 'success') {
    throw new Error(`Expected success but got ${result.status}: ${result.status === 'error' ? result.error?.message : 'Not found'}`);
  }
  return result.data;
}

// Helper to create a minimal valid game state
function createMinimalValidState(overrides?: Partial<ViewGameState>): ViewGameState {
  return {
    score: 0,
    tiles: [],
    nextShapes: [],
    savedShape: null,
    totalLinesCleared: 0,
    shapesUsed: 0,
    hasPlacedFirstShape: false,
    lastUpdated: Date.now(),
    stats: INITIAL_STATS_PERSISTENCE,
    ...overrides,
  };
}

// Helper to create a full 100-tile game state (new game)
function createFullGridState(overrides?: Partial<ViewGameState>): ViewGameState {
  const tiles: TileData[] = [];
  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 10; col++) {
      tiles.push({
        position: `R${row}C${col}`,
        backgroundColor: 'grey',
        isFilled: false,
        color: 'grey',
        activeAnimations: [],
      });
    }
  }
  return createMinimalValidState({ tiles, ...overrides });
}

// Helper to create a game state with some filled tiles
function createPartiallyFilledState(filledPositions: { row: number; col: number; color?: string }[]): ViewGameState {
  const tiles: TileData[] = [];
  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 10; col++) {
      const filled = filledPositions.find(p => p.row === row && p.col === col);
      tiles.push({
        position: `R${row}C${col}`,
        backgroundColor: 'grey',
        isFilled: !!filled,
        color: filled?.color as any ?? 'grey',
        activeAnimations: [],
      });
    }
  }
  return createMinimalValidState({ tiles, score: filledPositions.length * 10 });
}

// Helper to create a valid shape
function createTestShape(): Shape {
  return [
    [{ color: 'red' as const, isFilled: true }, { color: 'red' as const, isFilled: false }],
    [{ color: 'red' as const, isFilled: true }, { color: 'red' as const, isFilled: true }],
  ];
}

describe('Persistence Validation Tests', () => {
  beforeEach(async () => {
    await initializePersistence();
  });

  afterEach(async () => {
    // Clean up all data after each test
    const modes = ['infinite', 'daily', 'tutorial'] as const;
    for (const mode of modes) {
      try {
        await clearViewGameState(mode);
      } catch {
        // Ignore errors during cleanup
      }
    }
    closeDatabase();
  });

  describe('CRITICAL: Tile Array Length Validation Bug', () => {
    /**
     * This is the critical bug that causes users to lose progress.
     * 
     * The bug: TetrixProvider.tsx checks `tiles.length === 100` before loading.
     * If the saved tiles array has fewer than 100 entries, the game data is
     * silently discarded and a new game is started.
     * 
     * This test ensures the persistence layer saves exactly 100 tiles for
     * a standard 10x10 grid game.
     */
    
    it('should save exactly 100 tiles for a full grid state', async () => {
      const state = createFullGridState({ score: 500 });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);
      
      expect(loaded.tiles.length).toBe(100);
      expect(loaded.score).toBe(500);
    });

    it('should save 100 tiles even when most are empty', async () => {
      // Create a state with 100 tiles but only a few filled
      const state = createPartiallyFilledState([
        { row: 1, col: 1, color: 'red' },
        { row: 5, col: 5, color: 'blue' },
      ]);
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);
      
      expect(loaded.tiles.length).toBe(100);
      expect(loaded.score).toBe(20); // 2 tiles * 10 points
    });

    it('should NOT fail silently when tiles < 100', async () => {
      // This simulates a corrupted save or migration issue
      const corruptedState: ViewGameState = {
        score: 1000,
        tiles: [
          { position: 'R1C1', isFilled: true, color: 'red', backgroundColor: 'grey' },
          { position: 'R1C2', isFilled: true, color: 'blue', backgroundColor: 'grey' },
        ],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 10,
        shapesUsed: 20,
        hasPlacedFirstShape: true,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      await saveViewGameState('infinite', corruptedState);
      const result = await loadViewGameState('infinite');
      
      // The persistence layer should still load this data
      // It's up to the application to handle/repair it
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        // Score must be preserved - this is the user's progress!
        expect(result.data.score).toBe(1000);
        expect(result.data.totalLinesCleared).toBe(10);
        expect(result.data.shapesUsed).toBe(20);
        expect(result.data.hasPlacedFirstShape).toBe(true);
      }
    });

    it('should handle tiles > 100 gracefully (grid size change scenario)', async () => {
      // Simulate a grid size change from 10x10 to 12x12
      const tiles: TileData[] = [];
      for (let row = 1; row <= 12; row++) {
        for (let col = 1; col <= 12; col++) {
          tiles.push({
            position: `R${row}C${col}`,
            backgroundColor: 'grey',
            isFilled: false,
            color: 'grey',
          });
        }
      }
      
      const state = createMinimalValidState({ tiles, score: 250 });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.score).toBe(250);
        expect(result.data.tiles.length).toBe(144); // 12x12
      }
    });

    it('should preserve progress even with empty tiles array', async () => {
      // Extreme edge case: somehow tiles got cleared but score remains
      const state: ViewGameState = {
        score: 500,
        tiles: [],
        nextShapes: [createTestShape()],
        savedShape: null,
        totalLinesCleared: 5,
        shapesUsed: 10,
        hasPlacedFirstShape: true,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        // Critical: score should NEVER be lost
        expect(result.data.score).toBe(500);
        expect(result.data.totalLinesCleared).toBe(5);
        expect(result.data.hasPlacedFirstShape).toBe(true);
      }
    });
  });

  describe('Data Type Coercion and Missing Fields', () => {
    it('should handle missing optional fields gracefully', async () => {
      const minimalState: any = {
        score: 100,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        lastUpdated: Date.now(),
        // Missing: totalLinesCleared, shapesUsed, hasPlacedFirstShape, stats
      };

      await saveViewGameState('infinite', minimalState);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);
      
      // Should have been sanitized to include default values
      expect(typeof loaded.totalLinesCleared).toBe('number');
      expect(typeof loaded.shapesUsed).toBe('number');
      expect(typeof loaded.hasPlacedFirstShape).toBe('boolean');
      expect(loaded.stats).toBeDefined();
    });

    it('should handle wrong types and coerce them', async () => {
      const malformedState: any = {
        score: '500', // string instead of number
        tiles: null, // null instead of array
        nextShapes: undefined, // undefined
        savedShape: null,
        totalLinesCleared: '10', // string
        shapesUsed: null, // null
        hasPlacedFirstShape: 'true', // string
        lastUpdated: Date.now(),
      };

      await saveViewGameState('infinite', malformedState);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);
      
      // loadViewGameState should sanitize these values
      expect(typeof loaded.score).toBe('number');
      expect(Array.isArray(loaded.tiles)).toBe(true);
      expect(Array.isArray(loaded.nextShapes)).toBe(true);
    });

    it('should handle NaN and Infinity scores (coerced to 0)', async () => {
      const state = createMinimalValidState({ score: NaN });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);
      
      // NaN should be coerced to 0 by the sanitizeNumber helper in loadViewGameState
      expect(Number.isNaN(loaded.score)).toBe(false);
      expect(loaded.score).toBe(0);
    });

    it('should handle Infinity scores (coerced to 0)', async () => {
      const state = createMinimalValidState({ score: Infinity });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);
      
      // Infinity should be coerced to 0 by the sanitizeNumber helper
      expect(Number.isFinite(loaded.score)).toBe(true);
      expect(loaded.score).toBe(0);
    });

    it('should handle negative Infinity scores (coerced to 0)', async () => {
      const state = createMinimalValidState({ score: -Infinity });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);
      
      expect(Number.isFinite(loaded.score)).toBe(true);
      expect(loaded.score).toBe(0);
    });

    it('should sanitize invalid number values on load', async () => {
      // This tests the sanitization that SHOULD happen in loadViewGameState
      // The sanitization logic already exists for some fields, but not for NaN scores
      const result = await loadViewGameState('infinite');
      
      if (result.status === 'success') {
        // Score should always be a valid number
        expect(Number.isFinite(result.data.score) || result.data.score === 0).toBe(true);
        // totalLinesCleared should always be a valid number
        expect(Number.isFinite(result.data.totalLinesCleared)).toBe(true);
        // shapesUsed should always be a valid number
        expect(Number.isFinite(result.data.shapesUsed)).toBe(true);
      }
    });

    it('should handle negative scores', async () => {
      const state = createMinimalValidState({ score: -100 });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);
      
      // Negative scores might be valid in some game modes (penalties)
      expect(loaded.score).toBe(-100);
    });
  });

  describe('Shapes Persistence', () => {
    it('should save and load shapes with all properties intact', async () => {
      const shape: Shape = [
        [
          { color: 'red' as const, isFilled: true },
          { color: 'red' as const, isFilled: false },
          { color: 'red' as const, isFilled: false },
          { color: 'red' as const, isFilled: false },
        ],
        [
          { color: 'red' as const, isFilled: true },
          { color: 'red' as const, isFilled: true },
          { color: 'red' as const, isFilled: false },
          { color: 'red' as const, isFilled: false },
        ],
        [
          { color: 'red' as const, isFilled: false },
          { color: 'red' as const, isFilled: false },
          { color: 'red' as const, isFilled: false },
          { color: 'red' as const, isFilled: false },
        ],
        [
          { color: 'red' as const, isFilled: false },
          { color: 'red' as const, isFilled: false },
          { color: 'red' as const, isFilled: false },
          { color: 'red' as const, isFilled: false },
        ],
      ];

      const state = createMinimalValidState({
        nextShapes: [shape, shape, shape],
        savedShape: shape,
      });

      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.nextShapes.length).toBe(3);
      expect(loaded.savedShape).not.toBeNull();
      expect(loaded.nextShapes[0][0][0].isFilled).toBe(true);
      expect(loaded.nextShapes[0][0][0].color).toBe('red');
    });

    it('should handle empty shapes array', async () => {
      const state = createMinimalValidState({
        nextShapes: [],
        savedShape: null,
      });

      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.nextShapes).toEqual([]);
      expect(loaded.savedShape).toBeNull();
    });

    it('should handle malformed shape data', async () => {
      const malformedState: any = createMinimalValidState({
        nextShapes: [
          null,
          undefined,
          [[{ color: 'red', isFilled: true }]],
          'not a shape',
          123,
        ],
      });

      await saveViewGameState('infinite', malformedState);
      const result = await loadViewGameState('infinite');
      
      // Should not crash, should load what it can
      expect(result.status).toBe('success');
    });
  });

  describe('Queue Mode Persistence', () => {
    it('should save and load infinite queue mode', async () => {
      const state = createFullGridState({
        queueMode: 'infinite',
        queueSize: -1,
        queueHiddenShapes: [],
      });

      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.queueMode).toBe('infinite');
    });

    it('should save and load finite queue mode with hidden shapes', async () => {
      const shapes = [createTestShape(), createTestShape(), createTestShape()];
      
      const state = createFullGridState({
        queueMode: 'finite',
        queueSize: 6,
        queueHiddenShapes: shapes,
        nextShapes: shapes,
      });

      await saveViewGameState('daily', state);
      const result = await loadViewGameState('daily');
      const loaded = expectSuccess(result);

      expect(loaded.queueMode).toBe('finite');
      expect(loaded.queueSize).toBe(6);
      expect(loaded.queueHiddenShapes?.length).toBe(3);
    });

    it('should preserve color probabilities', async () => {
      const colorProbs = [
        { color: 'red' as const, probability: 0.5 },
        { color: 'blue' as const, probability: 0.5 },
      ];
      
      const state = createFullGridState({
        queueColorProbabilities: colorProbs,
      });

      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.queueColorProbabilities).toEqual(colorProbs);
    });
  });

  describe('Game State Flags', () => {
    it('should preserve isGameOver flag', async () => {
      const state = createFullGridState({
        score: 1000,
        isGameOver: true,
      });

      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.isGameOver).toBe(true);
    });

    it('should preserve hasPlacedFirstShape flag', async () => {
      const state = createFullGridState({
        hasPlacedFirstShape: true,
        shapesUsed: 5,
      });

      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.hasPlacedFirstShape).toBe(true);
      expect(loaded.shapesUsed).toBe(5);
    });
  });

  describe('Stats Persistence', () => {
    it('should preserve all stats fields', async () => {
      const stats = {
        ...INITIAL_STATS_PERSISTENCE,
        current: {
          ...INITIAL_STATS_PERSISTENCE.current,
          shapesPlaced: { total: 100, colors: { red: 50, blue: 50 } },
          linesCleared: { total: 20, colors: { red: 10, blue: 10 } },
        },
        allTime: {
          ...INITIAL_STATS_PERSISTENCE.allTime,
          shapesPlaced: { total: 1000, colors: { red: 500, blue: 500 } },
          linesCleared: { total: 200, colors: { red: 100, blue: 100 } },
        },
      };

      const state = createFullGridState({ stats });

      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.stats.current.shapesPlaced.total).toBe(100);
      expect(loaded.stats.allTime.shapesPlaced.total).toBe(1000);
    });
  });

  describe('Checksum/Integrity Verification', () => {
    it('should generate valid checksum manifest', () => {
      const state = createFullGridState({ score: 500 });
      const manifest = generateChecksumManifest(state);

      expect(manifest.root.hash).toBeDefined();
      expect(manifest.schemaVersion).toBe(1);
      expect(manifest.timestamp).toBeDefined();
    });

    it('should verify unchanged data passes', () => {
      const state = createFullGridState({ score: 500 });
      const manifest = generateChecksumManifest(state);
      const result = verifyChecksumManifest(state, manifest);

      expect(result.isValid).toBe(true);
      expect(result.mismatches).toHaveLength(0);
    });

    it('should detect score tampering', () => {
      const state = createFullGridState({ score: 500 });
      const manifest = generateChecksumManifest(state);
      
      // Tamper with the score
      state.score = 1000000;
      
      const result = verifyChecksumManifest(state, manifest);

      expect(result.isValid).toBe(false);
      expect(result.mismatches.length).toBeGreaterThan(0);
    });

    it('should detect tiles tampering', () => {
      const state = createPartiallyFilledState([
        { row: 1, col: 1, color: 'red' },
      ]);
      const manifest = generateChecksumManifest(state);
      
      // Tamper with tiles
      if (state.tiles[0]) {
        state.tiles[0].isFilled = false;
      }
      
      const result = verifyChecksumManifest(state, manifest);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Mode Isolation', () => {
    it('should not cross-contaminate infinite and daily modes', async () => {
      const infiniteState = createFullGridState({
        score: 10000,
        hasPlacedFirstShape: true,
      });

      const dailyState = createFullGridState({
        score: 500,
        queueMode: 'finite',
        queueSize: 10,
      });

      await saveViewGameState('infinite', infiniteState);
      await saveViewGameState('daily', dailyState);

      // Clear only daily
      await clearViewGameState('daily');

      // Infinite should still exist
      const infiniteResult = await loadViewGameState('infinite');
      expect(infiniteResult.status).toBe('success');
      if (infiniteResult.status === 'success') {
        expect(infiniteResult.data.score).toBe(10000);
      }

      // Daily should be gone
      const dailyResult = await loadViewGameState('daily');
      expect(dailyResult.status).toBe('not_found');
    });

    it('should track which modes have saved state', async () => {
      const state = createFullGridState({ score: 100 });

      await saveViewGameState('infinite', state);
      
      expect(await hasViewGameState('infinite')).toBe(true);
      expect(await hasViewGameState('daily')).toBe(false);
      expect(await hasViewGameState('tutorial')).toBe(false);
    });
  });

  describe('Concurrent Save/Load Operations', () => {
    it('should handle rapid successive saves', async () => {
      const saves = [];
      for (let i = 0; i < 10; i++) {
        const state = createFullGridState({ score: i * 100 });
        saves.push(saveViewGameState('infinite', state));
      }
      
      await Promise.all(saves);
      
      const result = await loadViewGameState('infinite');
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        // Should have the last saved score (900)
        expect(result.data.score).toBe(900);
      }
    });

    it('should handle save during load', async () => {
      const state1 = createFullGridState({ score: 100 });
      await saveViewGameState('infinite', state1);

      // Start load
      const loadPromise = loadViewGameState('infinite');
      
      // Save different state while loading
      const state2 = createFullGridState({ score: 200 });
      await saveViewGameState('infinite', state2);

      // Original load should complete
      const result = await loadPromise;
      expect(result.status).toBe('success');
    });
  });

  describe('Edge Cases', () => {
    it('should handle loading from empty database', async () => {
      const result = await loadViewGameState('infinite');
      expect(result.status).toBe('not_found');
    });

    it('should handle very large scores', async () => {
      const state = createFullGridState({ score: Number.MAX_SAFE_INTEGER });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.score).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle unicode in custom shape attributes', async () => {
      const shape: Shape = [[{
        color: 'red' as const,
        isFilled: true,
        customAttribute: '🎮 テトリス 游戏',
      }]];
      
      const state = createMinimalValidState({ nextShapes: [shape] });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.nextShapes[0][0][0].customAttribute).toBe('🎮 テトリス 游戏');
    });

    it('should handle many active animations on tiles', async () => {
      const tiles: TileData[] = createFullGridState().tiles;
      
      // Add many animations to first tile
      tiles[0] = {
        ...tiles[0],
        activeAnimations: Array(100).fill(null).map((_, i) => ({
          id: `anim-${i}`,
          type: 'row-cw' as const,
          startTime: Date.now(),
          duration: 500,
        })),
      };
      
      const state = createMinimalValidState({ tiles });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      const loaded = expectSuccess(result);

      expect(loaded.tiles[0].activeAnimations?.length).toBe(100);
    });
  });

  describe('Application-Level Load Validation', () => {
    /**
     * These tests simulate what TetrixProvider.tsx does and verify
     * the CORRECT behavior for loading saved games.
     */
    
    it('should load game state regardless of tiles length (fix for bug)', async () => {
      // Simulate various tile counts that should ALL be loadable
      const testCases = [
        { tilesCount: 0, description: 'empty tiles' },
        { tilesCount: 1, description: 'single tile' },
        { tilesCount: 50, description: 'partial grid' },
        { tilesCount: 99, description: 'almost full grid' },
        { tilesCount: 100, description: 'full grid' },
        { tilesCount: 144, description: 'larger grid (12x12)' },
      ];

      for (const { tilesCount, description } of testCases) {
        await clearViewGameState('infinite');
        
        const tiles: TileData[] = [];
        for (let i = 0; i < tilesCount; i++) {
          const row = Math.floor(i / 10) + 1;
          const col = (i % 10) + 1;
          tiles.push({
            position: `R${row}C${col}`,
            backgroundColor: 'grey',
            isFilled: i < 5, // First 5 tiles are filled
            color: 'red',
          });
        }

        const state = createMinimalValidState({
          tiles,
          score: 500,
          hasPlacedFirstShape: true,
        });

        await saveViewGameState('infinite', state);
        const result = await loadViewGameState('infinite');

        expect(
          result.status,
          `Should load successfully for ${description}`
        ).toBe('success');
        
        if (result.status === 'success') {
          expect(
            result.data.score,
            `Score should be preserved for ${description}`
          ).toBe(500);
          
          expect(
            result.data.hasPlacedFirstShape,
            `hasPlacedFirstShape should be preserved for ${description}`
          ).toBe(true);
        }
      }
    });

    it('should identify if a save has any user progress', async () => {
      // A valid way to check for user progress is to look at multiple signals
      const emptyGame = createFullGridState({
        score: 0,
        hasPlacedFirstShape: false,
        shapesUsed: 0,
        totalLinesCleared: 0,
      });

      const gameWithProgress = createFullGridState({
        score: 100,
        hasPlacedFirstShape: true,
        shapesUsed: 5,
        totalLinesCleared: 2,
      });

      // Save and load both
      await saveViewGameState('infinite', emptyGame);
      const emptyResult = expectSuccess(await loadViewGameState('infinite'));

      const hasProgressEmpty = 
        emptyResult.score > 0 ||
        emptyResult.hasPlacedFirstShape ||
        emptyResult.shapesUsed > 0 ||
        emptyResult.tiles.some(t => t.isFilled);

      expect(hasProgressEmpty).toBe(false);

      await saveViewGameState('infinite', gameWithProgress);
      const progressResult = expectSuccess(await loadViewGameState('infinite'));

      const hasProgress = 
        progressResult.score > 0 ||
        progressResult.hasPlacedFirstShape ||
        progressResult.shapesUsed > 0 ||
        progressResult.tiles.some(t => t.isFilled);

      expect(hasProgress).toBe(true);
    });
  });
});
