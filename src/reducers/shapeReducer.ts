/**
 * Shape Reducer - Handles shape queue, rotation, and shape option management
 * Actions: SET_AVAILABLE_SHAPES, ROTATE_SHAPE, ADD_SHAPE_OPTION, REMOVE_SHAPE_OPTION,
 *          SET_SHAPE_OPTION_BOUNDS, START_SHAPE_REMOVAL, COMPLETE_SHAPE_REMOVAL
 */

import type { TetrixReducerState, TetrixAction } from '../types';
import { generateRandomShape, rotateShape, cloneShape } from '../utils/shapes';
import { safeBatchSave } from '../utils/persistenceUtils';

export function shapeReducer(state: TetrixReducerState, action: TetrixAction): TetrixReducerState {
  switch (action.type) {
    case "SET_AVAILABLE_SHAPES": {
      const { shapes } = action.value;
      // Use the provided shapes directly - no automatic virtual buffer
      const enhancedShapes = [...shapes];

      const newState = {
        ...state,
        nextShapes: enhancedShapes,
        openRotationMenus: new Array(enhancedShapes.length).fill(false),
        shapeOptionBounds: new Array(enhancedShapes.length).fill(null),
        newShapeAnimationStates: new Array(enhancedShapes.length).fill('none'),
      };

      // Save shapes to database when they are updated
      safeBatchSave(undefined, undefined, enhancedShapes, newState.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });

      return newState;
    }

    case "ROTATE_SHAPE": {
      const { shapeIndex, clockwise } = action.value;

      if (shapeIndex < 0 || shapeIndex >= state.nextShapes.length) {
        return state;
      }

      const newShapes = [...state.nextShapes];
      let rotatedShape = cloneShape(newShapes[shapeIndex]);

      if (clockwise) {
        rotatedShape = rotateShape(rotatedShape);
      } else {
        // Rotate counter-clockwise (3 clockwise rotations)
        rotatedShape = rotateShape(rotateShape(rotateShape(rotatedShape)));
      }

      newShapes[shapeIndex] = rotatedShape;

      // If this is the currently selected shape, update it in dragState too
      const newDragState = state.dragState.selectedShapeIndex === shapeIndex
        ? { ...state.dragState, selectedShape: rotatedShape }
        : state.dragState;

      const newState = {
        ...state,
        nextShapes: newShapes,
        dragState: newDragState,
      };

      // Save updated shapes to database
      safeBatchSave(undefined, undefined, newShapes, newState.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });

      return newState;
    }

    case "ADD_SHAPE_OPTION": {
      const newShape = generateRandomShape();
      const updatedShapes = [...state.nextShapes, newShape];

      const newState = {
        ...state,
        nextShapes: updatedShapes,
        openRotationMenus: [...state.openRotationMenus, false], // New shape starts with menu closed
        shapeOptionBounds: [...state.shapeOptionBounds, null], // New shape has no bounds initially
        newShapeAnimationStates: [...state.newShapeAnimationStates, 'none' as const], // New shape appears immediately
      };

      // Save updated shapes to database
      safeBatchSave(undefined, undefined, updatedShapes, newState.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });

      return newState;
    }

    case "REMOVE_SHAPE_OPTION": {
      // Never remove below 1 shape
      if (state.nextShapes.length <= 1) {
        return state;
      }

      // Remove the last shape
      const updatedShapes = state.nextShapes.slice(0, -1);
      const updatedRotationMenus = state.openRotationMenus.slice(0, -1);
      const updatedBounds = state.shapeOptionBounds.slice(0, -1);
      const updatedAnimationStates = state.newShapeAnimationStates.slice(0, -1);

      // If the currently selected shape is being removed, clear selection
      const isRemovingSelectedShape = state.dragState.selectedShapeIndex === state.nextShapes.length - 1;

      const newDragState = isRemovingSelectedShape
        ? {
          phase: 'none' as const,
          selectedShape: null,
          selectedShapeIndex: null,
          isValidPlacement: false,
          hoveredBlockPositions: [],
          invalidBlockPositions: [],
          sourcePosition: null,
          targetPosition: null,
          placementLocation: null,
          startTime: null,
          dragOffsets: null,
        }
        : state.dragState;

      const newState = {
        ...state,
        nextShapes: updatedShapes,
        openRotationMenus: updatedRotationMenus,
        shapeOptionBounds: updatedBounds,
        newShapeAnimationStates: updatedAnimationStates,
        dragState: newDragState,
      };

      // Save updated shapes to database
      safeBatchSave(undefined, undefined, updatedShapes, newState.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });

      return newState;
    }

    case "SET_SHAPE_OPTION_BOUNDS": {
      const { index, bounds } = action.value;
      const newBounds = [...state.shapeOptionBounds];
      newBounds[index] = bounds;
      return {
        ...state,
        shapeOptionBounds: newBounds,
      };
    }

    case "START_SHAPE_REMOVAL": {
      const { shapeIndex } = action.value;
      return {
        ...state,
        removingShapeIndex: shapeIndex,
        shapeRemovalAnimationState: 'removing',
      };
    }

    case "COMPLETE_SHAPE_REMOVAL": {
      // This should be called when the removal animation completes
      // Now actually remove the shape from the array
      if (state.removingShapeIndex === null) {
        return state; // No removal in progress
      }

      const removedIndex = state.removingShapeIndex;

      // Remove the shape from the array and its associated states
      const updatedNextShapes = state.nextShapes.filter((_, index) => index !== removedIndex);
      const newOpenRotationMenus = state.openRotationMenus.filter((_, index) => index !== removedIndex);
      const newAnimationStates = state.newShapeAnimationStates.filter((_, index) => index !== removedIndex);

      // No need to add a new shape here - it was already added during COMPLETE_PLACEMENT

      return {
        ...state,
        nextShapes: updatedNextShapes,
        openRotationMenus: newOpenRotationMenus,
        newShapeAnimationStates: newAnimationStates,
        shapeOptionBounds: new Array(updatedNextShapes.length).fill(null),
        removingShapeIndex: null,
        shapeRemovalAnimationState: 'none',
        shapesUsed: state.shapesUsed + 1, // Increment when shape is fully removed and replaced
      };
    }

    default:
      return state;
  }
}
