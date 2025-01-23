import './Grid.css'
import TileComponent from '../TileComponent';
import type { Tile } from '../../utils/types';

type GridProps = {
  tiles: Tile[];
  dispatch: React.Dispatch<{ type: string; value: Tile }>;
}

const Grid = ({ tiles, dispatch }: GridProps) => {

  return (
    <div className="grid">
      {
        tiles.map((tile: Tile, index) => {
          return (
            <TileComponent key={index} tile={tile} dispatch={dispatch} />
          )
        })
      }
    </div >
  )
}

export default Grid;
