import { describe, it, expect } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import type { Shape, TetrixAction } from '../utils/types';
import { countFilledTiles } from './testHelpers';

// Helper to create a test shape (in 4x4 grid)
const createTestShape = (): Shape => [
  [
    { color: 'blue', isFilled: true },
    { color: 'blue', isFilled: false },
    { color: 'blue', isFilled: false },
    { color: 'blue', isFilled: false }
  ],
  [
    { color: 'blue', isFilled: true },
    { color: 'blue', isFilled: false },
    { color: 'blue', isFilled: false },
    { color: 'blue', isFilled: false }
  ],
  [
    { color: 'blue', isFilled: true },
    { color: 'blue', isFilled: true },
    { color: 'blue', isFilled: false },
    { color: 'blue', isFilled: false }
  ],
  [
    { color: 'blue', isFilled: false },
    { color: 'blue', isFilled: false },
    { color: 'blue', isFilled: false },
    { color: 'blue', isFilled: false }
  ]
];

describe('TetrixReducer - Bug Fixes', () => {
  describe('SELECT_SHAPE action', () => {
    it('should set selectedShape and isShapeDragging when selecting a shape', () => {
      const testShape = createTestShape();
      // First set up state with shapes and bounds
      const stateWithShapes = {
        ...initialState,
        nextShapes: [testShape],
        shapeOptionBounds: [{ top: 50, left: 50, width: 100, height: 100 }]
      };
      const action: TetrixAction = {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 }
      };

      const newState = tetrixReducer(stateWithShapes, action);

      expect(newState.selectedShape).toBe(testShape);
      expect(newState.selectedShapeIndex).toBe(0);
      expect(newState.isShapeDragging).toBe(true);
      expect(newState.dragState.phase).toBe('picking-up');
    });

    it('should allow selecting different shapes sequentially', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();

      let state: typeof initialState = {
        ...initialState,
        nextShapes: [shape1, shape2],
        shapeOptionBounds: [
          { top: 50, left: 50, width: 100, height: 100 },
          { top: 50, left: 200, width: 100, height: 100 }
        ]
      };

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 }
      });

      expect(state.selectedShape).toBe(shape1);
      expect(state.selectedShapeIndex).toBe(0);

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 1 }
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
      expect(newState.dragState.phase).toBe('placing');
      expect(newState.isShapeDragging).toBe(false);
      expect(newState.dragState.targetPosition).toBeDefined();
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

      // Should start removal animation and add a new shape (4th shape temporarily)
      expect(newState.nextShapes.length).toBe(4);
      expect(newState.nextShapes.slice(0, 3)).toEqual([shape1, shape2, shape3]); // Original shapes remain
      expect(newState.nextShapes[3]).toBeDefined(); // New shape added
      expect(newState.removingShapeIndex).toBe(0);
      expect(newState.shapeRemovalAnimationState).toBe('removing');
    });

    it('should handle COMPLETE_SHAPE_REMOVAL action', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const state = {
        ...initialState,
        removingShapeIndex: 0,
        shapeRemovalAnimationState: 'removing' as const,
        nextShapes: [shape1, shape2, shape3, createTestShape()], // Start with 4 shapes (post-placement state)
        shapesUsed: 5,
        openRotationMenus: [false, true, false, false]
      };

      const newState = tetrixReducer(state, { type: 'COMPLETE_SHAPE_REMOVAL' });

      // Should remove the first shape, leaving 3 shapes total
      expect(newState.nextShapes.length).toBe(3);
      expect(newState.nextShapes[0]).toBe(shape2); // First shape was removed
      expect(newState.nextShapes[1]).toBe(shape3);
      expect(newState.nextShapes[2]).not.toBe(shape1); // Third shape should be new

      // Should update shapes used count
      expect(newState.shapesUsed).toBe(6);

      // Should reset removal animation state
      expect(newState.removingShapeIndex).toBeNull();
      expect(newState.shapeRemovalAnimationState).toBe('none');

      // Should preserve rotation menu states for remaining shapes
      expect(newState.openRotationMenus).toEqual([true, false, false]); // Adjusted for removal
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
      const filledTilesCount = countFilledTiles(newState.tiles);
      const initialFilledTilesCount = countFilledTiles(initialState.tiles);

      // Should have more filled tiles than initial state
      expect(filledTilesCount).toBeGreaterThan(initialFilledTilesCount);
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
