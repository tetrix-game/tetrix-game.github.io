import './Tetrix.css'
import GridBlock from './GridBlock';
import type { Block } from './GridBlock';

type GridProps = {
  gridBlocks: Array<Block>;
}



const Grid = ({ gridBlocks }: GridProps) => {

  return (
    <div className="grid">
      {
        gridBlocks.map((block: Block, index) => {
          return (
            <GridBlock key={index} block={block} />
          )
        })
      }
    </div >
  )
}

export default Grid;
