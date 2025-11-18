import type { TilesSet, ColorName, TileData } from '../types';

/**
 * Helper functions for testing with TilesSet (Map-based tiles)
 */

// Helper to get tile data from TilesSet
export function getTileData(tiles: TilesSet, row: number, column: number) {
  return tiles.get(`R${row}C${column}`);
}

// Helper to count filled tiles
export function countFilledTiles(tiles: TilesSet): number {
  let count = 0;
  for (const tileData of tiles.values()) {
    if (tileData.isFilled) count++;
  }
  return count;
}

// Helper to convert TilesSet to array for filtering
export function tilesToArray(tiles: TilesSet) {
  const result = [];
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      const tileData = tiles.get(`R${row}C${column}`);
      if (tileData) {
        result.push({ location: { row, column }, ...tileData });
      }
    }
  }
  return result;
}

// Helper to check if row is full
export function isRowFull(tiles: TilesSet, row: number): boolean {
  for (let column = 1; column <= 10; column++) {
    const tile = getTileData(tiles, row, column);
    if (!tile || !tile.isFilled) {
      return false;
    }
  }
  return true;
}

// Helper to check if column is full
export function isColumnFull(tiles: TilesSet, column: number): boolean {
  for (let row = 1; row <= 10; row++) {
    const tile = getTileData(tiles, row, column);
    if (!tile || !tile.isFilled) {
      return false;
    }
  }
  return true;
}

// Helper to fill a specific tile in a TilesSet
export function setTileData(
  tiles: TilesSet,
  row: number,
  column: number,
  isFilled: boolean,
  color: ColorName
): TilesSet {
  const newTiles = new Map(tiles);
  newTiles.set(`R${row}C${column}`, { isFilled, color });
  return newTiles;
}

// Helper to create a TilesSet with specific filled positions
export function createTilesWithFilled(
  positions: Array<{ row: number; column: number; color?: ColorName }>
): TilesSet {
  const tiles = new Map<string, TileData>();

  // Initialize all tiles as empty
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      tiles.set(`R${row}C${column}`, {
        isFilled: false,
        color: 'grey' as ColorName,
      });
    }
  }

  // Fill specified positions
  for (const pos of positions) {
    tiles.set(`R${pos.row}C${pos.column}`, {
      isFilled: true,
      color: (pos.color || 'blue') as ColorName,
    });
  }

  return tiles;
}
