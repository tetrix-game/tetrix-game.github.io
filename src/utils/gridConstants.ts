/**
 * Grid Constants - Static grid addresses and helper functions
 * 
 * This module provides:
 * - GRID_ADDRESSES: Static array of all grid tile keys (R1C1 through R10C10)
 * - Helper functions for tile key manipulation
 * - Challenge board data conversion utilities
 */

import type { TileData, ColorName } from '../types';

// Grid configuration
export const GRID_SIZE = 10 as const;

/**
 * Generate static grid addresses in row-major order
 * Returns a frozen array of all 100 grid keys (R1C1, R1C2, ..., R10C10)
 */
function generateGridAddresses(): readonly string[] {
  const addresses: string[] = [];
  for (let row = 1; row <= GRID_SIZE; row++) {
    for (let column = 1; column <= GRID_SIZE; column++) {
      addresses.push(`R${row}C${column}`);
    }
  }
  
  // Freeze to prevent mutations
  return Object.freeze(addresses);
}

/**
 * Static array of all grid addresses in row-major order
 * Use this for iteration instead of generating arrays
 */
export const GRID_ADDRESSES = generateGridAddresses();

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
export function tilesMapToChallengeData(tilesMap: Map<string, TileData>): ChallengeBoardData {
  const tiles: Array<{ key: string; data: { isFilled: boolean; color: ColorName } }> = [];
  
  tilesMap.forEach((data, key) => {
    // Only save filled tiles to keep data compact
    if (data.isFilled) {
      tiles.push({
        key,
        data: {
          isFilled: data.isFilled,
          color: data.color,
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
      isFilled: false,
      color: 'grey',
    });
  }
  
  // Apply challenge tiles with validation
  challengeData.tiles.forEach(({ key, data }) => {
    if (!GRID_ADDRESSES.includes(key)) {
      throw new Error(`Invalid challenge tile key: ${key}. Must be in format R<1-10>C<1-10>`);
    }
    tiles.set(key, data);
  });
  
  return tiles;
}
