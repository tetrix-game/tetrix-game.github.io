import { describe, it, expect } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import type { Shape, TetrixAction } from '../utils/types';

// Helper to create a test shape (in 4x4 grid)
const createTestShape = (): Shape => [
  [
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: true },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false }
  ],
  [
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: true },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false }
  ],
  [
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: true },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: true },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false }
  ],
  [
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false },
    { color: { lightest: '#0274e6', light: '#0059b2', main: '#023f80', dark: '#023468', darkest: '#011e3f' }, isFilled: false }
  ]
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
    it('should start placement animation and prepare for shape placement', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const state = {
        ...initialState,
        selectedShape: shape1,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 5, column: 5 },
        mousePosition: { x: 100, y: 100 },
        gridTileSize: 20,
        gridBounds: { top: 50, left: 50, width: 200, height: 200 },
        nextShapes: [shape1, shape2, shape3]
      };

      const newState = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: { location: { row: 5, column: 5 } }
      });

      // Should start placement animation
      expect(newState.placementAnimationState).toBe('placing');
      expect(newState.isShapeDragging).toBe(false);
      expect(newState.animationStartPosition).toEqual({ x: 100, y: 100 });
      expect(newState.animationTargetPosition).toBeDefined();
      // Should maintain selected shape during animation
      expect(newState.selectedShape).toBe(shape1);
      expect(newState.selectedShapeIndex).toBe(0);
    });

    it('should not affect shapes during placement animation', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const state = {
        ...initialState,
        selectedShape: shape2,
        selectedShapeIndex: 1,
        mouseGridLocation: { row: 5, column: 5 },
        mousePosition: { x: 100, y: 100 },
        gridTileSize: 20,
        gridBounds: { top: 50, left: 50, width: 200, height: 200 },
        nextShapes: [shape1, shape2, shape3]
      };

      const newState = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: { location: { row: 5, column: 5 } }
      });

      // Should not modify nextShapes during placement animation
      expect(newState.nextShapes.length).toBe(3);
      expect(newState.nextShapes[0]).toBe(shape1);
      expect(newState.nextShapes[1]).toBe(shape2);
      expect(newState.nextShapes[2]).toBe(shape3);
    });

    it('should not update grid during placement animation', () => {
      const testShape = createTestShape();
      const state = {
        ...initialState,
        selectedShape: testShape,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 5, column: 5 },
        mousePosition: { x: 100, y: 100 },
        gridTileSize: 20,
        gridBounds: { top: 50, left: 50, width: 200, height: 200 }
      };

      const newState = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: { location: { row: 5, column: 5 } }
      });

      // Grid should remain unchanged during placement animation
      expect(newState.tiles).toEqual(initialState.tiles);
    });

    it('should not place shape if no shape is selected', () => {
      const state = { ...initialState, mouseGridLocation: { row: 5, column: 5 } };

      const newState = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: { location: { row: 5, column: 5 } }
      });

      expect(newState).toEqual(state);
    });

    it('should not place shape if required animation properties are missing', () => {
      const testShape = createTestShape();
      const state = {
        ...initialState,
        selectedShape: testShape,
        selectedShapeIndex: 0,
        // Missing mousePosition, gridTileSize, gridBounds
      };

      const newState = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: { location: { row: 5, column: 5 } }
      });

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

      const newState = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: { location: { row: 5, column: 5 } }
      });

      expect(newState).toEqual(state);
    });
  });

  describe('COMPLETE_PLACEMENT action', () => {
    it('should initiate shape removal animation without modifying nextShapes', () => {
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

      const newState = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });

      // Should clear selection
      expect(newState.selectedShape).toBeNull();
      expect(newState.selectedShapeIndex).toBeNull();
      expect(newState.isShapeDragging).toBe(false);
      expect(newState.mouseGridLocation).toBeNull();

      // Should initiate shape removal animation
      expect(newState.removingShapeIndex).toBe(0);
      expect(newState.shapesSliding).toBe(true);

      // nextShapes should remain unchanged during placement (shapes are removed later in animation)
      expect(newState.nextShapes.length).toBe(3);
      expect(newState.nextShapes[0]).toBe(shape1);
      expect(newState.nextShapes[1]).toBe(shape2);
      expect(newState.nextShapes[2]).toBe(shape3);
    });

    it('should complete shape removal and generate new shape', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const state = {
        ...initialState,
        removingShapeIndex: 0,
        shapesSliding: true,
        nextShapes: [shape1, shape2, shape3]
      };

      const newState = tetrixReducer(state, { type: 'COMPLETE_SHAPE_REMOVAL' });

      // Should clear removal animation state
      expect(newState.removingShapeIndex).toBeNull();
      expect(newState.shapesSliding).toBe(false);

      // Should have 3 shapes: shape2, shape3, and a new random shape
      expect(newState.nextShapes.length).toBe(3);
      expect(newState.nextShapes[0]).toBe(shape2);
      expect(newState.nextShapes[1]).toBe(shape3);
      expect(newState.nextShapes[2]).not.toBe(shape1);
    });

    it('should update grid tiles with shape blocks', () => {
      const testShape = createTestShape();
      const state = {
        ...initialState,
        selectedShape: testShape,
        selectedShapeIndex: 0,
        mouseGridLocation: { row: 5, column: 5 }
      };

      const newState = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });

      // Find tiles that should have been filled
      const filledTiles = newState.tiles.filter(tile => tile.block.isFilled);
      const initialFilledTiles = initialState.tiles.filter(tile => tile.block.isFilled);

      // Should have more filled tiles than initial state
      expect(filledTiles.length).toBeGreaterThan(initialFilledTiles.length);
    });

    it('should not place shape if no shape is selected', () => {
      const state = { ...initialState, mouseGridLocation: { row: 5, column: 5 } };

      const newState = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });

      expect(newState).toEqual(state);
    });

    it('should not place shape if no mouse location is set', () => {
      const testShape = createTestShape();
      const state = { ...initialState, selectedShape: testShape, selectedShapeIndex: 0 };

      const newState = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });

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
