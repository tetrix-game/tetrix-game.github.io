/**
 * Grid Constants - Static grid addresses and helper functions
 * 
 * This module provides:
 * - GRID_ADDRESSES: Static array of all grid tile keys (R1C1 through R10C10)
 * - Helper functions for tile key manipulation
 * - Challenge board data conversion utilities
 */

import type { TileData, ColorName, TilesSet } from '../types';

// Grid configuration - mutable to allow runtime size changes
export let GRID_SIZE = 10;

/**
 * Generate grid addresses in row-major order
 * Returns a frozen array of all grid keys (R1C1, R1C2, ..., RnCn)
 */
function generateGridAddresses(size: number): readonly string[] {
  const addresses: string[] = [];
  for (let row = 1; row <= size; row++) {
    for (let column = 1; column <= size; column++) {
      addresses.push(`R${row}C${column}`);
    }
  }
  
  // Freeze to prevent mutations
  return Object.freeze(addresses);
}

/**
 * Array of all grid addresses in row-major order
 * Use this for iteration instead of generating arrays
 * Regenerated when grid size changes
 */
export let GRID_ADDRESSES = generateGridAddresses(GRID_SIZE);

/**
 * Set the grid size and regenerate all grid addresses
 * This should be called before initializing the game state
 * @param size - The new grid size (e.g., 8, 10, 12, 15)
 */
export function setGridSize(size: number): void {
  if (size < 4 || size > 20) {
    throw new Error(`Grid size must be between 4 and 20, got ${size}`);
  }
  GRID_SIZE = size;
  GRID_ADDRESSES = generateGridAddresses(size);
}

// Validation at module load time
if (GRID_ADDRESSES.length !== GRID_SIZE * GRID_SIZE) {
  throw new Error(`GRID_ADDRESSES must have exactly ${GRID_SIZE * GRID_SIZE} entries, got ${GRID_ADDRESSES.length}`);
}

/**
 * Helper function to create a tile key from location (1-indexed)
 */
export function makeTileKey(row: number, column: number): string {
  return `R${row}C${column}`;
}

/**
 * Helper function to parse a tile key back to location (1-indexed)
 */
export function parseTileKey(key: string): { row: number; column: number } {
  const match = key.match(/R(\d+)C(\d+)/);
  if (!match) throw new Error(`Invalid tile key: ${key}`);
  return { row: parseInt(match[1], 10), column: parseInt(match[2], 10) };
}

/**
 * Validate that a tiles Map has all required keys
 */
export function validateTilesMap(tiles: Map<string, TileData>): void {
  const expectedSize = GRID_SIZE * GRID_SIZE;
  if (tiles.size !== expectedSize) {
    throw new Error(`Tiles map must have exactly ${expectedSize} entries, got ${tiles.size}`);
  }
  
  for (const key of GRID_ADDRESSES) {
    if (!tiles.has(key)) {
      throw new Error(`Missing required tile key: ${key}`);
    }
  }
}

/**
 * Challenge board data structure for serialization
 */
export type ChallengeBoardData = {
  tiles: Array<{
    key: string;
    data: {
      isFilled: boolean;
      color: ColorName;
    }
  }>;
};

/**
 * Convert tiles Map to challenge board data (only includes filled tiles)
 * Use this for exporting board state from debug editor
 */
export function tilesMapToChallengeData(tilesMap: TilesSet): ChallengeBoardData {
  const tiles: Array<{ key: string; data: { isFilled: boolean; color: ColorName } }> = [];
  
  tilesMap.forEach((tile, key) => {
    // Only save filled tiles to keep data compact
    if (tile.isFilled) {
      tiles.push({
        key,
        data: {
          isFilled: tile.isFilled,
          color: tile.blockColor,
        }
      });
    }
  });
  
  return { tiles };
}

/**
 * Convert challenge board data to tiles Map
 * Use this for loading challenge boards into the game
 */
export function challengeDataToTilesMap(challengeData: ChallengeBoardData): Map<string, TileData> {
  const tiles = new Map<string, TileData>();
  
  // Initialize empty board using static addresses
  for (const key of GRID_ADDRESSES) {
    tiles.set(key, {
      position: key,
      isFilled: false,
      color: 'grey',
    });
  }
  
  // Apply challenge tiles with validation
  challengeData.tiles.forEach(({ key, data }) => {
    if (!GRID_ADDRESSES.includes(key)) {
      throw new Error(`Invalid challenge tile key: ${key}. Must be in format R<1-10>C<1-10>`);
    }
    tiles.set(key, {
      position: key,
      isFilled: data.isFilled,
      color: data.color,
    });
  });
  
  return tiles;
}
