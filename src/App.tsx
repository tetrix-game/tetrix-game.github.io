import { useState } from 'react';
import Header from './components/Header';
import Tetrix from './components/Tetrix';
import FullScreenFloatingActionButton from './components/FullScreenButton';
import './App.css';

const App = () => {
  const [score, setScore] = useState(0);
  return (
    <div className="App">
      <Header score={score} />
      <Tetrix setScore={setScore} />
      <FullScreenFloatingActionButton />
    </div>
  )
}

export default App;

/**
 * A "shape" consists of a 3X3 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */