import Header from './components/Header';
import Tetrix from './components/Tetrix';
import GameMap from './components/GameMap';
import FullScreenFloatingActionButton from './components/FullScreenButton';
import DebugEditor from './components/DebugEditor';
import GridEditor from './components/GridEditor';
import DraggingShape from './components/DraggingShape';
import ToastOverlay from './components/ToastOverlay';
import ColorOverrideApplier from './components/ColorPicker/ColorOverrideApplier';
import { PersistenceListener } from './components/PersistenceListener/PersistenceListener';
import { useTetrixStateContext, useTetrixDispatchContext } from './components/Tetrix/TetrixContext';
import { useSoundEffects } from './components/SoundEffectsContext';
import { useEffect, useRef } from 'react';
import { mousePositionToGridLocation, isValidPlacement, getInvalidBlocks } from './utils/shapeUtils';
import { BLOCK_COLOR_PALETTES, blockPaletteToCssVars } from './utils/colorUtils';
import { GRID_SIZE } from './utils/gridConstants';
import './App.css';

const App = () => {
  const { gameState, gameMode, dragState, gridTileSize, gridBounds, tiles, currentTheme } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const { playSound } = useSoundEffects();
  const gridRef = useRef<HTMLElement | null>(null);

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
            { rows: GRID_SIZE, columns: GRID_SIZE },
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
            isValid = isValidPlacement(dragState.selectedShape, location, tiles, gameMode);
            invalidBlocks = getInvalidBlocks(dragState.selectedShape, location, tiles, gameMode);
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
        { rows: GRID_SIZE, columns: GRID_SIZE },
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
      if (location === null || !isValidPlacement(dragState.selectedShape, location, tiles, gameMode)) {
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

  // Apply comprehensive theme colors via CSS custom properties
  const themeDefinitions = {
    dark: {
      background: 'rgb(25, 25, 25)',
      gameBackground: 'rgb(25, 25, 25)',
      text: 'rgb(200, 200, 200)',
      textSecondary: 'rgb(150, 150, 150)',
      gridBg: 'rgb(10, 10, 10)',
      tileBg: 'rgb(30, 30, 30)',
      tileBorder: 'rgb(50, 50, 50)',
      headerBg: 'rgb(25, 25, 25)',
      headerBorder: 'rgba(255, 255, 255, 0.1)',
      shapeSelectorBg: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 50%, rgba(240, 147, 251, 0.2) 100%)',
      shapeSelectorBorder: 'rgba(255, 255, 255, 0.3)',
      overlayBg: 'rgba(0, 0, 0, 0.85)',
      buttonBg: 'rgba(255, 255, 255, 0.1)',
      buttonHover: 'rgba(255, 255, 255, 0.2)',
    },
    light: {
      background: 'rgb(245, 245, 245)',
      gameBackground: 'rgb(235, 235, 235)',
      text: 'rgb(20, 20, 20)',
      textSecondary: 'rgb(100, 100, 100)',
      gridBg: 'rgb(220, 220, 220)',
      tileBg: 'rgb(255, 255, 255)',
      tileBorder: 'rgb(200, 200, 200)',
      headerBg: 'rgb(255, 255, 255)',
      headerBorder: 'rgba(0, 0, 0, 0.1)',
      shapeSelectorBg: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(240, 147, 251, 0.15) 100%)',
      shapeSelectorBorder: 'rgba(0, 0, 0, 0.2)',
      overlayBg: 'linear-gradient(135deg, rgba(245, 245, 245, 0.98) 0%, rgba(235, 235, 235, 0.98) 100%)',
      buttonBg: 'rgba(0, 0, 0, 0.05)',
      buttonHover: 'rgba(0, 0, 0, 0.1)',
    },
    'block-blast': {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      gameBackground: 'rgba(0, 0, 0, 0.15)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      gridBg: 'rgba(255, 255, 255, 0.1)',
      tileBg: 'rgba(255, 255, 255, 0.05)',
      tileBorder: 'rgba(255, 255, 255, 0.2)',
      headerBg: 'rgba(255, 255, 255, 0.1)',
      headerBorder: 'rgba(255, 255, 255, 0.2)',
      shapeSelectorBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)',
      shapeSelectorBorder: 'rgba(255, 255, 255, 0.4)',
      overlayBg: 'rgba(102, 126, 234, 0.95)',
      buttonBg: 'rgba(255, 255, 255, 0.15)',
      buttonHover: 'rgba(255, 255, 255, 0.25)',
    },
  };

  const theme = themeDefinitions[currentTheme];
  const blockColors = blockPaletteToCssVars(BLOCK_COLOR_PALETTES[currentTheme]);
  const themeStyle = {
    background: theme.background,
    color: theme.text,
    '--theme-text': theme.text,
    '--theme-text-secondary': theme.textSecondary,
    '--theme-game-bg': theme.gameBackground,
    '--theme-grid-bg': theme.gridBg,
    '--theme-tile-bg': theme.tileBg,
    '--theme-tile-border': theme.tileBorder,
    '--theme-header-bg': theme.headerBg,
    '--theme-header-border': theme.headerBorder,
    '--theme-shape-selector-bg': theme.shapeSelectorBg,
    '--theme-shape-selector-border': theme.shapeSelectorBorder,
    '--theme-overlay-bg': theme.overlayBg,
    '--theme-button-bg': theme.buttonBg,
    '--theme-button-hover': theme.buttonHover,
    '--theme-animation-color': currentTheme === 'light' ? 'rgba(100, 100, 100, 0.55)' : 'rgba(255, 255, 255, 0.55)',
    ...blockColors, // Apply theme-specific block colors
  } as React.CSSProperties & Record<string, string>;

  return (
    <div className="App" style={themeStyle}>
      <PersistenceListener />
      <ColorOverrideApplier />

      <Header />
      <div className="game-container">
        {gameState === 'playing' || gameState === 'gameover' ? (
          <Tetrix />
        ) : (
          <GameMap />
        )}
      </div>
      <FullScreenFloatingActionButton />

      <DebugEditor />
      <GridEditor />
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