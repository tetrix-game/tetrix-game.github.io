import './Tile.css';
import type { Block } from '../../utils/shape';
import BlockVisual from '../BlockVisual';

type TileProps = {
  block: Block;
  row: number;
  column: number;
}

const Tile = ({ block, row, column }: TileProps) => {

  const style = (row: number, column: number) => {
    const dark = (row + column) % 2 === 0;
    return {
      gridColumn: column,
      gridRow: row,
      backgroundColor: dark ? "rgb(30, 30, 40)" : "rgb(40, 40, 60)",
      borderRadius: '5px'
    }
  }
  return (
    <div style={style(row, column)}>
      <BlockVisual block={block} />
    </div>
  )
}

export default Tile;