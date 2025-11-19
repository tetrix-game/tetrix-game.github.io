import { expect, test, describe } from 'vitest';
import { tetrixReducer, initialState } from '../components/Tetrix/TetrixReducer';
import { generateRandomShape } from '../utils/shapeUtils';

describe('Rotation Menu Isolation', () => {
  test('COMPLETE_PLACEMENT starts removal animation without changing shapes', () => {
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
      dragState: {
        ...initialState.dragState,
        selectedShape: testShapes[1], // Select shape at index 1
        selectedShapeIndex: 1,
      },
      mouseGridLocation: { row: 5, column: 5 }, // Valid placement location
    };

    // Complete placement (which now starts removal animation)
    const newState = tetrixReducer(state, {
      type: 'COMPLETE_PLACEMENT'
    });

    // Should add a new shape temporarily (creating 5 shapes during animation)
    expect(newState.nextShapes.length).toBe(testShapes.length + 1);
    expect(newState.nextShapes.slice(0, 4)).toEqual(testShapes); // Original shapes remain
    expect(newState.nextShapes[4]).toBeDefined(); // New shape added

    // Should start removal animation
    expect(newState.removingShapeIndex).toBe(1);
    expect(newState.shapeRemovalAnimationState).toBe('removing');

    // Rotation menu states should be extended for the new shape
    expect(newState.openRotationMenus).toEqual([false, true, true, false, false]); // New shape starts with menu closed

    // Selection should be cleared
    expect(newState.dragState.selectedShape).toBe(null);
    expect(newState.dragState.selectedShapeIndex).toBe(null);
  });

  test('COMPLETE_SHAPE_REMOVAL preserves rotation menu states for remaining shapes', () => {
    // Create test shapes - simulating post-placement state with 5 shapes
    const testShapes = [
      generateRandomShape(), // index 0 
      generateRandomShape(), // index 1 (will be removed)
      generateRandomShape(), // index 2
      generateRandomShape(), // index 3
      generateRandomShape(), // index 4 (added during placement)
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
      openRotationMenus: [false, true, true, false, false], // Shapes 1 and 2 have menus open
      removingShapeIndex: 1, // Removing shape at index 1
      shapeRemovalAnimationState: 'removing' as const,
    };

    // Complete shape removal
    const newState = tetrixReducer(state, {
      type: 'COMPLETE_SHAPE_REMOVAL'
    });

    // Should have 4 shapes (5 - 1 removed = 4, no new shape added during removal)
    expect(newState.nextShapes.length).toBe(4);

    // The rotation menu states should be preserved for remaining shapes
    // Original: [false, true, true, false, false] for indices [0, 1, 2, 3, 4]
    // After removing index 1: [false, true, false, false] for indices [0, 1, 2, 3]
    // The shape at original index 2 (which had menu open) becomes index 1
    expect(newState.openRotationMenus[0]).toBe(false); // Was index 0, still index 0
    expect(newState.openRotationMenus[1]).toBe(true);  // Was index 2, now index 1
    expect(newState.openRotationMenus[2]).toBe(false); // Was index 3, now index 2  
    expect(newState.openRotationMenus[3]).toBe(false); // Was index 4, now index 3

    // Animation should be reset
    expect(newState.removingShapeIndex).toBe(null);
    expect(newState.shapeRemovalAnimationState).toBe('none');
  });

  test('COMPLETE_PLACEMENT handles edge case when removing last shape with menu open', () => {
    const testShapes = [
      generateRandomShape(),
      generateRandomShape(),
      generateRandomShape(),
    ];

    const state = {
      ...initialState,
      nextShapes: testShapes,
      openRotationMenus: [false, true, true], // Last two shapes have menus open
      dragState: {
        ...initialState.dragState,
        selectedShape: testShapes[2], // Select the last shape
        selectedShapeIndex: 2,
      },
      mouseGridLocation: { row: 5, column: 5 },
    };

    const newState = tetrixReducer(state, {
      type: 'COMPLETE_PLACEMENT'
    });

    // Rotation menus for remaining shapes should be preserved
    expect(newState.openRotationMenus[0]).toBe(false); // Was index 0, still index 0
    expect(newState.openRotationMenus[1]).toBe(true);  // Was index 1, still index 1
    // The menu for the removed shape (index 2) should be gone and new shape added
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