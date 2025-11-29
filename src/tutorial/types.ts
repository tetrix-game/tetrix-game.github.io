/**
 * Tutorial System Types
 * 
 * This file defines the complete type system for the tutorial architecture.
 * The tutorial system uses a multi-layer validation approach to ensure users
 * can never get stuck in dead-end states.
 */

import type { TetrixReducerState, TetrixAction, Shape } from '../types';

// Alias for reducer state (actual game state with all properties)
export type GameState = TetrixReducerState;

// Alias for TetrixAction
export type Action = TetrixAction;

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Allowed actions for a tutorial step.
 * Each boolean controls whether that action type is permitted during the step.
 */
export interface AllowedActions {
  pointerDown?: boolean;
  pointerMove?: boolean;
  pointerUp?: boolean;
  click?: boolean;
  keydown?: boolean;
  rotate?: boolean;
  // Add more as needed
}

/**
 * Visual configuration for the spotlight effect
 */
export interface HighlightConfig {
  /** Radius of the spotlight circle in pixels */
  spotlightRadius: number;
  
  /** Opacity of the dimmed overlay (0-1) */
  dimOverlayOpacity: number;
  
  /** Optional: animate spotlight entrance */
  animateEntrance?: boolean;
  
  /** Optional: pulse effect on spotlight */
  pulse?: boolean;
}

/**
 * Constraints to prevent dead-end states
 */
export interface GridConstraints {
  /** Maximum number of filled tiles allowed */
  maxFilled?: number;
  
  /** Minimum number of empty tiles required */
  minEmpty?: number;
  
  /** Ensure at least one row can be completed */
  noBlockedRows?: boolean;
  
  /** Ensure at least one column can be completed */
  noBlockedColumns?: boolean;
}

/**
 * Step constraints that prevent invalid game states
 */
export interface StepConstraints {
  /** Force specific shapes to appear in queue */
  forcedShapes?: Shape[];
  
  /** Actions that are completely blocked */
  blockedActions?: string[];
  
  /** Minimum number of moves remaining to complete step */
  minRemainingMoves?: number;
  
  /** Grid-specific constraints */
  gridConstraints?: GridConstraints;
}

/**
 * Recovery mechanisms when user gets stuck
 */
export interface StepRecovery {
  /**
   * Function to detect if user is stuck.
   * @param state - Current game state
   * @param actionHistory - Array of actions user has taken
   * @returns true if user is stuck
   */
  stuckDetection?: (state: GameState, actionHistory: Action[]) => boolean;
  
  /**
   * Hint message to show when user is stuck.
   * Can be a string or function that returns a string based on state.
   */
  hintMessage?: string | ((state: GameState) => string);
  
  /**
   * Maximum number of undo actions allowed in this step.
   * Set to 0 to disable undo, or omit to disallow undo.
   */
  undoLimit?: number;
  
  /**
   * Maximum number of resets allowed in this step.
   * Set to 0 to disable reset, or omit to disallow reset.
   */
  resetLimit?: number;
  
  /**
   * Automatically fix the game state when stuck.
   * @param state - Current stuck state
   * @returns Fixed game state
   */
  autoFix?: (state: GameState) => GameState;
  
  /**
   * Allow user to skip this step.
   * Use sparingly - skipping should only be allowed as last resort.
   */
  allowSkip?: boolean;
  
  /**
   * Custom order to try recovery strategies.
   * If omitted, uses default order: hint → undo → reset → autoFix → skip
   */
  strategyOrder?: RecoveryStrategyType[];
}

/**
 * Metadata used for validation
 */
export interface StepMetadata {
  /** Actions that modify game state (used for validation) */
  stateModifyingActions: string[];
  
  /** Required state conditions to complete this step */
  requiredStateConditions: Partial<GameState>;
  
  /** Can this step be completed from any valid prior state? */
  idempotent: boolean;
  
  /** Maximum actions before considering user stuck */
  maxActionsBeforeStuck?: number;
  
