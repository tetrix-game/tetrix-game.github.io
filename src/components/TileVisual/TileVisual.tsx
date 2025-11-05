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

  // Display hovered block during drag preview, otherwise display actual tile block
  const displayBlock = (isHovered && hoveredBlock) ? {
    ...hoveredBlock,
    isFilled: true,
  } : tile.block;

  // Apply 20% opacity if hovering but placement is invalid
  const shouldDimBlock = isHovered && !isValidPlacement;

  return (
    <div style={style(tile.location.row, tile.location.column)}>
      <BlockVisual block={displayBlock} opacity={shouldDimBlock ? 0.2 : 1} />
    </div>
  )
}

export default React.memo(TileVisual);