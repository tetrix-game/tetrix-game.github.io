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

const featureIdeas = {
  save: "saving a game to local storage",
  optimization: "representing each shape in only one orientation and a rotate function for random rotations",
  shapeSaver: "a way to save a shape for later",
  pickup: {
    animation: "the shape moves from the queue to the grid, changing size",
    sound: "swoop to accompany the animation",
  },
  drag: {
    snap: "The dragged shape is made of blocks that snap to the grid",
    sound: "dragging sound",
  },
  gameOver: {
    requirement: "No shape can be placed from any of the three slots or from the saved shape slot, no matter the orientation",
  },
}

export default App;