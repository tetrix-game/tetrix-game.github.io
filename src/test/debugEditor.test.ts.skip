import { describe, it, expect, beforeEach } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import type { TetrixReducerState, TilesSet } from '../utils/types';

// Helper to get tile data from TilesSet
function getTileData(tiles: TilesSet, row: number, column: number) {
  return tiles.get(`R${row}C${column}`);
}

// Helper to convert TilesSet to array for filtering
function tilesToArray(tiles: TilesSet) {
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

describe('Debug Editor Actions', () => {
  let state: TetrixReducerState;

  beforeEach(() => {
    state = { ...initialState };
  });

  it('should fill row except for the clicked column', () => {
    const newState = tetrixReducer(state, {
      type: 'DEBUG_FILL_ROW',
      value: { row: 5, excludeColumn: 5, color: 'blue' },
    });

    // Check that row 5 is filled except column 5
    const row5Tiles = tilesToArray(newState.tiles).filter(tile => tile.location.row === 5);
    const filledTiles = row5Tiles.filter(tile => tile.isFilled);
    const excludedTile = getTileData(newState.tiles, 5, 5);

    expect(filledTiles.length).toBe(9); // 10 tiles - 1 excluded
    expect(excludedTile?.isFilled).toBe(false);

    // All filled tiles should be blue
    filledTiles.forEach(tile => {
      expect(tile.color).toBe('blue');
    });
  });

  it('should fill column except for the clicked row', () => {
    const newState = tetrixReducer(state, {
      type: 'DEBUG_FILL_COLUMN',
      value: { column: 3, excludeRow: 7, color: 'red' },
    });

    // Check that column 3 is filled except row 7
    const col3Tiles = tilesToArray(newState.tiles).filter(tile => tile.location.column === 3);
    const filledTiles = col3Tiles.filter(tile => tile.isFilled);
    const excludedTile = getTileData(newState.tiles, 7, 3);

    expect(filledTiles.length).toBe(9); // 10 tiles - 1 excluded
    expect(excludedTile?.isFilled).toBe(false);

    // All filled tiles should be red
    filledTiles.forEach(tile => {
      expect(tile.color).toBe('red');
    });
  });

  it('should remove a block at the specified location', () => {
    // First, fill a tile
    const filledState = tetrixReducer(state, {
      type: 'DEBUG_FILL_ROW',
      value: { row: 5, excludeColumn: 10, color: 'green' },
    });

    // Verify it's filled
    const targetTile = getTileData(filledState.tiles, 5, 5);
    expect(targetTile?.isFilled).toBe(true);

    // Now remove it
    const removedState = tetrixReducer(filledState, {
      type: 'DEBUG_REMOVE_BLOCK',
      value: { location: { row: 5, column: 5 } },
    });

    const removedTile = getTileData(removedState.tiles, 5, 5);
    expect(removedTile?.isFilled).toBe(false);
  });

  it('should handle fill row with different colors', () => {
    const colors = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;

    colors.forEach((color, index) => {
      const row = index + 1;
      const newState = tetrixReducer(state, {
        type: 'DEBUG_FILL_ROW',
        value: { row, excludeColumn: 1, color },
      });

      const rowTiles = tilesToArray(newState.tiles).filter(
        tile => tile.location.row === row && tile.isFilled
      );

      rowTiles.forEach(tile => {
        expect(tile.color).toBe(color);
      });
    });
  });
});
