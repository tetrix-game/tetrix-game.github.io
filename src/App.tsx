import Header from './components/Header';
import Tetrix from './components/Tetrix';
import GameMap from './components/GameMap';
import FullScreenFloatingActionButton from './components/FullScreenButton';
import TutorialOverlay from './components/TutorialOverlay';
import DebugEditor from './components/DebugEditor';
import DraggingShape from './components/DraggingShape';
import ToastOverlay from './components/ToastOverlay';
import { useTetrixStateContext, useTetrixDispatchContext } from './components/Tetrix/TetrixContext';
import { useMusicControl } from './components/Header/MusicControlContext';
import { useSoundEffects } from './components/SoundEffectsContext';
import { useState, useEffect, useRef } from 'react';
import { mousePositionToGridLocation, isValidPlacement, getInvalidBlocks } from './utils/shapeUtils';
import './App.css';

const App = () => {
  const { gameState, dragState, gridTileSize, gridBounds, tiles } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const { triggerAutoplay } = useMusicControl();
  const { playSound } = useSoundEffects();
  const [showTutorial, setShowTutorial] = useState(false);
  const gridRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Check if user has seen the tutorial before
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  // Global mouse/pointer tracking for DraggingShape
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const position = { x: e.clientX, y: e.clientY };

      // Optimization: If we are placing or returning, we don't need to calculate fit
      // The reducer also guards against this, but we can save the calculation here
      if (dragState.phase === 'placing' || dragState.phase === 'returning') {
        dispatch({
          type: 'UPDATE_MOUSE_LOCATION',
          value: {
            location: null,
            position,
            tileSize: gridTileSize,
            gridBounds: gridBounds,
            isValid: false,
            invalidBlocks: [],
          },
        });
        return;
      }

      // Only calculate grid location if a shape is selected and grid is available
      let location = null;
      let tileSize = gridTileSize;
      let bounds = gridBounds;
      let isValid = false;
      let invalidBlocks: Array<{ shapeRow: number; shapeCol: number }> = [];

      if (dragState.selectedShape) {
        // Find the grid element if we don't have it cached
        if (!gridRef.current) {
          gridRef.current = document.querySelector('.grid');
        }

        if (gridRef.current) {
          const gridElement = gridRef.current as HTMLElement;
          const rect = gridElement.getBoundingClientRect();

          // Update bounds if needed
          if (!bounds) {
            bounds = {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            };
          }

          // Use precomputed offsets from dragState (required)
          const offsets = dragState.dragOffsets;
          if (!offsets) {
            // No offsets means SELECT_SHAPE didn't properly calculate them
            console.error('dragOffsets not available - this indicates a logic error in SELECT_SHAPE');
            return;
          }

          // Use stored tile size and touch offset
          tileSize = offsets.tileSize;

          // Calculate grid location with precomputed offsets
          location = mousePositionToGridLocation(
            e.clientX,
            e.clientY,
            gridElement,
            { rows: 10, columns: 10 },
            offsets.touchOffset,
            dragState.selectedShape,
            {
              gridOffsetX: offsets.gridOffsetX,
              gridOffsetY: offsets.gridOffsetY,
              tileSize: offsets.tileSize,
              gridGap: offsets.gridGap,
            }
          );

          // Validate placement when we have a location
          if (location) {
            // Always calculate validation - the location might be the same but we need to ensure
            // invalidBlocks is properly calculated for any location (including out of bounds)
            isValid = isValidPlacement(dragState.selectedShape, location, tiles);
            invalidBlocks = getInvalidBlocks(dragState.selectedShape, location, tiles);
          }
        }
      }

      // Always dispatch position updates to keep mousePosition current
      dispatch({
        type: 'UPDATE_MOUSE_LOCATION',
        value: {
          location,
          position,
          tileSize,
          gridBounds: bounds,
          isValid,
          invalidBlocks,
        },
      });
    };

    // Track pointer movement globally
    document.addEventListener('pointermove', handlePointerMove);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      gridRef.current = null;
    };
  }, [dispatch, dragState.selectedShape, dragState.dragOffsets, dragState.hoveredBlockPositions, dragState.isValidPlacement, dragState.invalidBlockPositions, dragState.phase, gridTileSize, gridBounds, tiles]);

  // Global pointerup handler - consolidates all placement/return logic
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      // Only handle if a shape is being dragged
      if (!dragState.selectedShape) return;

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
        console.error('dragOffsets not available - this indicates a logic error in SELECT_SHAPE');
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
        return;
      }

      // Use precomputed offsets for grid location calculation
      const location = mousePositionToGridLocation(
        e.clientX,
        e.clientY,
        gridElement,
        { rows: 10, columns: 10 },
        offsets.touchOffset,
        dragState.selectedShape,
        {
          gridOffsetX: offsets.gridOffsetX,
          gridOffsetY: offsets.gridOffsetY,
          tileSize: offsets.tileSize,
          gridGap: offsets.gridGap,
        }
      );

      // If location is null or placement is invalid, return the shape
      if (location === null || !isValidPlacement(dragState.selectedShape, location, tiles)) {
        playSound('invalid_placement');
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
        return;
      }

      // Valid placement - place the shape
      dispatch({
        type: 'PLACE_SHAPE',
        value: {
          location,
          mousePosition: { x: e.clientX, y: e.clientY },
        },
      });
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [dispatch, dragState.selectedShape, dragState.dragOffsets, tiles, playSound]);

  return (
    <div className="App">
      <Header onShowTutorial={() => setShowTutorial(true)} />
      <div className="game-container">
        {gameState === 'playing' ? (
          <Tetrix />
        ) : (
          <GameMap />
        )}
      </div>
      <FullScreenFloatingActionButton />
      {showTutorial && (
        <TutorialOverlay
          onClose={() => setShowTutorial(false)}
          onStartPlaying={triggerAutoplay}
        />
      )}
      <DebugEditor />
      <DraggingShape />
      <ToastOverlay />
    </div>
  );
};

export default App;

/**
 * A "shape" consists of a 4x4 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */