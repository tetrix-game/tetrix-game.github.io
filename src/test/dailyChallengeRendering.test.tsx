/**
 * Tests for daily challenge grid rendering
 * 
 * In daily challenge mode, only tiles that exist in the tiles Map should be rendered.
 * Out-of-bounds areas (missing tiles) should not render at all.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import Grid from '../components/Grid/Grid';
import { TetrixStoreContext } from '../components/Tetrix/TetrixContext';
import type { TetrixReducerState, TetrixDispatch } from '../types';
import { initialState } from '../reducers';

// Mock useDebugGridInteractions
vi.mock('../hooks/useDebugGridInteractions', () => ({
  useDebugGridInteractions: () => ({
    isDebugMode: false,
    handleDebugClick: vi.fn(),
  }),
}));

// Mock useGameSizing
vi.mock('../hooks/useGameSizing', () => ({
  useGameSizing: () => ({
    gridSize: 300,
    gridCellSize: 30,
    gridGap: 2,
    gameControlsButtonSize: 40,
  }),
}));

// Mock TetrixTile to avoid animation loops and simplify testing
vi.mock('../components/TetrixTile/TetrixTile', () => ({
  default: ({ location, backgroundColor }: any) => (
    <div 
      data-testid="tetrix-tile" 
      data-row={location.row}
      data-col={location.column}
      data-bgcolor={backgroundColor}
    />
  )
}));

describe('Daily Challenge Grid Rendering', () => {
  const mockDispatch: TetrixDispatch = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should render all tiles in infinite mode', () => {
    // Create state for infinite mode with standard 10x10 grid
    const state: TetrixReducerState = {
      ...initialState,
      gameMode: 'infinite',
      tiles: new Map(), // Empty map means no tiles have data, but grid positions exist
    };

    const mockStore = {
      getState: () => state,
      subscribe: () => () => {},
      dispatch: mockDispatch
    };

    render(
      <TetrixStoreContext.Provider value={mockStore}>
          <Grid width={10} height={10} />
      </TetrixStoreContext.Provider>
    );

    // Should render 100 tiles (10x10 grid)
    const tiles = screen.getAllByTestId('tetrix-tile');
    expect(tiles).toHaveLength(100);
  });

  it('should only render existing tiles in daily challenge mode', () => {
    // Create state for daily challenge with partial grid
    // Only include center 4 tiles: R5C5, R5C6, R6C5, R6C6
    const partialTiles = new Map();
    ['R5C5', 'R5C6', 'R6C5', 'R6C6'].forEach(position => {
      partialTiles.set(position, {
        position,
        backgroundColor: 'blue' as const,
        block: { isFilled: false, color: 'grey' as const },
        activeAnimations: []
      });
    });

    const state: TetrixReducerState = {
      ...initialState,
      gameMode: 'daily',
      tiles: partialTiles,
    };

    const mockStore = {
      getState: () => state,
      subscribe: () => () => {},
      dispatch: mockDispatch
    };

    render(
      <TetrixStoreContext.Provider value={mockStore}>
          <Grid width={10} height={10} />
      </TetrixStoreContext.Provider>
    );

    // Should only render 4 tiles (the ones in the tiles Map)
    const tiles = screen.getAllByTestId('tetrix-tile');
    expect(tiles).toHaveLength(4);
    
    // Verify specific tile properties
    const tile = tiles[0];
    expect(tile).toHaveAttribute('data-bgcolor', 'blue');
  });

  it('should not render gray tiles for missing positions in daily challenge', () => {
    // Create a diamond-shaped grid for daily challenge
    const diamondTiles = new Map();
    const positions = [
      'R3C5', 'R3C6', // Top row
      'R4C4', 'R4C5', 'R4C6', 'R4C7', // Second row
      'R5C3', 'R5C4', 'R5C5', 'R5C6', 'R5C7', 'R5C8', // Middle row
      'R6C4', 'R6C5', 'R6C6', 'R6C7', // Second to last row
      'R7C5', 'R7C6', // Bottom row
    ];
    
    positions.forEach(position => {
      diamondTiles.set(position, {
        position,
        backgroundColor: 'red' as const,
        block: { isFilled: false, color: 'grey' as const },
        activeAnimations: []
      });
    });

    const state: TetrixReducerState = {
      ...initialState,
      gameMode: 'daily',
      tiles: diamondTiles,
    };

    const mockStore = {
      getState: () => state,
      subscribe: () => () => {},
      dispatch: mockDispatch
    };

    render(
      <TetrixStoreContext.Provider value={mockStore}>
          <Grid width={10} height={10} />
      </TetrixStoreContext.Provider>
    );

    // Should only render diamond tiles (18 total)
    const tiles = screen.getAllByTestId('tetrix-tile');
    expect(tiles).toHaveLength(18);
  });
});
