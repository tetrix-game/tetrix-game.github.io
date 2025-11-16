import type { TilesSet } from './types';

const GRID_SIZE = 10;

// Helper to create tile key
function makeTileKey(row: number, column: number): string {
  return `R${row}C${column}`;
}

/**
 * Checks if a specific row is completely filled with blocks
 * @param tiles - All tiles in the grid (Map)
 * @param row - The row number to check (1-indexed)
 * @returns true if all 10 tiles in the row have isFilled = true
 */
export function isRowFull(tiles: TilesSet, row: number): boolean {
  for (let column = 1; column <= GRID_SIZE; column++) {
    const tile = tiles.get(makeTileKey(row, column));
    if (!tile || !tile.isFilled) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if a specific column is completely filled with blocks
 * @param tiles - All tiles in the grid (Map)
 * @param column - The column number to check (1-indexed)
 * @returns true if all 10 tiles in the column have isFilled = true
 */
export function isColumnFull(tiles: TilesSet, column: number): boolean {
  for (let row = 1; row <= GRID_SIZE; row++) {
    const tile = tiles.get(makeTileKey(row, column));
    if (!tile || !tile.isFilled) {
      return false;
    }
  }
  return true;
}

/**
 * Finds all full rows in the grid
 * @param tiles - All tiles in the grid (Map)
 * @returns Array of row numbers that are completely filled (1-indexed)
 */
export function findFullRows(tiles: TilesSet): number[] {
  const fullRows: number[] = [];
  for (let row = 1; row <= GRID_SIZE; row++) {
    if (isRowFull(tiles, row)) {
      fullRows.push(row);
    }
  }
  return fullRows;
}

/**
 * Finds all full columns in the grid
 * @param tiles - All tiles in the grid (Map)
 * @returns Array of column numbers that are completely filled (1-indexed)
 */
export function findFullColumns(tiles: TilesSet): number[] {
  const fullColumns: number[] = [];
  for (let column = 1; column <= GRID_SIZE; column++) {
    if (isColumnFull(tiles, column)) {
      fullColumns.push(column);
    }
  }
  return fullColumns;
}

/**
 * Clears (empties) all tiles in the specified rows
 * @param tiles - All tiles in the grid (Map)
 * @param rows - Array of row numbers to clear (1-indexed)
 * @returns New tiles Map with specified rows cleared
 */
export function clearRows(tiles: TilesSet, rows: number[]): TilesSet {
  if (rows.length === 0) return tiles;

  const newTiles = new Map(tiles);
  const rowSet = new Set(rows);

  for (let row = 1; row <= GRID_SIZE; row++) {
    if (rowSet.has(row)) {
      for (let column = 1; column <= GRID_SIZE; column++) {
        newTiles.set(makeTileKey(row, column), { isFilled: false, color: 'grey' });
      }
    }
  }

  return newTiles;
}

/**
 * Clears (empties) all tiles in the specified columns
 * @param tiles - All tiles in the grid (Map)
 * @param columns - Array of column numbers to clear (1-indexed)
 * @returns New tiles Map with specified columns cleared
 */
export function clearColumns(tiles: TilesSet, columns: number[]): TilesSet {
  if (columns.length === 0) return tiles;

  const newTiles = new Map(tiles);
  const columnSet = new Set(columns);

  for (let column = 1; column <= GRID_SIZE; column++) {
    if (columnSet.has(column)) {
      for (let row = 1; row <= GRID_SIZE; row++) {
        newTiles.set(makeTileKey(row, column), { isFilled: false, color: 'grey' });
      }
    }
  }

  return newTiles;
}

/**
 * Finds and clears all full lines (both rows and columns) in the grid
 * This is the main function to call after placing a shape
 * @param tiles - All tiles in the grid (Map)
 * @returns Object containing the new tiles Map and info about what was cleared
 */
export function clearFullLines(tiles: TilesSet): {
  tiles: TilesSet;
  clearedRows: number[];
  clearedColumns: number[];
  totalLinesCleared: number;
} {
  const fullRows = findFullRows(tiles);
  const fullColumns = findFullColumns(tiles);

  // Clear rows first, then columns
  let newTiles = clearRows(tiles, fullRows);
  newTiles = clearColumns(newTiles, fullColumns);

  return {
    tiles: newTiles,
    clearedRows: fullRows,
    clearedColumns: fullColumns,
    totalLinesCleared: fullRows.length + fullColumns.length
  };
}
