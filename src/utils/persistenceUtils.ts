import type {
  GamePersistenceData,
  ScorePersistenceData,
  TilesPersistenceData,
  ShapesPersistenceData,
  GameSettingsPersistenceData,
  MusicPersistenceData,
  ModifiersPersistenceData
} from './types';

const DB_NAME = 'TetrixGameDB';
const DB_VERSION = 2; // Increment for new stores
const GAME_STATE_STORE = 'gameState'; // Legacy store
const SCORE_STORE = 'score';
const TILES_STORE = 'tiles';
const SHAPES_STORE = 'shapes';
const SETTINGS_STORE = 'settings';
const MODIFIERS_STORE = 'modifiers';

/**
 * Check if IndexedDB is available (not in Node.js/testing environments)
 */
function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Recreate database with proper schema
 */
async function recreateDatabase(): Promise<IDBDatabase> {
  const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

  return new Promise((resolve, reject) => {
    deleteRequest.onsuccess = () => {
      // Small delay then retry
      setTimeout(() => {
        openDatabase().then(resolve).catch(reject);
      }, 100);
    };

    deleteRequest.onerror = () => {
      console.error('Failed to delete corrupted database');
      reject(new Error('Database schema mismatch and failed to recreate'));
    };
  });
}

/**
 * Open database with proper error handling
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(new Error(`Failed to open IndexedDB: ${request.error}`));
    };

    request.onsuccess = async () => {
      const db = request.result;

      // Verify all required stores exist
      const requiredStores = [GAME_STATE_STORE, SCORE_STORE, TILES_STORE, SHAPES_STORE, SETTINGS_STORE, MODIFIERS_STORE];
      const missingStores = requiredStores.filter(store => !db.objectStoreNames.contains(store));

      if (missingStores.length > 0) {
        console.warn('Missing object stores:', missingStores, 'Recreating database...');
        db.close();

        try {
          const newDb = await recreateDatabase();
          resolve(newDb);
        } catch (error) {
          reject(error);
        }
        return;
      }

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      console.log('Upgrading database from version', event.oldVersion, 'to', event.newVersion);

      // Create legacy game state store for backward compatibility
      if (!db.objectStoreNames.contains(GAME_STATE_STORE)) {
        console.log('Creating', GAME_STATE_STORE, 'store');
        db.createObjectStore(GAME_STATE_STORE);
      }

      // Create granular stores
      if (!db.objectStoreNames.contains(SCORE_STORE)) {
        console.log('Creating', SCORE_STORE, 'store');
        db.createObjectStore(SCORE_STORE);
      }

      if (!db.objectStoreNames.contains(TILES_STORE)) {
        console.log('Creating', TILES_STORE, 'store');
        db.createObjectStore(TILES_STORE);
      }

      if (!db.objectStoreNames.contains(SHAPES_STORE)) {
        console.log('Creating', SHAPES_STORE, 'store');
        db.createObjectStore(SHAPES_STORE);
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        console.log('Creating', SETTINGS_STORE, 'store');
        db.createObjectStore(SETTINGS_STORE);
      }

      if (!db.objectStoreNames.contains(MODIFIERS_STORE)) {
        console.log('Creating', MODIFIERS_STORE, 'store');
        db.createObjectStore(MODIFIERS_STORE);
      }
    };
  });
}

/**
 * Initialize the IndexedDB database for Tetrix game
 */
export function initializeDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB not available in this environment'));
  }

  return openDatabase();
}

/**
 * Save complete game state to IndexedDB
 */
export async function saveGameState(gameData: GamePersistenceData): Promise<void> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAME_STATE_STORE], 'readwrite');
      const store = transaction.objectStore(GAME_STATE_STORE);

      const request = store.put(gameData, 'current');

      request.onsuccess = () => {
        console.log('Game state saved successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save game state:', request.error);
        reject(new Error(`Failed to save game state: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving game state:', error);
    throw error;
  }
}

/**
 * Load game state from IndexedDB
 */
export async function loadGameState(): Promise<GamePersistenceData | null> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAME_STATE_STORE], 'readonly');
      const store = transaction.objectStore(GAME_STATE_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result?.tiles && Array.isArray(result.tiles)) {
          // Ensure backward compatibility - add missing fields if they don't exist
          const gameData = {
            score: result.score || 0,
            tiles: result.tiles || [],
            nextShapes: result.nextShapes || [],
            savedShape: result.savedShape || null,
          };
          resolve(gameData);
        } else {
          // No saved state or invalid data
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to load game state:', request.error);
        reject(new Error(`Failed to load game state: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
}

/**
 * Save score data to IndexedDB
 */
export async function saveScore(score: number): Promise<void> {
  try {
    const db = await initializeDatabase();
    const data: ScorePersistenceData = { score, lastUpdated: Date.now() };

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([SCORE_STORE], 'readwrite');

        transaction.onerror = () => {
          console.error('Transaction failed for score save:', transaction.error);
          reject(new Error(`Transaction failed: ${transaction.error}`));
        };

        const store = transaction.objectStore(SCORE_STORE);
        const request = store.put(data, 'current');

        request.onsuccess = () => {
          console.log('Score saved successfully:', score);
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to save score:', request.error);
          reject(new Error(`Failed to save score: ${request.error}`));
        };
      } catch (transactionError) {
        console.error('Failed to create transaction for score save:', transactionError);
        reject(new Error(`Transaction creation failed: ${transactionError}`));
      }
    });
  } catch (error) {
    console.error('Error saving score:', error);
    throw error;
  }
}

