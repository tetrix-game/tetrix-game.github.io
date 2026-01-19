/**
 * Tests for no-turn streak tracking
 * 
 * Verifies that:
 * 1. Streak increments when shapes are placed without rotation
 * 2. Streak resets when a shape is rotated
 * 3. Best-in-game and all-time-best are properly tracked
 * 4. Reset game preserves all-time best but resets current and best-in-game
 */

import { describe, it, expect } from 'vitest';
import { tetrixReducer, initialState } from '../reducers';
import { generateRandomShape } from '../utils/shapes';
import { incrementNoTurnStreak } from '../utils/statsUtils';
import type { TetrixReducerState, QueuedShape, Shape } from '../types';

// Helper functions to create QueuedShapes for tests
let testShapeIdCounter = 5000;
const createQueuedShape = (shape: Shape): QueuedShape => ({
  id: testShapeIdCounter++,
  shape,
});
const createQueuedShapes = (shapes: Shape[]): QueuedShape[] =>
  shapes.map(shape => createQueuedShape(shape));

// Helper function to set up a state ready for shape placement
function setupStateWithShape(shape: ReturnType<typeof generateRandomShape>, location: { row: number; column: number }) {
  return {
    ...initialState,
    gameMode: 'infinite' as const, // Must be infinite for stats to work
    nextShapes: createQueuedShapes([shape]),
    openRotationMenus: [false],
    dragState: {
      ...initialState.dragState,
      selectedShape: shape,
      selectedShapeIndex: 0,
      phase: 'dragging' as const,
    },
    mouseGridLocation: location,
    mousePosition: { x: 100, y: 100 },
    gridTileSize: 20,
    gridBounds: { top: 50, left: 50, width: 200, height: 200 },
  };
}

// Helper function to place and complete a shape
function placeShape(state: TetrixReducerState, location: { row: number; column: number }): TetrixReducerState {
  const stateAfterPlace = tetrixReducer(state, {
    type: 'PLACE_SHAPE',
    value: {
      location,
      mousePosition: { x: 100, y: 100 },
    },
  });

  return tetrixReducer(stateAfterPlace, { type: 'COMPLETE_PLACEMENT' });
}

