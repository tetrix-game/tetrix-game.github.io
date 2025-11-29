import { describe, it, expect } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import type { TilesSet } from '../utils/types';

// Helper to get tile data from TilesSet
function getTileData(tiles: TilesSet, row: number, column: number) {
  return tiles.get(`R${row}C${column}`);
}

// Helper to count filled tiles
function countFilledTiles(tiles: TilesSet): number {
  let count = 0;
  for (const tileData of tiles.values()) {
    if (tileData.block.isFilled) count++;
  }
  return count;
}

describe('Debug Tools', () => {
  describe('DEBUG_ADD_BLOCK', () => {
    it('should add a block at the specified location', () => {
      const location = { row: 5, column: 5 };

      // Verify initial state has no block
      const initialTile = getTileData(initialState.tiles, location.row, location.column);
      expect(initialTile?.block.isFilled).toBe(false);

      // Add block
      const newState = tetrixReducer(initialState, {
        type: 'DEBUG_ADD_BLOCK',
        value: { location, color: 'blue' },
      });

      // Verify block was added
      const updatedTile = getTileData(newState.tiles, location.row, location.column);
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

      const finalTile = getTileData(stateWithGreenBlock.tiles, location.row, location.column);
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
      const filledTilesBefore = countFilledTiles(state.tiles);
      expect(filledTilesBefore).toBe(25);

      // Clear all blocks
      const clearedState = tetrixReducer(state, {
        type: 'DEBUG_CLEAR_ALL',
      });

      // Verify all blocks are removed
      const filledTilesAfter = countFilledTiles(clearedState.tiles);
      expect(filledTilesAfter).toBe(0);
    });

    it('should work on empty grid without issues', () => {
      // Get initial filled count
      const filledTilesBefore = countFilledTiles(initialState.tiles);

      // Clear all (should clear any filled tiles)
      const clearedState = tetrixReducer(initialState, {
        type: 'DEBUG_CLEAR_ALL',
      });

      // Verify grid is now empty
      const filledTilesAfter = countFilledTiles(clearedState.tiles);
      expect(filledTilesAfter).toBe(0);
      // If there were filled tiles before, verify they're now cleared
      if (filledTilesBefore > 0) {
        expect(filledTilesAfter).toBeLessThan(filledTilesBefore);
      }
    });
  });

  describe('Integration with existing debug tools', () => {
    it('should work with other debug tools', () => {
      // Start with a fresh state for this test
      const freshState = tetrixReducer(initialState, {
        type: 'DEBUG_CLEAR_ALL',
      });

      // Add a few blocks
      let state = tetrixReducer(freshState, {
        type: 'DEBUG_ADD_BLOCK',
        value: { location: { row: 5, column: 5 }, color: 'blue' },
      });

      // Fill a row (excluding position)
      state = tetrixReducer(state, {
        type: 'DEBUG_FILL_ROW',
        value: { row: 3, excludeColumn: 5, color: 'red' },
      });

      // Count filled tiles
      const filledAfterFill = countFilledTiles(state.tiles);
      expect(filledAfterFill).toBe(10); // 1 from add + 9 from fill row

      // Clear all
      state = tetrixReducer(state, {
        type: 'DEBUG_CLEAR_ALL',
      });

      // Verify everything is cleared
      const filledAfterClear = countFilledTiles(state.tiles);
      expect(filledAfterClear).toBe(0);

      // Add blocks again after clear
      state = tetrixReducer(state, {
        type: 'DEBUG_ADD_BLOCK',
        value: { location: { row: 1, column: 1 }, color: 'yellow' },
      });

      const filledFinal = countFilledTiles(state.tiles);
      expect(filledFinal).toBe(1);
    });
  });
});
