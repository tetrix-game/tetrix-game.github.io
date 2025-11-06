import type { GamePersistenceData } from './types';

const DB_NAME = 'TetrixGameDB';
const DB_VERSION = 1;
const GAME_STATE_STORE = 'gameState';
const MUSIC_STATE_STORE = 'musicState';

/**
 * Check if IndexedDB is available (not in Node.js/testing environments)
 */
function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Initialize the IndexedDB database for Tetrix game
 */
export function initializeDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB not available in this environment'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(new Error(`Failed to open IndexedDB: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create game state store (score, grid tiles, shapes)
      if (!db.objectStoreNames.contains(GAME_STATE_STORE)) {
        const gameStore = db.createObjectStore(GAME_STATE_STORE);
        // Initialize with default values
        gameStore.add({
          score: 0,
          tiles: [],
          currentMusicTrack: 0,
          nextShapes: [],
          savedShape: null
        }, 'current');
      }

      // Create music state store (current track, volume, etc.)
      if (!db.objectStoreNames.contains(MUSIC_STATE_STORE)) {
        const musicStore = db.createObjectStore(MUSIC_STATE_STORE);
        // Initialize with default values
        musicStore.add({
          currentTrack: 0,
          isMuted: false,
          hasUserInteracted: false
        }, 'current');
      }
    };
  });
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
            currentMusicTrack: result.currentMusicTrack || 0,
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
 * Save music state (current track, mute status, etc.)
 */
export async function saveMusicState(musicData: {
  currentTrack: number;
  isMuted: boolean;
  hasUserInteracted: boolean;
}): Promise<void> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MUSIC_STATE_STORE], 'readwrite');
      const store = transaction.objectStore(MUSIC_STATE_STORE);

      const request = store.put(musicData, 'current');

      request.onsuccess = () => {
        console.log('Music state saved successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save music state:', request.error);
        reject(new Error(`Failed to save music state: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving music state:', error);
    throw error;
  }
}

/**
 * Load music state from IndexedDB
 */
export async function loadMusicState(): Promise<{
  currentTrack: number;
  isMuted: boolean;
  hasUserInteracted: boolean;
} | null> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MUSIC_STATE_STORE], 'readonly');
      const store = transaction.objectStore(MUSIC_STATE_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to load music state:', request.error);
        reject(new Error(`Failed to load music state: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading music state:', error);
    return null;
  }
}

/**
 * Clear all saved data (reset game)
 */
export async function clearAllSavedData(): Promise<void> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAME_STATE_STORE, MUSIC_STATE_STORE], 'readwrite');

      // Clear game state
      const gameStore = transaction.objectStore(GAME_STATE_STORE);
      gameStore.delete('current');

      // Reset music state
      const musicStore = transaction.objectStore(MUSIC_STATE_STORE);
      musicStore.put({
        currentTrack: 0,
        isMuted: false,
        hasUserInteracted: false
      }, 'current');

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
 * Check if there's any saved game data
 */
export async function hasSavedGameData(): Promise<boolean> {
  try {
    const gameData = await loadGameState();
    return gameData !== null && gameData.tiles.length > 0;
  } catch {
    return false;
  }
}