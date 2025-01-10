import { useState } from 'react';
import Header from './components/Header';
import Tetrix from './components/Tetrix';
import FullScreenFloatingActionButton from './components/FullScreenButton';
import './App.css';

const App = () => {
  const [score, dispatch] = useState(0);
  return (
    <div className="App">
      <Header score={score} />
      <Tetrix />
      <FullScreenFloatingActionButton />
    </div>
  )
}

const featureIdeas = Array<string>(
  "saving a game to local storage",
  "goodies in the block of a shape randomly",
  "Higher levels of give higher points (level 2 => 2X points, level 3 => 3X points, etc)",
  "representing each shape in only one orientation and a rotate function for random rotations",
  "different levels of difficulty that progress until the game is not helping the player at all",
  "a way to save a shape for later",
  "10 X 10 Tetrix",
  "Placing a shape, the shape hovers with the bottom a set distance from the drag point",
  "Placing a shape, calculate if the shape is in a valid poisition, and if it will clear rows",
  "Play a sound when a shape clicks into a possible position",
  "Play a sound when a shape goes from a possible position to an impossible position",
  "Game over doesn't run unless no shapes can be turned to fit",
  "background sounds like 'take shape, 'place shape', 'clear shape', rotate shape', 'level up', 'game over', etc",
  "background music",
  "Animated background",
  "Animated popups",
  "Animaged Shape Placement",
  "A reducer to handle the entire app's state, and a context to provide the state and all possible actions to all components in the entire app",
  "High score tap leads to best all time scores"
)

export default App;