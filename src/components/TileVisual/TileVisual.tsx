import './TileVisual.css';
import type { Tile, Block } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import React from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';

type TileVisualProps = {
  tile: Tile;
  isHovered?: boolean;
  hoveredBlock?: Block;
}

const TileVisual = ({ tile, isHovered = false, hoveredBlock }: TileVisualProps) => {
  const { isValidPlacement } = useTetrixStateContext();

  // Fixed border width for consistent grid sizing
  // Grid is 400px, with 10 tiles and 9 gaps of 2px = 38.2px per tile
  const FIXED_GRID_SIZE = 400;
  const GRID_GAP = 2;
  const GRID_GAPS_TOTAL = 9 * GRID_GAP;
  const FIXED_TILE_SIZE = (FIXED_GRID_SIZE - GRID_GAPS_TOTAL) / 10;
  const FIXED_BORDER_WIDTH = FIXED_TILE_SIZE / 2;

  const style = (row: number, column: number) => {
    const dark = (row + column) % 2 === 0;
    return {
      gridColumn: column,
      gridRow: row,
      backgroundColor: dark ? "rgb(59, 59, 62)" : "rgb(40, 40, 50)",
      borderRadius: '5px',
      zIndex: 1,
      position: 'relative' as const,
    }
  }

  // Always display the actual tile block
  const displayBlock = tile.block;

  // Show a shadow overlay when hovering
  const showShadow = isHovered && hoveredBlock;

  // Calculate shadow opacity: 50% for valid placement, 20% for invalid
  let shadowOpacity = 0;
  if (showShadow) {
    shadowOpacity = isValidPlacement ? 0.5 : 0.2;
  }

  return (
    <div style={style(tile.location.row, tile.location.column)}>
      <BlockVisual block={displayBlock} borderWidth={FIXED_BORDER_WIDTH} />
      {showShadow && (
        <div
          className="tile-visual-shadow"
          style={{
            opacity: shadowOpacity,
          }}
        />
      )}
    </div>
  )
}

export default React.memo(TileVisual);