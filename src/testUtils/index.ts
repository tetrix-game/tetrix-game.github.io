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
      __testUtils: Record<string, unknown>;
    }).__testUtils = {
      initializeGridDimensions,
      placePieceAtRow,
      placePieceAtColumn,
      placePieceAt,
      placeShapeAtIndex,
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
          gameMode: state?.gameMode ?? 'unknown',
          gameState: state?.gameState ?? 'unknown',
          gridTileSize: state?.gridTileSize,
          gridBounds: state?.gridBounds,
        };
      },
    };
  }
}

/**
 * Initialize grid dimensions for testing
 * This is required before placing shapes programmatically
 */
function initializeGridDimensions(): void {
  if (!dispatchRef) throw new Error('Test utils not initialized');

  // Get actual grid element dimensions if available
  const gridElement = document.querySelector('[data-testid="game-board"]');
  if (gridElement) {
    const rect = gridElement.getBoundingClientRect();
    const GRID_GAP = 2;
    const GRID_GAPS_TOTAL = 9 * GRID_GAP;
    const tileSize = (rect.width - GRID_GAPS_TOTAL) / 10;

    dispatchRef({
      type: 'UPDATE_MOUSE_LOCATION',
      value: {
        location: { row: 5, column: 5 },
        position: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        tileSize,
        gridBounds: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        isValid: true,
        invalidBlocks: [],
      },
    });
  } else {
    // Fallback: use default values
    dispatchRef({
      type: 'UPDATE_MOUSE_LOCATION',
      value: {
        location: { row: 5, column: 5 },
        position: { x: 400, y: 300 },
        tileSize: 50,
        gridBounds: {
          top: 100,
          left: 100,
          width: 590,
          height: 590,
        },
        isValid: true,
        invalidBlocks: [],
      },
    });
  }
}

/**
 * Place the first available shape in the queue at the specified row
 * @param rowIndex - Row index (1-10)
 * @param columnIndex - Starting column index (default: 1)
 */
