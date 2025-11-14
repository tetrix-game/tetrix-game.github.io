import Header from './components/Header';
import Tetrix from './components/Tetrix';
import GameMap from './components/GameMap';
import FullScreenFloatingActionButton from './components/FullScreenButton';
import TutorialOverlay from './components/TutorialOverlay';
import DebugEditor from './components/DebugEditor';
import DraggingShape from './components/DraggingShape';
import { useTetrixStateContext, useTetrixDispatchContext } from './components/Tetrix/TetrixContext';
import { useState, useEffect, useRef } from 'react';
import { mousePositionToGridLocation, isValidPlacement } from './utils/shapeUtils';
import './App.css';

const App = () => {
  const { gameState, selectedShape, gridTileSize, gridBounds, tiles } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
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

      // Only calculate grid location if a shape is selected and grid is available
      let location = null;
      let tileSize = gridTileSize;
      let bounds = gridBounds;
      let isValid = false;

      if (selectedShape) {
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

          // Calculate tile size if needed
          if (!tileSize) {
            tileSize = rect.width / 10; // 10x10 grid
          }

          // Calculate mobile touch offset (same as DraggingShape)
          const isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
          const MOBILE_TOUCH_OFFSET = isTouchDevice ? tileSize * 2.5 : 0;

          // Calculate grid location with mobile offset
          location = mousePositionToGridLocation(
            e.clientX,
            e.clientY,
            gridElement,
            { rows: 10, columns: 10 },
            MOBILE_TOUCH_OFFSET
          );

          // Validate placement if location is within grid
          if (location) {
            isValid = isValidPlacement(selectedShape, location, tiles);
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
        },
      });
    };

    // Track pointer movement globally
    document.addEventListener('pointermove', handlePointerMove);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      gridRef.current = null;
    };
  }, [dispatch, selectedShape, gridTileSize, gridBounds, tiles]);

  // Global pointerup handler - consolidates all placement/return logic
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      // Only handle if a shape is being dragged
      if (!selectedShape) return;

      const target = e.target as HTMLElement;

      console.log('[DEBUG] pointerup event:', {
        clientX: e.clientX,
        clientY: e.clientY,
        targetClass: target.className,
      });

      // Get current grid element for validation
      if (!gridRef.current) {
        gridRef.current = document.querySelector('.grid');
      }

      const gridElement = gridRef.current as HTMLElement;
      if (!gridElement) {
        console.log('[DEBUG] No grid element - returning shape');
        // No grid available - return shape
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
        return;
      }

      // Calculate if pointer is over the grid
      const rect = gridElement.getBoundingClientRect();

      // Calculate mobile touch offset (same as DraggingShape)
      const isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
      const tileSize = rect.width / 10;
      const MOBILE_TOUCH_OFFSET = isTouchDevice ? tileSize * 2.5 : 0;

      console.log('[DEBUG] Grid check:', {
        isTouchDevice,
        MOBILE_TOUCH_OFFSET,
        rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
        pointer: { x: e.clientX, y: e.clientY },
      });

      // Over grid - check if valid placement using adjusted position

      const location = mousePositionToGridLocation(
        e.clientX,
        e.clientY,
        gridElement,
        { rows: 10, columns: 10 },
        MOBILE_TOUCH_OFFSET
      );

      console.log('[DEBUG] Calculated location:', location);

      if (location === null) {
        console.log('[DEBUG] Not over grid - returning shape');
      } else if (!isValidPlacement(selectedShape, location, tiles)) {
        console.log('[DEBUG] Invalid placement - returning shape', { location, hasSelectedShape: !!selectedShape });
        // Invalid placement - return shape
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
        return;
      }

      console.log('[DEBUG] Valid placement - placing shape at', location);
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
  }, [dispatch, selectedShape, tiles]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  return (
    <div className="App">
      <Header />
      {gameState === 'map' ? (
        <GameMap />
      ) : (
        <Tetrix />
      )}
      <DraggingShape />
      <FullScreenFloatingActionButton />
      {showTutorial && <TutorialOverlay onClose={handleCloseTutorial} />}
      <DebugEditor />
    </div>
  )
}

export default App;

/**
 * A "shape" consists of a 4x4 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */