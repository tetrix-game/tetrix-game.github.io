/**
 * Tutorial Static Validator
 * 
 * This module performs build-time validation of tutorial configurations.
 * It catches errors before they reach users and ensures tutorials are completable.
 * 
 * WHEN IT RUNS: Automatically on app startup
 * WHAT IT CHECKS:
 * - Required fields present
 * - No contradictory constraints
 * - Steps build on each other logically
 * - No dead-end states possible
 * 
 * HOW TO USE:
 * ```typescript
 * import { validateTutorialConfiguration } from './validator';
 * import { tutorialSteps } from './tutorialSteps';
 * 
 * const result = validateTutorialConfiguration(tutorialSteps);
 * if (!result.valid) {
 *   console.error('Tutorial validation failed:', result.errors);
 *   throw new Error('Tutorial configuration is invalid');
 * }
 * ```
 */

import type {
  TutorialStepConfig,
  ValidationResult,
  ValidationError,
  StepConstraints,
} from './types';
import type { GameState } from '../types';

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate complete tutorial configuration.
 * 
 * This is the main entry point for validation. Call this once with your
 * entire tutorial step array. It will run all validation checks and return
 * a detailed report of any issues.
 * 
 * @param steps - Array of tutorial step configurations
 * @returns Validation result with any errors found
 * 
 * @example
 * ```typescript
 * const result = validateTutorialConfiguration(mySteps);
 * 
 * if (!result.valid) {
 *   result.errors.forEach(error => {
 *     console.error(`[${error.stepId}] ${error.message}`);
 *     if (error.suggestion) {
 *       console.log(`  💡 ${error.suggestion}`);
 *     }
 *   });
 * }
 * ```
 */
export function validateTutorialConfiguration(
  steps: TutorialStepConfig[]
): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate each step individually
  steps.forEach((step, index) => {
    errors.push(...validateStep(step, index));
  });
  
  // Validate step sequence
  errors.push(...validateStepSequence(steps));
  
  // Validate state transitions
  errors.push(...validateStateTransitions(steps));
  
  if (errors.some(e => e.severity === 'error')) {
    return { valid: false, errors };
  }
  
  return { valid: true };
}

// ============================================================================
// INDIVIDUAL STEP VALIDATION
// ============================================================================

/**
 * Validate a single tutorial step configuration.
 * 
 * Checks for:
 * - Missing required fields
 * - Uncompletable steps
 * - Missing stuck detection
 * - Missing recovery mechanisms
 * - Contradictory constraints
 * 
 * @param step - Step to validate
 * @param index - Step index in tutorial sequence
 * @returns Array of validation errors found
 */
