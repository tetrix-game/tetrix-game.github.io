import './Grid.css'
import TileVisual from '../TileVisual';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useRef, useEffect, useMemo } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';
import { useDebugGridInteractions } from '../../hooks/useDebugGridInteractions';
import { GRID_SIZE } from '../../utils/gridConstants';
import { useGridEditor } from '../GridEditor/GridEditorContext';

interface GridProps {
  width?: number; // Grid width in tiles (default: GRID_SIZE)
  height?: number; // Grid height in tiles (default: GRID_SIZE)
}

export default function Grid({ width = GRID_SIZE, height = GRID_SIZE }: GridProps) {
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

  // Determine which tiles to render and grid dimensions based on grid editor state
  const { gridLayout, isEditorOpen, selectedColor } = gridEditorState;
  const gridWidth = isEditorOpen && gridLayout ? gridLayout.width : width;
  const gridHeight = isEditorOpen && gridLayout ? gridLayout.height : height;

  // Generate all potential tile positions in the grid
  const allPositions = useMemo(() => {
    const positions: string[] = [];
    for (let row = 1; row <= gridHeight; row++) {
      for (let col = 1; col <= gridWidth; col++) {
        positions.push(`R${row}C${col}`);
      }
    }
    return positions;
  }, [gridWidth, gridHeight]);

  return (
    <div
      ref={gridRef}
      className={`grid ${dragState.selectedShape ? 'grid-dragging' : ''} ${isEditorOpen ? 'grid-editor-mode' : ''}`}
      style={
        {
          '--grid-gap': `${gridGap}px`,
          '--grid-size': `${gridSize}px`,
          gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
          gridTemplateRows: `repeat(${gridHeight}, 1fr)`,
        } as React.CSSProperties
      }
    >
      {
        allPositions.map((position) => {
          const tileEntity = tiles.get(position);
          
          // In editor mode or for empty spaces, create default tile
          const defaultBlock = { isFilled: false, color: 'grey' as const };
          const backgroundColor = tileEntity?.backgroundColor || 'grey';
          const block = tileEntity ? tileEntity.block : defaultBlock;
          
          // Parse position to location
          const match = position.match(/R(\d+)C(\d+)/);
          if (!match) {
            console.error(`Invalid position format: ${position}`);
            return null;
          }
          const row = parseInt(match[1]);
          const column = parseInt(match[2]);
          
          // Get tile background color from editor if in editor mode
          const editorTileBackground = isEditorOpen ? gridLayout.tileBackgrounds.get(position) : undefined;
          
          const tile: Tile = {
            id: `(row: ${row}, column: ${column})`,
            location: { row, column },
            block,
            tileBackgroundColor: editorTileBackground || backgroundColor,
          };

          const posKey = `${row},${column}`;
          const hoveredBlock = hoveredBlockMap.get(posKey);
          const isHovered = hoveredBlock?.isFilled ?? false;
          
          // In grid editor mode, check if this tile exists in the layout and pass color
          const tileExistsInLayout = isEditorOpen ? gridLayout.tiles.has(position) : true;
          const editorColor = isEditorOpen && tileExistsInLayout && selectedColor !== 'eraser' ? selectedColor : undefined;

          return (
            <TileVisual
              key={position}
              tile={tile}
              isHovered={isHovered}
              hoveredBlock={hoveredBlock}
              onClick={isDebugMode ? () => handleDebugClick(tile.location) : undefined}
              size={gridCellSize}
              editorColor={editorColor}
              isEditorMode={isEditorOpen}
              tileExists={tileExistsInLayout}
              tileBackgroundColor={tile.tileBackgroundColor}
            />
          )
        })
      }
    </div >
  )
}
