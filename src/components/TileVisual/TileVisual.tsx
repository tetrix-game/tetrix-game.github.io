import './TileVisual.css';
import type { Tile, Block } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import React, { useCallback } from 'react';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';

type TileVisualProps = {
  tile: Tile;
  isHovered?: boolean;
  hoveredBlock?: Block;
}

const TileVisual = ({ tile, isHovered = false, hoveredBlock }: TileVisualProps) => {
  const dispatch = useTetrixDispatchContext();
  const { isShapeDragging, placementAnimationState } = useTetrixStateContext();

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

  const onClick = useCallback(() => {
    // Only allow toggling when not dragging a shape
    if (isShapeDragging) return;

    const isFilled = tile.block.isFilled;
    const index = (tile.location.row - 1) * 10 + tile.location.column - 1;
    dispatch({ type: "TOGGLE_BLOCK", value: { isFilled, index } })
  }, [dispatch, tile, isShapeDragging])

  // Hide hovered blocks during normal dragging and animation - only show during settling
  const shouldShowHoveredBlock = isHovered && hoveredBlock && placementAnimationState === 'settling';
  const isSettling = placementAnimationState === 'settling';

  // Display hovered block if in settling phase, otherwise display actual tile block
  const displayBlock = shouldShowHoveredBlock ? {
    ...hoveredBlock,
    isFilled: true,
  } : tile.block;

  return (
    <div onClick={onClick} style={style(tile.location.row, tile.location.column)}>
      <BlockVisual block={displayBlock} isHovered={shouldShowHoveredBlock} isSettling={isSettling} />
    </div>
  )
}

export default React.memo(TileVisual);