import { expect, test, describe } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import { generateRandomShape, rotateShape, cloneShape } from '../utils/shapeUtils';

describe('Shape Rotation', () => {
  test('ROTATE_SHAPE action rotates shapes clockwise', () => {
    // Create a test state with shapes
    const testShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
    };

    // Get the original shape
    const originalShape = cloneShape(testShapes[0]);
    const expectedRotated = rotateShape(originalShape);

    // Dispatch rotate action
    const newState = tetrixReducer(state, {
      type: 'ROTATE_SHAPE',
      value: { shapeIndex: 0, clockwise: true }
    });

    // Verify the shape was rotated
    expect(newState.nextShapes[0]).toEqual(expectedRotated);
    expect(newState.nextShapes[1]).toEqual(testShapes[1]); // Other shapes unchanged
    expect(newState.nextShapes[2]).toEqual(testShapes[2]); // Other shapes unchanged
  });

  test('ROTATE_SHAPE action rotates shapes counter-clockwise', () => {
    // Create a test state with shapes
    const testShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
    };

    // Get the original shape
    const originalShape = cloneShape(testShapes[1]);
    // Counter-clockwise = 3 clockwise rotations
    const expectedRotated = rotateShape(rotateShape(rotateShape(originalShape)));

    // Dispatch rotate action
    const newState = tetrixReducer(state, {
      type: 'ROTATE_SHAPE',
      value: { shapeIndex: 1, clockwise: false }
    });

    // Verify the shape was rotated
    expect(newState.nextShapes[1]).toEqual(expectedRotated);
    expect(newState.nextShapes[0]).toEqual(testShapes[0]); // Other shapes unchanged
    expect(newState.nextShapes[2]).toEqual(testShapes[2]); // Other shapes unchanged
  });

  test('ROTATE_SHAPE handles invalid shape index gracefully', () => {
    const state = {
      ...initialState,
      nextShapes: [generateRandomShape(), generateRandomShape()],
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
    const testShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
      selectedShape: testShapes[1],
      selectedShapeIndex: 1,
    };

    const originalShape = cloneShape(testShapes[1]);
    const expectedRotated = rotateShape(originalShape);

    // Rotate the currently selected shape
    const newState = tetrixReducer(state, {
      type: 'ROTATE_SHAPE',
      value: { shapeIndex: 1, clockwise: true }
    });

    // Both the shape in nextShapes and selectedShape should be updated
    expect(newState.nextShapes[1]).toEqual(expectedRotated);
    expect(newState.selectedShape).toEqual(expectedRotated);
    expect(newState.selectedShapeIndex).toBe(1);
  });
});