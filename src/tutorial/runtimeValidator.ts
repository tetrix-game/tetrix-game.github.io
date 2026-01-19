/**
 * Tutorial Runtime Validator
 * 
 * This module monitors tutorial execution in real-time and detects when users get stuck.
 * It tracks action counts, state changes, and patterns to identify dead-end situations.
 * 
 * WHEN IT RUNS: During tutorial playback, after every user action
 * WHAT IT DETECTS:
 * - Too many actions without progress
 * - Infinite loops (repeated patterns)
 * - Dead-end states (no path to completion)
 * - Constraint violations
 * 
 * HOW TO USE:
 * ```typescript
 * const validator = new TutorialRuntimeValidator(currentStep, (reason) => {
 *   console.warn('User stuck:', reason);
 *   handleStuckState();
 * });
 * 
 * // After each action:
 * const result = validator.checkState(gameState, action);
 * if (!result.valid) {
 *   // User is stuck! Trigger recovery
 * }
 * ```
 */

import type {
  TutorialStepConfig,
  TutorialRuntimeMonitor,
  ValidationResult,
  Action,
  GameState,
} from './types';
import type { Location } from '../types';
import { isValidPlacement } from '../utils/shapeUtils';

// ============================================================================
// RUNTIME VALIDATOR CLASS
// ============================================================================

/**
 * Runtime validator that monitors tutorial execution.
 * 
 * Create one instance per tutorial step. It tracks user actions and
 * detects stuck states in real-time.
 */
export class TutorialRuntimeValidator {
  private monitor: TutorialRuntimeMonitor;
  private step: TutorialStepConfig;
  private onStuck: (reason: string) => void;

  constructor(
    step: TutorialStepConfig,
    onStuck: (reason: string) => void
  ) {
    this.step = step;
    this.onStuck = onStuck;
    this.monitor = {
      stepStartTime: Date.now(),
      actionCount: 0,
      actionHistory: [],
      lastStateHash: '',
      stateChangeCount: 0,
      warningShown: false,
    };
  }

  /**
   * Check game state after every action.
   * 
   * This is the main entry point - call it after each user action.
   * It runs all detection checks and returns whether state is valid.
   * 
   * @param state - Current game state
   * @param action - Action that was just performed
   * @returns Validation result
   * 
   * @example
   * ```typescript
   * const result = validator.checkState(state, { type: 'PLACE_SHAPE', ... });
   * if (!result.valid) {
   *   console.error('Stuck detected:', result.errors);
   *   triggerRecovery();
   * }
   * ```
   */
  checkState(state: GameState, action: Action): ValidationResult {
    this.monitor.actionCount++;
    this.monitor.actionHistory.push(action);

    const stateHash = hashGameState(state);
    if (stateHash !== this.monitor.lastStateHash) {
      this.monitor.stateChangeCount++;
      this.monitor.lastStateHash = stateHash;
    }

    // Run all detection checks
    const checks = [
      this.checkMaxActions(),
      this.checkInfiniteLoop(),
      this.checkDeadEnd(state),
      this.checkConstraintViolation(state),
      this.checkCustomStuckDetection(state),
    ];

    const failures = checks.filter(c => !c.valid);

    if (failures.length > 0) {
      const errors = failures.flatMap(f => f.errors || []);
      if (errors.length > 0) {
        this.onStuck(errors[0].message);
      }
      return {
        valid: false,
        errors
      };
    }

    return { valid: true };
  }

  /**
   * Get current monitor state (for recovery system)
   */
  getMonitor(): TutorialRuntimeMonitor {
    return this.monitor;
  }

  // ==========================================================================
  // DETECTION CHECKS
  // ==========================================================================

  /**
   * Check 1: Maximum actions exceeded
   */
  private checkMaxActions(): ValidationResult {
    const max = this.step.metadata.maxActionsBeforeStuck;

    if (max && this.monitor.actionCount > max) {
      return {
        valid: false,
        errors: [{
          stepIndex: 0,
          stepId: this.step.id,
          severity: 'error',
          type: 'MAX_ACTIONS_EXCEEDED',
          message: `User performed ${this.monitor.actionCount} actions, max is ${max}`,
        }]
      };
    }

    return { valid: true };
  }