/**
 * Save tiles data to IndexedDB
 */
export async function saveTiles(tiles: TilesPersistenceData['tiles']): Promise<void> {
  try {
    const db = await initializeDatabase();
    const data: TilesPersistenceData = { tiles, lastUpdated: Date.now() };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TILES_STORE], 'readwrite');
      const store = transaction.objectStore(TILES_STORE);

      const request = store.put(data, 'current');

      request.onsuccess = () => {
        console.log('Tiles saved successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save tiles:', request.error);
        reject(new Error(`Failed to save tiles: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving tiles:', error);
    throw error;
  }
}

/**
 * Save shapes data to IndexedDB
 */
export async function saveShapes(nextShapes: ShapesPersistenceData['nextShapes'], savedShape: ShapesPersistenceData['savedShape']): Promise<void> {
  try {
    const db = await initializeDatabase();
    const data: ShapesPersistenceData = { nextShapes, savedShape, lastUpdated: Date.now() };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHAPES_STORE], 'readwrite');
      const store = transaction.objectStore(SHAPES_STORE);

      const request = store.put(data, 'current');

      request.onsuccess = () => {
        console.log('Shapes saved successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save shapes:', request.error);
        reject(new Error(`Failed to save shapes: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving shapes:', error);
    throw error;
  }
}

/**
 * Save music settings to IndexedDB
 */
export async function saveMusicSettings(isMuted: boolean): Promise<void> {
  try {
    const db = await initializeDatabase();
    const musicData: MusicPersistenceData = { isMuted, lastUpdated: Date.now() };
    const data: GameSettingsPersistenceData = { music: musicData, lastUpdated: Date.now() };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.put(data, 'current');

      request.onsuccess = () => {
        console.log('Music settings saved successfully:', isMuted);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save music settings:', request.error);
        reject(new Error(`Failed to save music settings: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving music settings:', error);
    throw error;
  }
}

/**
 * Load score from IndexedDB
 */
export async function loadScore(): Promise<number> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCORE_STORE], 'readonly');
      const store = transaction.objectStore(SCORE_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.score ?? 0);
      };

      request.onerror = () => {
        console.error('Failed to load score:', request.error);
        reject(new Error(`Failed to load score: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading score:', error);
    return 0;
  }
}

/**
 * Load tiles from IndexedDB
 */
export async function loadTiles(): Promise<TilesPersistenceData['tiles'] | null> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TILES_STORE], 'readonly');
      const store = transaction.objectStore(TILES_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result?.tiles && Array.isArray(result.tiles)) {
          resolve(result.tiles);
        } else {
          resolve(null); // No tiles saved
        }
      };

      request.onerror = () => {
        console.error('Failed to load tiles:', request.error);
        reject(new Error(`Failed to load tiles: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading tiles:', error);
    return null;
  }
}

/**
 * Load shapes from IndexedDB
 */
export async function loadShapes(): Promise<{ nextShapes: ShapesPersistenceData['nextShapes']; savedShape: ShapesPersistenceData['savedShape'] } | null> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHAPES_STORE], 'readonly');
      const store = transaction.objectStore(SHAPES_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            nextShapes: result.nextShapes || [],
            savedShape: result.savedShape || null
          });
        } else {
          resolve(null); // No shapes saved
        }
      };

      request.onerror = () => {
        console.error('Failed to load shapes:', request.error);
        reject(new Error(`Failed to load shapes: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading shapes:', error);
    return null;
  }
}

/**
 * Load music settings from IndexedDB
 */
export async function loadMusicSettings(): Promise<boolean> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.music?.isMuted ?? false);
      };

      request.onerror = () => {
        console.error('Failed to load music settings:', request.error);
        reject(new Error(`Failed to load music settings: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading music settings:', error);
    return false;
  }
}

/**
 * Load complete game state from granular stores (preferred method)
 * Falls back to legacy monolithic store if granular data is not available
 */
export async function loadCompleteGameState(): Promise<GamePersistenceData | null> {
  try {
    // Try to load from granular stores first
    const [score, tiles, shapes] = await Promise.all([
      loadScore(),
      loadTiles(),
      loadShapes()
    ]);

    // Only return granular state if we have tiles (indicating a real game in progress)
    if (tiles?.length === 100) {
      console.log('Loaded game state from granular stores');
      return {
        score,
        tiles,
        nextShapes: shapes?.nextShapes ?? [],
        savedShape: shapes?.savedShape ?? null
      };
    }

    // Fallback to legacy monolithic store
    console.log('Granular stores empty, trying legacy store...');
    const legacyData = await loadGameState();
    if (legacyData?.tiles?.length === 100) {
      console.log('Loaded game state from legacy store');

      // Migrate legacy data to granular stores for future use
      safeBatchSave(
        legacyData.score,
        legacyData.tiles,
        legacyData.nextShapes,
        legacyData.savedShape
      ).catch((error: Error) => {
        console.error('Failed to migrate legacy data to granular stores:', error);
      });

      return legacyData;
    }

    console.log('No saved game state found in either granular or legacy stores');
    return null;
  } catch (error) {
    console.error('Error loading complete game state:', error);
    return null;
  }
}

/**
 * Safe batch save to prevent overwrites during initialization
 */
export async function safeBatchSave(
  score?: number,
  tiles?: TilesPersistenceData['tiles'],
  nextShapes?: ShapesPersistenceData['nextShapes'],
  savedShape?: ShapesPersistenceData['savedShape']
): Promise<void> {
  const promises: Promise<void>[] = [];

  // Add score save with error handling
  if (score !== undefined) {
    promises.push(
      saveScore(score).catch((error) => {
        console.warn('Failed to save score, continuing without persistence:', error.message);
      })
    );
  }

  // Add tiles save with error handling
  if (tiles) {
    promises.push(
      saveTiles(tiles).catch((error) => {
        console.warn('Failed to save tiles, continuing without persistence:', error.message);
      })
    );
  }

  // Add shapes save with error handling
  if (nextShapes !== undefined || savedShape !== undefined) {
    promises.push(
      (async () => {
        try {
          // Load current shapes first to avoid overwriting
          const currentShapes = await loadShapes();
          await saveShapes(
            nextShapes ?? currentShapes?.nextShapes ?? [],
            savedShape ?? currentShapes?.savedShape ?? null
          );
        } catch (error) {
          console.warn('Failed to save shapes, continuing without persistence:', error instanceof Error ? error.message : 'Unknown error');
        }
      })()
    );
  }

  // Wait for all saves to complete (or fail gracefully)
  await Promise.all(promises);
}

/**
 * Clear all saved data (reset game)
 */
export async function clearAllSavedData(): Promise<void> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([
        GAME_STATE_STORE,
        SCORE_STORE,
        TILES_STORE,
        SHAPES_STORE,
        SETTINGS_STORE,
        MODIFIERS_STORE
      ], 'readwrite');

      // Clear all stores
      const gameStore = transaction.objectStore(GAME_STATE_STORE);
      const scoreStore = transaction.objectStore(SCORE_STORE);
      const tilesStore = transaction.objectStore(TILES_STORE);
      const shapesStore = transaction.objectStore(SHAPES_STORE);
      const settingsStore = transaction.objectStore(SETTINGS_STORE);
      const modifiersStore = transaction.objectStore(MODIFIERS_STORE);

      gameStore.delete('current');
      scoreStore.delete('current');
      tilesStore.delete('current');
      shapesStore.delete('current');
      settingsStore.delete('current');
      modifiersStore.delete('current');

      transaction.oncomplete = () => {
        console.log('All saved data cleared successfully');
        resolve();
      };

      transaction.onerror = () => {
        console.error('Failed to clear saved data:', transaction.error);
        reject(new Error(`Failed to clear saved data: ${transaction.error}`));
      };
    });
  } catch (error) {
    console.error('Error clearing saved data:', error);
    throw error;
  }
}

/**
 * Save unlocked modifiers to IndexedDB
 */
export async function saveModifiers(unlockedModifiers: Set<number>): Promise<void> {
  try {
    const db = await initializeDatabase();
    const data: ModifiersPersistenceData = { 
      unlockedModifiers: Array.from(unlockedModifiers), 
      lastUpdated: Date.now() 
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODIFIERS_STORE], 'readwrite');
      const store = transaction.objectStore(MODIFIERS_STORE);

      const request = store.put(data, 'current');

      request.onsuccess = () => {
        console.log('Modifiers saved successfully:', data.unlockedModifiers);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save modifiers:', request.error);
        reject(new Error(`Failed to save modifiers: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving modifiers:', error);
    throw error;
  }
}

/**
 * Load unlocked modifiers from IndexedDB
 */
export async function loadModifiers(): Promise<Set<number>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODIFIERS_STORE], 'readonly');
      const store = transaction.objectStore(MODIFIERS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result?.unlockedModifiers && Array.isArray(result.unlockedModifiers)) {
          resolve(new Set(result.unlockedModifiers));
        } else {
          resolve(new Set()); // No modifiers unlocked yet
        }
      };

      request.onerror = () => {
        console.error('Failed to load modifiers:', request.error);
        reject(new Error(`Failed to load modifiers: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading modifiers:', error);
    return new Set(); // Return empty set on error
  }
}

/**
 * Check if there's any saved game data (checks granular stores first, then legacy)
 */
export async function hasSavedGameData(): Promise<boolean> {
  try {
    // Check granular stores first
    const tiles = await loadTiles();
    if (tiles?.length === 100) {
      return true;
    }

    // Fallback to legacy store
    const gameData = await loadGameState();
    return gameData !== null && gameData.tiles.length > 0;
  } catch {
    return false;
  }
}