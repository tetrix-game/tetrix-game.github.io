import './TileVisual.css';
import type { Tile } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import React, { useCallback } from 'react';
import { useTetrixDispatchContext } from '../Tetrix/TetrixContext';

type TileVisualProps = {
  tile: Tile;
}

const TileVisual = ({ tile }: TileVisualProps) => {
  const dispatch = useTetrixDispatchContext();

  const style = (row: number, column: number) => {
    const dark = (row + column) % 2 === 0;
    return {
      gridColumn: column,
      gridRow: row,
      backgroundColor: dark ? "rgb(69, 69, 108)" : "rgb(40, 40, 60)",
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

export default React.memo(TileVisual);