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

  const style = (row: number, column: number) => {
    const dark = (row + column) % 2 === 0;
    return {
      gridColumn: column,
      gridRow: row,
      backgroundColor: dark ? "rgb(59, 59, 62)" : "rgb(40, 40, 50)",
      borderRadius: '5px',
      zIndex: 1,
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
      <BlockVisual block={displayBlock} />
      {showShadow && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'black',
            opacity: shadowOpacity,
            pointerEvents: 'none',
            borderRadius: '3px',
          }}
        />
      )}
    </div>
  )
}

export default React.memo(TileVisual);