  /** Allow user to undo actions */
  allowUndo?: boolean;
  
  /** Allow user to skip this step */
  allowSkip?: boolean;
}

// ============================================================================
// MAIN CONFIGURATION TYPE
// ============================================================================

/**
 * Complete configuration for a single tutorial step.
 * 
 * REQUIRED FIELDS:
 * - id: Unique identifier
 * - instruction: What to tell the user
 * - allowedActions: What user can do
 * - completionCondition: How to know step is done
 * - metadata: Validation metadata
 * 
 * EXAMPLE:
 * ```typescript
 * {
 *   id: 'place-first-shape',
 *   instruction: 'Drag the shape onto the grid',
 *   targetSelector: '[data-shape-index="0"]',
 *   allowedActions: {
 *     pointerDown: true,
 *     pointerMove: true,
 *     pointerUp: true,
 *   },
 *   completionCondition: (state) => {
 *     // Step complete when any tile is filled
 *     return Array.from(state.tiles.values()).some(t => t.isFilled);
 *   },
 *   validationFn: (event, state) => {
 *     // Only allow clicking/dragging first shape
 *     const target = event.target as HTMLElement;
 *     const firstShape = document.querySelector('[data-shape-index="0"]');
 *     return firstShape?.contains(target) || false;
 *   },
 *   metadata: {
 *     stateModifyingActions: ['PLACE_SHAPE'],
 *     requiredStateConditions: {},
 *     idempotent: false,
 *     maxActionsBeforeStuck: 10,
 *     allowSkip: true,
 *   },
 *   highlightConfig: {
 *     spotlightRadius: 120,
 *     dimOverlayOpacity: 0.85,
 *   },
 * }
 * ```
 */
export interface TutorialStepConfig {
  // ===== IDENTIFICATION =====
  
  /** Unique identifier for this step */
  id: string;
  
  /** User-facing instruction text */
  instruction: string;
  
  /** Optional: CSS selector for element to highlight */
  targetSelector?: string;
  
  // ===== BEHAVIOR =====
  
  /** What actions are allowed during this step */
  allowedActions: AllowedActions;
  
  /**
   * Function to check if a specific event/action should be allowed.
   * Called before action is executed.
   * Return true to allow, false to block.
   */
  validationFn?: (event: Event, state: GameState) => boolean;
  
  /**
   * Function to check if the step is complete.
   * Called after every state change.
   * Return true when step goals are achieved.
   */
  completionCondition: (state: GameState) => boolean;
  
  /**
   * Optional: Function called when step is completed.
   * Use for cleanup or triggering animations.
   */
  onComplete?: (state: GameState) => void;
  
  // ===== VALIDATION =====
  
  /** Metadata used for static and runtime validation */
  metadata: StepMetadata;
  
  /** Constraints to prevent dead-end states */
  constraints?: StepConstraints;
  
  /** Recovery mechanisms when user gets stuck */
  recovery?: StepRecovery;
  
  /**
   * Initial state for this step.
   * Used when resetting the step.
   * Can be a state object or a function that generates the state.
   */
  initialState?: GameState | (() => GameState);
  
  // ===== VISUAL =====
  
  /** Configuration for spotlight highlight effect */
  highlightConfig?: HighlightConfig;
  
  /** Optional: Custom CSS class for this step */
  customClass?: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Result of a validation check
 */
export type ValidationResult = 
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

/**
 * Error found during validation
 */
export interface ValidationError {
  /** Index of step with error */
  stepIndex: number;
  
  /** ID of step with error */
  stepId: string;
  
  /** Severity level */
  severity: 'error' | 'warning';
  
  /** Error type code */
  type: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Optional suggestion for fixing */
  suggestion?: string;
}

// ============================================================================
// RUNTIME MONITORING TYPES
// ============================================================================

/**
 * Runtime monitoring state for a tutorial step
 */
export interface TutorialRuntimeMonitor {
  /** When the step started (timestamp) */
  stepStartTime: number;
  
