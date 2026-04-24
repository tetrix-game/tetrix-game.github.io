import { useEffect, useRef } from 'react';

import { api } from '../api/client';
import { useAuth } from '../AuthProvider/AuthContext';
import { gridConstants } from '../gridConstants';
import { mousePositionToGridLocation } from '../shapeGeometry';
import { isValidPlacement } from '../shapeValidation';
import { useSoundEffects } from '../SoundEffectsProvider';
import { useTetrixDispatchContext, useTetrixStateContext } from '../TetrixProvider';

const { GRID_SIZE } = gridConstants;

export const useShapePlacement = (): void => {
  const { gameMode, dragState, tiles } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const { playSound } = useSoundEffects();
  const { isAuthenticated } = useAuth();
  const gridRef = useRef<HTMLElement | null>(null);

  // Global pointerup handler - consolidates all placement/return logic
  useEffect((): (() => void) => {
    const handleGlobalPointerUp = async (e: PointerEvent): Promise<void> => {
      // Only handle if a shape is being dragged
      if (!dragState.selectedShape || dragState.selectedShapeIndex === null) return;

      // Get current grid element for validation
      if (!gridRef.current) {
        gridRef.current = document.querySelector('.grid');
      }

      const gridElement = gridRef.current as HTMLElement;
      if (!gridElement) {
        // No grid available - return shape
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
        return;
      }

      // Use precomputed offsets (required)
      const offsets = dragState.dragOffsets;
      if (!offsets) {
        // No offsets means SELECT_SHAPE didn't properly calculate them
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
        return;
      }

      // Use precomputed offsets for grid location calculation
      const location = mousePositionToGridLocation(
        e.clientX,
        e.clientY,
        gridElement,
        { rows: GRID_SIZE, columns: GRID_SIZE },
        offsets.touchOffset,
        dragState.selectedShape,
        {
          gridOffsetX: offsets.gridOffsetX,
          gridOffsetY: offsets.gridOffsetY,
          tileSize: offsets.tileSize,
          gridGap: offsets.gridGap,
        },
      );

      // If location is null or placement is invalid, return the shape
      if (
        location === null
        || !isValidPlacement(dragState.selectedShape, location, tiles, gameMode)
      ) {
        playSound('invalid_placement');
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
        return;
      }

      // If authenticated, use server-authoritative placement
      if (isAuthenticated) {
        // Phase 1: Start wiggle animation
        dispatch({
          type: 'START_SERVER_PLACEMENT',
          value: {
            location,
            mousePosition: { x: e.clientX, y: e.clientY },
          },
        });

        // Phase 2: Make async API call
        try {
          const response = await api.placeShapeMinimal(
            dragState.selectedShapeIndex,
            location.row, // Already 1-indexed
            location.column, // Already 1-indexed
          );

          if (response.success && response.tiles) {
            // Transition to placing phase (drop animation)
            dispatch({ type: 'PLACE_SHAPE', value: { location, mousePosition: { x: e.clientX, y: e.clientY } } });

            // Apply server response after a short delay to let drop animation start
            setTimeout(() => {
              dispatch({
                type: 'APPLY_SERVER_PLACEMENT',
                value: {
                  tiles: response.tiles,
                  score: response.score!,
                  linesCleared: response.linesCleared!,
                  updatedQueue: response.updatedQueue!,
                  gameOver: response.gameOver || false,
                },
              });
            }, 50);
          } else {
            // Server rejected placement
            playSound('invalid_placement');
            dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
          }
        } catch {
          // Failed to place - return shape to selector
          playSound('invalid_placement');
          dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
        }
      } else {
        // Local play - use old client-side logic
        dispatch({
          type: 'PLACE_SHAPE',
          value: {
            location,
            mousePosition: { x: e.clientX, y: e.clientY },
          },
        });
      }
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);

    return (): void => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [
    dispatch,
    dragState.selectedShape,
    dragState.selectedShapeIndex,
    dragState.dragOffsets,
    tiles,
    playSound,
    gameMode,
    isAuthenticated,
  ]);
};
