import { expect, test, describe } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import { generateRandomShape } from '../utils/shapeUtils';

describe('Spend Coin Feature', () => {
  test('SPEND_COIN action reduces score and opens rotation menu', () => {
    // Create a test state with some score and shapes
    const testShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
      score: 5,
      openRotationMenus: [false, false, false],
    };

    // Dispatch spend coin action for first shape
    const newState = tetrixReducer(state, {
      type: 'SPEND_COIN',
      value: {
        shapeIndex: 0,
        mousePosition: { x: 100, y: 100 }
      }
    });

    // Verify the score was reduced and menu was opened
    expect(newState.score).toBe(4);
    expect(newState.openRotationMenus[0]).toBe(true);
    expect(newState.openRotationMenus[1]).toBe(false);
    expect(newState.openRotationMenus[2]).toBe(false);
    expect(newState.showerLocation).toEqual({ x: 100, y: 100 });
  });

  test('SPEND_COIN action fails when score is 0', () => {
    const testShapes = [generateRandomShape()];

    const state = {
      ...initialState,
      nextShapes: testShapes,
      score: 0,
      openRotationMenus: [false],
    };

    // Try to spend when no coins available
    const newState = tetrixReducer(state, {
      type: 'SPEND_COIN',
      value: { shapeIndex: 0 }
    });

    // State should be unchanged
    expect(newState).toEqual(state);
  });

  test('SPEND_COIN action fails with invalid shape index', () => {
    const state = {
      ...initialState,
      nextShapes: [generateRandomShape()],
      score: 5,
      openRotationMenus: [false],
    };

    // Try to spend on non-existent shape
    const newState = tetrixReducer(state, {
      type: 'SPEND_COIN',
      value: { shapeIndex: 5 }
    });

    // State should be unchanged
    expect(newState).toEqual(state);
  });

  test('SET_AVAILABLE_SHAPES resets rotation menus', () => {
    const state = {
      ...initialState,
      openRotationMenus: [true, true, false],
    };

    const newShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    // Set new shapes
    const newState = tetrixReducer(state, {
      type: 'SET_AVAILABLE_SHAPES',
      value: { shapes: newShapes }
    });

    // All rotation menus should be closed
    expect(newState.openRotationMenus).toEqual([false, false, false]);
    expect(newState.nextShapes).toEqual(newShapes);
  });

  test('COMPLETE_SHAPE_REMOVAL preserves rotation menus for remaining shapes', () => {
    // Create a test state with some opened rotation menus
    const testShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
      openRotationMenus: [true, true, false], // Some menus are open
      removingShapeIndex: 0, // Remove the first shape
      shapesSliding: true,
    };

    // Complete shape removal
    const newState = tetrixReducer(state, {
      type: 'COMPLETE_SHAPE_REMOVAL'
    });

    // Only the removed shape's menu should be gone, others preserved
    // Original was [true, true, false] for indices [0, 1, 2]
    // After removing index 0, we should have [true, false] for indices [0, 1] (previously 1, 2)
    expect(newState.openRotationMenus[0]).toBe(true); // Was index 1, now index 0
    expect(newState.openRotationMenus[1]).toBe(false); // Was index 2, now index 1
    expect(newState.removingShapeIndex).toBe(null);
    expect(newState.shapesSliding).toBe(false);
  });
});