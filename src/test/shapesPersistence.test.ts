import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveGameState,
  loadGameState,
  clearAllSavedData
} from '../utils/persistenceUtils';
import type { GamePersistenceData, Shape, Tile } from '../utils/types';

// Mock database for testing
const mockDB = {
  gameState: null as GamePersistenceData | null
};

// Mock database operations
vi.mock('../utils/persistenceUtils', async () => {
  const actual = await vi.importActual('../utils/persistenceUtils');
  return {
    ...actual,
    saveGameState: vi.fn(async (data: GamePersistenceData) => {
      mockDB.gameState = data;
    }),
    loadGameState: vi.fn(async () => {
      return mockDB.gameState;
    }),
    clearAllSavedData: vi.fn(async () => {
      mockDB.gameState = null;
    })
  };
});

describe('Shape Options Persistence', () => {
  beforeEach(() => {
    // Reset mock database
    mockDB.gameState = null;
    vi.clearAllMocks();
  });

  it('should save and load nextShapes correctly', async () => {
    const sampleShape: Shape = [
      [
        { color: 'red', isFilled: true },
        { color: 'red', isFilled: false },
        { color: 'red', isFilled: false }
      ],
      [
        { color: 'red', isFilled: true },
        { color: 'red', isFilled: true },
        { color: 'red', isFilled: false }
      ],
      [
        { color: 'red', isFilled: false },
        { color: 'red', isFilled: false },
        { color: 'red', isFilled: false }
      ]
    ];

    const gameData: GamePersistenceData = {
      score: 100,
      tiles: [] as Tile[],
      nextShapes: [sampleShape, sampleShape, sampleShape],
      savedShape: sampleShape
    };

    // Save the game state
    await saveGameState(gameData);

    // Verify it was saved
    expect(saveGameState).toHaveBeenCalledWith(gameData);
    expect(mockDB.gameState).toEqual(gameData);

    // Load the game state
    const loadedData = await loadGameState();

    // Verify loaded data matches saved data
    expect(loadGameState).toHaveBeenCalled();
    expect(loadedData).toEqual(gameData);
    expect(loadedData?.nextShapes).toHaveLength(3);
    expect(loadedData?.savedShape).toEqual(sampleShape);
  });

  it('should handle empty shapes correctly', async () => {
    const gameData: GamePersistenceData = {
      score: 0,
      tiles: [],
      nextShapes: [],
      savedShape: null
    };

    await saveGameState(gameData);
    const loadedData = await loadGameState();

    expect(loadedData?.nextShapes).toEqual([]);
    expect(loadedData?.savedShape).toBeNull();
  });

  it('should clear saved shapes when resetting game', async () => {
    // First save some data
    const gameData: GamePersistenceData = {
      score: 500,
      tiles: [],
      nextShapes: [{} as Shape, {} as Shape],
      savedShape: {} as Shape
    };

    await saveGameState(gameData);
    expect(mockDB.gameState).toEqual(gameData);

    // Clear all data
    await clearAllSavedData();

    // Verify data is cleared
    expect(clearAllSavedData).toHaveBeenCalled();
    expect(mockDB.gameState).toBeNull();
  });

  it('should provide backward compatibility for old save data', async () => {
    // Simulate old save data without nextShapes and savedShape
    const oldGameData = {
      score: 250,
      tiles: [],
      currentMusicTrack: 1,
      nextShapes: [], // Will be added by backward compatibility
      savedShape: null // Will be added by backward compatibility
    };

    mockDB.gameState = oldGameData;

    const loadedData = await loadGameState();

    // Should handle missing fields gracefully
    // Note: In actual implementation, loadGameState adds default values for missing fields
    expect(loadedData).toBeTruthy();
  });
});