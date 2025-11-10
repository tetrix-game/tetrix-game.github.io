import Header from './components/Header';
import Tetrix from './components/Tetrix';
import GameMap from './components/GameMap';
import FullScreenFloatingActionButton from './components/FullScreenButton';
import { useTetrixStateContext } from './components/Tetrix/TetrixContext';
import './App.css';

const App = () => {
  const { gameState } = useTetrixStateContext();

  return (
    <div className="App">
      <Header />
      {gameState === 'map' ? (
        <GameMap />
      ) : (
        <Tetrix />
      )}
      <FullScreenFloatingActionButton />
    </div>
  )
}

export default App;

/**
 * A "shape" consists of a 4x4 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */