import type {
  GamePersistenceData,
  ScorePersistenceData,
  TilesPersistenceData,
  ShapesPersistenceData,
  GameSettingsPersistenceData,
  MusicPersistenceData,
  SoundEffectsPersistenceData,
  ModifiersPersistenceData,
  StatsPersistenceData
} from './types';
import { INITIAL_GAME_STATS } from '../types/stats';

const DB_NAME = 'TetrixGameDB';
const DB_VERSION = 3; // Increment for new stores
const GAME_STATE_STORE = 'gameState'; // Legacy store
const SCORE_STORE = 'score';
const TILES_STORE = 'tiles';
const SHAPES_STORE = 'shapes';
const SETTINGS_STORE = 'settings';
const MODIFIERS_STORE = 'modifiers';
const STATS_STORE = 'stats';

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
      const requiredStores = [GAME_STATE_STORE, SCORE_STORE, TILES_STORE, SHAPES_STORE, SETTINGS_STORE, MODIFIERS_STORE, STATS_STORE];
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

      if (!db.objectStoreNames.contains(STATS_STORE)) {
        console.log('Creating', STATS_STORE, 'store');
        db.createObjectStore(STATS_STORE);
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
export async function saveMusicSettings(isMuted: boolean, volume: number = 100, isEnabled: boolean = true): Promise<void> {
  try {
    const db = await initializeDatabase();

    // Load existing settings to preserve sound effects settings
    let existingSoundEffects: SoundEffectsPersistenceData = { isMuted: false, volume: 100, isEnabled: true, lastUpdated: Date.now() };
    let existingDebugUnlocked = false;
    try {
      const existingData = await loadGameSettings();
      existingSoundEffects = existingData?.soundEffects || existingSoundEffects;
      existingDebugUnlocked = existingData?.debugUnlocked || false;
    } catch {
      // Use defaults if loading fails
    }

    const musicData: MusicPersistenceData = { isMuted, volume, isEnabled, lastUpdated: Date.now() };
    const data: GameSettingsPersistenceData = {
      music: musicData,
      soundEffects: existingSoundEffects,
      debugUnlocked: existingDebugUnlocked,
      lastUpdated: Date.now()
    };

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
 * Save sound effects settings to IndexedDB
 */
export async function saveSoundEffectsSettings(isMuted: boolean, volume: number = 100, isEnabled: boolean = true): Promise<void> {
  try {
    const db = await initializeDatabase();

    // Load existing settings to preserve music settings
    let existingMusic: MusicPersistenceData = { isMuted: false, volume: 100, isEnabled: true, lastUpdated: Date.now() };
    let existingDebugUnlocked = false;
    try {
      const existingData = await loadGameSettings();
      existingMusic = existingData?.music || existingMusic;
      existingDebugUnlocked = existingData?.debugUnlocked || false;
    } catch {
      // Use defaults if loading fails
    }

    const soundEffectsData: SoundEffectsPersistenceData = { isMuted, volume, isEnabled, lastUpdated: Date.now() };
    const data: GameSettingsPersistenceData = {
      music: existingMusic,
      soundEffects: soundEffectsData,
      debugUnlocked: existingDebugUnlocked,
      lastUpdated: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.put(data, 'current');

      request.onsuccess = () => {
        console.log('Sound effects settings saved successfully:', isMuted);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save sound effects settings:', request.error);
        reject(new Error(`Failed to save sound effects settings: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving sound effects settings:', error);
    throw error;
  }
}

/**
 * Save stats to IndexedDB
 */
export async function saveStats(stats: StatsPersistenceData): Promise<void> {
  try {
    const db = await initializeDatabase();
    // Update lastUpdated timestamp
    const data = { ...stats, lastUpdated: Date.now() };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STATS_STORE], 'readwrite');
      const store = transaction.objectStore(STATS_STORE);

      const request = store.put(data, 'current');

      request.onsuccess = () => {
        // console.log('Stats saved successfully'); // Verbose
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save stats:', request.error);
        reject(new Error(`Failed to save stats: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving stats:', error);
    throw error;
  }
}

/**
 * Save debug settings to IndexedDB
 */
export async function saveDebugSettings(unlocked: boolean): Promise<void> {
  try {
    const db = await initializeDatabase();

    // Load existing settings to preserve other settings
    let existingMusic: MusicPersistenceData = { isMuted: false, volume: 100, isEnabled: true, lastUpdated: Date.now() };
    let existingSoundEffects: SoundEffectsPersistenceData = { isMuted: false, volume: 100, isEnabled: true, lastUpdated: Date.now() };

    try {
      const existingData = await loadGameSettings();
      existingMusic = existingData?.music || existingMusic;
      existingSoundEffects = existingData?.soundEffects || existingSoundEffects;
    } catch {
      // Use defaults if loading fails
    }

    const data: GameSettingsPersistenceData = {
      music: existingMusic,
      soundEffects: existingSoundEffects,
      debugUnlocked: unlocked,
      lastUpdated: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.put(data, 'current');

      request.onsuccess = () => {
        console.log('Debug settings saved successfully:', unlocked);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save debug settings:', request.error);
        reject(new Error(`Failed to save debug settings: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving debug settings:', error);
    throw error;
  }
}

/**
 * Load debug settings from IndexedDB
 */
export async function loadDebugSettings(): Promise<boolean> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.debugUnlocked ?? false);
      };

      request.onerror = () => {
        console.error('Failed to load debug settings:', request.error);
        reject(new Error(`Failed to load debug settings: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading debug settings:', error);
    return false;
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
export async function loadMusicSettings(): Promise<{ isMuted: boolean; volume: number; isEnabled: boolean }> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        // Provide backward compatibility with old data
        const volume = result?.music?.volume ?? 100;
        const isEnabled = result?.music?.isEnabled ?? !result?.music?.isMuted ?? true;
        const isMuted = result?.music?.isMuted ?? false;
        resolve({ isMuted, volume, isEnabled });
      };

      request.onerror = () => {
        console.error('Failed to load music settings:', request.error);
        reject(new Error(`Failed to load music settings: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading music settings:', error);
    return { isMuted: false, volume: 100, isEnabled: true };
  }
}

/**
 * Load sound effects settings from IndexedDB
 */
export async function loadSoundEffectsSettings(): Promise<{ isMuted: boolean; volume: number; isEnabled: boolean }> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        // Provide backward compatibility with old data
        const volume = result?.soundEffects?.volume ?? 100;
        const isEnabled = result?.soundEffects?.isEnabled ?? !result?.soundEffects?.isMuted ?? true;
        const isMuted = result?.soundEffects?.isMuted ?? false;
        resolve({ isMuted, volume, isEnabled });
      };

      request.onerror = () => {
        console.error('Failed to load sound effects settings:', request.error);
        reject(new Error(`Failed to load sound effects settings: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading sound effects settings:', error);
    return { isMuted: false, volume: 100, isEnabled: true };
  }
}

/**
 * Load stats from IndexedDB
 */
export async function loadStats(): Promise<StatsPersistenceData | null> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STATS_STORE], 'readonly');
      const store = transaction.objectStore(STATS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result);
        } else {
          resolve(null); // No stats saved yet
        }
      };

      request.onerror = () => {
        console.error('Failed to load stats:', request.error);
        reject(new Error(`Failed to load stats: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading stats:', error);
    return null;
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
 * Load complete game settings from IndexedDB (helper for saving functions)
 */
async function loadGameSettings(): Promise<GameSettingsPersistenceData | null> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };

      request.onerror = () => {
        console.error('Failed to load game settings:', request.error);
        reject(new Error(`Failed to load game settings: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading game settings:', error);
    return null;
  }
}

/**
 * Save theme preference to IndexedDB
 */
export async function saveTheme(theme: string): Promise<void> {
  try {
    const db = await initializeDatabase();
    const settings = await loadGameSettings();
    
    const updatedSettings: GameSettingsPersistenceData = {
      ...settings,
      music: settings?.music || { isMuted: false, volume: 100, isEnabled: true, lastUpdated: Date.now() },
      soundEffects: settings?.soundEffects || { isMuted: false, volume: 100, isEnabled: true, lastUpdated: Date.now() },
      theme,
      lastUpdated: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.put(updatedSettings, 'current');

      request.onsuccess = () => {
        console.log('Theme saved successfully:', theme);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save theme:', request.error);
        reject(new Error(`Failed to save theme: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving theme:', error);
    throw error;
  }
}

/**
 * Load theme preference from IndexedDB
 */
export async function loadTheme(): Promise<string | null> {
  try {
    const settings = await loadGameSettings();
    return settings?.theme || null;
  } catch (error) {
    console.error('Error loading theme:', error);
    return null;
  }
}

/**
 * Load complete game state from granular stores (preferred method)
 * Falls back to legacy monolithic store if granular data is not available
 */
export async function loadCompleteGameState(): Promise<GamePersistenceData | null> {
  try {
    // Try to load from granular stores first
    const [score, tilesData, shapes] = await Promise.all([
      loadScore(),
      loadTiles(),
      loadShapes()
    ]);

    // Convert serialized tiles data to Tile array for backward compatibility
    let tiles: GamePersistenceData['tiles'] = [];
    if (tilesData && Array.isArray(tilesData)) {
      // Check if it's the new serialized format (array of {key, data})
      if (tilesData.length > 0 && 'key' in tilesData[0] && 'data' in tilesData[0]) {
        // New format: convert from serialized format to Tile array
        tiles = tilesData.map((item: { key: string; data: { isFilled: boolean; color: string } }) => {
          const match = item.key.match(/R(\d+)C(\d+)/);
          if (!match) throw new Error(`Invalid tile key: ${item.key}`);
          const row = parseInt(match[1], 10);
          const column = parseInt(match[2], 10);
          return {
            id: `(row: ${row}, column: ${column})`,
            location: { row, column },
            block: { isFilled: item.data.isFilled, color: item.data.color as import('../types/core').ColorName },
          };
        });
      } else {
        // Old format: it's already Tile[]
        tiles = tilesData as unknown as GamePersistenceData['tiles'];
      }
    }

    // Only return granular state if we have tiles (indicating a real game in progress)
    if (tiles.length === 100) {
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
      // Convert tiles to serialized format for storage
      const tilesPersistenceData = legacyData.tiles.map(tile => ({
        key: `R${tile.location.row}C${tile.location.column}`,
        data: { isFilled: tile.block.isFilled, color: tile.block.color }
      }));

      safeBatchSave(
        legacyData.score,
        tilesPersistenceData,
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
  savedShape?: ShapesPersistenceData['savedShape'],
  stats?: StatsPersistenceData
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

  // Add stats save with error handling
  if (stats) {
    promises.push(
      saveStats(stats).catch((error) => {
        console.warn('Failed to save stats, continuing without persistence:', error.message);
      })
    );
  }

  // Wait for all saves to complete (or fail gracefully)
  await Promise.all(promises);
}

/**
 * Clear game data only (preserves user settings like music/sound preferences)
 */
export async function clearAllSavedData(): Promise<void> {
  try {
    // Load existing stats first so we can preserve all-time/best game records
    let existingStats: StatsPersistenceData | null = null;
    try {
      existingStats = await loadStats();
    } catch (e) {
      console.warn('Failed to load stats during clear:', e);
    }

    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([
        GAME_STATE_STORE,
        SCORE_STORE,
        TILES_STORE,
        SHAPES_STORE,
        MODIFIERS_STORE,
        STATS_STORE
      ], 'readwrite');

      // Clear game data stores only - NOT settings
      const gameStore = transaction.objectStore(GAME_STATE_STORE);
      const scoreStore = transaction.objectStore(SCORE_STORE);
      const tilesStore = transaction.objectStore(TILES_STORE);
      const shapesStore = transaction.objectStore(SHAPES_STORE);
      const modifiersStore = transaction.objectStore(MODIFIERS_STORE);
      const statsStore = transaction.objectStore(STATS_STORE);

      gameStore.delete('current');
      scoreStore.delete('current');
      tilesStore.delete('current');
      shapesStore.delete('current');
      modifiersStore.delete('current');

      // Handle stats: preserve allTime/highScore, reset current
      if (existingStats) {
        const resetStats: StatsPersistenceData = {
          ...existingStats,
          current: JSON.parse(JSON.stringify(INITIAL_GAME_STATS)),
          lastUpdated: Date.now()
        };
        statsStore.put(resetStats, 'current');
        console.log('Game stats reset (history preserved)');
      } else {
        statsStore.delete('current');
      }

      transaction.oncomplete = () => {
        console.log('Game data cleared successfully (settings preserved)');
        resolve();
      };

      transaction.onerror = () => {
        console.error('Failed to clear game data:', transaction.error);
        reject(new Error(`Failed to clear game data: ${transaction.error}`));
      };
    });
  } catch (error) {
    console.error('Error clearing game data:', error);
    throw error;
  }
}

/**
 * Clear ALL data including settings, then reload the page fresh from server
 * This is the nuclear option for when the app gets into a bad state
 */
export async function clearAllDataAndReload(): Promise<void> {
  try {
    // Clear IndexedDB completely
    const db = await initializeDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([
        GAME_STATE_STORE,
        SCORE_STORE,
        TILES_STORE,
        SHAPES_STORE,
        SETTINGS_STORE,
        MODIFIERS_STORE,
        STATS_STORE
      ], 'readwrite');

      // Clear ALL stores including settings
      const gameStore = transaction.objectStore(GAME_STATE_STORE);
      const scoreStore = transaction.objectStore(SCORE_STORE);
      const tilesStore = transaction.objectStore(TILES_STORE);
      const shapesStore = transaction.objectStore(SHAPES_STORE);
      const settingsStore = transaction.objectStore(SETTINGS_STORE);
      const modifiersStore = transaction.objectStore(MODIFIERS_STORE);
      const statsStore = transaction.objectStore(STATS_STORE);

      gameStore.delete('current');
      scoreStore.delete('current');
      tilesStore.delete('current');
      shapesStore.delete('current');
      settingsStore.delete('current');
      modifiersStore.delete('current');
      statsStore.delete('current');

      transaction.oncomplete = () => {
        console.log('All data (including settings) cleared successfully');
        resolve();
      };

      transaction.onerror = () => {
        console.error('Failed to clear all data:', transaction.error);
        reject(new Error(`Failed to clear all data: ${transaction.error}`));
      };
    });

    // Clear localStorage as fallback/legacy storage
    try {
      localStorage.clear();
      console.log('localStorage cleared');
    } catch (localStorageError) {
      console.warn('Failed to clear localStorage:', localStorageError);
    }

    // Clear service worker caches if available
    if ('caches' in globalThis) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('Service worker caches cleared');
      } catch (cacheError) {
        console.warn('Failed to clear caches:', cacheError);
      }
    }

    // Unregister service workers if any
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
        console.log('Service workers unregistered');
      } catch (swError) {
        console.warn('Failed to unregister service workers:', swError);
      }
    }

    // Force hard reload from server (bypass cache)
    console.log('Reloading page from server...');
    globalThis.location.reload();
  } catch (error) {
    console.error('Error during full data clear:', error);
    // Even if clearing fails, try to reload anyway
    globalThis.location.reload();
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