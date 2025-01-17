import './Grid.css'
import Tile from '../Tile';
import type { Block } from '../../utils/shape';

type GridProps = {
  tiles: Array<Block>;
}



const Grid = ({ tiles }: GridProps) => {

  return (
    <div className="grid">
      {
        tiles.map((block: Block, index) => {
          return (
            <Tile key={index} block={block} />
          )
        })
      }
    </div >
  )
}

export default Grid;
