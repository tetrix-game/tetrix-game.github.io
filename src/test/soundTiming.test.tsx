import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import DraggingShape from '../components/DraggingShape';
import { TetrixStateContext, TetrixDispatchContext } from '../components/Tetrix/TetrixContext';
import { TetrixReducerState, PlacementAnimationState } from '../utils/types';
import * as soundEffects from '../utils/soundEffects';

// Mock the sound effects module
vi.mock('../utils/soundEffects', () => ({
  playSound: vi.fn().mockResolvedValue(undefined)
}));

const mockDispatch = vi.fn();

const createMockState = (placementAnimationState: PlacementAnimationState): TetrixReducerState => ({
  gameState: 'playing',
  currentLevel: 1,
  isMapUnlocked: false,
  tiles: [],
  nextShapes: [],
  savedShape: null,
  selectedShape: [
    [{ isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: true, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }],
    [{ isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: true, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }],
    [{ isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: true, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }],
    [{ isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }, { isFilled: false, color: { lightest: '', light: '', main: '', dark: '', darkest: '' } }]
  ],
  selectedShapeIndex: 0,
  mouseGridLocation: { row: 5, column: 5 },
  mousePosition: { x: 100, y: 100 },
  showerLocation: { x: 100, y: 100 },
  isShapeDragging: false,
  isValidPlacement: true,
  hoveredBlockPositions: [],
  placementAnimationState,
  animationStartPosition: placementAnimationState === 'placing' ? { x: 100, y: 100 } : null,
  animationTargetPosition: placementAnimationState === 'placing' ? { x: 250, y: 250 } : null,
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
  unlockedModifiers: new Set()
});

describe('Sound Timing in DraggingShape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should trigger sound during animation placement at correct timing', async () => {
    const mockState = createMockState('placing');

    render(
      <TetrixStateContext.Provider value={mockState}>
        <TetrixDispatchContext.Provider value={mockDispatch}>
          <DraggingShape />
        </TetrixDispatchContext.Provider>
      </TetrixStateContext.Provider>
    );

    // Fast-forward to the sound trigger point (203ms out of 300ms animation)
    vi.advanceTimersByTime(203);

    // Allow time for the next animation frame
    await vi.runOnlyPendingTimersAsync();

    // Verify that the sound was called at the correct timing
    expect(soundEffects.playSound).toHaveBeenCalledWith('click_into_place');
  });

  it('should not trigger sound when not in placing animation state', () => {
    const mockState = createMockState('none');

    render(
      <TetrixStateContext.Provider value={mockState}>
        <TetrixDispatchContext.Provider value={mockDispatch}>
          <DraggingShape />
        </TetrixDispatchContext.Provider>
      </TetrixStateContext.Provider>
    );

    // Fast-forward past the sound trigger point
    vi.advanceTimersByTime(400);

    // Verify that no sound was triggered
    expect(soundEffects.playSound).not.toHaveBeenCalled();
  });

  it('should complete placement animation after 300ms', async () => {
    const mockState = createMockState('placing');

    render(
      <TetrixStateContext.Provider value={mockState}>
        <TetrixDispatchContext.Provider value={mockDispatch}>
          <DraggingShape />
        </TetrixDispatchContext.Provider>
      </TetrixStateContext.Provider>
    );

    // Fast-forward to completion (300ms)
    vi.advanceTimersByTime(300);

    // Allow time for the final animation frame
    await vi.runOnlyPendingTimersAsync();

    // Verify that COMPLETE_PLACEMENT was dispatched
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'COMPLETE_PLACEMENT' });
  });
});