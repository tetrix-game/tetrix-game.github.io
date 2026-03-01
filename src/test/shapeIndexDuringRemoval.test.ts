import { describe, it, expect } from 'vitest';

import { tetrixReducer } from '../reducers';
import { generateRandomShape } from '../shapeGeneration';
import type { TetrixReducerState, QueuedShape } from '../types';

describe('Shape Index During Removal Animation', () => {
  it('should adjust selectedShapeIndex when a shape before it is removed', () => {
    // Setup: Create state with 4 shapes where shape at index 0 is being removed
    // and shape at index 2 is currently being dragged
    const shape0 = generateRandomShape();
    const shape1 = generateRandomShape();
    const shape2 = generateRandomShape(); // This is being dragged
    const shape3 = generateRandomShape();

    const initialState: TetrixReducerState = {
      nextShapes: [
        { id: 0, shape: shape0, type: 'shape' },
        { id: 1, shape: shape1, type: 'shape' },
        { id: 2, shape: shape2, type: 'shape' },
        { id: 3, shape: shape3, type: 'shape' },
      ] as QueuedShape[],
      removingShapeIndex: 0, // Shape 0 is being removed
      shapeRemovalAnimationState: 'removing',
      dragState: {
        phase: 'dragging',
        selectedShape: shape2,
        selectedShapeIndex: 2, // Currently dragging shape at index 2
        sourceId: 'shape-2',
        isValidPlacement: false,
        hoveredBlockPositions: [],
        invalidBlockPositions: [],
        sourcePosition: { x: 100, y: 100, width: 80, height: 80 },
        targetPosition: null,
        placementLocation: null,
        placementStartPosition: null,
        startTime: null,
        dragOffsets: null,
      },
      openRotationMenus: [false, false, false, false],
      newShapeAnimationStates: ['none', 'none', 'none', 'none'],
      shapeOptionBounds: [null, null, null, null],
    } as TetrixReducerState;

    // Action: Complete the shape removal animation
    const result = tetrixReducer(initialState, { type: 'COMPLETE_SHAPE_REMOVAL' });

    // Assert: Shape array should now have 3 shapes (shape0 removed)
    expect(result.nextShapes.length).toBe(3);
    expect(result.nextShapes[0]).toEqual({ id: 1, shape: shape1, type: 'shape' });
    expect(result.nextShapes[1]).toEqual({ id: 2, shape: shape2, type: 'shape' });
    expect(result.nextShapes[2]).toEqual({ id: 3, shape: shape3, type: 'shape' });

    // Assert: selectedShapeIndex should be adjusted from 2 to 1
    // because shape at index 0 was removed, shifting everything down
    expect(result.dragState.selectedShapeIndex).toBe(1);
    expect(result.dragState.selectedShape).toBe(shape2); // Shape itself unchanged
    expect(result.dragState.phase).toBe('dragging'); // Still dragging

    // Assert: Animation state is reset
    expect(result.removingShapeIndex).toBeNull();
    expect(result.shapeRemovalAnimationState).toBe('none');
  });

  it('should NOT adjust selectedShapeIndex when a shape after it is removed', () => {
    // Setup: Create state where shape at index 3 is being removed
    // and shape at index 1 is currently being dragged
    const shape0 = generateRandomShape();
    const shape1 = generateRandomShape(); // This is being dragged
    const shape2 = generateRandomShape();
    const shape3 = generateRandomShape();

    const initialState: TetrixReducerState = {
      nextShapes: [
        { id: 0, shape: shape0, type: 'shape' },
        { id: 1, shape: shape1, type: 'shape' },
        { id: 2, shape: shape2, type: 'shape' },
        { id: 3, shape: shape3, type: 'shape' },
      ] as QueuedShape[],
      removingShapeIndex: 3, // Shape 3 is being removed
      shapeRemovalAnimationState: 'removing',
      dragState: {
        phase: 'dragging',
        selectedShape: shape1,
        selectedShapeIndex: 1, // Currently dragging shape at index 1
        sourceId: 'shape-1',
        isValidPlacement: false,
        hoveredBlockPositions: [],
        invalidBlockPositions: [],
        sourcePosition: { x: 100, y: 100, width: 80, height: 80 },
        targetPosition: null,
        placementLocation: null,
        placementStartPosition: null,
        startTime: null,
        dragOffsets: null,
      },
      openRotationMenus: [false, false, false, false],
      newShapeAnimationStates: ['none', 'none', 'none', 'none'],
      shapeOptionBounds: [null, null, null, null],
    } as TetrixReducerState;

    // Action: Complete the shape removal animation
    const result = tetrixReducer(initialState, { type: 'COMPLETE_SHAPE_REMOVAL' });

    // Assert: selectedShapeIndex should remain 1
    // because the removed shape was after the dragged shape
    expect(result.dragState.selectedShapeIndex).toBe(1);
    expect(result.dragState.selectedShape).toBe(shape1);
    expect(result.dragState.phase).toBe('dragging');

    // Assert: Shape array should now have 3 shapes
    expect(result.nextShapes.length).toBe(3);
  });

  it('should handle removal when no shape is being dragged', () => {
    // Setup: Create state where shape at index 0 is being removed
    // but no shape is currently selected
    const shape0 = generateRandomShape();
    const shape1 = generateRandomShape();
    const shape2 = generateRandomShape();

    const initialState: TetrixReducerState = {
      nextShapes: [
        { id: 0, shape: shape0, type: 'shape' },
        { id: 1, shape: shape1, type: 'shape' },
        { id: 2, shape: shape2, type: 'shape' },
      ] as QueuedShape[],
      removingShapeIndex: 0,
      shapeRemovalAnimationState: 'removing',
      dragState: {
        phase: 'none',
        selectedShape: null,
        selectedShapeIndex: null, // No shape selected
        sourceId: null,
        isValidPlacement: false,
        hoveredBlockPositions: [],
        invalidBlockPositions: [],
        sourcePosition: null,
        targetPosition: null,
        placementLocation: null,
        placementStartPosition: null,
        startTime: null,
        dragOffsets: null,
      },
      openRotationMenus: [false, false, false],
      newShapeAnimationStates: ['none', 'none', 'none'],
      shapeOptionBounds: [null, null, null],
    } as TetrixReducerState;

    // Action: Complete the shape removal animation
    const result = tetrixReducer(initialState, { type: 'COMPLETE_SHAPE_REMOVAL' });

    // Assert: dragState should remain unchanged
    expect(result.dragState.selectedShapeIndex).toBeNull();
    expect(result.dragState.selectedShape).toBeNull();
    expect(result.dragState.phase).toBe('none');

    // Assert: Shape array should now have 2 shapes
    expect(result.nextShapes.length).toBe(2);
  });

  it('should adjust selectedShapeIndex during slot purchase removal', () => {
    // Setup: Create state where a purchasable slot at index 1 is being removed
    // and shape at index 2 is currently being dragged
    const shape0 = generateRandomShape();
    const shape2 = generateRandomShape(); // This is being dragged
    const shape3 = generateRandomShape();

    const initialState: TetrixReducerState = {
      nextShapes: [
        { id: 0, shape: shape0, type: 'shape' },
        { id: 1, type: 'purchasable-slot', cost: 5000, slotNumber: 2 },
        { id: 2, shape: shape2, type: 'shape' },
        { id: 3, shape: shape3, type: 'shape' },
      ],
      removingShapeIndex: 1, // Slot at index 1 is being removed
      shapeRemovalAnimationState: 'removing',
      dragState: {
        phase: 'dragging',
        selectedShape: shape2,
        selectedShapeIndex: 2, // Currently dragging shape at index 2
        sourceId: 'shape-2',
        isValidPlacement: false,
        hoveredBlockPositions: [],
        invalidBlockPositions: [],
        sourcePosition: { x: 100, y: 100, width: 80, height: 80 },
        targetPosition: null,
        placementLocation: null,
        placementStartPosition: null,
        startTime: null,
        dragOffsets: null,
      },
      openRotationMenus: [false, false, false, false],
      newShapeAnimationStates: ['none', 'none', 'none', 'none'],
      shapeOptionBounds: [null, null, null, null],
      unlockedSlots: new Set([1, 2]),
    } as TetrixReducerState;

    // Action: Complete the slot purchase removal animation
    const result = tetrixReducer(initialState, { type: 'COMPLETE_SLOT_PURCHASE_REMOVAL' });

    // Assert: selectedShapeIndex should be adjusted from 2 to 1
    expect(result.dragState.selectedShapeIndex).toBe(1);
    expect(result.dragState.selectedShape).toBe(shape2);
    expect(result.dragState.phase).toBe('dragging');

    // Assert: Array should now have 3 items
    expect(result.nextShapes.length).toBe(3);
  });
});
