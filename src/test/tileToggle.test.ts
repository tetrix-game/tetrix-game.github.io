import { describe, it, expect } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/tetrixReducer';
import type { Shape, TetrixAction, TetrixReducerState } from '../utils/types';

// Helper to create a test shape
const createTestShape = (): Shape => [
  [{ color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: true },
  { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false },
  { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false }],
  [{ color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: true },
  { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: true },
  { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false }],
  [{ color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false },
  { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false },
  { color: { lightest: '#ff6b6b', light: '#ff5252', main: '#ff0000', dark: '#cc0000', darkest: '#990000' }, isFilled: false }],
];

describe('TetrixReducer - Tile Toggle Behavior', () => {
  describe('TOGGLE_BLOCK on empty tiles', () => {
    it('should NOT change color state when an empty tile is clicked', () => {
      // Get an empty tile from initial state (all tiles start empty)
      const emptyTileIndex = 0; // First tile at (1, 1)
      const emptyTile = initialState.tiles[emptyTileIndex];

      // Verify tile starts empty
      expect(emptyTile.block.isFilled).toBe(false);
      expect(emptyTile.block.color.main).toBe('#000000'); // Empty color

      // Try to toggle the empty tile
      const toggleAction: TetrixAction = {
        type: 'TOGGLE_BLOCK',
        value: { index: emptyTileIndex, isFilled: false }
      };

      const newState = tetrixReducer(initialState, toggleAction);
      const tileAfterToggle = newState.tiles[emptyTileIndex];

      // Tile should remain empty - should NOT toggle to filled
      expect(tileAfterToggle.block.isFilled).toBe(false);
      expect(tileAfterToggle.block.color.main).toBe('#000000'); // Should still be empty color
    });

    it('should NOT turn empty tiles black when clicked', () => {
      // Test multiple empty tiles
      const emptyTileIndices = [0, 5, 10, 50, 99]; // Various positions

      for (const index of emptyTileIndices) {
        const toggleAction: TetrixAction = {
          type: 'TOGGLE_BLOCK',
          value: { index, isFilled: false }
        };

        const newState = tetrixReducer(initialState, toggleAction);
        const tileAfterToggle = newState.tiles[index];

        // Should remain unchanged
        expect(tileAfterToggle.block.isFilled).toBe(false);
        expect(tileAfterToggle.block.color).toEqual(initialState.tiles[index].block.color);
      }
    });
  });

  describe('TOGGLE_BLOCK on tiles with placed blocks', () => {
    it('should toggle isFilled when a tile with a placed block is clicked', () => {
      // First, place a shape on the grid
      const testShape = createTestShape();
      const stateWithShape: TetrixReducerState = {
        ...initialState,
        selectedShape: testShape,
        mouseGridLocation: { row: 5, column: 5 }
      };

      // Place the shape
      const stateAfterPlacement = tetrixReducer(stateWithShape, { type: 'PLACE_SHAPE' });

      // Find a tile that has a block (should have red color from our test shape)
      const filledTileIndex = stateAfterPlacement.tiles.findIndex(
        tile => tile.block.isFilled && tile.block.color.main === '#ff0000'
      );

      expect(filledTileIndex).toBeGreaterThan(-1); // Should find at least one filled tile
      const filledTile = stateAfterPlacement.tiles[filledTileIndex];
      expect(filledTile.block.isFilled).toBe(true);

      // Now toggle this tile (should toggle off)
      const toggleAction: TetrixAction = {
        type: 'TOGGLE_BLOCK',
        value: { index: filledTileIndex, isFilled: true }
      };

      const stateAfterToggle = tetrixReducer(stateAfterPlacement, toggleAction);
      const tileAfterToggle = stateAfterToggle.tiles[filledTileIndex];

      // Should toggle to false but keep the color
      expect(tileAfterToggle.block.isFilled).toBe(false);
      expect(tileAfterToggle.block.color.main).toBe('#ff0000'); // Color should remain
    });

    it('should toggle back to filled when clicked again', () => {
      // Place a shape
      const testShape = createTestShape();
      const stateWithShape: TetrixReducerState = {
        ...initialState,
        selectedShape: testShape,
        mouseGridLocation: { row: 5, column: 5 }
      };

      const stateAfterPlacement = tetrixReducer(stateWithShape, { type: 'PLACE_SHAPE' });

      // Find a filled tile
      const filledTileIndex = stateAfterPlacement.tiles.findIndex(
        tile => tile.block.isFilled && tile.block.color.main === '#ff0000'
      );

      // Toggle off
      let state = tetrixReducer(stateAfterPlacement, {
        type: 'TOGGLE_BLOCK',
        value: { index: filledTileIndex, isFilled: true }
      });
      expect(state.tiles[filledTileIndex].block.isFilled).toBe(false);

      // Toggle back on
      state = tetrixReducer(state, {
        type: 'TOGGLE_BLOCK',
        value: { index: filledTileIndex, isFilled: false }
      });
      expect(state.tiles[filledTileIndex].block.isFilled).toBe(true);
      expect(state.tiles[filledTileIndex].block.color.main).toBe('#ff0000');
    });

    it('should preserve block color when toggling', () => {
      // Place a shape
      const testShape = createTestShape();
      const stateWithShape: TetrixReducerState = {
        ...initialState,
        selectedShape: testShape,
        mouseGridLocation: { row: 5, column: 5 }
      };

      const stateAfterPlacement = tetrixReducer(stateWithShape, { type: 'PLACE_SHAPE' });

      // Find a filled tile
      const filledTileIndex = stateAfterPlacement.tiles.findIndex(
        tile => tile.block.isFilled && tile.block.color.main === '#ff0000'
      );

      const originalColor = stateAfterPlacement.tiles[filledTileIndex].block.color;

      // Toggle off
      let state = tetrixReducer(stateAfterPlacement, {
        type: 'TOGGLE_BLOCK',
        value: { index: filledTileIndex, isFilled: true }
      });

      // Color should be preserved even when toggled off
      expect(state.tiles[filledTileIndex].block.color).toEqual(originalColor);

      // Toggle back on
      state = tetrixReducer(state, {
        type: 'TOGGLE_BLOCK',
        value: { index: filledTileIndex, isFilled: false }
      });

      // Color should still be preserved
      expect(state.tiles[filledTileIndex].block.color).toEqual(originalColor);
    });
  });

  describe('TOGGLE_BLOCK color distinction', () => {
    it('should only allow toggling on tiles with non-empty colors', () => {
      // Empty tile (black color)
      const emptyTileIndex = 0;
      expect(initialState.tiles[emptyTileIndex].block.color.main).toBe('#000000');

      const stateAfterEmptyToggle = tetrixReducer(initialState, {
        type: 'TOGGLE_BLOCK',
        value: { index: emptyTileIndex, isFilled: false }
      });

      // Should not change
      expect(stateAfterEmptyToggle.tiles[emptyTileIndex].block.isFilled).toBe(false);

      // Place a shape to get colored tiles
      const testShape = createTestShape();
      const stateWithShape: TetrixReducerState = {
        ...initialState,
        selectedShape: testShape,
        mouseGridLocation: { row: 5, column: 5 }
      };

      const stateWithColoredTiles = tetrixReducer(stateWithShape, { type: 'PLACE_SHAPE' });

      // Find a colored tile
      const coloredTileIndex = stateWithColoredTiles.tiles.findIndex(
        tile => tile.block.color.main !== '#000000'
      );

      expect(coloredTileIndex).toBeGreaterThan(-1);
      expect(stateWithColoredTiles.tiles[coloredTileIndex].block.isFilled).toBe(true);

      // This one SHOULD toggle
      const stateAfterColoredToggle = tetrixReducer(stateWithColoredTiles, {
        type: 'TOGGLE_BLOCK',
        value: { index: coloredTileIndex, isFilled: true }
      });

      expect(stateAfterColoredToggle.tiles[coloredTileIndex].block.isFilled).toBe(false);
    });
  });
});