  /** Number of actions taken in this step */
  actionCount: number;
  
  /** History of all actions taken */
  actionHistory: Action[];
  
  /** Hash of last game state (for detecting changes) */
  lastStateHash: string;
  
  /** Number of times state has changed */
  stateChangeCount: number;
  
  /** Whether we've shown a warning to user */
  warningShown: boolean;
}

// ============================================================================
// SIMULATION TYPES
// ============================================================================

/**
 * User behavior strategy for simulation
 */
export type UserStrategy = 
  | 'optimal'      // Always makes best move
  | 'random'       // Random valid moves
  | 'malicious'    // Tries to break tutorial
  | 'confused'     // Makes mistakes, backtracks
  | 'impatient';   // Spam clicks, fast actions

/**
 * Configuration for tutorial simulation
 */
export interface SimulationConfig {
  /** User behavior strategies to test */
  strategies: UserStrategy[];
  
  /** Number of simulation runs per strategy */
  iterations: number;
  
  /** Optional random seed for reproducibility */
  randomSeed?: number;
}

/**
 * Result of a single simulation run
 */
export interface SimulationResult {
  /** Whether tutorial completed successfully */
  success: boolean;
  
  /** Total actions taken */
  actionCount: number;
  
  /** Time taken in milliseconds */
  timeMs: number;
  
  /** Failure details if unsuccessful */
  failure?: {
    step: string;
    type: string;
    message: string;
  };
  
  /** Final game state */
  finalState: GameState;
}

/**
 * Report of simulation testing results
 */
export interface SimulationReport {
  /** Total simulation runs */
  totalRuns: number;
  
  /** Number of successful completions */
  successfulRuns: number;
  
  /** Number of failures */
  failedRuns: number;
  
  /** Details of all failures */
  failures: Array<{
    step: string;
    type: string;
    message: string;
  }>;
  
  /** Average actions to complete */
  averageActions: number;
  
  /** Average time to complete */
  averageTime: number;
  
  /** Maximum actions in any run */
  maxActions: number;
  
  /** Game states that led to dead-ends */
  deadEndStates: GameState[];
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Tutorial context provided to components
 */
export interface TutorialContextValue {
  /** Current step configuration */
  currentStep: TutorialStepConfig | null;
  
  /** Index of current step */
  currentStepIndex: number;
  
  /** Total number of steps */
  totalSteps: number;
  
  /** Whether tutorial is active */
  isActive: boolean;
  
  /** Callback when action is attempted */
  onAction: (state: GameState, action: Action) => void;
  
  /** Callback when step is completed */
  onStepComplete: () => void;
  
  /** Callback to skip current step */
  skipStep: () => void;
  
  /** Callback to restart current step */
  restartStep: () => void;
  
  /** Callback to exit tutorial entirely */
  exitTutorial: () => void;
}

// ============================================================================
// RECOVERY TYPES
// ============================================================================

/**
 * Recovery strategy type identifier
 */
export type RecoveryStrategyType = 'hint' | 'undo' | 'reset' | 'autoFix' | 'skip';

/**
 * Result of a recovery attempt
 */
export interface RecoveryResult {
  /** Whether recovery was successful */
  success: boolean;
  
  /** Strategy that was used */
  strategy: RecoveryStrategyType;
  
  /** Message to show to user */
  message: string;
  
  /** Error code if recovery failed */
  error?: string;
}

/**
 * Recovery strategy type (deprecated - use RecoveryStrategyType)
 * Keeping for backward compatibility.
 */
export type RecoveryType = RecoveryStrategyType;

/**
 * A recovery strategy to help stuck users (deprecated interface)
 * Use RecoveryResult instead for new code.
 */
export interface RecoveryStrategy {
  /** Type of recovery */
  type: RecoveryType;
  
  /** 
   * Execute the recovery.
   * @returns New game state, or null if no state change needed
   */
  execute: (state: GameState, monitor: TutorialRuntimeMonitor) => GameState | null;
}