function validateStep(
  step: TutorialStepConfig, 
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // ===== CHECK 1: Required Fields =====
  
  if (!step.id) {
    errors.push({
      stepIndex: index,
      stepId: step.id || 'unknown',
      severity: 'error',
      type: 'MISSING_FIELD',
      message: 'Step must have an "id" field',
      suggestion: 'Add id: "unique-step-identifier"',
    });
  }
  
  if (!step.instruction) {
    errors.push({
      stepIndex: index,
      stepId: step.id,
      severity: 'error',
      type: 'MISSING_FIELD',
      message: 'Step must have an "instruction" field',
      suggestion: 'Add instruction: "Tell user what to do"',
    });
  }
  
  if (!step.completionCondition) {
    errors.push({
      stepIndex: index,
      stepId: step.id,
      severity: 'error',
      type: 'MISSING_COMPLETION',
      message: 'Step must have a completionCondition function',
      suggestion: 'Add completionCondition: (state) => boolean',
    });
  }
  
  if (!step.metadata) {
    errors.push({
      stepIndex: index,
      stepId: step.id,
      severity: 'error',
      type: 'MISSING_METADATA',
      message: 'Step must have metadata for validation',
      suggestion: 'Add metadata: { stateModifyingActions, requiredStateConditions, idempotent }',
    });
    return errors; // Can't continue validation without metadata
  }
  
  // ===== CHECK 2: Stuck Detection =====
  
  if (!step.metadata.maxActionsBeforeStuck && !step.recovery?.stuckDetection) {
    errors.push({
      stepIndex: index,
      stepId: step.id,
      severity: 'warning',
      type: 'NO_STUCK_DETECTION',
      message: 'Step has no mechanism to detect if user is stuck',
      suggestion: 'Add metadata.maxActionsBeforeStuck or recovery.stuckDetection',
    });
  }
  
  // ===== CHECK 3: Completability =====
  
  const hasStateModifyingActions = step.metadata.stateModifyingActions.length > 0;
  const hasAllowedActions = Object.values(step.allowedActions || {}).some(v => v === true);
  
  if (!hasStateModifyingActions && !step.metadata.idempotent) {
    errors.push({
      stepIndex: index,
      stepId: step.id,
      severity: 'error',
      type: 'UNCOMPLETABLE_STEP',
      message: 'Step cannot be completed - no state-modifying actions allowed',
      suggestion: 'Either add state-modifying actions or mark idempotent: true',
    });
  }
  
  if (!hasAllowedActions && !step.metadata.idempotent) {
    errors.push({
      stepIndex: index,
      stepId: step.id,
      severity: 'warning',
      type: 'NO_ALLOWED_ACTIONS',
      message: 'Step has no allowed actions',
      suggestion: 'Add at least one action to allowedActions or mark idempotent: true',
    });
  }
  
  // ===== CHECK 4: Recovery Mechanisms =====
  
  if (!step.recovery && !step.metadata.allowSkip && !step.metadata.allowUndo) {
    errors.push({
      stepIndex: index,
      stepId: step.id,
      severity: 'warning',
      type: 'NO_RECOVERY',
      message: 'Step has no recovery mechanism if user gets stuck',
      suggestion: 'Add recovery.autoRecover, allowSkip, or allowUndo',
    });
  }
  
  // ===== CHECK 5: Constraint Validation =====
  
  if (step.constraints?.gridConstraints) {
    const { maxFilled, minEmpty } = step.constraints.gridConstraints;
    
    if (maxFilled !== undefined && minEmpty !== undefined) {
      if (maxFilled + minEmpty > 100) {
        errors.push({
          stepIndex: index,
          stepId: step.id,
          severity: 'error',
          type: 'CONTRADICTORY_CONSTRAINTS',
          message: `Grid constraints impossible: maxFilled(${maxFilled}) + minEmpty(${minEmpty}) > 100`,
          suggestion: 'Adjust constraints so they can both be satisfied',
        });
      }
    }
    
    if (maxFilled !== undefined && maxFilled < 0) {
      errors.push({
        stepIndex: index,
        stepId: step.id,
        severity: 'error',
        type: 'INVALID_CONSTRAINT',
        message: `maxFilled cannot be negative: ${maxFilled}`,
      });
    }
    
    if (minEmpty !== undefined && minEmpty < 0) {
      errors.push({
        stepIndex: index,
        stepId: step.id,
        severity: 'error',
        type: 'INVALID_CONSTRAINT',
        message: `minEmpty cannot be negative: ${minEmpty}`,
      });
    }
  }
  
  return errors;
}

// ============================================================================
// STEP SEQUENCE VALIDATION
// ============================================================================

/**
 * Validate that steps build on each other logically.
 * 
 * Checks for:
 * - Broken dependencies (step requires state previous step can't produce)
 * - Contradictory constraints between steps
 * 
 * @param steps - All tutorial steps
 * @returns Array of validation errors
 */
