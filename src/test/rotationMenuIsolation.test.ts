import { expect, test, describe } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import { generateRandomShape } from '../utils/shapeUtils';

describe('Rotation Menu Isolation', () => {
  test('COMPLETE_SHAPE_REMOVAL preserves rotation menu states for remaining shapes', () => {
    // Create test shapes
    const testShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
      openRotationMenus: [false, true, true, false], // Shapes 1 and 2 have menus open
      removingShapeIndex: 1, // Remove shape at index 1 (the first one with menu open)
      shapesSliding: true,
    };

    // Complete shape removal
    const newState = tetrixReducer(state, {
      type: 'COMPLETE_SHAPE_REMOVAL'
    });

    // Should have one less shape
    expect(newState.nextShapes.length).toBe(testShapes.length); // Maintains buffer

    // The rotation menu states should be preserved for remaining shapes
    // Original: [false, true, true, false] for indices [0, 1, 2, 3]
    // After removing index 1: [false, true, false, ...] for indices [0, 1, 2, ...]
    // The shape at original index 2 (which had menu open) becomes index 1
    expect(newState.openRotationMenus[0]).toBe(false); // Was index 0, still index 0
    expect(newState.openRotationMenus[1]).toBe(true);  // Was index 2, now index 1
    expect(newState.openRotationMenus[2]).toBe(false); // Was index 3, now index 2

    // Animation state should be reset
    expect(newState.removingShapeIndex).toBe(null);
    expect(newState.shapesSliding).toBe(false);
  });

  test('COMPLETE_SHAPE_REMOVAL handles edge case when removing last shape with menu open', () => {
    const testShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
      openRotationMenus: [false, true, true], // Last two shapes have menus open
      removingShapeIndex: 2, // Remove the last shape
      shapesSliding: true,
    };

    const newState = tetrixReducer(state, {
      type: 'COMPLETE_SHAPE_REMOVAL'
    });

    // Rotation menus for remaining shapes should be preserved
    expect(newState.openRotationMenus[0]).toBe(false); // Was index 0, still index 0
    expect(newState.openRotationMenus[1]).toBe(true);  // Was index 1, still index 1
    // The menu for the removed shape (index 2) should be gone
    expect(newState.openRotationMenus.length).toBe(newState.nextShapes.length);
  });

  test('SPEND_COIN only affects the specific shape index', () => {
    const testShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
      openRotationMenus: [false, true, false], // Only middle shape has menu open
      score: 5, // Have coins to spend
    };

    // Spend coin on first shape (index 0)
    const newState = tetrixReducer(state, {
      type: 'SPEND_COIN',
      value: {
        shapeIndex: 0,
        mousePosition: { x: 100, y: 100 }
      }
    });

    // Only the first shape's menu should be affected
    expect(newState.openRotationMenus[0]).toBe(true);  // Changed from false to true
    expect(newState.openRotationMenus[1]).toBe(true);  // Unchanged - was already true
    expect(newState.openRotationMenus[2]).toBe(false); // Unchanged - was already false
    expect(newState.score).toBe(4); // Coin spent
  });
});