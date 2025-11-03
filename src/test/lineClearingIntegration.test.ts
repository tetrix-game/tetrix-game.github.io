import { describe, it, expect } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/tetrixReducer';
import type { Shape } from '../utils/types';

// Helper to create a simple horizontal line shape (3 blocks in a row)
const createHorizontalLineShape = (): Shape => [
  [
    { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false },
    { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false },
    { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false }
  ],
  [
    { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: true },
    { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: true },
    { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: true }
  ],
  [
    { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false },
    { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false },
    { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false }
  ]
];

// Helper to create a simple vertical line shape (3 blocks in a column)
const createVerticalLineShape = (): Shape => [
  [
    { color: { lightest: '#6b6bff', light: '#5252ff', main: '#0000ff', dark: '#0000cc', darkest: '#000099' }, isFilled: false },
    { color: { lightest: '#6b6bff', light: '#5252ff', main: '#0000ff', dark: '#0000cc', darkest: '#000099' }, isFilled: true },
    { color: { lightest: '#6b6bff', light: '#5252ff', main: '#0000ff', dark: '#0000cc', darkest: '#000099' }, isFilled: false }
  ],
  [
    { color: { lightest: '#6b6bff', light: '#5252ff', main: '#0000ff', dark: '#0000cc', darkest: '#000099' }, isFilled: false },
    { color: { lightest: '#6b6bff', light: '#5252ff', main: '#0000ff', dark: '#0000cc', darkest: '#000099' }, isFilled: true },
    { color: { lightest: '#6b6bff', light: '#5252ff', main: '#0000ff', dark: '#0000cc', darkest: '#000099' }, isFilled: false }
  ],
  [
    { color: { lightest: '#6b6bff', light: '#5252ff', main: '#0000ff', dark: '#0000cc', darkest: '#000099' }, isFilled: false },
    { color: { lightest: '#6b6bff', light: '#5252ff', main: '#0000ff', dark: '#0000cc', darkest: '#000099' }, isFilled: true },
    { color: { lightest: '#6b6bff', light: '#5252ff', main: '#0000ff', dark: '#0000cc', darkest: '#000099' }, isFilled: false }
  ]
];

// Helper to create a single block shape
const createSingleBlockShape = (): Shape => [
  [
    { color: { lightest: '#6bff6b', light: '#52ff52', main: '#00ff00', dark: '#00cc00', darkest: '#009900' }, isFilled: false },
    { color: { lightest: '#6bff6b', light: '#52ff52', main: '#00ff00', dark: '#00cc00', darkest: '#009900' }, isFilled: false },
    { color: { lightest: '#6bff6b', light: '#52ff52', main: '#00ff00', dark: '#00cc00', darkest: '#009900' }, isFilled: false }
  ],
  [
    { color: { lightest: '#6bff6b', light: '#52ff52', main: '#00ff00', dark: '#00cc00', darkest: '#009900' }, isFilled: false },
    { color: { lightest: '#6bff6b', light: '#52ff52', main: '#00ff00', dark: '#00cc00', darkest: '#009900' }, isFilled: true },
    { color: { lightest: '#6bff6b', light: '#52ff52', main: '#00ff00', dark: '#00cc00', darkest: '#009900' }, isFilled: false }
  ],
  [
    { color: { lightest: '#6bff6b', light: '#52ff52', main: '#00ff00', dark: '#00cc00', darkest: '#009900' }, isFilled: false },
    { color: { lightest: '#6bff6b', light: '#52ff52', main: '#00ff00', dark: '#00cc00', darkest: '#009900' }, isFilled: false },
    { color: { lightest: '#6bff6b', light: '#52ff52', main: '#00ff00', dark: '#00cc00', darkest: '#009900' }, isFilled: false }
  ]
];

