import { describe, it, expect } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import type { Shape, TetrixAction, QueuedShape } from '../utils/types';
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

// Helper to create a QueuedShape from a Shape
let testShapeIdCounter = 1000; // Use high numbers to avoid collision with actual state
const createQueuedShape = (shape: Shape): QueuedShape => ({
  id: testShapeIdCounter++,
  shape,
});

// Helper to create multiple QueuedShapes from an array of Shapes
const createQueuedShapes = (shapes: Shape[]): QueuedShape[] => 
  shapes.map(shape => createQueuedShape(shape));

describe('TetrixReducer - Bug Fixes', () => {
  describe('SELECT_SHAPE action', () => {
    it('should set selectedShape and isShapeDragging when selecting a shape', () => {
      const testShape = createTestShape();
      const queuedShape = createQueuedShape(testShape);
      // First set up state with shapes and bounds
      const stateWithShapes = {
        ...initialState,
        nextShapes: [queuedShape],
        shapeOptionBounds: [{ top: 50, left: 50, width: 100, height: 100 }]
      };
      const action: TetrixAction = {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 }
      };

      const newState = tetrixReducer(stateWithShapes, action);

      expect(newState.dragState.selectedShape).toEqual(testShape);
      expect(newState.dragState.selectedShapeIndex).toBe(0);
      expect(newState.dragState.phase).toBe('picking-up');
      expect(newState.dragState.phase).toBe('picking-up');
    });

    it('should allow selecting different shapes sequentially', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();

      let state: typeof initialState = {
        ...initialState,
        nextShapes: createQueuedShapes([shape1, shape2]),
        shapeOptionBounds: [
          { top: 50, left: 50, width: 100, height: 100 },
          { top: 50, left: 200, width: 100, height: 100 }
        ]
      };

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 }
      });

      expect(state.dragState.selectedShape).toEqual(shape1);
      expect(state.dragState.selectedShapeIndex).toBe(0);

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 1 }
      });

      expect(state.dragState.selectedShape).toEqual(shape2);
      expect(state.dragState.selectedShapeIndex).toBe(1);
    });
  });

  describe('PLACE_SHAPE action', () => {
    it('should start placement animation and prepare for shape placement', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const state = {
        ...initialState,
        dragState: {
          ...initialState.dragState,
          selectedShape: shape1,
          selectedShapeIndex: 0,
          phase: 'dragging' as const
        },
        mouseGridLocation: { row: 5, column: 5 },
        mousePosition: { x: 100, y: 100 },
        gridTileSize: 20,
        gridBounds: { top: 50, left: 50, width: 200, height: 200 },
        nextShapes: createQueuedShapes([shape1, shape2, shape3])
      };

      const newState = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: { location: { row: 5, column: 5 } }
      });

      // Should start placement animation
      expect(newState.dragState.phase).toBe('placing');
      expect(newState.dragState.targetPosition).toBeDefined();
      // Should maintain selected shape during animation
      expect(newState.dragState.selectedShape).toBe(shape1);
      expect(newState.dragState.selectedShapeIndex).toBe(0);
    });

    it('should not affect shapes during placement animation', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const queuedShapes = createQueuedShapes([shape1, shape2, shape3]);
      const state = {
        ...initialState,
        dragState: {
          ...initialState.dragState,
          selectedShape: shape2,
          selectedShapeIndex: 1,
          phase: 'dragging' as const
        },
        mouseGridLocation: { row: 5, column: 5 },
        mousePosition: { x: 100, y: 100 },
        gridTileSize: 20,
        gridBounds: { top: 50, left: 50, width: 200, height: 200 },
        nextShapes: queuedShapes
      };

      const newState = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: { location: { row: 5, column: 5 } }
      });

      // Should not modify nextShapes during placement animation
      expect(newState.nextShapes.length).toBe(3);
      expect(newState.nextShapes[0].shape).toEqual(shape1);
      expect(newState.nextShapes[1].shape).toEqual(shape2);
      expect(newState.nextShapes[2].shape).toEqual(shape3);
    });

    it('should not update grid during placement animation', () => {
      const testShape = createTestShape();
      const state = {
        ...initialState,
        dragState: {
          ...initialState.dragState,
          selectedShape: testShape,
          selectedShapeIndex: 0,
          phase: 'dragging' as const
        },
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
        dragState: {
          ...initialState.dragState,
          selectedShape: testShape,
          selectedShapeIndex: 0,
          phase: 'dragging' as const
        },
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
        dragState: {
          ...initialState.dragState,
          selectedShape: testShape,
          selectedShapeIndex: null,
          phase: 'dragging' as const
        },
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
    it('should atomically remove placed shape and add new shape', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const state = {
        ...initialState,
        dragState: {
          ...initialState.dragState,
          selectedShape: shape1,
          selectedShapeIndex: 0,
          phase: 'dragging' as const
        },
        mouseGridLocation: { row: 5, column: 5 },
        nextShapes: createQueuedShapes([shape1, shape2, shape3]),
        shapesUsed: 5
      };

      const newState = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });

      // Should clear selection
      expect(newState.dragState.selectedShape).toBeNull();
      expect(newState.dragState.selectedShapeIndex).toBeNull();
      expect(newState.dragState.phase).toBe('none');
      expect(newState.mouseGridLocation).toBeNull();

      // Two-phase animation: keeps 4 shapes during animation (placed shape + new shape)
      // COMPLETE_SHAPE_REMOVAL will remove the placed shape after animation
      expect(newState.nextShapes.length).toBe(4);
      expect(newState.nextShapes[0].shape).toEqual(shape1); // Still present during animation
      expect(newState.nextShapes[1].shape).toEqual(shape2);
      expect(newState.nextShapes[2].shape).toEqual(shape3);
      // New shape added at index 3 (clipped, will slide in)
      expect(newState.nextShapes[3].shape).not.toEqual(shape1);
      
      // Removal animation is active (shape at index 0 shrinks, others slide)
      expect(newState.removingShapeIndex).toBe(0);
      expect(newState.shapeRemovalAnimationState).toBe('removing');
      
      // shapesUsed should be incremented immediately
      expect(newState.shapesUsed).toBe(6);
    });

    it('should handle COMPLETE_SHAPE_REMOVAL action (removes placed shape after animation)', () => {
      const shape1 = createTestShape();
      const shape2 = createTestShape();
      const shape3 = createTestShape();
      const shape4 = createTestShape(); // The new shape that slid in
      const queuedShapes = createQueuedShapes([shape1, shape2, shape3, shape4]);
      const state = {
        ...initialState,
        removingShapeIndex: 0, // shape1 is being removed
        shapeRemovalAnimationState: 'removing' as const,
        nextShapes: queuedShapes, // 4 shapes during animation
        shapesUsed: 6,
        openRotationMenus: [false, true, false, false],
        newShapeAnimationStates: ['none', 'none', 'none', 'none'] as const,
        shapeOptionBounds: [null, null, null, null],
      };

      const newState = tetrixReducer(state, { type: 'COMPLETE_SHAPE_REMOVAL' });

      // After animation completes, placed shape is removed (back to 3 shapes)
      expect(newState.nextShapes.length).toBe(3);
      expect(newState.nextShapes[0].shape).toEqual(shape2); // Was at index 1, now at 0
      expect(newState.nextShapes[1].shape).toEqual(shape3); // Was at index 2, now at 1
      expect(newState.nextShapes[2].shape).toEqual(shape4); // Was at index 3, now at 2

      // shapesUsed should NOT change - it was already incremented in COMPLETE_PLACEMENT
      expect(newState.shapesUsed).toBe(6);

      // Should reset removal animation state
      expect(newState.removingShapeIndex).toBeNull();
      expect(newState.shapeRemovalAnimationState).toBe('none');

      // Rotation menu states should be filtered (index 0 removed)
      expect(newState.openRotationMenus).toEqual([true, false, false]);
    });

    it.skip('should update grid tiles with shape blocks', () => {
      const testShape = createTestShape();
      const placementLoc = { row: 5, column: 5 };
      const state = {
        ...initialState,
        dragState: {
          ...initialState.dragState,
          selectedShape: testShape,
          selectedShapeIndex: 0,
          phase: 'dragging' as const,
          placementLocation: placementLoc,
        },
        mouseGridLocation: placementLoc
      };

      // Get initial count from the specific state being used
      const initialFilledTilesCount = countFilledTiles(state.tiles);

      const newState = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });

      // Find tiles that should have been filled
      const filledTilesCount = countFilledTiles(newState.tiles);

      // Should have more filled tiles than before placement
      expect(filledTilesCount).toBeGreaterThan(initialFilledTilesCount);
    });

    it('should not place shape if no shape is selected', () => {
      const state = { ...initialState, mouseGridLocation: { row: 5, column: 5 } };

      const newState = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });

      expect(newState).toEqual(state);
    });

    it('should not place shape if no mouse location is set', () => {
      const testShape = createTestShape();
      const state = {
        ...initialState,
        dragState: {
          ...initialState.dragState,
          selectedShape: testShape,
          selectedShapeIndex: 0,
          phase: 'dragging' as const
        }
      };

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
        dragState: {
          ...initialState.dragState,
          selectedShape: testShape,
          phase: 'dragging' as const
        },
        mouseGridLocation: { row: 5, column: 5 }
      };

      const newState = tetrixReducer(state, { type: 'CLEAR_SELECTION' });

      expect(newState.dragState.selectedShape).toBeNull();
      expect(newState.dragState.phase).toBe('none');
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

      // SET_AVAILABLE_SHAPES wraps shapes with IDs, so compare .shape values
      expect(newState.nextShapes.length).toBe(3);
      expect(newState.nextShapes[0].shape).toEqual(shapes[0]);
      expect(newState.nextShapes[1].shape).toEqual(shapes[1]);
      expect(newState.nextShapes[2].shape).toEqual(shapes[2]);
    });
  });
});
