import { describe, it, expect } from 'vitest';
import {
  isRowFull,
  isColumnFull,
  findFullRows,
  findFullColumns,
  clearRows,
  clearColumns,
  clearFullLines
} from '../utils/lineUtils';
import type { Tile } from '../utils/types';

// Helper to create a test tile
const createTile = (row: number, column: number, isFilled: boolean): Tile => {
  return {
    id: `(row: ${row}, column: ${column})`,
    location: { row, column },
    block: { isFilled, color: isFilled ? 'red' : 'grey' }
  };
};

// Helper to create a full grid of empty tiles
const createEmptyGrid = (): Tile[] => {
  const tiles: Tile[] = [];
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      tiles.push(createTile(row, column, false));
    }
  }
  return tiles;
};

describe('Line Clearing Utilities', () => {
  describe('isRowFull', () => {
    it('should return true when all 10 tiles in a row are filled', () => {
      const tiles = createEmptyGrid();
      // Fill row 5
      const tilesWithFullRow = tiles.map(tile =>
        tile.location.row === 5 ? createTile(tile.location.row, tile.location.column, true) : tile
      );

      expect(isRowFull(tilesWithFullRow, 5)).toBe(true);
    });

    it('should return false when a row is not completely filled', () => {
      const tiles = createEmptyGrid();
      // Fill row 5 except for one tile
      const tilesWithPartialRow = tiles.map(tile =>
        tile.location.row === 5 && tile.location.column !== 5
          ? createTile(tile.location.row, tile.location.column, true)
          : tile
      );

      expect(isRowFull(tilesWithPartialRow, 5)).toBe(false);
    });

    it('should return false for an empty row', () => {
      const tiles = createEmptyGrid();
      expect(isRowFull(tiles, 1)).toBe(false);
    });
  });

  describe('isColumnFull', () => {
    it('should return true when all 10 tiles in a column are filled', () => {
      const tiles = createEmptyGrid();
      // Fill column 3
      const tilesWithFullColumn = tiles.map(tile =>
        tile.location.column === 3 ? createTile(tile.location.row, tile.location.column, true) : tile
      );

      expect(isColumnFull(tilesWithFullColumn, 3)).toBe(true);
    });

    it('should return false when a column is not completely filled', () => {
      const tiles = createEmptyGrid();
      // Fill column 3 except for one tile
      const tilesWithPartialColumn = tiles.map(tile =>
        tile.location.column === 3 && tile.location.row !== 7
          ? createTile(tile.location.row, tile.location.column, true)
          : tile
      );

      expect(isColumnFull(tilesWithPartialColumn, 3)).toBe(false);
    });

    it('should return false for an empty column', () => {
      const tiles = createEmptyGrid();
      expect(isColumnFull(tiles, 1)).toBe(false);
    });
  });

  describe('findFullRows', () => {
    it('should find all full rows', () => {
      const tiles = createEmptyGrid();
      // Fill rows 2, 5, and 9
      const tilesWithFullRows = tiles.map(tile => {
        if (tile.location.row === 2 || tile.location.row === 5 || tile.location.row === 9) {
          return createTile(tile.location.row, tile.location.column, true);
        }
        return tile;
      });

      const fullRows = findFullRows(tilesWithFullRows);
      expect(fullRows).toEqual([2, 5, 9]);
    });

    it('should return empty array when no rows are full', () => {
      const tiles = createEmptyGrid();
      expect(findFullRows(tiles)).toEqual([]);
    });
  });

  describe('findFullColumns', () => {
    it('should find all full columns', () => {
      const tiles = createEmptyGrid();
      // Fill columns 1, 4, and 10
      const tilesWithFullColumns = tiles.map(tile => {
        if (tile.location.column === 1 || tile.location.column === 4 || tile.location.column === 10) {
          return createTile(tile.location.row, tile.location.column, true);
        }
        return tile;
      });

      const fullColumns = findFullColumns(tilesWithFullColumns);
      expect(fullColumns).toEqual([1, 4, 10]);
    });

    it('should return empty array when no columns are full', () => {
      const tiles = createEmptyGrid();
      expect(findFullColumns(tiles)).toEqual([]);
    });
  });

  describe('clearRows', () => {
    it('should clear specified rows', () => {
      const tiles = createEmptyGrid();
      // Fill rows 2 and 5
      const tilesWithFullRows = tiles.map(tile => {
        if (tile.location.row === 2 || tile.location.row === 5) {
          return createTile(tile.location.row, tile.location.column, true);
        }
        return tile;
      });

      const clearedTiles = clearRows(tilesWithFullRows, [2, 5]);

      // Check that rows 2 and 5 are now empty
      const row2Tiles = clearedTiles.filter(t => t.location.row === 2);
      const row5Tiles = clearedTiles.filter(t => t.location.row === 5);

      expect(row2Tiles.every(t => !t.block.isFilled)).toBe(true);
      expect(row5Tiles.every(t => !t.block.isFilled)).toBe(true);
      expect(row2Tiles.every(t => t.block.color === 'grey')).toBe(true);
      expect(row5Tiles.every(t => t.block.color === 'grey')).toBe(true);
    });

    it('should not modify other rows', () => {
      const tiles = createEmptyGrid();
      // Fill rows 2 and 7
      const tilesWithFullRows = tiles.map(tile => {
        if (tile.location.row === 2 || tile.location.row === 7) {
          return createTile(tile.location.row, tile.location.column, true);
        }
        return tile;
      });

      const clearedTiles = clearRows(tilesWithFullRows, [2]);

      // Row 7 should still be filled
      const row7Tiles = clearedTiles.filter(t => t.location.row === 7);
      expect(row7Tiles.every(t => t.block.isFilled)).toBe(true);
    });

    it('should return unchanged tiles when clearing empty array', () => {
      const tiles = createEmptyGrid();
      const clearedTiles = clearRows(tiles, []);
      expect(clearedTiles).toBe(tiles);
    });
  });

  describe('clearColumns', () => {
    it('should clear specified columns', () => {
      const tiles = createEmptyGrid();
      // Fill columns 3 and 8
      const tilesWithFullColumns = tiles.map(tile => {
        if (tile.location.column === 3 || tile.location.column === 8) {
          return createTile(tile.location.row, tile.location.column, true);
        }
        return tile;
      });

      const clearedTiles = clearColumns(tilesWithFullColumns, [3, 8]);

      // Check that columns 3 and 8 are now empty
      const col3Tiles = clearedTiles.filter(t => t.location.column === 3);
      const col8Tiles = clearedTiles.filter(t => t.location.column === 8);

      expect(col3Tiles.every(t => !t.block.isFilled)).toBe(true);
      expect(col8Tiles.every(t => !t.block.isFilled)).toBe(true);
      expect(col3Tiles.every(t => t.block.color === 'grey')).toBe(true);
      expect(col8Tiles.every(t => t.block.color === 'grey')).toBe(true);
    });

    it('should not modify other columns', () => {
      const tiles = createEmptyGrid();
      // Fill columns 3 and 6
      const tilesWithFullColumns = tiles.map(tile => {
        if (tile.location.column === 3 || tile.location.column === 6) {
          return createTile(tile.location.row, tile.location.column, true);
        }
        return tile;
      });

      const clearedTiles = clearColumns(tilesWithFullColumns, [3]);

      // Column 6 should still be filled
      const col6Tiles = clearedTiles.filter(t => t.location.column === 6);
      expect(col6Tiles.every(t => t.block.isFilled)).toBe(true);
    });

    it('should return unchanged tiles when clearing empty array', () => {
      const tiles = createEmptyGrid();
      const clearedTiles = clearColumns(tiles, []);
      expect(clearedTiles).toBe(tiles);
    });
  });

  describe('clearFullLines', () => {
    it('should clear both full rows and columns', () => {
      const tiles = createEmptyGrid();
      // Fill row 5 and column 3
      const tilesWithFullLines = tiles.map(tile => {
        if (tile.location.row === 5 || tile.location.column === 3) {
          return createTile(tile.location.row, tile.location.column, true);
        }
        return tile;
      });

      const result = clearFullLines(tilesWithFullLines);

      expect(result.clearedRows).toEqual([5]);
      expect(result.clearedColumns).toEqual([3]);
      expect(result.totalLinesCleared).toBe(2);

      // Check that row 5 and column 3 are cleared
      const row5Tiles = result.tiles.filter(t => t.location.row === 5);
      const col3Tiles = result.tiles.filter(t => t.location.column === 3);

      expect(row5Tiles.every(t => !t.block.isFilled)).toBe(true);
      expect(col3Tiles.every(t => !t.block.isFilled)).toBe(true);
    });

    it('should handle intersecting row and column clears', () => {
      const tiles = createEmptyGrid();
      // Fill entire grid
      const tilesAllFilled = tiles.map(tile => createTile(tile.location.row, tile.location.column, true));

      const result = clearFullLines(tilesAllFilled);

      expect(result.clearedRows).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(result.clearedColumns).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(result.totalLinesCleared).toBe(20);

      // All tiles should be cleared
      expect(result.tiles.every(t => !t.block.isFilled)).toBe(true);
    });

    it('should return unchanged tiles when no lines are full', () => {
      const tiles = createEmptyGrid();

      const result = clearFullLines(tiles);

      expect(result.clearedRows).toEqual([]);
      expect(result.clearedColumns).toEqual([]);
      expect(result.totalLinesCleared).toBe(0);
      expect(result.tiles).toBe(tiles);
    });
  });
});
