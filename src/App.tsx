import Header from './components/Header';
import Tetrix from './components/Tetrix';
import GameMap from './components/GameMap';
import FullScreenFloatingActionButton from './components/FullScreenButton';
import TutorialOverlay from './components/TutorialOverlay';
import { useTetrixStateContext } from './components/Tetrix/TetrixContext';
import { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const { gameState } = useTetrixStateContext();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check if user has seen the tutorial before
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  return (
    <div className="App">
      <Header />
      {gameState === 'map' ? (
        <GameMap />
      ) : (
        <Tetrix />
      )}
      <FullScreenFloatingActionButton />
      {showTutorial && <TutorialOverlay onClose={handleCloseTutorial} />}
    </div>
  )
}

export default App;

/**
 * A "shape" consists of a 4x4 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */