import { gridConstants } from '../../gridConstants';
import type { TilesSet, ColorName, Tile, Shape, Block } from '../../types';

const { GRID_SIZE } = gridConstants;

/**
 * Helper functions for testing with TilesSet (Map-based tiles using plain Tile objects)
 */

// Helper to get tile data from TilesSet
export function getTileData(tiles: TilesSet, row: number, column: number): Tile | undefined {
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

// Helper to check if row is full
export function isRowFull(tiles: TilesSet, row: number): boolean {
  for (let column = 0; column < GRID_SIZE; column++) {
    const tile = getTileData(tiles, row, column);
    if (!tile || !tile.block.isFilled) {
      return false;
    }
  }
  return true;
}

// Helper to check if column is full
export function isColumnFull(tiles: TilesSet, column: number): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    const tile = getTileData(tiles, row, column);
    if (!tile || !tile.block.isFilled) {
      return false;
    }
  }
  return true;
}

// Helper to create a TilesSet with specific filled positions
export function createTilesWithFilled(
  positions: Array<{ row: number; column: number; color?: ColorName }>,
): TilesSet {
  const tiles = new Map<string, Tile>();

  // Initialize all tiles as empty
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let column = 0; column < GRID_SIZE; column++) {
      const position = `R${row}C${column}`;
      const tile: Tile = {
        position,
        backgroundColor: 'grey',
        block: { isFilled: false, color: 'grey' },
        activeAnimations: [],
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
        block: { isFilled: true, color: (pos.color || 'blue') as ColorName },
      });
    }
  }

  return tiles;
}

// ============================================================================
// SHAPE FACTORY FUNCTIONS
// ============================================================================

/**
 * Helper function to create an empty block
 */
function createEmptyBlock(): Block {
  return { color: 'grey', isFilled: false };
}

/**
 * Helper function to create a filled block with a specific color
 */
function createFilledBlock(color: ColorName): Block {
  return { color, isFilled: true };
}

/**
 * Create a single block shape (1x1)
 */
export function createSingleBlockShape(color: ColorName = 'blue'): Shape {
  const _ = createEmptyBlock;
  const X = (): Block => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [_(), _(), _(), _()],
    [_(), _(), X(), _()],
    [_(), _(), _(), _()],
  ];
}

/**
 * Create a horizontal line shape (4 blocks in a row)
 */
export function createHorizontalLineShape(color: ColorName = 'red'): Shape {
  const _ = createEmptyBlock;
  const X = (): Block => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [_(), _(), _(), _()],
    [X(), X(), X(), X()],
    [_(), _(), _(), _()],
  ];
}

/**
 * Create a vertical line shape (4 blocks in a column)
 */
export function createVerticalLineShape(color: ColorName = 'blue'): Shape {
  const _ = createEmptyBlock;
  const X = (): Block => createFilledBlock(color);

  return [
    [_(), X(), _(), _()],
    [_(), X(), _(), _()],
    [_(), X(), _(), _()],
    [_(), X(), _(), _()],
  ];
}

/**
 * Create an L-shape (4 blocks in L formation)
 */
export function createLShape(color: ColorName = 'green'): Shape {
  const _ = createEmptyBlock;
  const X = (): Block => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [_(), X(), _(), _()],
    [_(), X(), _(), _()],
    [_(), X(), X(), _()],
  ];
}

/**
 * Create a square shape (2x2)
 */
export function createSquareShape(color: ColorName = 'yellow'): Shape {
  const _ = createEmptyBlock;
  const X = (): Block => createFilledBlock(color);

  return [
    [_(), _(), _(), _()],
    [_(), X(), X(), _()],
    [_(), X(), X(), _()],
    [_(), _(), _(), _()],
  ];
}

// ============================================================================
// GRID FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an empty grid (10x10 with all tiles empty)
 */
export function createEmptyGrid(): TilesSet {
  return createTilesWithFilled([]);
}

/**
 * Create a completely full grid (10x10 with all tiles filled)
 */
export function createFullGrid(color: ColorName = 'blue'): TilesSet {
  const positions: Array<{ row: number; column: number; color: ColorName }> = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let column = 0; column < GRID_SIZE; column++) {
      positions.push({ row, column, color });
    }
  }
  return createTilesWithFilled(positions);
}

/**
 * Create a grid with one empty spot at the specified location
 */
export function createGridWithOneEmptySpot(row: number, col: number): TilesSet {
  const positions: Array<{ row: number; column: number; color: ColorName }> = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Skip the empty spot
      if (r !== row || c !== col) {
        positions.push({ row: r, column: c, color: 'blue' });
      }
    }
  }
  return createTilesWithFilled(positions);
}

// Default export to match folder name
export const testHelpers = {
  getTileData,
  countFilledTiles,
  isRowFull,
  isColumnFull,
  createTilesWithFilled,
  createSingleBlockShape,
  createHorizontalLineShape,
  createVerticalLineShape,
  createLShape,
  createSquareShape,
  createEmptyGrid,
  createFullGrid,
  createGridWithOneEmptySpot,
};
