import './Tetrix.css';
import Grid from '../Grid';
import GameControlsPanel from '../GameControlsPanel';
import GemShower from '../GemShower';
import GameOverOverlay from '../GameOverOverlay';
import { useTetrixStateContext } from './TetrixContext';

const Tetrix: React.FC = () => {
  const { gameState, isStatsOpen } = useTetrixStateContext();

  // Only render when in playing or gameover state
  if (gameState !== 'playing' && gameState !== 'gameover') {
    return null;
  }

  return (
    <div className="tetrix">
      <Grid />
      <GameControlsPanel />
      <GemShower />
      {gameState === 'gameover' && !isStatsOpen && <GameOverOverlay />}
    </div>
  )
}

export default Tetrix;