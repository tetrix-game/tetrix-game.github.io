/**
 * Shape Reducer - Handles shape queue, rotation, and shape option management
 * Actions: SET_AVAILABLE_SHAPES, ROTATE_SHAPE, ADD_SHAPE_OPTION, REMOVE_SHAPE_OPTION,
 *          SET_SHAPE_OPTION_BOUNDS, START_SHAPE_REMOVAL, COMPLETE_SHAPE_REMOVAL
 */

import type { TetrixReducerState, TetrixAction } from '../types';
import { generateRandomShape, rotateShape, cloneShape } from '../utils/shapes';
import { safeBatchSave } from '../utils/persistence';
import { resetNoTurnStreak } from '../utils/statsUtils';
import { checkMapCompletion } from '../utils/mapCompletionUtils';
import { checkGameOver } from '../utils/gameOverUtils';

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
      if (state.gameMode !== 'hub') {
        safeBatchSave(state.gameMode, { nextShapes: enhancedShapes, savedShape: newState.savedShape })
          .catch((error: Error) => {
            console.error('Failed to save shapes state:', error);
          });
      }

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

      // Reset no-turn streak since a shape was rotated
      const newStats = resetNoTurnStreak(state.stats);

      const newState = {
        ...state,
        nextShapes: newShapes,
        dragState: newDragState,
        stats: newStats,
      };

      // Save updated shapes and stats to database
      if (state.gameMode !== 'hub') {
        safeBatchSave(state.gameMode, {
          nextShapes: newShapes,
          savedShape: newState.savedShape,
          stats: state.gameMode === 'infinite' ? newStats : undefined,
        }).catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });
      }

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
      if (state.gameMode !== 'hub') {
        safeBatchSave(state.gameMode, { nextShapes: updatedShapes, savedShape: newState.savedShape })
          .catch((error: Error) => {
            console.error('Failed to save shapes state:', error);
          });
      }

      return newState;
    }

    case "REMOVE_SHAPE_OPTION": {
      // In infinite mode, never remove below 1 shape
      // In finite mode, allow going to 0 to show empty queue placeholder
      if (state.queueMode === 'infinite' && state.nextShapes.length <= 1) {
        return state;
      }

      // Don't allow removal if already at 0
      if (state.nextShapes.length === 0) {
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
      if (state.gameMode !== 'hub') {
        safeBatchSave(state.gameMode, { nextShapes: updatedShapes, savedShape: newState.savedShape })
          .catch((error: Error) => {
            console.error('Failed to save shapes state:', error);
          });
      }

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

      // Check for game over / completion after shape removal
      // In finite mode (daily challenge), check if this was the last shape
      let isGameOver = false;
      let mapCompletionResult = state.mapCompletionResult;
      let newGameState = state.gameState;

      if (state.queueMode === 'finite') {
        // Queue is depleted when no visible shapes remain and no hidden shapes in queue
        const queueDepleted = updatedNextShapes.length === 0 && state.queueHiddenShapes.length === 0;
        
        // Check if no moves are possible with remaining shapes
        const noMovesPossible = checkGameOver(state.tiles, updatedNextShapes, state.score, newOpenRotationMenus, state.gameMode);

        if ((queueDepleted || noMovesPossible) && state.targetTiles) {
          // Check map completion and show overlay
          const completionResult = checkMapCompletion(state.tiles, state.targetTiles);
          
          mapCompletionResult = {
            stars: completionResult.stars,
            matchedTiles: completionResult.matchedTiles,
            totalTiles: completionResult.totalTiles,
            missedTiles: completionResult.missedTiles,
          };
          newGameState = 'gameover';
          isGameOver = true;
        }
      } else if (state.gameMode === 'infinite') {
        // In infinite mode, check if any remaining shapes can be placed
        isGameOver = checkGameOver(state.tiles, updatedNextShapes, state.score, newOpenRotationMenus, state.gameMode);
        if (isGameOver) {
          newGameState = 'gameover';
        }
      }

      return {
        ...state,
        nextShapes: updatedNextShapes,
        openRotationMenus: newOpenRotationMenus,
        newShapeAnimationStates: newAnimationStates,
        shapeOptionBounds: new Array(updatedNextShapes.length).fill(null),
        removingShapeIndex: null,
        shapeRemovalAnimationState: 'none',
        shapesUsed: state.shapesUsed + 1, // Increment when shape is fully removed and replaced
        gameState: newGameState,
        mapCompletionResult: mapCompletionResult,
      };
    }

    default:
      return state;
  }
}
