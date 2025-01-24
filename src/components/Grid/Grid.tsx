import './Grid.css'
import TileVisual from '../TileVisual';
import type { Tile } from '../../utils/types';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';

export default function Grid() {
  const { tiles } = useTetrixStateContext()

  return (
    <div className="grid">
      {
        tiles.map((tile: Tile) => {
          return (
            <TileVisual key={tile.id} tile={tile} />
          )
        })
      }
    </div >
  )
}
