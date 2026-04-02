/**
 * Testing Utilities for Tetrix Game
 *
 * Provides programmatic APIs for testing game mechanics without relying on
 * drag-and-drop interactions. These utilities expose methods on window.testUtils
 * that can be called from Playwright tests.
 */

import { generateIPiece } from '../shapeGeneration';
import type { TetrixAction, TetrixReducerState } from '../types';

let dispatchRef: ((action: TetrixAction) => void) | null = null;
let getStateRef: (() => TetrixReducerState) | null = null;

/**
 * Initialize test utilities with dispatch and getState functions
 */
export function initializeTestUtils(
  dispatch: (action: TetrixAction) => void,
  getState: () => TetrixReducerState,
): void {
  dispatchRef = dispatch;
  getStateRef = getState;

  // Expose test utilities on window for Playwright access
  if (typeof window !== 'undefined') {
    (window as unknown as {
      testUtils: Record<string, unknown>;
    }).testUtils = {
      placePieceAtRow,
      placePieceAtColumn,
      placePieceAt,
      fillBoard,
      getScore,
      getBoardClearCount,
      clearBoard,
      dispatch: dispatchRef,
      getState: getStateRef,
      // Debug helper to inspect state
      debugState: (): Record<string, unknown> => {
        const state = getStateRef?.();
        return {
          nextShapesCount: state?.nextShapes?.length ?? 0,
          score: state?.score ?? 0,
          boardClearCount: state?.stats?.current?.fullBoardClears?.total ?? 0,
          dragPhase: state?.dragState?.phase ?? 'unknown',
          selectedShapeIndex: state?.dragState?.selectedShapeIndex,
          hasSelectedShape: !!state?.dragState?.selectedShape,
        };
      },
    };
  }
}

/**
 * Place an I-piece horizontally at the specified row
 * @param rowIndex - Row index (1-10)
 */
async function placePieceAtRow(rowIndex: number): Promise<void> {
  if (!dispatchRef || !getStateRef) throw new Error('Test utils not initialized');

  const shape = generateIPiece('blue');

  // Step 0: Ensure shape exists in queue (initialize if needed)
  const state = getStateRef();
  if (state.nextShapes.length === 0) {
    dispatchRef({
      type: 'INITIALIZE_QUEUE',
      value: {
        items: [{
          id: 0,
          shape,
          type: 'shape',
        }],
      },
    });
  }

  // Step 1: Set shape bounds (required for SELECT_SHAPE to work)
  dispatchRef({
    type: 'SET_SHAPE_OPTION_BOUNDS',
    value: {
      index: 0,
      bounds: { top: 0, left: 0, width: 100, height: 100 },
    },
  });

  // Step 2: Select the shape (simulate picking it up)
  dispatchRef({
    type: 'SELECT_SHAPE',
    value: {
      shapeIndex: 0,
    },
  });

  // Step 3: Place the shape at target location
  dispatchRef({
    type: 'PLACE_SHAPE',
    value: {
      location: { row: rowIndex, column: 1 },
      mousePosition: { x: 0, y: 0 },
    },
  });

  // Step 4: Complete placement (triggers line clearing)
  dispatchRef({
    type: 'COMPLETE_PLACEMENT',
  });

  // Wait for animations
  await new Promise((resolve) => setTimeout(resolve, 200));
}

/**
 * Place an I-piece vertically at the specified column
 * @param columnIndex - Column index (1-10)
 */
async function placePieceAtColumn(columnIndex: number): Promise<void> {
  if (!dispatchRef || !getStateRef) throw new Error('Test utils not initialized');

  const shape = generateIPiece('blue');

  // Step 0: Ensure shape exists in queue (initialize if needed)
  const state = getStateRef();
  if (state.nextShapes.length === 0) {
    dispatchRef({
      type: 'INITIALIZE_QUEUE',
      value: {
        items: [{
          id: 0,
          shape,
          type: 'shape',
        }],
      },
    });
  }

  // Step 1: Set shape bounds (required for SELECT_SHAPE to work)
  dispatchRef({
    type: 'SET_SHAPE_OPTION_BOUNDS',
    value: {
      index: 0,
      bounds: { top: 0, left: 0, width: 100, height: 100 },
    },
  });

  dispatchRef({
    type: 'SELECT_SHAPE',
    value: {
      shapeIndex: 0,
    },
  });

  dispatchRef({
    type: 'PLACE_SHAPE',
    value: {
      location: { row: 1, column: columnIndex },
      mousePosition: { x: 0, y: 0 },
    },
  });

  dispatchRef({
    type: 'COMPLETE_PLACEMENT',
  });

  await new Promise((resolve) => setTimeout(resolve, 200));
}

/**
 * Place an I-piece at a specific row and column
 * @param row - Row index (1-10)
 * @param column - Column index (1-10)
 */
async function placePieceAt(row: number, column: number): Promise<void> {
  if (!dispatchRef || !getStateRef) throw new Error('Test utils not initialized');

  const shape = generateIPiece('blue');

  // Step 0: Ensure shape exists in queue (initialize if needed)
  const state = getStateRef();
  if (state.nextShapes.length === 0) {
    dispatchRef({
      type: 'INITIALIZE_QUEUE',
      value: {
        items: [{
          id: 0,
          shape,
          type: 'shape',
        }],
      },
    });
  }

  // Step 1: Set shape bounds (required for SELECT_SHAPE to work)
  dispatchRef({
    type: 'SET_SHAPE_OPTION_BOUNDS',
    value: {
      index: 0,
      bounds: { top: 0, left: 0, width: 100, height: 100 },
    },
  });

  dispatchRef({
    type: 'SELECT_SHAPE',
    value: {
      shapeIndex: 0,
    },
  });

  dispatchRef({
    type: 'PLACE_SHAPE',
    value: {
      location: { row, column },
      mousePosition: { x: 0, y: 0 },
    },
  });

  dispatchRef({
    type: 'COMPLETE_PLACEMENT',
  });

  await new Promise((resolve) => setTimeout(resolve, 200));
}

/**
 * Fill the entire board with I-pieces (triggers board clear)
 */
async function fillBoard(): Promise<void> {
  // Place 10 horizontal I-pieces to fill all rows
  for (let row = 1; row <= 10; row++) {
    await placePieceAtRow(row);
  }

  // Wait for board clear animation
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

/**
 * Get the current score
 */
function getScore(): number {
  if (!getStateRef) throw new Error('Test utils not initialized');
  return getStateRef().score;
}

/**
 * Get the current board clear count
 */
function getBoardClearCount(): number {
  if (!getStateRef) throw new Error('Test utils not initialized');
  const stats = getStateRef().stats;
  return stats?.current?.fullBoardClears?.total ?? 0;
}

/**
 * Clear the board (reset game state)
 */
function clearBoard(): void {
  if (!dispatchRef) throw new Error('Test utils not initialized');
  dispatchRef({ type: 'RESET_GAME' });
}

// Facade export
export const testUtils = {
  initializeTestUtils,
  placePieceAtRow,
  placePieceAtColumn,
  placePieceAt,
  fillBoard,
  getScore,
  getBoardClearCount,
  clearBoard,
};
