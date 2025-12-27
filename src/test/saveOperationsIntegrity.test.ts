/**
 * Save Operations Integrity Tests
 * 
 * These tests specifically focus on ensuring that every save path 
 * produces valid, loadable data that won't cause users to lose progress.
 * 
 * This complements persistenceValidation.test.ts by focusing on
 * the save side rather than the load side.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveViewGameState,
  loadViewGameState,
  clearViewGameState,
  saveSettings,
  loadSettings,
  saveModifiers,
  loadModifiers,
  updateViewGameState,
  saveDailyHistory,
  loadDailyHistory,
  initializePersistence,
} from '../utils/persistenceAdapter';
import { safeBatchSave, saveGameForMode, loadGameForMode } from '../utils/persistence';
import { closeDatabase } from '../utils/indexedDBCrud';
import type { ViewGameState, TileData, Shape, GameSettingsPersistenceData, DailyChallengeHistory } from '../types';
import { INITIAL_STATS_PERSISTENCE } from '../types/stats';
import { tilesToArray, tilesFromArray } from '../types/core';

// Helper to create valid test data
function createValidTiles(count: number = 100): TileData[] {
  const tiles: TileData[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 10) + 1;
    const col = (i % 10) + 1;
    tiles.push({
      position: `R${row}C${col}`,
      backgroundColor: 'grey',
      isFilled: false,
      color: 'grey',
    });
  }
  return tiles;
}

function createValidShape(): Shape {
  return [
    [{ color: 'red' as const, isFilled: true }, { color: 'red' as const, isFilled: true }],
    [{ color: 'red' as const, isFilled: true }, { color: 'red' as const, isFilled: false }],
  ];
}

function createValidGameState(overrides?: Partial<ViewGameState>): ViewGameState {
  return {
    score: 0,
    tiles: createValidTiles(100),
    nextShapes: [createValidShape()],
    savedShape: null,
    totalLinesCleared: 0,
    shapesUsed: 0,
    hasPlacedFirstShape: false,
    lastUpdated: Date.now(),
    stats: INITIAL_STATS_PERSISTENCE,
    ...overrides,
  };
}

describe('Save Operations Integrity Tests', () => {
  beforeEach(async () => {
    await initializePersistence();
  });

  afterEach(async () => {
    const modes = ['infinite', 'daily', 'tutorial'] as const;
    for (const mode of modes) {
      try {
        await clearViewGameState(mode);
      } catch {
        // Ignore
      }
    }
    closeDatabase();
  });

  describe('saveViewGameState', () => {
    it('should produce loadable data for all game modes', async () => {
      const modes = ['infinite', 'daily', 'tutorial'] as const;
      
      for (const mode of modes) {
        const state = createValidGameState({ score: 100 });
        
        await saveViewGameState(mode, state);
        const result = await loadViewGameState(mode);
        
        expect(result.status, `${mode} mode should save successfully`).toBe('success');
        if (result.status === 'success') {
          expect(result.data.score, `${mode} score should be preserved`).toBe(100);
        }
      }
    });

    it('should produce data with all required fields', async () => {
      const state = createValidGameState({ score: 500 });
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const data = result.data;
        
        // All required fields must exist
        expect(data.score).toBeDefined();
        expect(data.tiles).toBeDefined();
        expect(data.nextShapes).toBeDefined();
        expect(data.savedShape).toBeDefined(); // Can be null but must exist
        expect(data.totalLinesCleared).toBeDefined();
        expect(data.shapesUsed).toBeDefined();
        expect(data.hasPlacedFirstShape).toBeDefined();
        expect(data.stats).toBeDefined();
        expect(data.lastUpdated).toBeDefined();
        
        // Types must be correct
        expect(typeof data.score).toBe('number');
        expect(Array.isArray(data.tiles)).toBe(true);
        expect(Array.isArray(data.nextShapes)).toBe(true);
        expect(typeof data.totalLinesCleared).toBe('number');
        expect(typeof data.shapesUsed).toBe('number');
        expect(typeof data.hasPlacedFirstShape).toBe('boolean');
        expect(typeof data.lastUpdated).toBe('number');
      }
    });

    it('should overwrite previous save completely', async () => {
      const state1 = createValidGameState({ score: 100, totalLinesCleared: 5 });
      const state2 = createValidGameState({ score: 200, totalLinesCleared: 10 });
      
      await saveViewGameState('infinite', state1);
      await saveViewGameState('infinite', state2);
      
      const result = await loadViewGameState('infinite');
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.score).toBe(200);
        expect(result.data.totalLinesCleared).toBe(10);
      }
    });
  });

  describe('updateViewGameState', () => {
    it('should preserve unmodified fields', async () => {
      const initialState = createValidGameState({
        score: 100,
        totalLinesCleared: 5,
        shapesUsed: 10,
      });
      
      await saveViewGameState('infinite', initialState);
      
      // Only update score
      await updateViewGameState('infinite', { score: 200 });
      
      const result = await loadViewGameState('infinite');
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.score).toBe(200); // Updated
        expect(result.data.totalLinesCleared).toBe(5); // Preserved
        expect(result.data.shapesUsed).toBe(10); // Preserved
      }
    });

    it('should fail gracefully for non-existent state', async () => {
      await expect(
        updateViewGameState('infinite', { score: 100 })
      ).rejects.toThrow();
    });
  });

  describe('safeBatchSave', () => {
    it('should save partial updates correctly', async () => {
      // First create initial state
      const initialState = createValidGameState({ score: 0 });
      await saveViewGameState('infinite', initialState);
      
      // Then do partial save via safeBatchSave
      await safeBatchSave('infinite', {
        score: 500,
        tiles: createValidTiles(100),
      });
      
      const result = await loadViewGameState('infinite');
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.score).toBe(500);
        expect(result.data.tiles.length).toBe(100);
      }
    });

    it('should handle all optional fields in batch', async () => {
      const initialState = createValidGameState();
      await saveViewGameState('infinite', initialState);
      
      await safeBatchSave('infinite', {
        score: 100,
        tiles: createValidTiles(100),
        nextShapes: [createValidShape(), createValidShape()],
        savedShape: createValidShape(),
        stats: INITIAL_STATS_PERSISTENCE,
        totalLinesCleared: 5,
        shapesUsed: 10,
        hasPlacedFirstShape: true,
        queueMode: 'finite',
        queueSize: 10,
        isGameOver: false,
      });
      
      const result = await loadViewGameState('infinite');
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.score).toBe(100);
        expect(result.data.nextShapes.length).toBe(2);
        expect(result.data.savedShape).not.toBeNull();
        expect(result.data.totalLinesCleared).toBe(5);
        expect(result.data.queueMode).toBe('finite');
      }
    });
  });

  describe('saveGameForMode / loadGameForMode', () => {
    it('should roundtrip game data correctly', async () => {
      const tiles = createValidTiles(100);
      tiles[0] = { ...tiles[0], isFilled: true, color: 'red' };
      tiles[50] = { ...tiles[50], isFilled: true, color: 'blue' };
      
      await saveGameForMode('infinite', {
        score: 1000,
        tiles: tiles,
        nextShapes: [createValidShape()],
        savedShape: createValidShape(),
        totalLinesCleared: 10,
        shapesUsed: 20,
        hasPlacedFirstShape: true,
      });
      
      const loaded = await loadGameForMode('infinite');
      
      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.score).toBe(1000);
        expect(loaded.tiles.length).toBe(100);
        expect(loaded.tiles.find(t => t.position === 'R1C1')?.isFilled).toBe(true);
        expect(loaded.nextShapes.length).toBe(1);
        expect(loaded.savedShape).not.toBeNull();
      }
    });
  });

  describe('Tiles Array Integrity', () => {
    it('should preserve tile position format', async () => {
      const state = createValidGameState();
      state.tiles[0] = {
        position: 'R1C1',
        backgroundColor: 'grey',
        isFilled: true,
        color: 'red',
      };
      
      await saveViewGameState('infinite', state);
      const result = await loadViewGameState('infinite');
      
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const tile = result.data.tiles.find(t => t.position === 'R1C1');
        expect(tile).toBeDefined();
        expect(tile?.isFilled).toBe(true);
        expect(tile?.color).toBe('red');
      }
    });

    it('should preserve TileData to TilesSet conversion', () => {
      // Test the conversion utilities work correctly
      const tileData: TileData[] = [
        { position: 'R1C1', backgroundColor: 'grey', isFilled: true, color: 'red' },
        { position: 'R1C2', backgroundColor: 'grey', isFilled: false, color: 'grey' },
      ];
      
      const tilesSet = tilesFromArray(tileData);
      const backToArray = tilesToArray(tilesSet);
      
      expect(backToArray.length).toBe(2);
      expect(backToArray.find(t => t.position === 'R1C1')?.isFilled).toBe(true);
      expect(backToArray.find(t => t.position === 'R1C1')?.color).toBe('red');
    });
  });

  describe('Settings Persistence', () => {
    it('should save and load complete settings', async () => {
      const settings: GameSettingsPersistenceData = {
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
        blockTheme: 'gem',
        showBlockIcons: true,
        isMapUnlocked: true,
        buttonSizeMultiplier: 1.2,
        lastUpdated: Date.now(),
      };
      
      await saveSettings(settings);
      const result = await loadSettings();
      
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.music.volume).toBe(50);
        expect(result.data.soundEffects.volume).toBe(80);
        expect(result.data.theme).toBe('dark');
        expect(result.data.isMapUnlocked).toBe(true);
      }
    });
  });

  describe('Modifiers Persistence', () => {
    it('should save and load modifier sets', async () => {
      const modifiers = new Set([2, 3, 5, 7, 11, 13]);
      
      await saveModifiers(modifiers);
      const result = await loadModifiers();
      
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.size).toBe(6);
        expect(result.data.has(7)).toBe(true);
        expect(result.data.has(17)).toBe(false);
      }
    });

    it('should handle empty modifier set', async () => {
      await saveModifiers(new Set());
      const result = await loadModifiers();
      
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.size).toBe(0);
      }
    });
  });

  describe('Daily Challenge History', () => {
    it('should save and load daily history', async () => {
      const history: DailyChallengeHistory = {
        completions: [
          {
            date: '2025-01-01',
            score: 500,
            stars: 3,
            matchedTiles: 50,
            totalTiles: 50,
            missedTiles: 0,
            completedAt: Date.now(),
          },
        ],
        currentStreak: 1,
        longestStreak: 5,
        totalDaysPlayed: 10,
        lastUpdated: Date.now(),
      };
      
      await saveDailyHistory(history);
      const result = await loadDailyHistory();
      
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.currentStreak).toBe(1);
        expect(result.data.completions.length).toBe(1);
        expect(result.data.completions[0].stars).toBe(3);
      }
    });
  });

  describe('Edge Cases for Save Operations', () => {
    it('should handle saving after clear', async () => {
      const state = createValidGameState({ score: 100 });
      
      await saveViewGameState('infinite', state);
      await clearViewGameState('infinite');
      
      const state2 = createValidGameState({ score: 200 });
      await saveViewGameState('infinite', state2);
      
      const result = await loadViewGameState('infinite');
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.score).toBe(200);
      }
    });

    it('should handle multiple rapid saves', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const state = createValidGameState({ score: i * 100 });
        promises.push(saveViewGameState('infinite', state));
      }
      
      await Promise.all(promises);
      
      const result = await loadViewGameState('infinite');
      expect(result.status).toBe('success');
      // One of the saves should have succeeded (last one wins)
    });

    it('should produce valid checksums on save', async () => {
      const state = createValidGameState({ score: 500 });
      
      await saveViewGameState('infinite', state);
      
      // Load twice - checksums should be consistent
      const result1 = await loadViewGameState('infinite');
      const result2 = await loadViewGameState('infinite');
      
      expect(result1.status).toBe('success');
      expect(result2.status).toBe('success');
      
      if (result1.status === 'success' && result2.status === 'success') {
        expect(result1.data.score).toBe(result2.data.score);
      }
    });
  });
});
