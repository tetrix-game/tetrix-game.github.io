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
  const { placementAnimationState } = useTetrixStateContext();

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

  // Show hovered blocks ONLY during settling phase (not during animating)
  // DraggingShape handles the visual during animating phase
  // During settling, blocks start at 50% and grow to 100%
  const shouldShowHoveredBlock = isHovered && hoveredBlock && placementAnimationState === 'settling';
  const isSettling = placementAnimationState === 'settling';

  // Display hovered block during settling phase, otherwise display actual tile block
  const displayBlock = shouldShowHoveredBlock ? {
    ...hoveredBlock,
    isFilled: true,
  } : tile.block;

  return (
    <div style={style(tile.location.row, tile.location.column)}>
      <BlockVisual block={displayBlock} isHovered={shouldShowHoveredBlock} isSettling={isSettling} />
    </div>
  )
}

export default React.memo(TileVisual);