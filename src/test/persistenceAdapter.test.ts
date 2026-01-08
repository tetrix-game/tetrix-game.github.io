/**
 * Tests for Persistence Adapter (view-aware layer)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveGameState,
  loadGameState,
  clearGameBoard,
  hasGameState,
  saveSettings,
  loadSettings,
  saveModifiers,
  loadModifiers,
  clearAllGameData,
} from '../utils/persistenceAdapter';
import { closeDatabase } from '../utils/indexedDBCrud';
import type { GameState, LoadResult } from '../types';
import { INITIAL_STATS_PERSISTENCE } from '../types/stats';

function expectSuccess<T>(result: LoadResult<T>): T {
  if (result.status !== 'success') {
    throw new Error(`Expected success but got ${result.status}`);
  }
  return result.data;
}

describe('Persistence Adapter - View-Aware Operations', () => {
  beforeEach(async () => {
    // Clear will happen in afterEach
  });

  afterEach(async () => {
    // Clean up all data after each test
    const modes = ['infinite', 'daily', 'tutorial'] as const;
    for (const mode of modes) {
      try {
        await clearGameBoard(mode);
      } catch {
        // Ignore errors
      }
    }
    closeDatabase();
  });

  describe('View-Specific Game State', () => {
    it('should save and load view game state correctly', async () => {
      const mockState: GameState = {
        score: 100,
        tiles: [{ position: 'R1C1', isFilled: true, color: 'red', backgroundColor: 'grey' }],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 0,
        shapesUsed: 0,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
        // Include optional fields that the sanitizer adds
        queueMode: undefined,
        queueColorProbabilities: undefined,
        queueHiddenShapes: undefined,
        queueSize: undefined,
        isGameOver: false,
      };

      await saveGameState('infinite', mockState);
      const loadedState = await loadGameState('infinite');

      expect(expectSuccess(loadedState)).toEqual(mockState);
    });

    it('should save and load game state for daily mode', async () => {
      const state: GameState = {
        score: 500,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 2,
        shapesUsed: 3,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      await saveGameState('daily', state);
      const loaded = await loadGameState('daily');

      const data = expectSuccess(loaded);
      expect(data.score).toBe(500);
    });

    it('should keep different modes isolated', async () => {
      const infiniteState: GameState = {
        score: 1000,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 10,
        shapesUsed: 20,
        hasPlacedFirstShape: true,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      const dailyState: GameState = {
        score: 500,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 5,
        shapesUsed: 10,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      await saveGameState('infinite', infiniteState);
      await saveGameState('daily', dailyState);

      const loadedInfinite = expectSuccess(await loadGameState('infinite'));
      const loadedDaily = expectSuccess(await loadGameState('daily'));

      expect(loadedInfinite.score).toBe(1000);
      expect(loadedInfinite.totalLinesCleared).toBe(10);
      expect(loadedDaily.score).toBe(500);
      expect(loadedDaily.totalLinesCleared).toBe(5);
    });

    it('should clear specific mode without affecting others', async () => {
      const state: GameState = {
        score: 1000,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 0,
        shapesUsed: 0,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      await saveGameState('infinite', state);
      await saveGameState('daily', state);

      await clearGameBoard('infinite');

      const infiniteExists = await hasGameState('infinite');
      const dailyExists = await hasGameState('daily');

      expect(infiniteExists).toBe(false);
      expect(dailyExists).toBe(true);
    });

    it('should detect existing game states', async () => {
      const state: GameState = {
        score: 100,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 0,
        shapesUsed: 0,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      expect(await hasGameState('infinite')).toBe(false);

      await saveGameState('infinite', state);

      expect(await hasGameState('infinite')).toBe(true);
    });

    it('should list all modes with saved data', async () => {
      const state: GameState = {
        score: 100,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 0,
        shapesUsed: 0,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      await saveGameState('infinite', state);
      await saveGameState('tutorial', state);

      const saved = await // getSavedGameModes removed - single mode only();

      expect(saved).toHaveLength(2);
      expect(saved).toContain('infinite');
      expect(saved).toContain('tutorial');
      expect(saved).not.toContain('daily');
    });
  });

  describe('Shared Settings', () => {
    it('should save and load settings', async () => {
      const settings = {
        music: {
          isMuted: true,
          volume: 50,
          isEnabled: false,
          lastUpdated: Date.now(),
        },
        soundEffects: {
          isMuted: false,
          volume: 80,
          isEnabled: true,
          lastUpdated: Date.now(),
        },
        debugUnlocked: true,
        theme: 'dark',
        lastUpdated: Date.now(),
      };

      await saveSettings(settings);
      const loaded = expectSuccess(await loadSettings());

      expect(loaded.music.isMuted).toBe(true);
      expect(loaded.music.volume).toBe(50);
      expect(loaded.soundEffects.volume).toBe(80);
      expect(loaded.debugUnlocked).toBe(true);
      expect(loaded.theme).toBe('dark');
    });

    it('should preserve settings across game mode clears', async () => {
      const settings = {
        music: {
          isMuted: true,
          volume: 50,
          isEnabled: true,
          lastUpdated: Date.now(),
        },
        soundEffects: {
          isMuted: false,
          volume: 80,
          isEnabled: true,
          lastUpdated: Date.now(),
        },
        lastUpdated: Date.now(),
      };

      const gameState: GameState = {
        score: 1000,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 0,
        shapesUsed: 0,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      await saveSettings(settings);
      await saveGameState('infinite', gameState);
      await clearGameBoard('infinite');

      const loadedSettings = expectSuccess(await loadSettings());
      expect(loadedSettings.music.volume).toBe(50);
    });
  });

  describe('Shared Modifiers', () => {
    it('should save and load modifiers', async () => {
      const modifiers = new Set([2, 3, 5, 7, 11]);

      await saveModifiers(modifiers);
      const loaded = expectSuccess(await loadModifiers());

      expect(loaded.size).toBe(5);
      expect(loaded.has(2)).toBe(true);
      expect(loaded.has(3)).toBe(true);
      expect(loaded.has(5)).toBe(true);
      expect(loaded.has(7)).toBe(true);
      expect(loaded.has(11)).toBe(true);
      expect(loaded.has(13)).toBe(false);
    });

    it('should return empty set when no modifiers saved', async () => {
      // Clear any existing modifiers first
      await saveModifiers(new Set<number>());

      const loaded = expectSuccess(await loadModifiers());
      expect(loaded.size).toBe(0);
    });
  });

  describe('Data Separation Guarantees', () => {
    it('should not leak data between infinite and daily modes', async () => {
      const infiniteState: GameState = {
        score: 1000,
        tiles: [{ position: 'R1C1', isFilled: true, color: 'red', backgroundColor: 'grey' }],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 10,
        shapesUsed: 20,
        hasPlacedFirstShape: true,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      const dailyState: GameState = {
        score: 500,
        tiles: [{ position: 'R2C2', isFilled: true, color: 'blue', backgroundColor: 'grey' }],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 5,
        shapesUsed: 10,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      await saveGameState('infinite', infiniteState);
      await saveGameState('daily', dailyState);

      const loadedInfinite = expectSuccess(await loadGameState('infinite'));
      const loadedDaily = expectSuccess(await loadGameState('daily'));

      // Verify complete isolation
      expect(loadedInfinite.tiles[0].position).toBe('R1C1');
      expect(loadedDaily.tiles[0].position).toBe('R2C2');
      expect(loadedInfinite.score).not.toBe(loadedDaily.score);
      expect(loadedInfinite.hasPlacedFirstShape).not.toBe(loadedDaily.hasPlacedFirstShape);
    });

    it('should allow concurrent updates to different modes', async () => {
      const state1: GameState = {
        score: 100,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 1,
        shapesUsed: 1,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      const state2: GameState = {
        score: 200,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 2,
        shapesUsed: 2,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      const state3: GameState = {
        score: 300,
        tiles: [],
        nextShapes: [],
        savedShape: null,
        totalLinesCleared: 3,
        shapesUsed: 3,
        hasPlacedFirstShape: false,
        lastUpdated: Date.now(),
        stats: INITIAL_STATS_PERSISTENCE,
      };

      // Save all modes simultaneously
      await Promise.all([
        saveGameState('infinite', state1),
        saveGameState('daily', state2),
        saveGameState('tutorial', state3),
      ]);

      // Verify all saved correctly
      const [result1, result2, result3] = await Promise.all([
        loadGameState('infinite'),
        loadGameState('daily'),
        loadGameState('tutorial'),
      ]);

      const loaded1 = expectSuccess(result1);
      const loaded2 = expectSuccess(result2);
      const loaded3 = expectSuccess(result3);

      expect(loaded1.score).toBe(100);
      expect(loaded2.score).toBe(200);
      expect(loaded3.score).toBe(300);
    });
  });
});
