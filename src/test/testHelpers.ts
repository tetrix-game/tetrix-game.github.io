import type { TilesSet, ColorName } from '../types';
import { TileEntity } from '../types';
import { GRID_SIZE } from '../utils/gridConstants';

/**
 * Helper functions for testing with TilesSet (Map-based tiles using TileEntity)
 */

// Helper to get tile data from TilesSet
export function getTileData(tiles: TilesSet, row: number, column: number) {
  return tiles.get(`R${row}C${column}`);
}

// Helper to count filled tiles
export function countFilledTiles(tiles: TilesSet): number {
  let count = 0;
  for (const tile of tiles.values()) {
    if (tile.isFilled) count++;
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
        result.push({ location: { row, column }, isFilled: tile.isFilled, color: tile.blockColor });
      }
    }
  }
  return result;
}

// Helper to check if row is full
export function isRowFull(tiles: TilesSet, row: number): boolean {
  for (let column = 1; column <= GRID_SIZE; column++) {
    const tile = getTileData(tiles, row, column);
    if (!tile || !tile.isFilled) {
      return false;
    }
  }
  return true;
}

// Helper to check if column is full
export function isColumnFull(tiles: TilesSet, column: number): boolean {
  for (let row = 1; row <= GRID_SIZE; row++) {
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
  const position = `R${row}C${column}`;
  const existingTile = newTiles.get(position);
  
  if (existingTile) {
    existingTile.isFilled = isFilled;
    existingTile.blockColor = color;
  } else {
    const tile = new TileEntity(position, 'grey', { isFilled, color }, []);
    newTiles.set(position, tile);
  }
  
  return newTiles;
}

// Helper to create a TilesSet with specific filled positions
export function createTilesWithFilled(
  positions: Array<{ row: number; column: number; color?: ColorName }>
): TilesSet {
  const tiles = new Map<string, TileEntity>();

  // Initialize all tiles as empty
  for (let row = 1; row <= GRID_SIZE; row++) {
    for (let column = 1; column <= GRID_SIZE; column++) {
      const position = `R${row}C${column}`;
      const tile = new TileEntity(position, 'grey', { isFilled: false, color: 'grey' }, []);
      tiles.set(position, tile);
    }
  }

  // Fill specified positions
  for (const pos of positions) {
    const position = `R${pos.row}C${pos.column}`;
    const tile = tiles.get(position);
    if (tile) {
      tile.isFilled = true;
      tile.blockColor = (pos.color || 'blue') as ColorName;
    }
  }

  return tiles;
}