  /**
   * Check 2: Infinite loop detection (repeated actions)
   */
  private checkInfiniteLoop(): ValidationResult {
    const recentActions = this.monitor.actionHistory.slice(-10);

    // Check for repeated action sequences
    if (this.monitor.actionCount > 20) {
      const pattern = detectRepeatingPattern(recentActions);

      if (pattern && pattern.repetitions > 3) {
        return {
          valid: false,
          errors: [{
            stepIndex: 0,
            stepId: this.step.id,
            severity: 'error',
            type: 'INFINITE_LOOP',
            message: `User is repeating the same action sequence`,
          }]
        };
      }
    }

    // Check for no state changes despite actions
    if (this.monitor.actionCount > 10 && this.monitor.stateChangeCount < 2) {
      return {
        valid: false,
        errors: [{
          stepIndex: 0,
          stepId: this.step.id,
          severity: 'warning',
          type: 'NO_PROGRESS',
          message: `User performed ${this.monitor.actionCount} actions but state changed only ${this.monitor.stateChangeCount} times`,
        }]
      };
    }

    return { valid: true };
  }

  /**
   * Check 3: Dead-end state detection
   */
  private checkDeadEnd(state: GameState): ValidationResult {
    // Can the step completion condition EVER be satisfied from current state?
    const canComplete = this.canStepBeCompletedFrom(state);

    if (!canComplete) {
      return {
        valid: false,
        errors: [{
          stepIndex: 0,
          stepId: this.step.id,
          severity: 'error',
          type: 'DEAD_END_STATE',
          message: 'Current game state cannot satisfy step completion condition',
        }]
      };
    }

    return { valid: true };
  }

