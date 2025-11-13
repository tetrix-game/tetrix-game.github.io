import { describe, it, expect } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import type { Tile } from '../utils/types';

describe('Debug Tools', () => {
  describe('DEBUG_ADD_BLOCK', () => {
    it('should add a block at the specified location', () => {
      const location = { row: 5, column: 5 };

      // Verify initial state has no block
      const initialTile = initialState.tiles.find(
        (t: Tile) => t.location.row === location.row && t.location.column === location.column
      );
      expect(initialTile?.block.isFilled).toBe(false);

      // Add block
      const newState = tetrixReducer(initialState, {
        type: 'DEBUG_ADD_BLOCK',
        value: { location, color: 'blue' },
      });

      // Verify block was added
      const updatedTile = newState.tiles.find(
        (t: Tile) => t.location.row === location.row && t.location.column === location.column
      );
      expect(updatedTile?.block.isFilled).toBe(true);
      expect(updatedTile?.block.color).toBe('blue');
    });

    it('should overwrite existing blocks', () => {
      const location = { row: 3, column: 3 };

      // Add red block first
      const stateWithRedBlock = tetrixReducer(initialState, {
        type: 'DEBUG_ADD_BLOCK',
        value: { location, color: 'red' },
      });

      // Add green block over it
      const stateWithGreenBlock = tetrixReducer(stateWithRedBlock, {
        type: 'DEBUG_ADD_BLOCK',
        value: { location, color: 'green' },
      });

      const finalTile = stateWithGreenBlock.tiles.find(
        (t: Tile) => t.location.row === location.row && t.location.column === location.column
      );
      expect(finalTile?.block.isFilled).toBe(true);
      expect(finalTile?.block.color).toBe('green');
    });
  });

  describe('DEBUG_CLEAR_ALL', () => {
    it('should remove all blocks from the grid', () => {
      // Add several blocks
      let state = initialState;
      for (let row = 1; row <= 5; row++) {
        for (let column = 1; column <= 5; column++) {
          state = tetrixReducer(state, {
            type: 'DEBUG_ADD_BLOCK',
            value: { location: { row, column }, color: 'purple' },
          });
        }
      }

      // Verify blocks were added
      const filledTilesBefore = state.tiles.filter((t: Tile) => t.block.isFilled);
      expect(filledTilesBefore.length).toBe(25);

      // Clear all blocks
      const clearedState = tetrixReducer(state, {
        type: 'DEBUG_CLEAR_ALL',
      });

      // Verify all blocks are removed
      const filledTilesAfter = clearedState.tiles.filter((t: Tile) => t.block.isFilled);
      expect(filledTilesAfter.length).toBe(0);
    });

    it('should work on empty grid without issues', () => {
      // Verify grid is empty
      const filledTilesBefore = initialState.tiles.filter((t: Tile) => t.block.isFilled);
      expect(filledTilesBefore.length).toBe(0);

      // Clear all (should have no effect)
      const clearedState = tetrixReducer(initialState, {
        type: 'DEBUG_CLEAR_ALL',
      });

      // Verify grid is still empty
      const filledTilesAfter = clearedState.tiles.filter((t: Tile) => t.block.isFilled);
      expect(filledTilesAfter.length).toBe(0);
    });
  });

  describe('Integration with existing debug tools', () => {
    it('should work with other debug tools', () => {
      // Add a few blocks
      let state = tetrixReducer(initialState, {
        type: 'DEBUG_ADD_BLOCK',
        value: { location: { row: 5, column: 5 }, color: 'blue' },
      });

      // Fill a row (excluding position)
      state = tetrixReducer(state, {
        type: 'DEBUG_FILL_ROW',
        value: { row: 3, excludeColumn: 5, color: 'red' },
      });

      // Count filled tiles
      const filledAfterFill = state.tiles.filter((t: Tile) => t.block.isFilled);
      expect(filledAfterFill.length).toBe(10); // 1 from add + 9 from fill row

      // Clear all
      state = tetrixReducer(state, {
        type: 'DEBUG_CLEAR_ALL',
      });

      // Verify everything is cleared
      const filledAfterClear = state.tiles.filter((t: Tile) => t.block.isFilled);
      expect(filledAfterClear.length).toBe(0);

      // Add blocks again after clear
      state = tetrixReducer(state, {
        type: 'DEBUG_ADD_BLOCK',
        value: { location: { row: 1, column: 1 }, color: 'yellow' },
      });

      const filledFinal = state.tiles.filter((t: Tile) => t.block.isFilled);
      expect(filledFinal.length).toBe(1);
    });
  });
});
