import Header from './components/Header';
import Tetrix from './components/Tetrix';
import FullScreenFloatingActionButton from './components/FullScreenButton';
import ScoreNotification from './components/ScoreNotification';
import './App.css';

const App = () => {
  return (
    <div className="App">
      <Header />
      <Tetrix />
      <FullScreenFloatingActionButton />
      <ScoreNotification />
    </div>
  )
}

export default App;

/**
 * A "shape" consists of a 3X3 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */