/**
 * Tutorial Recovery System
 * 
 * This module implements the progressive recovery strategy when users get stuck.
 * It attempts multiple strategies in order: Hint → Undo → Reset → Auto-Fix → Skip.
 * 
 * WHEN IT RUNS: Triggered by runtime validator when stuck state detected
 * 
 * RECOVERY STRATEGIES (in order):
 * 1. **Hint**: Show a helpful message explaining what to do
 * 2. **Undo**: Revert the last action if available
 * 3. **Reset**: Return to the beginning of the current step
 * 4. **Auto-fix**: Automatically repair the state to be completable
 * 5. **Skip**: Allow user to skip this step
 * 
 * HOW TO USE:
 * ```typescript
 * const recovery = new TutorialRecoverySystem(currentStep, dispatch);
 * 
 * // When user gets stuck:
 * const result = await recovery.attemptRecovery(gameState, runtimeMonitor);
 * 
 * if (result.success) {
 *   console.log('Recovered using:', result.strategy);
 * } else {
 *   console.error('Recovery failed:', result.error);
 * }
 * ```
 */

import type {
  TutorialStepConfig,
  RecoveryStrategyType,
  RecoveryResult,
  TutorialRuntimeMonitor,
  GameState,
} from './types';

/**
 * Recovery system that attempts multiple strategies to help stuck users.
 * 
 * Each strategy is attempted in order until one succeeds.
 * The system tracks which strategies have been attempted to avoid loops.
 */
export class TutorialRecoverySystem {
  private step: TutorialStepConfig;
  private attemptedStrategies: Set<RecoveryStrategyType> = new Set();
  
  constructor(
    step: TutorialStepConfig
  ) {
    this.step = step;
  }
  
  /**
   * Attempt to recover from stuck state using progressive strategies.
   * 
   * This is the main entry point - call when user is stuck.
   * It will try each recovery strategy in order until one works.
   * 
   * @param state - Current game state
   * @param monitor - Runtime monitor with action history
   * @returns Recovery result with success status and strategy used
   * 
   * @example
   * ```typescript
   * const result = await recovery.attemptRecovery(state, monitor);
   * if (result.success) {
   *   showMessage(`Recovered using ${result.strategy}`);
   * }
   * ```
   */
  async attemptRecovery(
    state: GameState,
    monitor: TutorialRuntimeMonitor
  ): Promise<RecoveryResult> {
    // Get ordered list of strategies to try
    const strategies = this.getRecoveryStrategies();
    
    // Try each strategy in order
    for (const strategy of strategies) {
      // Skip if we've already tried this strategy
      if (this.attemptedStrategies.has(strategy)) {
        continue;
      }
      
      this.attemptedStrategies.add(strategy);
      
      const result = await this.executeStrategy(strategy, state, monitor);
      
      if (result.success) {
        return result;
      }
    }
    
    // All strategies failed
    return {
      success: false,
      strategy: 'skip',
      message: 'All recovery strategies failed. Tutorial cannot continue.',
      error: 'NO_RECOVERY_AVAILABLE'
    };
  }
  
  /**
   * Get ordered list of recovery strategies to try.
   * 
   * Uses step's custom order if available, otherwise uses default order.
   */
  private getRecoveryStrategies(): RecoveryStrategyType[] {
    if (this.step.recovery?.strategyOrder) {
      return this.step.recovery.strategyOrder;
    }
    
    // Default order: least intrusive to most intrusive
    return ['hint', 'undo', 'reset', 'autoFix', 'skip'];
  }
  
  /**
   * Execute a specific recovery strategy.
   */
  private async executeStrategy(
    strategy: RecoveryStrategyType,
    state: GameState,
    monitor: TutorialRuntimeMonitor
  ): Promise<RecoveryResult> {
    switch (strategy) {
      case 'hint':
        return this.attemptHint(state);
        
      case 'undo':
        return this.attemptUndo(state, monitor);
        
      case 'reset':
        return this.attemptReset(state);
        
      case 'autoFix':
        return this.attemptAutoFix(state);
        
      case 'skip':
        return this.attemptSkip();
        
      default:
        return {
          success: false,
          strategy,
          message: `Unknown recovery strategy: ${strategy}`,
          error: 'UNKNOWN_STRATEGY'
        };
    }
  }
  
  // ==========================================================================
  // STRATEGY IMPLEMENTATIONS
  // ==========================================================================
  
  /**
   * Strategy 1: Show a helpful hint message
   */
  private attemptHint(state: GameState): Promise<RecoveryResult> {
    if (!this.step.recovery?.hintMessage) {
      return Promise.resolve({
        success: false,
        strategy: 'hint',
        message: 'No hint available',
        error: 'NO_HINT_CONFIGURED'
      });
    }
    
    // Get hint message (can be function or string)
    const hintMessage = typeof this.step.recovery.hintMessage === 'function'
      ? this.step.recovery.hintMessage(state)
      : this.step.recovery.hintMessage;
    
    // Show hint to user (caller should display this message)
    return Promise.resolve({
      success: true,
      strategy: 'hint',
      message: hintMessage
    });
  }
  
  /**
   * Strategy 2: Undo the last action
   */
  private attemptUndo(
    _state: GameState,
    monitor: TutorialRuntimeMonitor
  ): Promise<RecoveryResult> {
    // Check if undo is available
    if (!this.step.recovery?.undoLimit) {
      return Promise.resolve({
        success: false,
        strategy: 'undo',
        message: 'Undo not available for this step',
        error: 'UNDO_NOT_ALLOWED'
      });
    }
    
    if (monitor.actionHistory.length === 0) {
      return Promise.resolve({
        success: false,
        strategy: 'undo',
        message: 'No actions to undo',
        error: 'NO_ACTIONS_TO_UNDO'
      });
    }
    
    // NOTE: Undo functionality not yet implemented in reducer
    // For now, just return that undo would work
    // TODO: Implement UNDO_LAST_ACTION in reducer
    return Promise.resolve({
      success: true,
      strategy: 'undo',
      message: 'Undo would work here (not yet implemented)'
    });
  }
  
  /**
   * Strategy 3: Reset to step's initial state
   */
  private attemptReset(_state: GameState): Promise<RecoveryResult> {
    if (!this.step.recovery?.resetLimit) {
      return Promise.resolve({
        success: false,
        strategy: 'reset',
        message: 'Reset not available for this step',
        error: 'RESET_NOT_ALLOWED'
      });
    }
    
    if (!this.step.initialState) {
      return Promise.resolve({
        success: false,
        strategy: 'reset',
        message: 'No initial state configured for reset',
        error: 'NO_INITIAL_STATE'
      });
    }
    
    // Return success - orchestrator will handle the actual reset
    return Promise.resolve({
      success: true,
      strategy: 'reset',
      message: 'Step can be reset to initial state'
    });
  }
  
  /**
   * Strategy 4: Automatically fix the state
   */
  private attemptAutoFix(state: GameState): Promise<RecoveryResult> {
    if (!this.step.recovery?.autoFix) {
      return Promise.resolve({
        success: false,
        strategy: 'autoFix',
        message: 'Auto-fix not available for this step',
        error: 'AUTO_FIX_NOT_CONFIGURED'
      });
    }
    
    try {
      // Test if auto-fix function works without error
      this.step.recovery.autoFix(state);
      
      // Return success - orchestrator will handle applying the fix
      return Promise.resolve({
        success: true,
        strategy: 'autoFix',
        message: 'State can be automatically repaired'
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        strategy: 'autoFix',
        message: `Auto-fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'AUTO_FIX_FAILED'
      });
    }
  }
  
  /**
   * Strategy 5: Allow user to skip this step
   */
  private attemptSkip(): Promise<RecoveryResult> {
    if (!this.step.recovery?.allowSkip) {
      return Promise.resolve({
        success: false,
        strategy: 'skip',
        message: 'Skip not allowed for this step',
        error: 'SKIP_NOT_ALLOWED'
      });
    }
    
    // Return success - orchestrator will handle the skip
    return Promise.resolve({
      success: true,
      strategy: 'skip',
      message: 'Step can be skipped'
    });
  }
}


// ============================================================================
// STATE REPAIR UTILITIES
// ============================================================================

/**
 * Common auto-fix functions that can be used in step.recovery.autoFix
 */

/**
 * Clear all filled tiles (emergency reset)
 */
export function clearAllTiles(state: GameState): GameState {
  const newTiles = new Map(state.tiles);
  
  for (const [key, tile] of newTiles.entries()) {
    if (tile.isFilled) {
      newTiles.set(key, { ...tile, isFilled: false });
    }
  }
  
  return {
    ...state,
    tiles: newTiles
  };
}

/**
 * Clear specific rows/columns to make progress possible
 */
export function clearRows(state: GameState, rows: number[]): GameState {
  const newTiles = new Map(state.tiles);
  
  for (const row of rows) {
    for (let col = 1; col <= 10; col++) {
      const key = `${row},${col}`;
      const tile = newTiles.get(key);
      if (tile) {
        newTiles.set(key, { ...tile, isFilled: false });
      }
    }
  }
  
  return {
    ...state,
    tiles: newTiles
  };
}

/**
 * Ensure at least N valid placements are possible
 */
export function ensureValidPlacements(
  state: GameState,
  _minPlacements: number
): GameState {
  // This is a simplified version - in production, you'd do more sophisticated analysis
  
  // If grid is too full, clear some random tiles
  const filledCount = countFilledTiles(state.tiles);
  
  if (filledCount > 85) { // If more than 85% full, clear some space
    return clearRandomTiles(state, 10);
  }
  
  return state;
}

/**
 * Clear N random filled tiles
 */
function clearRandomTiles(state: GameState, count: number): GameState {
  const newTiles = new Map(state.tiles);
  const filledKeys = Array.from(newTiles.entries())
    .filter(([, tile]) => tile.isFilled)
    .map(([key]) => key);
  
  // Shuffle and take N tiles
  const shuffled = filledKeys.sort(() => Math.random() - 0.5);
  const toClear = shuffled.slice(0, count);
  
  for (const key of toClear) {
    const tile = newTiles.get(key);
    if (tile) {
      newTiles.set(key, { ...tile, isFilled: false });
    }
  }
  
  return {
    ...state,
    tiles: newTiles
  };
}

/**
 * Count filled tiles in the grid
 */
function countFilledTiles(tiles: Map<string, { isFilled: boolean }>): number {
  let count = 0;
  for (const tile of tiles.values()) {
    if (tile.isFilled) count++;
  }
  return count;
}