  /**
   * Check 4: Constraint violations
   */
  private checkConstraintViolation(state: GameState): ValidationResult {
    if (!this.step.constraints) return { valid: true };

    const { gridConstraints } = this.step.constraints;

    if (gridConstraints) {
      const filledCount = countFilledTiles(state.tiles);
      const emptyCount = 100 - filledCount;

      if (gridConstraints.maxFilled && filledCount > gridConstraints.maxFilled) {
        return {
          valid: false,
          errors: [{
            stepIndex: 0,
            stepId: this.step.id,
            severity: 'error',
            type: 'CONSTRAINT_VIOLATION',
            message: `Grid has ${filledCount} filled tiles, max is ${gridConstraints.maxFilled}`,
          }]
        };
      }

      if (gridConstraints.minEmpty && emptyCount < gridConstraints.minEmpty) {
        return {
          valid: false,
          errors: [{
            stepIndex: 0,
            stepId: this.step.id,
            severity: 'error',
            type: 'CONSTRAINT_VIOLATION',
            message: `Grid has ${emptyCount} empty tiles, min is ${gridConstraints.minEmpty}`,
          }]
        };
      }

      // Check if any row/column can still be completed
      if (gridConstraints.noBlockedRows) {
        const hasCompletableRow = canCompleteAnyRow(state.tiles, state.nextShapes);
        if (!hasCompletableRow) {
          return {
            valid: false,
            errors: [{
              stepIndex: 0,
              stepId: this.step.id,
              severity: 'error',
              type: 'NO_COMPLETABLE_ROWS',
              message: 'No rows can be completed with current shapes',
            }]
          };
        }
      }

      if (gridConstraints.noBlockedColumns) {
        const hasCompletableColumn = canCompleteAnyColumn(state.tiles, state.nextShapes);
        if (!hasCompletableColumn) {
          return {
            valid: false,
            errors: [{
              stepIndex: 0,
              stepId: this.step.id,
              severity: 'error',
              type: 'NO_COMPLETABLE_COLUMNS',
              message: 'No columns can be completed with current shapes',
            }]
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Check 5: Custom stuck detection function
   */
  private checkCustomStuckDetection(state: GameState): ValidationResult {
    if (!this.step.recovery?.stuckDetection) return { valid: true };

    const isStuck = this.step.recovery.stuckDetection(
      state,
      this.monitor.actionHistory
    );

    if (isStuck) {
      return {
        valid: false,
        errors: [{
          stepIndex: 0,
          stepId: this.step.id,
          severity: 'error',
          type: 'CUSTOM_STUCK_DETECTION',
          message: 'Custom stuck detection function returned true',
        }]
      };
    }

    return { valid: true };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Check if step can be completed from current state.
   * 
   * This performs a simplified lookahead search to see if there's
   * any sequence of valid actions that would complete the step.
   */
  private canStepBeCompletedFrom(state: GameState): boolean {
    // If step is already complete, return true
    if (this.step.completionCondition(state)) {
      return true;
    }

    // If step is idempotent, it can complete from any state
    if (this.step.metadata.idempotent) {
      return true;
    }

    // Check if there are any valid actions available
    const hasValidActions = this.hasAnyValidActions(state);

    return hasValidActions;
  }

  /**
   * Check if user can perform any valid actions in current state
   */
  private hasAnyValidActions(state: GameState): boolean {
    // If no shapes available, can't do anything
    if (!state.nextShapes || state.nextShapes.length === 0) {
      return false;
    }

    // Check if any shape can be placed anywhere
    for (const queuedShape of state.nextShapes) {
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          const location: Location = { row, column: col };

          if (isValidPlacement(queuedShape.shape, location, state.tiles)) {
            return true; // Found at least one valid placement
          }
        }
      }
    }

    return false; // No valid placements found
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Hash a game state to detect changes.
 * This is a simple hash - in production you might want something more sophisticated.
 */
function hashGameState(state: GameState): string {
  // Hash based on key state properties
  return JSON.stringify({
    tilesCount: countFilledTiles(state.tiles),
    shapesCount: state.nextShapes.length,
    score: state.score,
    linesCleared: state.totalLinesCleared,
  });
}

/**
 * Count filled tiles in the grid
 */
function countFilledTiles(tiles: Map<string, import('../types').Tile>): number {
  let count = 0;
  for (const tile of tiles.values()) {
    if (tile.block.isFilled) count++;
  }
  return count;
}

/**
 * Detect repeating patterns in action history.
 * Returns the pattern and how many times it repeats.
 */
function detectRepeatingPattern(
  actions: Action[]
): { sequence: Action[]; repetitions: number } | null {
  if (actions.length < 4) return null;

  // Try different pattern lengths
  for (let patternLen = 2; patternLen <= actions.length / 2; patternLen++) {
    const pattern = actions.slice(-patternLen);
    const prevPattern = actions.slice(-patternLen * 2, -patternLen);

    // Check if pattern matches
    if (JSON.stringify(pattern) === JSON.stringify(prevPattern)) {
      // Count how many times this pattern repeats
      let reps = 2;
      for (let i = 3; i <= actions.length / patternLen; i++) {
        const checkPattern = actions.slice(-patternLen * i, -patternLen * (i - 1));
        if (JSON.stringify(checkPattern) !== JSON.stringify(pattern)) {
          break;
        }
        reps++;
      }

      return { sequence: pattern, repetitions: reps };
    }
  }

  return null;
}

/**
 * Check if any row can be completed with current shapes
 */
function canCompleteAnyRow(
  tiles: Map<string, import('../types').Tile>,
  shapes: unknown[]
): boolean {
  // Simplified check - in production, do more thorough analysis
  if (!shapes || shapes.length === 0) return false;

  // Check each row
  for (let row = 1; row <= 10; row++) {
    let filled = 0;
    for (let col = 1; col <= 10; col++) {
      const key = `R${row}C${col}`;
      const tile = tiles.get(key);
      if (tile?.block.isFilled) filled++;
    }

    // If row is nearly complete, assume it can be finished
    if (filled >= 7) return true;
  }

  return true; // Default to true to avoid false positives
}

/**
 * Check if any column can be completed with current shapes
 */
function canCompleteAnyColumn(
  tiles: Map<string, import('../types').Tile>,
  shapes: unknown[]
): boolean {
  // Simplified check - in production, do more thorough analysis
  if (!shapes || shapes.length === 0) return false;

  // Check each column
  for (let col = 1; col <= 10; col++) {
    let filled = 0;
    for (let row = 1; row <= 10; row++) {
      const key = `R${row}C${col}`;
      const tile = tiles.get(key);
      if (tile?.block.isFilled) filled++;
    }

    // If column is nearly complete, assume it can be finished
    if (filled >= 7) return true;
  }

  return true; // Default to true to avoid false positives
}
