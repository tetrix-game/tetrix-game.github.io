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
        value: { shape: testShape, shapeIndex: 0 }
      };

      const newState = tetrixReducer(initialState, action);

      expect(newState.selectedShape).toBe(testShape);
      expect(newState.selectedShapeIndex).toBe(0);
      expect(newState.isShapeDragging).toBe(true);
    });

    it('should allow selecting different shapes sequentially', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();

      let state = tetrixReducer(initialState, {
        type: 'SELECT_SHAPE',
        value: { shape: shape1, shapeIndex: 0 }
      });

      expect(state.selectedShape).toBe(shape1);
      expect(state.selectedShapeIndex).toBe(0);

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shape: shape2, shapeIndex: 1 }
      });

      expect(state.selectedShape).toBe(shape2);
      expect(state.selectedShapeIndex).toBe(1);
    });
  });

  describe('PLACE_SHAPE action', () => {
    it('should remove placed shape from nextShapes and select a remaining shape', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const state = {
        ...initialState,
        selectedShape: shape1,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 5, column: 5 },
        nextShapes: [shape1, shape2, shape3]
      };

      const newState = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      // Should select shape2 (first remaining shape after removing shape1)
      expect(newState.selectedShape).toBe(shape2);
      expect(newState.selectedShapeIndex).toBe(0);
      expect(newState.isShapeDragging).toBe(false); // Changed: no longer auto-dragging after placement
      expect(newState.mouseGridLocation).toBeNull();
      // Should have 3 shapes: shape2, shape3, and a new random shape
      expect(newState.nextShapes.length).toBe(3);
      expect(newState.nextShapes[0]).toBe(shape2);
      expect(newState.nextShapes[1]).toBe(shape3);
    });

    it('should generate a new shape to maintain 3 available shapes', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const state = {
        ...initialState,
        selectedShape: shape2,
        selectedShapeIndex: 1,
        mouseGridLocation: { row: 5, column: 5 },
        nextShapes: [shape1, shape2, shape3]
      };

      const newState = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      // Should have 3 shapes total (2 original + 1 new random)
      expect(newState.nextShapes.length).toBe(3);
      // First shape should still be shape1, second should be shape3, third is new
      expect(newState.nextShapes[0]).toBe(shape1);
      expect(newState.nextShapes[1]).toBe(shape3);
      expect(newState.nextShapes[2]).not.toBe(shape1);
      expect(newState.nextShapes[2]).not.toBe(shape2);
      expect(newState.nextShapes[2]).not.toBe(shape3);
    });

    it('should update grid tiles with shape blocks', () => {
      const testShape = createTestShape();
      const state = {
        ...initialState,
        selectedShape: testShape,
        selectedShapeIndex: 0,
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
      const state = { ...initialState, selectedShape: testShape, selectedShapeIndex: 0 };

      const newState = tetrixReducer(state, { type: 'PLACE_SHAPE' });

      expect(newState).toEqual(state);
    });

    it('should not place shape if selectedShapeIndex is null', () => {
      const testShape = createTestShape();
      const state = {
        ...initialState,
        selectedShape: testShape,
        selectedShapeIndex: null,
        mouseGridLocation: { row: 5, column: 5 }
      };

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
