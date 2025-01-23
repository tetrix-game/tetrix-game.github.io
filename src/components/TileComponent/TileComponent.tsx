import './TileComponent.css';
import type { Tile } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import React, { useCallback } from 'react';

type TileComponentProps = {
  tile: Tile;
  dispatch: React.Dispatch<{ type: string; value: Tile }>;
}

const TileComponent = ({ tile, dispatch }: TileComponentProps) => {
  if (tile.location.column === 1 && tile.location.row === 1) {
    console.log('block:', tile.block)
  }

  const style = (row: number, column: number) => {
    const dark = (row + column) % 2 === 0;
    return {
      gridColumn: column,
      gridRow: row,
      backgroundColor: dark ? "rgb(30, 30, 40)" : "rgb(40, 40, 60)",
      borderRadius: '5px',
      zIndex: 1,
    }
  }

  const onClick = useCallback(() => {
    const isFilled = tile.block.isFilled;
    const index = (tile.location.row - 1) * 10 + tile.location.column - 1;
    dispatch({ type: "TOGGLE_BLOCK", value: { isFilled, index } })
  }, [dispatch, tile])

  return (
    <div onClick={onClick} style={style(tile.location.row, tile.location.column)}>
      <BlockVisual block={tile.block} />
    </div>
  )
}

export default React.memo(TileComponent);