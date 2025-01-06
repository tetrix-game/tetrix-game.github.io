import React, { useCallback } from 'react'
import { useState } from 'react'
import './App.css'
import Tetrix from './Tetrix'
import useShapeSet from './useShapeSet'
import { cloneDeep } from 'lodash'
import UpNext from './UpNext'

const VALID_PLACEMENT = 3;

const PLACEMENT_MULTIPLIER = 24;
const PLACEMENT_OFFSET = 12;

const COLORS = {
  WHITE: '255, 255, 255',
}

export type COLOR_VALUES = typeof COLORS[keyof typeof COLORS];

const shouldBeVertical = window.innerWidth > window.innerHeight;
const gameCss = () => {
  return {
    display: 'flex',
    position: 'relative',
    flexDirection: shouldBeVertical ? 'row' : 'column',
    justifyContent: 'space-around',
    alignItems: 'space-around',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'whiteSmoke',
  }
}

const upNextCss = {
  display: 'flex',
  flexDirection: shouldBeVertical ? 'column' : 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  width: shouldBeVertical ? '20vw' : '100vw',
  height: shouldBeVertical ? '80vh' : '40vh',
  backgroundColor: 'lightblue'
}

type Board = { filled: number, color: COLOR_VALUES }[];
type shapePlaces = 'first' | 'second' | 'third';

const TurnShapeButton = ({ turnShape, focusedShape, shapes, setPoints }: { turnShape: (shapePlace: string, setPoints: (points: number) => void) => void, focusedShape: string | null, setPoints: (points: number) => void }) => {
  console.log('shapes', shapes)

  return (
    <button
      onClick={() => {
        if (focusedShape) {
          turnShape(focusedShape, setPoints);
        }
      }}
      disabled={!focusedShape}
      style={{ margin: '20px', padding: '10px', fontSize: '16px' }}
    >
      Turn {shapes?.[focusedShape]?.hasBeenRotated ? 'FREE!!' : '-10'}
    </button>
  );
};

export default function App() {
  const [points, setPoints] = useState(0)
  const [board, setBoard] = React.useState<Board>(new Array(64).fill({ filled: 0, color: COLORS.WHITE }));
  const [focusedShape, setFocusedShape] = React.useState<shapePlaces | null>('first');
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const placementDebounce = React.useRef<number>(Date.now());

  const shapeFitsSomewhere = React.useCallback((shape: boolean[][]) => {
    if (!shape) return false;
    // loop through every block on the board as the starting point for a potential spot for the shape
    // If any of them return true, return true
    for (let i = 0; i < 64; i++) {
      if (shapeCanBePlaced({ board, shape, index: i })) {
        return true;
      }
    }
    return false;
  }, [board])

  const { shapes, shapes: { first, second, third }, takeShape, peekShape, turnShape } = useShapeSet({ shapeFits: shapeFitsSomewhere });

  const placeShape = useCallback((e): void => {
    if (focusedShape === null) return;

    let x;
    let y;
    if (e.touches) {
      x = Math.max(0, Math.min(7, e.changedTouches[0].clientX / window.innerWidth * PLACEMENT_MULTIPLIER - PLACEMENT_OFFSET));
      y = Math.max(0, Math.min(7, e.changedTouches[0].clientY / window.innerHeight * PLACEMENT_MULTIPLIER - PLACEMENT_OFFSET));
    } else {
      x = e.clientX / window.innerWidth * 8;
      y = e.clientY / window.innerHeight * 8;
    }

    const index = Math.floor(y) * 8 + Math.floor(x);
    const shapeToUse = peekShape(focusedShape);
    if (!shapeCanBePlaced({ board, shape: shapeToUse?.shape, index })) return;
    takeShape(focusedShape);
    setFocusedShape(null);
    setBoard((prev) => {
      if (!shapeToUse) return prev;
      const { shape: shapeArr, color } = shapeToUse;
      let newBoard = cloneDeep(board);
      for (let i = 0; i < shapeArr.length; i++) {
        for (let j = 0; j < shapeArr[i].length; j++) {
          if (shapeArr[i][j]) {
            newBoard[index + i * 8 + j].filled = 2;
            newBoard[index + i * 8 + j].color = color;
          }
        }
      }
      newBoard = clearLines({
        board: newBoard, setPoints: (newPoints) => {
          setPoints(newPoints);
        }
      });

      placementDebounce.current = Date.now();
      return newBoard;
    });
  }, [board, focusedShape, takeShape, peekShape, points]);

  const hoverShape = useCallback((e): void => {
    if (focusedShape === null) return;

    let x;
    let y;
    if (e.touches) {
      x = Math.max(0, Math.min(7, e.touches[0].clientX / window.innerWidth * PLACEMENT_MULTIPLIER - PLACEMENT_OFFSET));
      y = Math.max(0, Math.min(7, e.touches[0].clientY / window.innerHeight * PLACEMENT_MULTIPLIER - PLACEMENT_OFFSET))
    } else {
      x = e.clientX / window.innerWidth * 8;
      y = e.clientY / window.innerHeight * 8;
    }
    const index = Math.floor(y) * 8 + Math.floor(x);
    if (index === focusedIndex) return;
    else setFocusedIndex(index);

    setBoard((prev: Board) => {
      const newBoard = prev.map(block => block.filled === 1 || block.filled === 3 ? { ...block, filled: 0, color: COLORS.WHITE } : block);
      const hoverTarget = peekShape(focusedShape);
      if (hoverTarget === null) return;

      let fill = 0;
      if (shapeCanBePlaced({ board: newBoard, shape: hoverTarget.shape, index })) {
        fill = VALID_PLACEMENT;
      } else {
        fill = 1;
      }
      for (let i = 0; i < hoverTarget.shape.length; i++) {
        for (let j = 0; j < hoverTarget.shape[i].length; j++) {
          const negative = index + i * 8 + j < 0;
          const overflowY = index + i * 8 + j > 63
          const overflowX = index % 8 + j >= 8
          if (negative || overflowY || overflowX) continue;
          if (hoverTarget.shape[i][j] && newBoard[index + i * 8 + j].filled !== 2) {
            newBoard[index + i * 8 + j].filled = fill;
            newBoard[index + i * 8 + j].color = hoverTarget.color;
          }
        }
      }
      return newBoard;
    })
  }, [focusedShape, peekShape, focusedIndex]);

  React.useEffect(() => {
    const timeout = setTimeout(() => checkForGameOver(), 100);
    // Check that at least one of the remaining shapes can be placed, if not, game over
    // If all shapes are null, just wait for the state to update
    const checkForGameOver = () => {
      let gameOver = true;

      if (first && shapeFitsSomewhere(first.shape)) gameOver = false;
      else if (second && shapeFitsSomewhere(second.shape)) gameOver = false;
      else if (third && shapeFitsSomewhere(third.shape)) gameOver = false;

      if (gameOver) {
        alert(`Game Over! You scored ${points} points!`);
        setBoard(new Array(64).fill({ filled: 0, color: COLORS.WHITE }));
        setPoints(0);
        takeShape('first');
        takeShape('second');
        takeShape('third');
      }
    }

    return () => clearTimeout(timeout);
  }, [first, second, third, shapeFitsSomewhere, points]);


  return (
    <div
      style={gameCss()}

      // Mobile controls
      onTouchMove={hoverShape}      // Shows preview while dragging
      onTouchEnd={placeShape}       // Places shape when touch ends

      // PC controls
      onClick={placeShape}
      onMouseMove={hoverShape}
    >
      <Tetrix board={board} />
      <PointsDisplay points={points} />
      <TurnShapeButton shapes={shapes} turnShape={turnShape} focusedShape={focusedShape} setPoints={setPoints} />
      <div style={upNextCss} >
        <UpNext setFocusedShape={setFocusedShape} focusedShape={focusedShape} shapePlace={'first'} shape={first} />
        <UpNext setFocusedShape={setFocusedShape} focusedShape={focusedShape} shapePlace={'second'} shape={second} />
        <UpNext setFocusedShape={setFocusedShape} focusedShape={focusedShape} shapePlace={'third'} shape={third} />
      </div>
    </div>
  )
}