describe('No-Turn Streak Tracking', () => {
  it('should have noTurnStreak in initial state', () => {
    expect(initialState.stats.noTurnStreak).toBeDefined();
    expect(initialState.stats.noTurnStreak.current).toBe(0);
    expect(initialState.stats.noTurnStreak.bestInGame).toBe(0);
    expect(initialState.stats.noTurnStreak.allTimeBest).toBe(0);
  });

  it('should increment noTurnStreak directly', () => {
    const stats = initialState.stats;
    const incrementedStats = incrementNoTurnStreak(stats);
    expect(incrementedStats.noTurnStreak.current).toBe(1);
    expect(incrementedStats.noTurnStreak.bestInGame).toBe(1);
    expect(incrementedStats.noTurnStreak.allTimeBest).toBe(1);
  });

  it('should have valid placement state before completing placement', () => {
    const shape = generateRandomShape();
    let state: TetrixReducerState = {
      ...initialState,
      gameMode: 'infinite' as const, // Must be infinite for stats to work
      nextShapes: createQueuedShapes([shape]),
      openRotationMenus: [false],
      shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }], // Add bounds for SELECT_SHAPE to work
      gridTileSize: 20,
      gridBounds: { top: 50, left: 50, width: 200, height: 200 },
    };

    // Select shape
    state = tetrixReducer(state, {
      type: 'SELECT_SHAPE',
      value: { shapeIndex: 0 },
    });
    expect(state.dragState.selectedShape).toBeDefined();
    expect(state.dragState.selectedShapeIndex).toBe(0);

    // Place shape at location (5, 5)
    state = tetrixReducer(state, {
      type: 'UPDATE_MOUSE_LOCATION',
      value: {
        location: { row: 5, column: 5 },
        position: { x: 100, y: 100 },
        isValid: true,
      },
    });

    state = tetrixReducer(state, {
      type: 'PLACE_SHAPE',
      value: {
        location: { row: 5, column: 5 },
        mousePosition: { x: 100, y: 100 },
      },
    });

    // Check the state right before COMPLETE_PLACEMENT
    expect(state.dragState.placementLocation).toEqual({ row: 5, column: 5 });
    expect(state.stats.noTurnStreak.current).toBe(0); // Should still be 0 before completion
  });

  it('should increment streak when placing a shape without rotation', () => {
    // Setup: Initialize game with a shape at row 5, column 5
    const shape = generateRandomShape();
    const state = setupStateWithShape(shape, { row: 5, column: 5 });

    // Place and complete shape
    const newState = placeShape(state, { row: 5, column: 5 });

    // Verify streak incremented
    expect(newState.stats.noTurnStreak.current).toBe(1);
    expect(newState.stats.noTurnStreak.bestInGame).toBe(1);
    expect(newState.stats.noTurnStreak.allTimeBest).toBe(1);
  });

  it('should reset current streak when rotating a shape', () => {
    let state: TetrixReducerState = {
      ...initialState,
      gameMode: 'infinite' as const, // Must be infinite for stats to work
      shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      gridTileSize: 20,
      gridBounds: { top: 50, left: 50, width: 200, height: 200 },
    };

    // Place 2 shapes without rotating
    for (let i = 0; i < 2; i++) {
      const shape = generateRandomShape();
      state = {
        ...state,
        nextShapes: createQueuedShapes([shape]),
        openRotationMenus: [false],
        shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      };

      // Select, place, and complete
      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 },
      });

      state = tetrixReducer(state, {
        type: 'UPDATE_MOUSE_LOCATION',
        value: {
          location: { row: i + 1, column: 1 },
          position: { x: 100, y: 100 },
          isValid: true,
        },
      });

      state = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: {
          location: { row: i + 1, column: 1 },
          mousePosition: { x: 100, y: 100 },
        },
      });

      state = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });
    }

    // Verify streak incremented to 2
    expect(state.stats.noTurnStreak.current).toBe(2);
    expect(state.stats.noTurnStreak.bestInGame).toBe(2);
    expect(state.stats.noTurnStreak.allTimeBest).toBe(2);
  });

  it('should reset current streak when rotating a shape', () => {
    // Setup: Place 2 shapes to build a streak
    let state: TetrixReducerState = {
      ...initialState,
      gameMode: 'infinite' as const, // Must be infinite for stats to work
      shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      gridTileSize: 20,
      gridBounds: { top: 50, left: 50, width: 200, height: 200 },
    };

    for (let i = 0; i < 2; i++) {
      const shape = generateRandomShape();
      state = {
        ...state,
        nextShapes: createQueuedShapes([shape]),
        openRotationMenus: [false],
        shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      };

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 },
      });

      state = tetrixReducer(state, {
        type: 'UPDATE_MOUSE_LOCATION',
        value: {
          location: { row: i + 1, column: 1 },
          position: { x: 100, y: 100 },
          isValid: true,
        },
      });

      state = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: {
          location: { row: i + 1, column: 1 },
          mousePosition: { x: 100, y: 100 },
        },
      });

      state = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });
    }

    // Verify streak is at 2
    expect(state.stats.noTurnStreak.current).toBe(2);
    expect(state.stats.noTurnStreak.bestInGame).toBe(2);

    // Add a new shape and rotate it
    const shape = generateRandomShape();
    state = {
      ...state,
      nextShapes: createQueuedShapes([shape]),
      openRotationMenus: [false],
    };

    state = tetrixReducer(state, {
      type: 'ROTATE_SHAPE',
      value: { shapeIndex: 0, clockwise: true },
    });

    // Verify streak reset to 0, but bestInGame preserved
    expect(state.stats.noTurnStreak.current).toBe(0);
    expect(state.stats.noTurnStreak.bestInGame).toBe(2);
    expect(state.stats.noTurnStreak.allTimeBest).toBe(2);
  });

  it('should track best-in-game correctly across streak breaks', () => {
    let state: TetrixReducerState = {
      ...initialState,
      gameMode: 'infinite' as const, // Must be infinite for stats to work
      shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      gridTileSize: 20,
      gridBounds: { top: 50, left: 50, width: 200, height: 200 },
    };

    // Build streak to 3
    for (let i = 0; i < 3; i++) {
      const shape = generateRandomShape();
      state = {
        ...state,
        nextShapes: createQueuedShapes([shape]),
        openRotationMenus: [false],
        shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      };

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 },
      });

      state = tetrixReducer(state, {
        type: 'UPDATE_MOUSE_LOCATION',
        value: {
          location: { row: i + 1, column: 1 },
          position: { x: 100, y: 100 },
          isValid: true,
        },
      });

      state = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: {
          location: { row: i + 1, column: 1 },
          mousePosition: { x: 100, y: 100 },
        },
      });

      state = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });
    }

    expect(state.stats.noTurnStreak.bestInGame).toBe(3);

    // Break streak with rotation
    state = {
      ...state,
      nextShapes: createQueuedShapes([generateRandomShape()]),
      openRotationMenus: [false],
    };
    state = tetrixReducer(state, {
      type: 'ROTATE_SHAPE',
      value: { shapeIndex: 0, clockwise: true },
    });

    expect(state.stats.noTurnStreak.current).toBe(0);
    expect(state.stats.noTurnStreak.bestInGame).toBe(3);

    // Second streak: 2 placements (less than best)
    for (let i = 0; i < 2; i++) {
      const shape = generateRandomShape();
      state = {
        ...state,
        nextShapes: createQueuedShapes([shape]),
        openRotationMenus: [false],
        shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      };

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 },
      });

      state = tetrixReducer(state, {
        type: 'UPDATE_MOUSE_LOCATION',
        value: {
          location: { row: i + 5, column: 1 },
          position: { x: 100, y: 100 },
          isValid: true,
        },
      });

      state = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: {
          location: { row: i + 5, column: 1 },
          mousePosition: { x: 100, y: 100 },
        },
      });

      state = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });
    }

    // bestInGame should still be 3, current should be 2
    expect(state.stats.noTurnStreak.current).toBe(2);
    expect(state.stats.noTurnStreak.bestInGame).toBe(3);
  });

  it('should update all-time best when current exceeds it', () => {
    let state: TetrixReducerState = {
      ...initialState,
      gameMode: 'infinite' as const, // Must be infinite for stats to work
      shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      gridTileSize: 20,
      gridBounds: { top: 50, left: 50, width: 200, height: 200 },
      stats: {
        ...initialState.stats,
        noTurnStreak: {
          current: 0,
          bestInGame: 0,
          allTimeBest: 5, // Start with an existing all-time best
        },
      },
    };

    // Place 6 shapes to exceed all-time best
    for (let i = 0; i < 6; i++) {
      const shape = generateRandomShape();
      state = {
        ...state,
        nextShapes: createQueuedShapes([shape]),
        openRotationMenus: [false],
        shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      };

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 },
      });

      state = tetrixReducer(state, {
        type: 'UPDATE_MOUSE_LOCATION',
        value: {
          location: { row: i + 1, column: 1 },
          position: { x: 100, y: 100 },
          isValid: true,
        },
      });

      state = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: {
          location: { row: i + 1, column: 1 },
          mousePosition: { x: 100, y: 100 },
        },
      });

      state = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });
    }

    // All-time best should be updated to 6
    expect(state.stats.noTurnStreak.current).toBe(6);
    expect(state.stats.noTurnStreak.bestInGame).toBe(6);
    expect(state.stats.noTurnStreak.allTimeBest).toBe(6);
  });

  it('should reset current and bestInGame on RESET_GAME but preserve allTimeBest', () => {
    let state: TetrixReducerState = {
      ...initialState,
      gameMode: 'infinite' as const, // Must be infinite for stats to work
      stats: {
        ...initialState.stats,
        noTurnStreak: {
          current: 5,
          bestInGame: 8,
          allTimeBest: 10,
        },
      },
    };

    // Reset game
    state = tetrixReducer(state, { type: 'RESET_GAME' });

    // Current and bestInGame should be reset, allTimeBest preserved
    expect(state.stats.noTurnStreak.current).toBe(0);
    expect(state.stats.noTurnStreak.bestInGame).toBe(0);
    expect(state.stats.noTurnStreak.allTimeBest).toBe(10);
  });

  it('should handle streak across game sessions correctly', () => {
    // Simulate first game with streak of 4
    let state: TetrixReducerState = {
      ...initialState,
      gameMode: 'infinite' as const, // Must be infinite for stats to work
      shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      gridTileSize: 20,
      gridBounds: { top: 50, left: 50, width: 200, height: 200 },
    };

    for (let i = 0; i < 4; i++) {
      const shape = generateRandomShape();
      state = {
        ...state,
        nextShapes: createQueuedShapes([shape]),
        openRotationMenus: [false],
        shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      };

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 },
      });

      state = tetrixReducer(state, {
        type: 'UPDATE_MOUSE_LOCATION',
        value: {
          location: { row: i + 1, column: 1 },
          position: { x: 100, y: 100 },
          isValid: true,
        },
      });

      state = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: {
          location: { row: i + 1, column: 1 },
          mousePosition: { x: 100, y: 100 },
        },
      });

      state = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });
    }

    expect(state.stats.noTurnStreak.allTimeBest).toBe(4);

    // Reset for new game
    state = tetrixReducer(state, { type: 'RESET_GAME' });

    // Second game with streak of 6
    for (let i = 0; i < 6; i++) {
      const shape = generateRandomShape();
      state = {
        ...state,
        gameMode: 'infinite', // Ensure infinite mode for stats
        nextShapes: createQueuedShapes([shape]),
        openRotationMenus: [false],
        shapeOptionBounds: [{ left: 0, top: 0, width: 100, height: 100 }],
      };

      state = tetrixReducer(state, {
        type: 'SELECT_SHAPE',
        value: { shapeIndex: 0 },
      });

      state = tetrixReducer(state, {
        type: 'UPDATE_MOUSE_LOCATION',
        value: {
          location: { row: i + 1, column: 2 },
          position: { x: 100, y: 100 },
          isValid: true,
        },
      });

      state = tetrixReducer(state, {
        type: 'PLACE_SHAPE',
        value: {
          location: { row: i + 1, column: 2 },
          mousePosition: { x: 100, y: 100 },
        },
      });

      state = tetrixReducer(state, { type: 'COMPLETE_PLACEMENT' });
    }

    // All-time best should be updated to 6, bestInGame should be 6
    expect(state.stats.noTurnStreak.current).toBe(6);
    expect(state.stats.noTurnStreak.bestInGame).toBe(6);
    expect(state.stats.noTurnStreak.allTimeBest).toBe(6);
  });
});
