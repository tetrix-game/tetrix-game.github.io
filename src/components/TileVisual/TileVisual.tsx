import './TileVisual.css';
import type { Tile, Block } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import React from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';

type TileVisualProps = {
  tile: Tile;
  isHovered?: boolean;
  hoveredBlock?: Block;
  onClick?: () => void;
}

const TileVisual = ({ tile, isHovered = false, hoveredBlock, onClick }: TileVisualProps) => {
  const { isValidPlacement } = useTetrixStateContext();

  // Fixed border width for consistent grid sizing
  // Always display the actual tile block
  const displayBlock = tile.block;

  // Show a shadow overlay when hovering
  const showShadow = isHovered && hoveredBlock;

  // Determine tile variant (dark vs light)
  const dark = (tile.location.row + tile.location.column) % 2 === 0;
  const tileClass = `tile-visual ${dark ? 'tile-visual-dark' : 'tile-visual-light'}`;

  // Calculate shadow opacity: 50% for valid placement, 20% for invalid
  let shadowOpacity = 0;
  if (showShadow) {
    shadowOpacity = isValidPlacement ? 0.5 : 0.2;
  }

  return (
    <div
      className={tileClass}
      style={{
        gridColumn: tile.location.column,
        gridRow: tile.location.row,
      }}
      onClick={onClick}
    >
      <BlockVisual block={displayBlock} />
      {showShadow && (
        <div
          className="tile-visual-shadow"
          style={{
            '--shadow-opacity': shadowOpacity,
          } as React.CSSProperties}
        />
      )}
    </div>
  )
}

export default React.memo(TileVisual);