async function placePieceAtRow(rowIndex: number, columnIndex = 1): Promise<void> {
  if (!dispatchRef || !getStateRef) throw new Error('Test utils not initialized');

  const initialState = getStateRef();

  // Initialize grid dimensions if not already set
  if (!initialState.gridTileSize || !initialState.gridBounds) {
    initializeGridDimensions();
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Ensure we have shapes in the queue
  if (initialState.nextShapes.length === 0) {
    const shape = generateIPiece('blue');
    dispatchRef({
      type: 'INITIALIZE_QUEUE',
      value: {
        items: [{
          id: Date.now(),
          shape,
          type: 'shape',
        }],
      },
    });
    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Find the first actual shape (not a purchasable slot)
  const state = getStateRef();
  const firstShapeIndex = state.nextShapes.findIndex((item) => item.type === 'shape');
  if (firstShapeIndex === -1) {
    throw new Error('No shapes available in queue');
  }

  // Set shape bounds for all items (required for SELECT_SHAPE to work)
  for (let i = 0; i < state.nextShapes.length; i++) {
    dispatchRef({
      type: 'SET_SHAPE_OPTION_BOUNDS',
      value: {
        index: i,
        bounds: { top: 0, left: 0, width: 100, height: 100 },
      },
    });
  }

  // Select the first shape
  dispatchRef({
    type: 'SELECT_SHAPE',
    value: {
      shapeIndex: firstShapeIndex,
    },
  });

  // Wait for selection to complete
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Place the shape at target location
  dispatchRef({
    type: 'PLACE_SHAPE',
    value: {
      location: { row: rowIndex, column: columnIndex },
      mousePosition: { x: 0, y: 0 },
    },
  });

  // Wait for placement to be validated
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Complete placement (triggers line clearing and game over check)
  dispatchRef({
    type: 'COMPLETE_PLACEMENT',
  });

  // Wait for animations and state updates
  await new Promise((resolve) => setTimeout(resolve, 300));
}

/**
 * Place the first available shape in the queue at the specified column
 * @param columnIndex - Column index (1-10)
 * @param rowIndex - Starting row index (default: 1)
 */
async function placePieceAtColumn(columnIndex: number, rowIndex = 1): Promise<void> {
  if (!dispatchRef || !getStateRef) throw new Error('Test utils not initialized');

  const initialState = getStateRef();

  // Initialize grid dimensions if not already set
  if (!initialState.gridTileSize || !initialState.gridBounds) {
    initializeGridDimensions();
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Ensure we have shapes in the queue
  if (initialState.nextShapes.length === 0) {
    const shape = generateIPiece('blue');
    dispatchRef({
      type: 'INITIALIZE_QUEUE',
      value: {
        items: [{
          id: Date.now(),
          shape,
          type: 'shape',
        }],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Find the first actual shape (not a purchasable slot)
  const state = getStateRef();
  const firstShapeIndex = state.nextShapes.findIndex((item) => item.type === 'shape');
  if (firstShapeIndex === -1) {
    throw new Error('No shapes available in queue');
  }

  // Set shape bounds for all items
  for (let i = 0; i < state.nextShapes.length; i++) {
    dispatchRef({
      type: 'SET_SHAPE_OPTION_BOUNDS',
      value: {
        index: i,
        bounds: { top: 0, left: 0, width: 100, height: 100 },
      },
    });
  }

  // Select the first shape
  dispatchRef({
    type: 'SELECT_SHAPE',
    value: {
      shapeIndex: firstShapeIndex,
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  // Place the shape at target location
  dispatchRef({
    type: 'PLACE_SHAPE',
    value: {
      location: { row: rowIndex, column: columnIndex },
      mousePosition: { x: 0, y: 0 },
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  // Complete placement
  dispatchRef({
    type: 'COMPLETE_PLACEMENT',
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
}

/**
 * Place the first available shape in the queue at a specific row and column
 * @param row - Row index (1-10)
 * @param column - Column index (1-10)
 */
async function placePieceAt(row: number, column: number): Promise<void> {
  if (!dispatchRef || !getStateRef) throw new Error('Test utils not initialized');

  const initialState = getStateRef();

  // Initialize grid dimensions if not already set
  if (!initialState.gridTileSize || !initialState.gridBounds) {
    initializeGridDimensions();
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Ensure we have shapes in the queue
  if (initialState.nextShapes.length === 0) {
    const shape = generateIPiece('blue');
    dispatchRef({
      type: 'INITIALIZE_QUEUE',
      value: {
        items: [{
          id: Date.now(),
          shape,
          type: 'shape',
        }],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Find the first actual shape (not a purchasable slot)
  const state = getStateRef();
  const firstShapeIndex = state.nextShapes.findIndex((item) => item.type === 'shape');
  if (firstShapeIndex === -1) {
    throw new Error('No shapes available in queue');
  }

  // Set shape bounds for all items
  for (let i = 0; i < state.nextShapes.length; i++) {
    dispatchRef({
      type: 'SET_SHAPE_OPTION_BOUNDS',
      value: {
        index: i,
        bounds: { top: 0, left: 0, width: 100, height: 100 },
      },
    });
  }

  // Select the first shape
  dispatchRef({
    type: 'SELECT_SHAPE',
    value: {
      shapeIndex: firstShapeIndex,
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  // Place the shape at target location
  dispatchRef({
    type: 'PLACE_SHAPE',
    value: {
      location: { row, column },
      mousePosition: { x: 0, y: 0 },
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  // Complete placement
  dispatchRef({
    type: 'COMPLETE_PLACEMENT',
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
}

/**
 * Place a shape from the queue at a specific index to a specific location
 * @param shapeIndex - Index in the queue (0-based)
 * @param row - Row index (1-10)
 * @param column - Column index (1-10)
 */
async function placeShapeAtIndex(shapeIndex: number, row: number, column: number): Promise<void> {
  if (!dispatchRef || !getStateRef) throw new Error('Test utils not initialized');

  const state = getStateRef();

  // Initialize grid dimensions if not already set
  if (!state.gridTileSize || !state.gridBounds) {
    initializeGridDimensions();
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Validate shape index
  if (shapeIndex < 0 || shapeIndex >= state.nextShapes.length) {
    throw new Error(`Invalid shape index: ${shapeIndex}. Queue has ${state.nextShapes.length} items.`);
  }

  // Verify it's a shape (not a purchasable slot)
  const item = state.nextShapes[shapeIndex];
  if (item.type !== 'shape') {
    throw new Error(`Item at index ${shapeIndex} is not a shape (type: ${item.type})`);
  }

  // Set shape bounds for all items
  for (let i = 0; i < state.nextShapes.length; i++) {
    dispatchRef({
      type: 'SET_SHAPE_OPTION_BOUNDS',
      value: {
        index: i,
        bounds: { top: 0, left: 0, width: 100, height: 100 },
      },
    });
  }

  // Select the specified shape
  dispatchRef({
    type: 'SELECT_SHAPE',
    value: {
      shapeIndex,
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  // Place the shape at target location
  dispatchRef({
    type: 'PLACE_SHAPE',
    value: {
      location: { row, column },
      mousePosition: { x: 0, y: 0 },
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  // Complete placement
  dispatchRef({
    type: 'COMPLETE_PLACEMENT',
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
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

/**
 * Set the board to a specific state (for E2E testing)
 * @param filledPositions Array of {row, column} positions to fill
 */
function setBoardState(filledPositions: Array<{ row: number; column: number }>): void {
  if (!dispatchRef || !getStateRef) throw new Error('Test utils not initialized');

  const state = getStateRef();
  const tiles = new Map(state.tiles);

  // Clear all tiles first
  tiles.forEach((tile, key) => {
    tiles.set(key, {
      ...tile,
      block: { isFilled: false, color: 'grey' },
    });
  });

  // Fill specified positions
  filledPositions.forEach(({ row, column }) => {
    const key = `R${row}C${column}`;
    const tile = tiles.get(key);
    if (tile) {
      tiles.set(key, {
        ...tile,
        block: { isFilled: true, color: 'blue' },
      });
    }
  });

  // Dispatch a custom action to set the tiles (we'll use LOAD_GAME_STATE)
  // Or we can directly manipulate state (not ideal but works for testing)
  // For now, let's dispatch SET_TILES which should exist
  // Actually, let's use the approach of dispatching PLACE_SHAPE events

  // Instead, let's just directly modify the internal state for testing
  // This is a hack but necessary for E2E testing
  const currentState = getStateRef();
  (currentState as TetrixReducerState & { tiles: typeof tiles }).tiles = tiles;
}

// Facade export
export const testUtils = {
  initializeTestUtils,
  initializeGridDimensions,
  placePieceAtRow,
  placePieceAtColumn,
  placePieceAt,
  placeShapeAtIndex,
  fillBoard,
  getScore,
  getBoardClearCount,
  clearBoard,
  setBoardState,
};