function shapeCanBePlaced({ board, shape, index }: { board: Board, shape: boolean[][] | undefined, index: number }): boolean {
  if (shape === undefined) return false;
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      const shapeSquareIsFilled = shape[i][j];

      const indexValue = index + i * 8 + j;
      if (indexValue < 0 || indexValue > 63) return false;

      const boardSquareIsFilled = board[indexValue].filled === 2;
      const overlap = shapeSquareIsFilled && boardSquareIsFilled;
      const boardSquareIsInXBounds = index % 8 + j < 8 && index % 8 + j >= 0;
      const boardSquareIsInYBounds = Math.floor(index / 8) + i < 8 && Math.floor(index / 8) + i >= 0;
      if (!boardSquareIsInXBounds || !boardSquareIsInYBounds || overlap) {
        return false;
      }
    }
  }
  return true;
}

function clearLines({ board, setPoints }: { board: Board, setPoints: (points: number) => void }) {
  const newBoard = cloneDeep(board);

  const rowIsFull = (index: number) => {
    for (let i = 0; i < 8; i++) {
      if (board[index * 8 + i].filled !== 2) return false;
    }
    return true;
  }

  const columnIsFull = (index: number) => {
    for (let i = 0; i < 8; i++) {
      if (board[index + i * 8].filled !== 2) return false;
    }
    return true;
  }

  let rowCells = 0;
  let columnCells = 0;
  const blockIndexesToClear = [];

  // Count the number of cells that need to be cleared in each row and column
  for (let i = 0; i < 64; i++) {
    if (rowIsFull(Math.floor(i / 8))) {
      rowCells++;
      blockIndexesToClear.push(i);
    }
    if (columnIsFull(i % 8)) {
      columnCells++;
      blockIndexesToClear.push(i);
    }
  }

  if (rowCells === 0 && columnCells === 0) return newBoard; // noOp

  // Count the points
  // Each block is worth 1 point multiplied by the number of rows cleared (if it was a part of a cleared row) multiplied by the number of columns cleared (if it was a part of a cleared column)
  // If the block was a part of an intersection of a row and column, it is counted as a minimum of 2 points
  const columnsCleared = columnCells / 8;
  const rowsCleared = rowCells / 8;

  let points = 0;
  // Clear the blocks by index and count their points
  blockIndexesToClear.forEach((index) => {
    newBoard[index].filled = 0;
    newBoard[index].color = COLORS.WHITE;
    if (columnIsFull(index % 8) && rowIsFull(Math.floor(index / 8))) {
      points += Math.max(2, rowsCleared * columnsCleared);
    } else if (columnIsFull(index % 8)) {
      points += columnsCleared;
    } else if (rowIsFull(Math.floor(index / 8))) {
      points += rowsCleared;
    }
  });

  setPoints((prev) => prev + points);
  return newBoard;
}

function PointsDisplay({ points, recentPoints }: { points: number, addedPoints: number }) {
  const timeout = React.useRef<number | null>(Date.now());

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <h1>Points: {Math.floor(points)}{recentPoints ? ` (+${recentPoints})` : ''}</h1>
    </div>
  );
};