/**
 * Drag Reducer - Handles all drag and drop state management
 * Actions: SELECT_SHAPE, UPDATE_MOUSE_LOCATION, PLACE_SHAPE, COMPLETE_PLACEMENT,
 *          RETURN_SHAPE_TO_SELECTOR, COMPLETE_RETURN, CLEAR_SELECTION
 */

import type { TetrixReducerState, TetrixAction } from '../types';
import { getShapeGridPositions, getShapeVisualOffset } from '../utils/shapes';

export function dragReducer(state: TetrixReducerState, action: TetrixAction): TetrixReducerState {
  switch (action.type) {
    case "SELECT_SHAPE": {
      const { shapeIndex } = action.value;
      const shape = state.nextShapes[shapeIndex];
      const bounds = state.shapeOptionBounds[shapeIndex];

      if (!shape || !bounds) {
        return state;
      }

      // Calculate grid dimensions - match the Grid component's calculation
      const gridElement = document.querySelector('.grid');
      if (!gridElement) {
        // Can't calculate offsets without grid, proceed without them (fallback behavior)
        return {
          ...state,
          dragState: {
            phase: 'picking-up',
            selectedShape: shape,
            selectedShapeIndex: shapeIndex,
            isValidPlacement: false,
            hoveredBlockPositions: [],
            invalidBlockPositions: [],
            sourcePosition: {
              x: bounds.left,
              y: bounds.top,
              width: bounds.width,
              height: bounds.height,
            },
            targetPosition: null,
            placementLocation: null,
            startTime: performance.now(),
            dragOffsets: null,
          },
        };
      }

      const rect = gridElement.getBoundingClientRect();
      const GRID_GAP = 2; // Matches Grid component
      const GRID_GAPS_TOTAL = 9 * GRID_GAP;
      const TILE_SIZE = (rect.width - GRID_GAPS_TOTAL) / 10;

      // Calculate visual offset from 4x4 center to filled blocks center
      const { offsetX: visualOffsetX, offsetY: visualOffsetY } = getShapeVisualOffset(
        shape,
        TILE_SIZE,
        GRID_GAP
      );

      // Calculate grid offset from mouse to 4x4 top-left corner
      // The 4x4 grid dimensions
      const shapeWidth = 4 * TILE_SIZE + 3 * GRID_GAP;
      const shapeHeight = 4 * TILE_SIZE + 3 * GRID_GAP;

      // Grid offset = distance from mouse to 4x4 top-left corner
      // When filled blocks are centered on mouse, top-left is at:
      // mouse - shapeWidth/2 - visualOffset
      // We want: gridTopLeft = mouse + gridOffset
      // Therefore: gridOffset = -shapeWidth/2 - visualOffset
      const gridOffsetX = -shapeWidth / 2 - visualOffsetX;
      const gridOffsetY = -shapeHeight / 2 - visualOffsetY;

      // Detect mobile and calculate touch offset
      const isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
      const touchOffset = isTouchDevice ? TILE_SIZE * 2.5 : 0;

      return {
        ...state,
        dragState: {
          phase: 'picking-up',
          selectedShape: shape,
          selectedShapeIndex: shapeIndex,
          isValidPlacement: false,
          hoveredBlockPositions: [],
          invalidBlockPositions: [],
          sourcePosition: {
            x: bounds.left,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height,
          },
          targetPosition: null,
          placementLocation: null,
          startTime: performance.now(),
          dragOffsets: {
            visualOffsetX,
            visualOffsetY,
            gridOffsetX,
            gridOffsetY,
            touchOffset,
            tileSize: TILE_SIZE,
            gridGap: GRID_GAP,
          },
        },
      };
    }

    case "UPDATE_MOUSE_LOCATION": {
      const { location, position, tileSize, gridBounds, isValid, invalidBlocks } = action.value;

      // Calculate hovered block positions based on selected shape and mouse location
      const hoveredBlockPositions = state.dragState.selectedShape && location
        ? getShapeGridPositions(state.dragState.selectedShape, location)
        : [];

      // Get invalid block positions from action (or default to empty array)
      const invalidBlockPositions = invalidBlocks ?? [];

      // Transition from picking-up to dragging after pickup animation completes
      const shouldTransitionToDragging = state.dragState.phase === 'picking-up' && state.dragState.startTime &&
        (performance.now() - state.dragState.startTime > 300); // 300ms pickup duration

      const newDragState = shouldTransitionToDragging
        ? { ...state.dragState, phase: 'dragging' as const, hoveredBlockPositions, invalidBlockPositions, isValidPlacement: isValid ?? false }
        : { ...state.dragState, hoveredBlockPositions, invalidBlockPositions, isValidPlacement: isValid ?? false };

      return {
        ...state,
        mouseGridLocation: location,
        mousePosition: position ?? state.mousePosition ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        gridTileSize: tileSize ?? state.gridTileSize ?? null,
        gridBounds: gridBounds ?? state.gridBounds ?? null,
        dragState: newDragState,
      };
    }

    case "PLACE_SHAPE": {
      const { location, mousePosition: clickPosition } = action.value;

      if (!state.dragState.selectedShape || state.dragState.selectedShapeIndex === null) {
        return state;
      }

      // Start placement animation
      if (!state.gridTileSize || !state.gridBounds) {
        return state;
      }

      // Use the click position if provided, otherwise fall back to current mouse position
      const useMousePosition = clickPosition || state.mousePosition;
      if (!useMousePosition) {
        return state;
      }

      // Calculate the target position
      const tileWithGap = state.gridTileSize + 2;
      const targetCellLeft = state.gridBounds.left + (location.column - 1) * tileWithGap;
      const targetCellTop = state.gridBounds.top + (location.row - 1) * tileWithGap;
      const targetCellCenterX = targetCellLeft + state.gridTileSize / 2;
      const targetCellCenterY = targetCellTop + state.gridTileSize / 2;

      // Get the positions where the shape will be placed
      const shapePositions = getShapeGridPositions(state.dragState.selectedShape, location);

      return {
        ...state,
        dragState: {
          ...state.dragState,
          phase: 'placing',
          targetPosition: { x: targetCellCenterX, y: targetCellCenterY },
          placementLocation: location, // Lock in the placement location at release time
          hoveredBlockPositions: shapePositions,
          startTime: performance.now(),
        },
        mouseGridLocation: location,
        mousePosition: useMousePosition, // Update current mouse position with click position
      };
    }

    case "COMPLETE_RETURN": {
      // Clear shape after return animation completes
      return {
        ...state,
        mouseGridLocation: null,
        dragState: {
          phase: 'none',
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
        },
      };
    }

    case "RETURN_SHAPE_TO_SELECTOR": {
      // Return shape to selector (invalid placement or drag outside grid)
      // If we have a selected shape and bounds, animate the return
      if (state.dragState.selectedShape && state.dragState.selectedShapeIndex !== null) {
        const bounds = state.shapeOptionBounds[state.dragState.selectedShapeIndex];
        const canAnimate = bounds && (state.dragState.phase === 'dragging' || state.dragState.phase === 'picking-up');
        if (canAnimate) {
          // Start return animation
          return {
            ...state,
            dragState: {
              ...state.dragState,
              phase: 'returning',
              sourcePosition: {
                x: bounds.left,
                y: bounds.top,
                width: bounds.width,
                height: bounds.height,
              },
              targetPosition: null,
              placementLocation: null,
              startTime: performance.now(),
            },
          };
        }
      }

      // No animation needed - clear immediately
      return {
        ...state,
        mouseGridLocation: null,
        mousePosition: state.mousePosition,
        dragState: {
          phase: 'none',
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
        },
      };
    }

    case "CLEAR_SELECTION": {
      // Clear selection immediately (ESC key)
      return {
        ...state,
        mouseGridLocation: null,
        mousePosition: state.mousePosition, // Keep current mouse position
        dragState: {
          phase: 'none',
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
        },
      };
    }

    default:
      return state;
  }
}