function validateStepSequence(steps: TutorialStepConfig[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (let i = 1; i < steps.length; i++) {
    const prevStep = steps[i - 1];
    const currStep = steps[i];
    
    // Check if current step has requirements
    if (!currStep.metadata?.requiredStateConditions) {
      continue;
    }
    
    const required = currStep.metadata.requiredStateConditions;
    
    // Check if previous step can produce required state
    // This is a simplified check - in a real implementation you'd do deeper analysis
    if (Object.keys(required).length > 0) {
      const canProduce = prevStep.metadata?.stateModifyingActions.length > 0 || 
                        prevStep.metadata?.idempotent;
      
      if (!canProduce && !prevStep.metadata?.idempotent) {
        errors.push({
          stepIndex: i,
          stepId: currStep.id,
          severity: 'warning',
          type: 'POTENTIAL_DEPENDENCY_ISSUE',
          message: `Step "${currStep.id}" has required conditions, but "${prevStep.id}" may not produce them`,
          suggestion: 'Verify previous step produces required state',
        });
      }
    }
    
    // Check for contradictory constraints
    if (prevStep.constraints && currStep.constraints) {
      const contradiction = findConstraintContradiction(
        prevStep.constraints,
        currStep.constraints
      );
      
      if (contradiction) {
        errors.push({
          stepIndex: i,
          stepId: currStep.id,
          severity: 'error',
          type: 'CONSTRAINT_CONTRADICTION',
          message: contradiction,
          suggestion: 'Adjust constraints to be compatible',
        });
      }
    }
  }
  
  return errors;
}

/**
 * Find contradictions between two sets of constraints
 */
function findConstraintContradiction(
  prev: StepConstraints,
  curr: StepConstraints
): string | null {
  // Check grid constraints
  if (prev.gridConstraints && curr.gridConstraints) {
    const prevMax = prev.gridConstraints.maxFilled;
    const currMin = curr.gridConstraints.minEmpty;
    
    if (prevMax !== undefined && currMin !== undefined) {
      // If previous step allows max 50 filled, and current requires min 60 empty,
      // that means current needs max 40 filled, which is compatible
      const currMaxFilled = 100 - currMin;
      if (currMaxFilled < prevMax) {
        return `Previous step allows up to ${prevMax} filled tiles, but current step requires at most ${currMaxFilled}`;
      }
    }
  }
  
  return null;
}

// ============================================================================
// STATE TRANSITION VALIDATION
// ============================================================================

/**
 * Validate state transitions between steps.
 * 
 * This performs deeper analysis to detect:
 * - Unreachable states
 * - Dead-end states
 * 
 * Note: This is a simplified version. A full implementation would
 * use graph analysis and state space exploration.
 * 
 * @param steps - All tutorial steps
 * @returns Array of validation errors
 */
function validateStateTransitions(
  steps: TutorialStepConfig[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // For each step, check if it's theoretically completable
  steps.forEach((step, index) => {
    // Skip idempotent steps (they complete automatically)
    if (step.metadata?.idempotent) {
      return;
    }
    
    // Check if step has any way to modify state
    const hasWayToProgress = 
      step.metadata?.stateModifyingActions.length > 0 &&
      Object.values(step.allowedActions || {}).some(v => v === true);
    
    if (!hasWayToProgress) {
      errors.push({
        stepIndex: index,
        stepId: step.id,
        severity: 'error',
        type: 'UNREACHABLE_COMPLETION',
        message: 'Step cannot be completed - no way to progress state',
        suggestion: 'Add allowed actions that can modify state',
      });
    }
  });
  
  return errors;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a step can produce a required state condition.
 * This is a simplified check - a full implementation would be more sophisticated.
 * 
 * NOTE: Currently unused but exported for future state graph validation.
 */
export function canStepProduceState(
  step: TutorialStepConfig,
  _requiredState: Partial<GameState>
): boolean {
  // If step is idempotent, it doesn't change state
  if (step.metadata?.idempotent) {
    return false;
  }
  
  // If step has state-modifying actions, assume it can produce some state
  // In a real implementation, you'd analyze what state each action produces
  return step.metadata?.stateModifyingActions.length > 0;
}

/**
 * Print validation report to console in a human-readable format
 */
export function printValidationReport(result: ValidationResult): void {
  if (result.valid) {
    console.log('✅ Tutorial validation passed - no errors found');
    return;
  }
  
  console.error('❌ Tutorial validation failed\n');
  
  const errors = result.errors || [];
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  
  console.error(`Found ${errorCount} error(s) and ${warningCount} warning(s)\n`);
  
  errors.forEach((error, i) => {
    const icon = error.severity === 'error' ? '❌' : '⚠️';
    console.error(`${icon} [${error.stepId}] ${error.message}`);
    if (error.suggestion) {
      console.error(`   💡 ${error.suggestion}`);
    }
    if (i < errors.length - 1) {
      console.error('');
    }
  });
  
  if (errorCount > 0) {
    console.error('\n⛔ Tutorial cannot be used until errors are fixed');
  }
}
