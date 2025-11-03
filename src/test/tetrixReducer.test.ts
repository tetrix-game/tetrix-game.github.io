import { describe, it, expect } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/tetrixReducer';
import type { Shape, TetrixAction } from '../utils/types';

// Helper to create a test shape
const createTestShape = (): Shape => [
  [{ color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: true },
  { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
  { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false }],
  [{ color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: true },
  { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
  { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false }],
  [{ color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: true },
  { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: true },
  { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false }],
];

describe('TetrixReducer - Bug Fixes', () => {
  describe('SELECT_SHAPE action', () => {
    it('should set selectedShape and isShapeDragging when selecting a shape', () => {
      const testShape = createTestShape();
      const action: TetrixAction = {
        type: 'SELECT_SHAPE',
        value: { shape: testShape }
      };

      const newState = tetrixReducer(initialState, action);

      expect(newState.selectedShape).toBe(testShape);
      expect(newState.isShapeDragging).toBe(true);
    });

    it('should allow selecting different shapes sequentially', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();

      let state = tetrixReducer(initialState, {
        type: 'SELECT_SHAPE',
        value: { shape: shape1 }
      });

      expect(state.selectedShape).toBe(shape1);

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shape: shape2 }
      });

      expect(state.selectedShape).toBe(shape2);
    });
  });

  describe('PLACE_SHAPE action', () => {
    it('should auto-generate a new shape after placing when no nextShapes available', () => {
      const testShape = createTestShape();
      const state = { ...initialState, selectedShape: testShape, mouseGridLocation: { row: 5, column: 5 } };

      const newState = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      // Should auto-generate and select a new random shape
      expect(newState.selectedShape).not.toBeNull();
      expect(newState.isShapeDragging).toBe(true);
      expect(newState.mouseGridLocation).toBeNull();
      // Should have no shapes in nextShapes (the generated shape was auto-selected)
      expect(newState.nextShapes.length).toBe(0);
    });

    it('should auto-select first shape from nextShapes after placing', () => {
      const testShape = createTestShape();
      const nextShape = createTestShape();
      const state = {
        ...initialState,
        selectedShape: testShape,
        mouseGridLocation: { row: 5, column: 5 },
        nextShapes: [nextShape]
      };

      const newState = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      expect(newState.selectedShape).toBe(nextShape);
      expect(newState.isShapeDragging).toBe(true);
      expect(newState.mouseGridLocation).toBeNull();
    });

    it('should update grid tiles with shape blocks', () => {
      const testShape = createTestShape();
      const state = {
        ...initialState,
        selectedShape: testShape,
        mouseGridLocation: { row: 5, column: 5 } // Place in middle of grid
      };

      const newState = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      // Find tiles that should have been filled
      const filledTiles = newState.tiles.filter(tile => tile.block.isFilled);

      // Should have more filled tiles than initial state (which has one at 6,6)
      const initialFilledTiles = initialState.tiles.filter(tile => tile.block.isFilled);

      // The test shape has 4 filled blocks, initial state has 1
      // If placed successfully, we should have at least 5 total (or 4 if one overlaps with existing)
      expect(filledTiles.length).toBeGreaterThan(initialFilledTiles.length);
    });

    it('should not place shape if no shape is selected', () => {
      const state = { ...initialState, mouseGridLocation: { row: 5, column: 5 } };

      const newState = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      expect(newState).toEqual(state);
    });

    it('should not place shape if no mouse location is set', () => {
      const testShape = createTestShape();
      const state = { ...initialState, selectedShape: testShape };

      const newState = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      expect(newState).toEqual(state);
    });
  });

  describe('UPDATE_MOUSE_LOCATION action', () => {
    it('should update mouse grid location', () => {
      const location = { row: 3, column: 7 };
      const action: TetrixAction = {
        type: 'UPDATE_MOUSE_LOCATION',
        value: { location }
      };

      const newState = tetrixReducer(initialState, action);

      expect(newState.mouseGridLocation).toEqual(location);
    });

    it('should clear mouse location when set to null', () => {
      const state = { ...initialState, mouseGridLocation: { row: 3, column: 7 } };
      const action: TetrixAction = {
        type: 'UPDATE_MOUSE_LOCATION',
        value: { location: null }
      };

      const newState = tetrixReducer(state, action);

      expect(newState.mouseGridLocation).toBeNull();
    });
  });

  describe('CLEAR_SELECTION action', () => {
    it('should clear selected shape and dragging state', () => {
      const testShape = createTestShape();
      const state = {
        ...initialState,
        selectedShape: testShape,
        isShapeDragging: true,
        mouseGridLocation: { row: 5, column: 5 }
      };

      const newState = tetrixReducer(state, { type: 'CLEAR_SELECTION' });

      expect(newState.selectedShape).toBeNull();
      expect(newState.isShapeDragging).toBe(false);
      expect(newState.mouseGridLocation).toBeNull();
    });
  });

  describe('SET_AVAILABLE_SHAPES action', () => {
    it('should update nextShapes with provided shapes', () => {
      const shapes = [createTestShape(), createTestShape(), createTestShape()];
      const action: TetrixAction = {
        type: 'SET_AVAILABLE_SHAPES',
        value: { shapes }
      };

      const newState = tetrixReducer(initialState, action);

      expect(newState.nextShapes).toEqual(shapes);
      expect(newState.nextShapes.length).toBe(3);
    });
  });
});