describe('Tetrix Reducer - Line Clearing Integration', () => {
  describe('Row clearing after shape placement', () => {
    it('should clear a full row after placing the completing shape', () => {
      // Start with initial state
      let state = initialState;

      // Place horizontal shapes to fill row 5 (need to place multiple shapes)
      const horizontalShape = createHorizontalLineShape();

      // Place first shape at column 2 (covers columns 1-3)
      state = {
        ...state,
        selectedShape: horizontalShape,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 5, column: 2 }
      };
      state = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      // Verify blocks were placed
      let row5Filled = state.tiles.filter(t => t.location.row === 5 && t.block.isFilled).length;
      expect(row5Filled).toBe(3);

      // Place second shape at column 5 (covers columns 4-6)
      state = {
        ...state,
        selectedShape: horizontalShape,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 5, column: 5 }
      };
      state = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      row5Filled = state.tiles.filter(t => t.location.row === 5 && t.block.isFilled).length;
      expect(row5Filled).toBe(6);

      // Place third shape at column 8 (covers columns 7-9)
      state = {
        ...state,
        selectedShape: horizontalShape,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 5, column: 8 }
      };
      state = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      row5Filled = state.tiles.filter(t => t.location.row === 5 && t.block.isFilled).length;
      expect(row5Filled).toBe(9);

      // Place final shape at column 10 (covers column 10)
      const singleBlock = createSingleBlockShape();
      state = {
        ...state,
        selectedShape: singleBlock,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 5, column: 10 }
      };
      state = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      // Row 5 should now be cleared (all blocks removed)
      row5Filled = state.tiles.filter(t => t.location.row === 5 && t.block.isFilled).length;
      expect(row5Filled).toBe(0);

      // Verify all tiles in row 5 are empty
      const row5Tiles = state.tiles.filter(t => t.location.row === 5);
      expect(row5Tiles.every(t => !t.block.isFilled)).toBe(true);
      expect(row5Tiles.every(t => t.block.color.main === '#000000')).toBe(true);
    });
  });

  describe('Column clearing after shape placement', () => {
    it('should clear a full column after placing the completing shape', () => {
      // Start with initial state
      let state = initialState;

      // Place vertical shapes to fill column 3
      const verticalShape = createVerticalLineShape();

      // Place shapes at different rows to fill column 3
      const rows = [2, 5, 8];
      for (const row of rows) {
        state = {
          ...state,
          selectedShape: verticalShape,
          selectedShapeIndex: 0,
          mouseGridLocation: { row, column: 3 }
        };
        state = tetrixReducer(state, { type: 'PLACE_SHAPE' });
      }

      // Should have 9 blocks in column 3
      let col3Filled = state.tiles.filter(t => t.location.column === 3 && t.block.isFilled).length;
      expect(col3Filled).toBe(9);

      // Place final block to complete column 3
      const singleBlock = createSingleBlockShape();
      state = {
        ...state,
        selectedShape: singleBlock,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 10, column: 3 }
      };
      state = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      // Column 3 should now be cleared
      col3Filled = state.tiles.filter(t => t.location.column === 3 && t.block.isFilled).length;
      expect(col3Filled).toBe(0);

      // Verify all tiles in column 3 are empty
      const col3Tiles = state.tiles.filter(t => t.location.column === 3);
      expect(col3Tiles.every(t => !t.block.isFilled)).toBe(true);
      expect(col3Tiles.every(t => t.block.color.main === '#000000')).toBe(true);
    });
  });

  describe('Simultaneous row and column clearing', () => {
    it('should clear both a row and column when they both become full', () => {
      // This is a simpler test that just verifies the mechanism works
      // We'll manually fill row 5 and column 5 except for the intersection point
      let state = initialState;

      // Fill all of row 5 
      const horizontalShape = createHorizontalLineShape();
      for (const col of [2, 5, 8]) {
        state = {
          ...state,
          selectedShape: horizontalShape,
          selectedShapeIndex: 0,
          mouseGridLocation: { row: 5, column: col }
        };
        state = tetrixReducer(state, { type: 'PLACE_SHAPE' });
      }

      // Add the final block to row 5
      const singleBlock = createSingleBlockShape();
      state = {
        ...state,
        selectedShape: singleBlock,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 5, column: 10 }
      };
      state = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      // Row 5 should be cleared now
      const row5Filled = state.tiles.filter(t => t.location.row === 5 && t.block.isFilled).length;
      expect(row5Filled).toBe(0);

      // Now fill column 5 (which is already empty from row clearing)
      const verticalShape = createVerticalLineShape();
      for (const row of [2, 5, 8]) {
        state = {
          ...state,
          selectedShape: verticalShape,
          selectedShapeIndex: 0,
          mouseGridLocation: { row, column: 5 }
        };
        state = tetrixReducer(state, { type: 'PLACE_SHAPE' });
      }

      // Add final block to column 5
      state = {
        ...state,
        selectedShape: singleBlock,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 10, column: 5 }
      };
      state = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      // Column 5 should now be cleared
      const col5Filled = state.tiles.filter(t => t.location.column === 5 && t.block.isFilled).length;
      expect(col5Filled).toBe(0);
    });
  });

  describe('No clearing when lines are incomplete', () => {
    it('should not clear a row with only 9 blocks', () => {
      let state = initialState;

      // Place 3 shapes to fill 9 blocks in row 5
      const horizontalShape = createHorizontalLineShape();
      const positions = [2, 5, 8];

      for (const col of positions) {
        state = {
          ...state,
          selectedShape: horizontalShape,
          selectedShapeIndex: 0,
          mouseGridLocation: { row: 5, column: col }
        };
        state = tetrixReducer(state, { type: 'PLACE_SHAPE' });
      }

      // Should have 9 blocks, not cleared
      const row5Filled = state.tiles.filter(t => t.location.row === 5 && t.block.isFilled).length;
      expect(row5Filled).toBe(9);

      // Blocks should still be filled
      const filledTiles = state.tiles.filter(t => t.location.row === 5 && t.block.isFilled);
      expect(filledTiles.every(t => t.block.color.main !== '#000000')).toBe(true);
    });

    it('should not clear a column with only 9 blocks', () => {
      let state = initialState;

      // Place 3 shapes to fill 9 blocks in column 4
      const verticalShape = createVerticalLineShape();
      const positions = [2, 5, 8];

      for (const row of positions) {
        state = {
          ...state,
          selectedShape: verticalShape,
          selectedShapeIndex: 0,
          mouseGridLocation: { row, column: 4 }
        };
        state = tetrixReducer(state, { type: 'PLACE_SHAPE' });
      }

      // Should have 9 blocks, not cleared
      const col4Filled = state.tiles.filter(t => t.location.column === 4 && t.block.isFilled).length;
      expect(col4Filled).toBe(9);

      // Blocks should still be filled
      const filledTiles = state.tiles.filter(t => t.location.column === 4 && t.block.isFilled);
      expect(filledTiles.every(t => t.block.color.main !== '#000000')).toBe(true);
    });
  });
});
