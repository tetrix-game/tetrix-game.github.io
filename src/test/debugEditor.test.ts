import { describe, it, expect, beforeEach } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import type { TetrixReducerState } from '../utils/types';

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
    const row5Tiles = newState.tiles.filter(tile => tile.location.row === 5);
    const filledTiles = row5Tiles.filter(tile => tile.block.isFilled);
    const excludedTile = row5Tiles.find(tile => tile.location.column === 5);

    expect(filledTiles.length).toBe(9); // 10 tiles - 1 excluded
    expect(excludedTile?.block.isFilled).toBe(false);

    // All filled tiles should be blue
    filledTiles.forEach(tile => {
      expect(tile.block.color).toBe('blue');
    });
  });

  it('should fill column except for the clicked row', () => {
    const newState = tetrixReducer(state, {
      type: 'DEBUG_FILL_COLUMN',
      value: { column: 3, excludeRow: 7, color: 'red' },
    });

    // Check that column 3 is filled except row 7
    const col3Tiles = newState.tiles.filter(tile => tile.location.column === 3);
    const filledTiles = col3Tiles.filter(tile => tile.block.isFilled);
    const excludedTile = col3Tiles.find(tile => tile.location.row === 7);

    expect(filledTiles.length).toBe(9); // 10 tiles - 1 excluded
    expect(excludedTile?.block.isFilled).toBe(false);

    // All filled tiles should be red
    filledTiles.forEach(tile => {
      expect(tile.block.color).toBe('red');
    });
  });

  it('should remove a block at the specified location', () => {
    // First, fill a tile
    const filledState = tetrixReducer(state, {
      type: 'DEBUG_FILL_ROW',
      value: { row: 5, excludeColumn: 10, color: 'green' },
    });

    // Verify it's filled
    const targetTile = filledState.tiles.find(
      tile => tile.location.row === 5 && tile.location.column === 5
    );
    expect(targetTile?.block.isFilled).toBe(true);

    // Now remove it
    const removedState = tetrixReducer(filledState, {
      type: 'DEBUG_REMOVE_BLOCK',
      value: { location: { row: 5, column: 5 } },
    });

    const removedTile = removedState.tiles.find(
      tile => tile.location.row === 5 && tile.location.column === 5
    );
    expect(removedTile?.block.isFilled).toBe(false);
  });

  it('should handle fill row with different colors', () => {
    const colors = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;

    colors.forEach((color, index) => {
      const row = index + 1;
      const newState = tetrixReducer(state, {
        type: 'DEBUG_FILL_ROW',
        value: { row, excludeColumn: 1, color },
      });

      const rowTiles = newState.tiles.filter(
        tile => tile.location.row === row && tile.block.isFilled
      );

      rowTiles.forEach(tile => {
        expect(tile.block.color).toBe(color);
      });
    });
  });
});
