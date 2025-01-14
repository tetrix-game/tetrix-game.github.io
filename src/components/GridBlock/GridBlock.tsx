import './GridBlock.css';

type Block = {
  row: number;
  column: number;
  color: string | undefined;
}

type GridBlockProps = {
  block: Block;
}

const GridBlock = ({ block }: GridBlockProps) => {

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
    <div style={style(block.row, block.column)}></div>
  )
}

export type { Block };
export default GridBlock;