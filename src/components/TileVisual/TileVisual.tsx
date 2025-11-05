import './TileVisual.css';
import type { Tile, Block } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import React from 'react';

type TileVisualProps = {
  tile: Tile;
  isHovered?: boolean;
  hoveredBlock?: Block;
}

const TileVisual = ({ tile, isHovered = false, hoveredBlock }: TileVisualProps) => {
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

  return (
    <div style={style(tile.location.row, tile.location.column)}>
      <BlockVisual block={displayBlock} />
    </div>
  )
}

export default React.memo(TileVisual);