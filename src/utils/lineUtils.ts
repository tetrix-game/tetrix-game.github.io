import type { Tile } from './types';

const GRID_SIZE = 10;

/**
 * Checks if a specific row is completely filled with blocks
 * @param tiles - All tiles in the grid
 * @param row - The row number to check (1-indexed)
 * @returns true if all 10 tiles in the row have isFilled = true
 */
export function isRowFull(tiles: Tile[], row: number): boolean {
  const rowTiles = tiles.filter(tile => tile.location.row === row);
  return rowTiles.length === GRID_SIZE && rowTiles.every(tile => tile.block.isFilled);
}

/**
 * Checks if a specific column is completely filled with blocks
 * @param tiles - All tiles in the grid
 * @param column - The column number to check (1-indexed)
 * @returns true if all 10 tiles in the column have isFilled = true
 */
export function isColumnFull(tiles: Tile[], column: number): boolean {
  const columnTiles = tiles.filter(tile => tile.location.column === column);
  return columnTiles.length === GRID_SIZE && columnTiles.every(tile => tile.block.isFilled);
}

/**
 * Finds all full rows in the grid
 * @param tiles - All tiles in the grid
 * @returns Array of row numbers that are completely filled (1-indexed)
 */
export function findFullRows(tiles: Tile[]): number[] {
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
 * @param tiles - All tiles in the grid
 * @returns Array of column numbers that are completely filled (1-indexed)
 */
export function findFullColumns(tiles: Tile[]): number[] {
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
 * @param tiles - All tiles in the grid
 * @param rows - Array of row numbers to clear (1-indexed)
 * @returns New tiles array with specified rows cleared
 */
export function clearRows(tiles: Tile[], rows: number[]): Tile[] {
  if (rows.length === 0) return tiles;

  const rowSet = new Set(rows);
  const emptyColor = {
    lightest: '#000000',
    light: '#000000',
    main: '#000000',
    dark: '#000000',
    darkest: '#000000'
  };

  return tiles.map(tile => {
    if (rowSet.has(tile.location.row)) {
      return {
        ...tile,
        block: { isFilled: false, color: emptyColor }
      };
    }
    return tile;
  });
}

/**
 * Clears (empties) all tiles in the specified columns
 * @param tiles - All tiles in the grid
 * @param columns - Array of column numbers to clear (1-indexed)
 * @returns New tiles array with specified columns cleared
 */
export function clearColumns(tiles: Tile[], columns: number[]): Tile[] {
  if (columns.length === 0) return tiles;

  const columnSet = new Set(columns);
  const emptyColor = {
    lightest: '#000000',
    light: '#000000',
    main: '#000000',
    dark: '#000000',
    darkest: '#000000'
  };

  return tiles.map(tile => {
    if (columnSet.has(tile.location.column)) {
      return {
        ...tile,
        block: { isFilled: false, color: emptyColor }
      };
    }
    return tile;
  });
}

/**
 * Finds and clears all full lines (both rows and columns) in the grid
 * This is the main function to call after placing a shape
 * @param tiles - All tiles in the grid
 * @returns Object containing the new tiles array and info about what was cleared
 */
export function clearFullLines(tiles: Tile[]): {
  tiles: Tile[];
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
