import type { TilesSet, ColorName, Tile } from '../types';
import { GRID_SIZE } from '../utils/gridConstants';

/**
 * Helper functions for testing with TilesSet (Map-based tiles using plain Tile objects)
 */

// Helper to get tile data from TilesSet
export function getTileData(tiles: TilesSet, row: number, column: number) {
  return tiles.get(`R${row}C${column}`);
}

// Helper to count filled tiles
export function countFilledTiles(tiles: TilesSet): number {
  let count = 0;
  for (const tile of tiles.values()) {
    if (tile.block.isFilled) count++;
  }
  return count;
}

// Helper to convert TilesSet to array for filtering
export function tilesToArray(tiles: TilesSet) {
  const result = [];
  for (let row = 1; row <= GRID_SIZE; row++) {
    for (let column = 1; column <= GRID_SIZE; column++) {
      const tile = tiles.get(`R${row}C${column}`);
      if (tile) {
        result.push({ location: { row, column }, isFilled: tile.block.isFilled, color: tile.block.color });
      }
    }
  }
  return result;
}

// Helper to check if row is full
export function isRowFull(tiles: TilesSet, row: number): boolean {
  for (let column = 1; column <= GRID_SIZE; column++) {
    const tile = getTileData(tiles, row, column);
    if (!tile || !tile.block.isFilled) {
      return false;
    }
  }
  return true;
}

// Helper to check if column is full
export function isColumnFull(tiles: TilesSet, column: number): boolean {
  for (let row = 1; row <= GRID_SIZE; row++) {
    const tile = getTileData(tiles, row, column);
    if (!tile || !tile.block.isFilled) {
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
  const position = `R${row}C${column}`;
  const existingTile = newTiles.get(position);
  
  if (existingTile) {
    newTiles.set(position, {
      ...existingTile,
      block: { isFilled, color }
    });
  } else {
    const tile: Tile = {
      position,
      backgroundColor: 'grey',
      block: { isFilled, color },
      activeAnimations: []
    };
    newTiles.set(position, tile);
  }
  
  return newTiles;
}

// Helper to create a TilesSet with specific filled positions
export function createTilesWithFilled(
  positions: Array<{ row: number; column: number; color?: ColorName }>
): TilesSet {
  const tiles = new Map<string, Tile>();

  // Initialize all tiles as empty
  for (let row = 1; row <= GRID_SIZE; row++) {
    for (let column = 1; column <= GRID_SIZE; column++) {
      const position = `R${row}C${column}`;
      const tile: Tile = {
        position,
        backgroundColor: 'grey',
        block: { isFilled: false, color: 'grey' },
        activeAnimations: []
      };
      tiles.set(position, tile);
    }
  }

  // Fill specified positions
  for (const pos of positions) {
    const position = `R${pos.row}C${pos.column}`;
    const tile = tiles.get(position);
    if (tile) {
      tiles.set(position, {
        ...tile,
        block: { isFilled: true, color: (pos.color || 'blue') as ColorName }
      });
    }
  }

  return tiles;
}
