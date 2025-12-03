import type {
  GamePersistenceData,
  ScorePersistenceData,
  TilesPersistenceData,
  ShapesPersistenceData,
  GameSettingsPersistenceData,
  MusicPersistenceData,
  SoundEffectsPersistenceData,
  ModifiersPersistenceData,
  StatsPersistenceData,
  LoadResult
} from './types';
import type { TileData, ColorName } from '../types';
import { INITIAL_GAME_STATS } from '../types/stats';
import {
  ScorePersistenceDataSchema,
  TilesPersistenceDataSchema,
  ShapesPersistenceDataSchema,
  MusicPersistenceDataSchema,
  SoundEffectsPersistenceDataSchema,
  StatsPersistenceDataSchema,
  ModifiersPersistenceDataSchema,
  GameSettingsPersistenceDataSchema,
  LegacyGamePersistenceDataSchema,
  validateSchema
} from './validationUtils';

const DB_NAME = 'TetrixGameDB';
const DB_VERSION = 7; // Keep in sync with indexedDBCrud.ts
const GAME_STATE_STORE = 'gameState'; // Legacy store
const SCORE_STORE = 'score';
const TILES_STORE = 'tiles';
const SHAPES_STORE = 'shapes';
const SETTINGS_STORE = 'settings';
const MODIFIERS_STORE = 'modifiers';
const STATS_STORE = 'stats';
const CALL_TO_ACTION_KEY_PREFIX = 'cta-';

/**
 * Check if IndexedDB is available (not in Node.js/testing environments)
 */
function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Delete the entire database
 * Used for hard resets when the database is corrupted
 */
