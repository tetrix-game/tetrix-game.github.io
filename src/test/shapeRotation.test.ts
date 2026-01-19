import { expect, test, describe } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import { generateRandomShape, rotateShape, cloneShape } from '../utils/shapeUtils';
import type { QueuedShape, Shape } from '../types';

// Helper functions to create QueuedShapes for tests
let testShapeIdCounter = 3000;
const createQueuedShape = (shape: Shape): QueuedShape => ({
  id: testShapeIdCounter++,
  shape,
});
const createQueuedShapes = (shapes: Shape[]): QueuedShape[] =>
  shapes.map(shape => createQueuedShape(shape));

describe('Shape Rotation', () => {
  test('ROTATE_SHAPE action rotates shapes clockwise', () => {
    // Create a test state with shapes
    const plainShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];
    const testShapes = createQueuedShapes(plainShapes);

    const state = {
      ...initialState,
      nextShapes: testShapes,
    };

    // Get the original shape
    const originalShape = cloneShape(plainShapes[0]);
    const expectedRotated = rotateShape(originalShape);

    // Dispatch rotate action
    const newState = tetrixReducer(state, {
      type: 'ROTATE_SHAPE',
      value: { shapeIndex: 0, clockwise: true }
    });

    // Verify the shape was rotated
    expect(newState.nextShapes[0].shape).toEqual(expectedRotated);
    expect(newState.nextShapes[1].shape).toEqual(plainShapes[1]); // Other shapes unchanged
    expect(newState.nextShapes[2].shape).toEqual(plainShapes[2]); // Other shapes unchanged
  });

  test('ROTATE_SHAPE action rotates shapes counter-clockwise', () => {
    // Create a test state with shapes
    const plainShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];
    const testShapes = createQueuedShapes(plainShapes);

    const state = {
      ...initialState,
      nextShapes: testShapes,
    };

    // Get the original shape
    const originalShape = cloneShape(plainShapes[1]);
    // Counter-clockwise = 3 clockwise rotations
    const expectedRotated = rotateShape(rotateShape(rotateShape(originalShape)));

    // Dispatch rotate action
    const newState = tetrixReducer(state, {
      type: 'ROTATE_SHAPE',
      value: { shapeIndex: 1, clockwise: false }
    });

    // Verify the shape was rotated
    expect(newState.nextShapes[1].shape).toEqual(expectedRotated);
    expect(newState.nextShapes[0].shape).toEqual(plainShapes[0]); // Other shapes unchanged
    expect(newState.nextShapes[2].shape).toEqual(plainShapes[2]); // Other shapes unchanged
  });

  test('ROTATE_SHAPE handles invalid shape index gracefully', () => {
    const plainShapes = [generateRandomShape(), generateRandomShape()];
    const testShapes = createQueuedShapes(plainShapes);
    
    const state = {
      ...initialState,
      nextShapes: testShapes,
    };

    // Try to rotate a shape that doesn't exist
    const newState = tetrixReducer(state, {
      type: 'ROTATE_SHAPE',
      value: { shapeIndex: 5, clockwise: true }
    });

    // State should be unchanged
    expect(newState).toEqual(state);
  });

  test('ROTATE_SHAPE updates selected shape if it is being rotated', () => {
    const plainShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];
    const testShapes = createQueuedShapes(plainShapes);

    const state = {
      ...initialState,
      nextShapes: testShapes,
      dragState: {
        ...initialState.dragState,
        selectedShape: plainShapes[1],
        selectedShapeIndex: 1,
      }
    };

    const originalShape = cloneShape(plainShapes[1]);
    const expectedRotated = rotateShape(originalShape);

    // Rotate the currently selected shape
    const newState = tetrixReducer(state, {
      type: 'ROTATE_SHAPE',
      value: { shapeIndex: 1, clockwise: true }
    });

    // Both the shape in nextShapes and selectedShape should be updated
    expect(newState.nextShapes[1].shape).toEqual(expectedRotated);
    expect(newState.dragState.selectedShape).toEqual(expectedRotated);
    expect(newState.dragState.selectedShapeIndex).toBe(1);
  });
});