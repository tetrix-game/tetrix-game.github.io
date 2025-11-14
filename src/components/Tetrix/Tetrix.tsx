import './Tetrix.css';
import Grid from '../Grid';
import GameControlsPanel from '../GameControlsPanel';
import GemShower from '../GemShower';
import { useTetrixStateContext } from './TetrixContext';

const Tetrix: React.FC = () => {
  const { gameState } = useTetrixStateContext();

  // Only render when in playing state
  if (gameState !== 'playing') {
    return null;
  }

  return (
    <div className="tetrix">
      <Grid />
      <GameControlsPanel />
      <GemShower />
    </div>
  )
}

export default Tetrix;