import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import DraggingShape from '../components/DraggingShape';
import { TetrixStateContext, TetrixDispatchContext } from '../components/Tetrix/TetrixContext';
import { TetrixReducerState, DragPhase } from '../utils/types';
import { DebugEditorProvider } from '../components/DebugEditor';

const mocks = vi.hoisted(() => ({
  playSound: vi.fn(),
}));

// Mock the sound effects module
vi.mock('../components/SoundEffectsContext', () => ({
  playSound: mocks.playSound,
  useSoundEffects: () => ({
    playSound: mocks.playSound,
    setMuted: vi.fn(),
    isMuted: false
  })
}));

const mockDispatch = vi.fn();

const createMockState = (dragPhase: DragPhase): TetrixReducerState => ({
  gameState: 'playing',
  currentLevel: 1,
  isMapUnlocked: false,
  tiles: [],
  nextShapes: [],
  savedShape: null,
  selectedShape: [
    [{ isFilled: false, color: 'grey' }, { isFilled: true, color: 'blue' }, { isFilled: false, color: 'grey' }, { isFilled: false, color: 'grey' }],
    [{ isFilled: false, color: 'grey' }, { isFilled: true, color: 'blue' }, { isFilled: false, color: 'grey' }, { isFilled: false, color: 'grey' }],
    [{ isFilled: false, color: 'grey' }, { isFilled: true, color: 'blue' }, { isFilled: false, color: 'grey' }, { isFilled: false, color: 'grey' }],
    [{ isFilled: false, color: 'grey' }, { isFilled: false, color: 'grey' }, { isFilled: false, color: 'grey' }, { isFilled: false, color: 'grey' }]
  ],
  selectedShapeIndex: 0,
  mouseGridLocation: { row: 5, column: 5 },
  mousePosition: { x: 100, y: 100 },
  gemIconPosition: { x: 100, y: 50 },
  isShapeDragging: false,
  isValidPlacement: true,
  hoveredBlockPositions: [],
  dragState: {
    phase: dragPhase,
    sourcePosition: dragPhase === 'picking-up' ? { x: 50, y: 50, width: 100, height: 100 } : null,
    targetPosition: dragPhase === 'placing' ? { x: 250, y: 250 } : null,
    placementLocation: null,
    startTime: dragPhase !== 'none' ? performance.now() : null,
  },
  shapeOptionBounds: [],
  openRotationMenus: [],
  score: 0,
  totalLinesCleared: 0,
  showCoinDisplay: false,
  queueSize: -1,
  shapesUsed: 0,
  gridTileSize: 50,
  gridBounds: { top: 0, left: 0, width: 500, height: 500 },
  hasPlacedFirstShape: false,
  isTurningModeActive: false,
  turningDirection: null,
  isDoubleTurnModeActive: false,
  unlockedModifiers: new Set(),
  removingShapeIndex: null,
  shapeRemovalAnimationState: 'none',
  newShapeAnimationStates: []
});

describe('Sound Timing in DraggingShape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date']
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should trigger sound during animation placement at correct timing', async () => {
    const mockState = createMockState('placing');

    render(
      <DebugEditorProvider>
        <TetrixStateContext.Provider value={mockState}>
          <TetrixDispatchContext.Provider value={mockDispatch}>
            <DraggingShape />
          </TetrixDispatchContext.Provider>
        </TetrixStateContext.Provider>
      </DebugEditorProvider>
    );

    // Fast-forward to the sound trigger point (203ms out of 300ms animation)
    await act(async () => {
      vi.advanceTimersByTime(210);
      // Allow time for the next animation frame
      await vi.runOnlyPendingTimersAsync();
    });

    // Verify that the sound was called at the correct timing
    expect(mocks.playSound).toHaveBeenCalledWith('click_into_place');
  });

  it('should not trigger sound when not in placing animation state', async () => {
    const mockState = createMockState('none');

    render(
      <DebugEditorProvider>
        <TetrixStateContext.Provider value={mockState}>
          <TetrixDispatchContext.Provider value={mockDispatch}>
            <DraggingShape />
          </TetrixDispatchContext.Provider>
        </TetrixStateContext.Provider>
      </DebugEditorProvider>
    );

    // Fast-forward past the sound trigger point
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    // Verify that no sound was triggered
    expect(mocks.playSound).not.toHaveBeenCalled();
  });

  it('should complete placement animation after 300ms', async () => {
    const mockState = createMockState('placing');

    render(
      <DebugEditorProvider>
        <TetrixStateContext.Provider value={mockState}>
          <TetrixDispatchContext.Provider value={mockDispatch}>
            <DraggingShape />
          </TetrixDispatchContext.Provider>
        </TetrixStateContext.Provider>
      </DebugEditorProvider>
    );

    // Fast-forward to completion (300ms)
    await act(async () => {
      vi.advanceTimersByTime(300);
      // Allow time for the final animation frame
      await vi.runOnlyPendingTimersAsync();
    });

    // Verify that COMPLETE_PLACEMENT was dispatched
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'COMPLETE_PLACEMENT' });
  });
});