export function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.log('Database deleted successfully');
      resolve();
    };

    request.onerror = () => {
      console.error('Failed to delete database:', request.error);
      reject(new Error('Failed to delete database'));
    };

    request.onblocked = () => {
      console.warn('Database deletion blocked');
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
      const error = request.error;
      console.error('Failed to open IndexedDB:', error);
      reject(new Error(`Failed to open IndexedDB: ${error}`));
    };

    request.onsuccess = async () => {
      const db = request.result;

      // Verify all required stores exist (including new view-separated stores)
      const requiredStores = [
        GAME_STATE_STORE, 
        SCORE_STORE, 
        TILES_STORE, 
        SHAPES_STORE, 
        SETTINGS_STORE, 
        MODIFIERS_STORE, 
        STATS_STORE,
        'infiniteState',
        'dailyState',
        'tutorialState',
        'dailyHistory'
      ];
      const missingStores = requiredStores.filter(store => !db.objectStoreNames.contains(store));

      if (missingStores.length > 0) {
        const errorMsg = `Missing object stores: ${missingStores.join(', ')}`;
        console.error(errorMsg);
        db.close();
        reject(new Error(errorMsg));
        return;
      }

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create legacy game state store for backward compatibility
      if (!db.objectStoreNames.contains(GAME_STATE_STORE)) {
        db.createObjectStore(GAME_STATE_STORE);
      }

      // Create granular stores
      if (!db.objectStoreNames.contains(SCORE_STORE)) {
        db.createObjectStore(SCORE_STORE);
      }

      if (!db.objectStoreNames.contains(TILES_STORE)) {
        db.createObjectStore(TILES_STORE);
      }

      if (!db.objectStoreNames.contains(SHAPES_STORE)) {
        db.createObjectStore(SHAPES_STORE);
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }

      if (!db.objectStoreNames.contains(MODIFIERS_STORE)) {
        db.createObjectStore(MODIFIERS_STORE);
      }

      if (!db.objectStoreNames.contains(STATS_STORE)) {
        db.createObjectStore(STATS_STORE);
      }

      // Create new view-separated stores for version 5
      if (!db.objectStoreNames.contains('infiniteState')) {
        db.createObjectStore('infiniteState');
      }

      if (!db.objectStoreNames.contains('dailyState')) {
        db.createObjectStore('dailyState');
      }

      if (!db.objectStoreNames.contains('tutorialState')) {
        db.createObjectStore('tutorialState');
      }

      if (!db.objectStoreNames.contains('dailyHistory')) {
        db.createObjectStore('dailyHistory');
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
export async function loadGameState(): Promise<LoadResult<GamePersistenceData>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([GAME_STATE_STORE], 'readonly');
      const store = transaction.objectStore(GAME_STATE_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        // Validate legacy data
        const validation = validateSchema(LegacyGamePersistenceDataSchema, result);
        
        if (validation.success) {
          const data = validation.data;
          // Ensure backward compatibility - add missing fields if they don't exist
          const gameData = {
            score: data.score || 0,
            tiles: data.tiles || [],
            nextShapes: data.nextShapes || [],
            savedShape: data.savedShape || null,
          };
          resolve({ status: 'success', data: gameData as GamePersistenceData });
        } else {
          console.error('Legacy game state validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load game state:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load game state: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading game state:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
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
      const existingDataResult = await loadGameSettings();
      if (existingDataResult.status === 'success') {
        existingSoundEffects = existingDataResult.data.soundEffects || existingSoundEffects;
        existingDebugUnlocked = existingDataResult.data.debugUnlocked || false;
      }
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
      const existingDataResult = await loadGameSettings();
      if (existingDataResult.status === 'success') {
        existingMusic = existingDataResult.data.music || existingMusic;
        existingDebugUnlocked = existingDataResult.data.debugUnlocked || false;
      }
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
      const existingDataResult = await loadGameSettings();
      if (existingDataResult.status === 'success') {
        existingMusic = existingDataResult.data.music || existingMusic;
        existingSoundEffects = existingDataResult.data.soundEffects || existingSoundEffects;
      }
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
export async function loadDebugSettings(): Promise<LoadResult<boolean>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        const validation = validateSchema(GameSettingsPersistenceDataSchema, result);
        
        if (validation.success) {
          resolve({ status: 'success', data: validation.data.debugUnlocked ?? false });
        } else {
          console.error('Debug settings validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load debug settings:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load debug settings: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading debug settings:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Load score from IndexedDB
 */
export async function loadScore(): Promise<LoadResult<number>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([SCORE_STORE], 'readonly');
      const store = transaction.objectStore(SCORE_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        const validation = validateSchema(ScorePersistenceDataSchema, result);
        
        if (validation.success) {
          resolve({ status: 'success', data: validation.data.score });
        } else {
          console.error('Score validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load score:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load score: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading score:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Load tiles from IndexedDB
 */
export async function loadTiles(): Promise<LoadResult<TilesPersistenceData['tiles']>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([TILES_STORE], 'readonly');
      const store = transaction.objectStore(TILES_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        const validation = validateSchema(TilesPersistenceDataSchema, result);
        
        if (validation.success) {
          resolve({ status: 'success', data: validation.data.tiles });
        } else {
          console.error('Tiles validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load tiles:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load tiles: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading tiles:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Load shapes from IndexedDB
 */
export async function loadShapes(): Promise<LoadResult<{ nextShapes: ShapesPersistenceData['nextShapes']; savedShape: ShapesPersistenceData['savedShape'] }>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([SHAPES_STORE], 'readonly');
      const store = transaction.objectStore(SHAPES_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        const validation = validateSchema(ShapesPersistenceDataSchema, result);
        
        if (validation.success) {
          resolve({
            status: 'success',
            data: {
              nextShapes: validation.data.nextShapes,
              savedShape: validation.data.savedShape
            }
          });
        } else {
          console.error('Shapes validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load shapes:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load shapes: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading shapes:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Load music settings from IndexedDB
 */
export async function loadMusicSettings(): Promise<LoadResult<{ isMuted: boolean; volume: number; isEnabled: boolean }>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        const validation = validateSchema(GameSettingsPersistenceDataSchema, result);
        
        if (validation.success) {
          resolve({ status: 'success', data: validation.data.music });
        } else {
          console.error('Music settings validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load music settings:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load music settings: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading music settings:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Load sound effects settings from IndexedDB
 */
export async function loadSoundEffectsSettings(): Promise<LoadResult<{ isMuted: boolean; volume: number; isEnabled: boolean }>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        const validation = validateSchema(GameSettingsPersistenceDataSchema, result);
        
        if (validation.success) {
          resolve({ status: 'success', data: validation.data.soundEffects });
        } else {
          console.error('Sound effects settings validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load sound effects settings:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load sound effects settings: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading sound effects settings:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Migrate stats to ensure all properties exist (backward compatibility)
 */
function migrateStats(stats: any): StatsPersistenceData {
  // Ensure noTurnStreak exists
  if (!stats.noTurnStreak) {
    stats.noTurnStreak = {
      current: 0,
      bestInGame: 0,
      allTimeBest: 0,
    };
  }
  return stats as StatsPersistenceData;
}

/**
 * Load stats from IndexedDB
 */
export async function loadStats(): Promise<LoadResult<StatsPersistenceData>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([STATS_STORE], 'readonly');
      const store = transaction.objectStore(STATS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        // Migrate old stats to ensure new properties exist
        const migratedStats = migrateStats(result);
        
        // Validate migrated stats
        const validation = validateSchema(StatsPersistenceDataSchema, migratedStats);
        
        if (validation.success) {
          resolve({ status: 'success', data: validation.data });
        } else {
          console.error('Stats validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load stats:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load stats: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading stats:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
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
export async function loadModifiers(): Promise<LoadResult<Set<number>>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([MODIFIERS_STORE], 'readonly');
      const store = transaction.objectStore(MODIFIERS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        const validation = validateSchema(ModifiersPersistenceDataSchema, result);
        
        if (validation.success) {
          resolve({ status: 'success', data: new Set(validation.data.unlockedModifiers) });
        } else {
          console.error('Modifiers validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load modifiers:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load modifiers: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading modifiers:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Load complete game settings from IndexedDB (helper for saving functions)
 */
async function loadGameSettings(): Promise<LoadResult<GameSettingsPersistenceData>> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve({ status: 'not_found' });
          return;
        }

        const validation = validateSchema(GameSettingsPersistenceDataSchema, result);
        
        if (validation.success) {
          resolve({ status: 'success', data: validation.data });
        } else {
          console.error('Game settings validation failed:', validation.error);
          resolve({ status: 'error', error: validation.error });
        }
      };

      request.onerror = () => {
        console.error('Failed to load game settings:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load game settings: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading game settings:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Save theme preference to IndexedDB
 */
export async function saveTheme(theme: string): Promise<void> {
  try {
    const db = await initializeDatabase();
    const settingsResult = await loadGameSettings();
    const settings = settingsResult.status === 'success' ? settingsResult.data : null;

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
export async function loadTheme(): Promise<LoadResult<string>> {
  try {
    const settingsResult = await loadGameSettings();
    if (settingsResult.status === 'success' && settingsResult.data.theme) {
      return { status: 'success', data: settingsResult.data.theme };
    }
    return { status: 'not_found' };
  } catch (error) {
    console.error('Error loading theme:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Load complete game state from granular stores (preferred method)
 * Falls back to legacy monolithic store if granular data is not available
 */
export async function loadCompleteGameState(): Promise<LoadResult<GamePersistenceData>> {
  try {
    // Try to load from granular stores first
    const [scoreResult, tilesResult, shapesResult] = await Promise.all([
      loadScore(),
      loadTiles(),
      loadShapes()
    ]);

    // Check for errors
    if (scoreResult.status === 'error') return { status: 'error', error: scoreResult.error };
    if (tilesResult.status === 'error') return { status: 'error', error: tilesResult.error };
    if (shapesResult.status === 'error') return { status: 'error', error: shapesResult.error };

    // Tiles are already in TileData format with position property
    const tiles: GamePersistenceData['tiles'] = tilesResult.status === 'success' ? tilesResult.data : [];
    const score = scoreResult.status === 'success' ? scoreResult.data : 0;
    const shapes = shapesResult.status === 'success' ? shapesResult.data : null;

    // Only return granular state if we have tiles (indicating a real game in progress)
    if (tiles.length === 100) {
      console.log('Loaded game state from granular stores');
      return {
        status: 'success',
        data: {
          score,
          tiles,
          nextShapes: shapes?.nextShapes ?? [],
          savedShape: shapes?.savedShape ?? null
        }
      };
    }

    // Fallback to legacy monolithic store
    console.log('Granular stores empty, trying legacy store...');
    const legacyResult = await loadGameState();
    
    if (legacyResult.status === 'error') return legacyResult;
    
    if (legacyResult.status === 'success') {
      const legacyData = legacyResult.data;
      if (legacyData?.tiles?.length === 100) {
        console.log('Loaded game state from legacy store');

        // Migrate legacy data to granular stores for future use
        // Convert old Tile[] format to TileData if needed
        const tilesData: TileData[] = legacyData.tiles.map((tile: any) => {
          if (tile.location) {
            // Old format - convert
            return {
              position: `R${tile.location.row}C${tile.location.column}`,
              isFilled: tile.block.isFilled,
              color: tile.block.color,
              backgroundColor: 'grey' as ColorName,
            };
          } else {
            // Already TileData
            return tile as TileData;
          }
        });

        safeBatchSave(
          legacyData.score,
          tilesData,
          legacyData.nextShapes,
          legacyData.savedShape
        ).catch((error: Error) => {
          console.error('Failed to migrate legacy data to granular stores:', error);
        });

        return {
          status: 'success',
          data: {
            ...legacyData,
            tiles: tilesData,
          }
        };
      }
    }

    console.log('No saved game state found in either granular or legacy stores');
    return { status: 'not_found' };
  } catch (error) {
    console.error('Error loading complete game state:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
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
          const currentShapesResult = await loadShapes();
          const currentShapes = currentShapesResult.status === 'success' ? currentShapesResult.data : null;
          
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
      const statsResult = await loadStats();
      if (statsResult.status === 'success') {
        existingStats = statsResult.data;
      }
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
    // Delete the entire database file
    await deleteDatabase();
    console.log('Database deleted successfully');

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
    const tilesResult = await loadTiles();
    if (tilesResult.status === 'success' && tilesResult.data.length === 100) {
      return true;
    }

    // Fallback to legacy store
    const gameDataResult = await loadGameState();
    return gameDataResult.status === 'success' && gameDataResult.data.tiles.length > 0;
  } catch {
    return false;
  }
}

/**
 * Save call-to-action timestamp to IndexedDB
 * Stores the timestamp when a call-to-action was last dismissed
 */
export async function saveCallToActionTimestamp(callKey: string, timestamp: number): Promise<void> {
  if (!isIndexedDBAvailable()) {
    // Fallback to sessionStorage for testing/non-browser environments
    try {
      sessionStorage.setItem(`${CALL_TO_ACTION_KEY_PREFIX}${callKey}`, timestamp.toString());
    } catch {
      console.warn('Failed to save call-to-action timestamp to sessionStorage');
    }
    return;
  }

  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);

      const storageKey = `${CALL_TO_ACTION_KEY_PREFIX}${callKey}`;
      const request = store.put(timestamp, storageKey);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save call-to-action timestamp:', request.error);
        reject(new Error(`Failed to save call-to-action timestamp: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving call-to-action timestamp:', error);
    throw error;
  }
}

/**
 * Load call-to-action timestamp from IndexedDB
 * Returns the timestamp when the call-to-action was last dismissed, or null if never dismissed
 */
export async function loadCallToActionTimestamp(callKey: string): Promise<LoadResult<number>> {
  if (!isIndexedDBAvailable()) {
    // Fallback to sessionStorage for testing/non-browser environments
    try {
      const value = sessionStorage.getItem(`${CALL_TO_ACTION_KEY_PREFIX}${callKey}`);
      return value ? { status: 'success', data: parseInt(value, 10) } : { status: 'not_found' };
    } catch {
      return { status: 'not_found' };
    }
  }

  try {
    const db = await initializeDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);

      const storageKey = `${CALL_TO_ACTION_KEY_PREFIX}${callKey}`;
      const request = store.get(storageKey);

      request.onsuccess = () => {
        const result = request.result;
        if (typeof result === 'number') {
          resolve({ status: 'success', data: result });
        } else {
          resolve({ status: 'not_found' });
        }
      };

      request.onerror = () => {
        console.error('Failed to load call-to-action timestamp:', request.error);
        resolve({ status: 'error', error: new Error(`Failed to load call-to-action timestamp: ${request.error}`) });
      };
    });
  } catch (error) {
    console.error('Error loading call-to-action timestamp:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}