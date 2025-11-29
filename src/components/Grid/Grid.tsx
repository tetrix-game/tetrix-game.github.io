import './Grid.css'
import TileVisual from '../TileVisual';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useRef, useEffect, useMemo } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';
import { useDebugGridInteractions } from '../../hooks/useDebugGridInteractions';
import { GRID_ADDRESSES, GRID_SIZE, parseTileKey } from '../../utils/gridConstants';
import { useGridEditor } from '../GridEditor/GridEditorContext';

export default function Grid() {
  const { tiles, dragState } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const gridRef = useRef<HTMLDivElement>(null);
  const { gridSize, gridGap, gridCellSize } = useGameSizing();
  const { isDebugMode, handleDebugClick } = useDebugGridInteractions();
  const { state: gridEditorState } = useGridEditor();

  // Periodically clean up expired animations
  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch({ type: 'CLEANUP_ANIMATIONS' });
    }, 1000); // Cleanup every second

    return () => clearInterval(intervalId);
  }, [dispatch]);

  // Handle escape key to cancel selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle escape if debug editor is open
      if (e.key === 'Escape' && dragState.selectedShape && !isDebugMode) {
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dragState.selectedShape, dispatch, isDebugMode]);

  // Create a map of hovered block positions for quick lookup
  const hoveredBlockMap = new Map(
    dragState.hoveredBlockPositions.map(pos => [
      `${pos.location.row},${pos.location.column}`,
      pos.block
    ])
  );

  // Determine which tiles to render based on grid editor state
  const { gridLayout, isEditorOpen, selectedColor } = gridEditorState;
  const tilesToRender = useMemo(() => {
    // If grid editor is open, render all potential tiles up to the current dimensions
    if (isEditorOpen && gridLayout) {
      const allTiles: string[] = [];
      for (let row = 1; row <= gridLayout.height; row++) {
        for (let col = 1; col <= gridLayout.width; col++) {
          allTiles.push(`R${row}C${col}`);
        }
      }
      return allTiles;
    }
    // Otherwise render all standard grid tiles
    return GRID_ADDRESSES;
  }, [isEditorOpen, gridLayout]);

  // Determine grid dimensions
  const gridWidth = isEditorOpen && gridLayout ? gridLayout.width : GRID_SIZE;
  const gridHeight = isEditorOpen && gridLayout ? gridLayout.height : GRID_SIZE;
  const aspectRatio = gridWidth / gridHeight;

  return (
    <div
      ref={gridRef}
      className={`grid ${dragState.selectedShape ? 'grid-dragging' : ''} ${isEditorOpen ? 'grid-editor-mode' : ''}`}
      style={{
        '--grid-gap': `${gridGap}px`,
        '--grid-size': `${gridSize}px`,
        '--grid-aspect-ratio': aspectRatio,
        gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
        gridTemplateRows: `repeat(${gridHeight}, 1fr)`,
      } as React.CSSProperties}
    >
      {
        tilesToRender.map((key) => {
          const tileData = tiles.get(key);
          if (!tileData) {
            console.error(`Missing tile data for key: ${key}`);
            return null;
          }

          const { row, column } = parseTileKey(key);
          const tile: Tile = {
            id: `(row: ${row}, column: ${column})`,
            location: { row, column },
            block: { isFilled: tileData.isFilled, color: tileData.color },
          };

          const posKey = `${row},${column}`;
          const hoveredBlock = hoveredBlockMap.get(posKey);
          const isHovered = hoveredBlock?.isFilled ?? false;
          
          // In grid editor mode, check if this tile exists in the layout and pass color
          const tileExistsInLayout = isEditorOpen ? gridLayout.tiles.has(key) : true;
          const editorColor = isEditorOpen && tileExistsInLayout && selectedColor !== 'eraser' ? selectedColor : undefined;

          return (
            <TileVisual
              key={key}
              tile={tile}
              isHovered={isHovered}
              hoveredBlock={hoveredBlock}
              onClick={isDebugMode ? () => handleDebugClick(tile.location) : undefined}
              size={gridCellSize}
              editorColor={editorColor}
              isEditorMode={isEditorOpen}
              tileExists={tileExistsInLayout}
            />
          )
        })
      }
    </div >
  )
}
