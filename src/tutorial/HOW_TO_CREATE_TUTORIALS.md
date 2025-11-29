# How to Create Tutorial Steps

This guide explains how to create new tutorial steps for the Tetrix game using the fail-fast validation system.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Step Anatomy](#step-anatomy)
3. [Required Fields](#required-fields)
4. [Validation & Safety](#validation--safety)
5. [Common Patterns](#common-patterns)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Minimal Working Example

```typescript
import type { TutorialStepConfig } from './types';

const myStep: TutorialStepConfig = {
  // 1. IDENTIFICATION
  id: 'my-unique-step-id',
  instruction: 'Click the highlighted shape',
  targetSelector: '[data-shape-index="0"]',
  
  // 2. ALLOWED ACTIONS
  allowedActions: {
    click: true,
  },
  
  // 3. COMPLETION
  completionCondition: (state) => {
    return state.dragState.selectedShape !== null;
  },
  
  // 4. METADATA (for validation)
  metadata: {
    stateModifyingActions: ['SELECT_SHAPE'],
    requiredStateConditions: { nextShapes: [] }, // Need shapes to exist
    idempotent: false,
    maxActionsBeforeStuck: 5,
    allowSkip: true,
  },
};
```

---

## Step Anatomy

Every tutorial step has 5 main sections:

### 1. Identification
```typescript
{
  id: 'unique-step-id',              // REQUIRED: Must be unique
  instruction: 'User-facing text',   // REQUIRED: What to tell user
  targetSelector: '.some-element',   // OPTIONAL: What to highlight
}
```

### 2. Behavior Control
```typescript
{
  allowedActions: {                  // REQUIRED: What user can do
    pointerDown: true,
    pointerMove: true,
    pointerUp: true,
  },
  
  validationFn: (event, state) => {  // OPTIONAL: Fine-grained control
    // Return true to allow event, false to block
    const target = event.target as HTMLElement;
    return target.matches('[data-shape-index="0"]');
  },
  
  completionCondition: (state) => {  // REQUIRED: When is step done?
    return state.score > 0;
  },
}
```

### 3. Validation Metadata
```typescript
{
  metadata: {                        // REQUIRED: Validation data
    stateModifyingActions: ['PLACE_SHAPE', 'ADD_SCORE'],
    requiredStateConditions: { score: 0 },
    idempotent: false,
    maxActionsBeforeStuck: 10,
    allowSkip: true,
    allowUndo: true,
  },
}
```

### 4. Constraints (Safety)
```typescript
{
  constraints: {                     // OPTIONAL: Prevent dead-ends
    forcedShapes: [generateIPiece('blue')],
    
    gridConstraints: {
      maxFilled: 10,                 // Can't fill more than 10 tiles
      minEmpty: 90,                  // Must keep 90 tiles empty
      noBlockedRows: true,           // Ensure completable row exists
      noBlockedColumns: true,        // Ensure completable column exists
    },
  },
}
```

### 5. Recovery Mechanisms
```typescript
{
  recovery: {                        // OPTIONAL: Help stuck users
    stuckDetection: (state, history) => {
      // Return true if user is stuck
      return history.filter(a => a.type === 'INVALID').length >= 3;
    },
    
    stuckHint: 'Try placing the shape in an empty area',
    
    autoRecover: (state) => {
      // Fix the state automatically
      return { ...state, tiles: getEmptyTiles() };
    },
    
    allowReset: true,
  },
}
```

---

## Required Fields

### Minimum Required Fields

Every step MUST have:

1. **`id`** - Unique identifier (string)
2. **`instruction`** - User-facing text (string)
3. **`allowedActions`** - What user can do (object)
4. **`completionCondition`** - When step is done (function)
5. **`metadata`** - Validation metadata (object)

```typescript
// ✅ VALID - Has all required fields
const validStep: TutorialStepConfig = {
  id: 'step-1',
  instruction: 'Do something',
  allowedActions: { click: true },
  completionCondition: (state) => true,
  metadata: {
    stateModifyingActions: ['ACTION'],
    requiredStateConditions: {},
    idempotent: false,
  },
};

// ❌ INVALID - Missing metadata
const invalidStep = {
  id: 'step-1',
  instruction: 'Do something',
  allowedActions: { click: true },
  completionCondition: (state) => true,
  // Missing metadata!
};
```

### Metadata Fields

The `metadata` object requires:

- **`stateModifyingActions`**: Array of action types that change game state
- **`requiredStateConditions`**: What state must exist before this step
- **`idempotent`**: Can step be completed from any valid prior state?

Optional but recommended:
- **`maxActionsBeforeStuck`**: Max actions before user is considered stuck
- **`allowSkip`**: Let user skip if they get frustrated
- **`allowUndo`**: Let user undo recent actions

---

## Validation & Safety

### The Three Validation Layers

#### 1. Static Validation (Build Time)

Runs when you start the app. Checks:
- All required fields present
- No contradictory constraints
- Steps build on each other logically

```typescript
// This will FAIL validation at build time:
const badStep: TutorialStepConfig = {
  id: 'impossible-step',
  instruction: 'Do the impossible',
  allowedActions: {},  // ❌ No allowed actions!
  completionCondition: (state) => state.score > 100,
  metadata: {
    stateModifyingActions: [],  // ❌ Can't modify state, can't complete!
    requiredStateConditions: {},
    idempotent: false,
  },
};
```

#### 2. Runtime Monitoring (During Play)

Watches user as they play. Detects:
- Too many actions without progress
- Repeated failed attempts (infinite loops)
- Game states where completion is impossible

```typescript
// Good practice: Set maxActionsBeforeStuck
metadata: {
  maxActionsBeforeStuck: 15,  // User stuck if >15 actions
  // ...
}
```

#### 3. Recovery System

Kicks in when user gets stuck:
1. Show hint (after 10 seconds)
2. Offer undo (after hint)
3. Offer reset (after undo)
4. Auto-fix state (if provided)
5. Allow skip (last resort)

---

## Common Patterns

### Pattern 1: "Click an Element"

```typescript
{
  id: 'click-button',
  instruction: 'Click the Start button',
  targetSelector: '.start-button',
  
  allowedActions: {
    click: true,
  },
  
  validationFn: (event) => {
    const target = event.target as HTMLElement;
    return target.matches('.start-button');
  },
  
  completionCondition: (state) => {
    return state.hasStarted === true;
  },
  
  metadata: {
    stateModifyingActions: ['START_GAME'],
    requiredStateConditions: {},
    idempotent: true,  // Can click from any state
    maxActionsBeforeStuck: 3,
    allowSkip: true,
  },
  
  highlightConfig: {
    spotlightRadius: 100,
    dimOverlayOpacity: 0.9,
    pulse: true,
  },
}
```

### Pattern 2: "Drag and Drop"

```typescript
{
  id: 'drag-shape-to-grid',
  instruction: 'Drag this shape onto the grid',
  targetSelector: '[data-shape-index="0"]',
  
  allowedActions: {
    pointerDown: true,
    pointerMove: true,
    pointerUp: true,
  },
  
  validationFn: (event, state) => {
    // Only allow interaction with first shape and grid
    const target = event.target as HTMLElement;
    return target.closest('[data-shape-index="0"]') !== null ||
           target.closest('.grid') !== null;
  },
  
  completionCondition: (state) => {
    // Complete when shape is placed
    return state.dragState.phase === 'placing' ||
           Array.from(state.tiles.values()).some(t => t.isFilled);
  },
  
  metadata: {
    stateModifyingActions: ['SELECT_SHAPE', 'PLACE_SHAPE'],
    requiredStateConditions: {
      nextShapes: [], // Need shapes
    },
    idempotent: false,
    maxActionsBeforeStuck: 20,
    allowSkip: false, // Core mechanic, shouldn't skip
    allowUndo: true,
  },
  
  constraints: {
    // Force an easy-to-place shape
    forcedShapes: [generateIPiece('blue')],
    
    gridConstraints: {
      maxFilled: 4,  // Only 4 blocks in I-piece
      minEmpty: 96,
    },
  },
  
  recovery: {
    stuckDetection: (state, history) => {
      // Stuck if tried to place 5 times without success
      const failedPlacements = history.filter(
        a => a.type === 'RETURN_SHAPE_TO_SELECTOR'
      );
      return failedPlacements.length >= 5;
    },
    
    stuckHint: 'Try placing the shape vertically or horizontally in an empty area',
    
    allowReset: true,
  },
  
  highlightConfig: {
    spotlightRadius: 150,
    dimOverlayOpacity: 0.8,
  },
}
```

### Pattern 3: "Complete a Goal"

```typescript
{
  id: 'clear-first-line',
  instruction: 'Fill a complete row or column to clear it',
  targetSelector: null, // No specific target
  
  allowedActions: {
    pointerDown: true,
    pointerMove: true,
    pointerUp: true,
  },
  
  completionCondition: (state) => {
    // Complete when any line has been cleared
    return state.totalLinesCleared > 0;
  },
  
  metadata: {
    stateModifyingActions: ['PLACE_SHAPE', 'CLEAR_LINES'],
    requiredStateConditions: {
      nextShapes: [], // Need shapes
    },
    idempotent: false,
    maxActionsBeforeStuck: 50, // More complex goal
    allowSkip: true,
  },
  
  constraints: {
    // Provide shapes that can complete a line
    forcedShapes: generateTutorialShapesForLineClearing(),
    
    gridConstraints: {
      noBlockedRows: true,    // Must be able to complete a row
      noBlockedColumns: true, // Must be able to complete a column
    },
  },
  
  recovery: {
    stuckDetection: (state, history) => {
      // Stuck if 30 actions without clearing a line
      return history.length > 30 && state.totalLinesCleared === 0;
    },
    
    stuckHint: 'Look for a row or column that is almost full. Place shapes to complete it!',
    
    autoRecover: (state) => {
      // Set up an almost-complete row for easy win
      return setupAlmostCompleteRow(state);
    },
    
    allowReset: true,
  },
  
  highlightConfig: {
    spotlightRadius: 0, // No specific target, light dim only
    dimOverlayOpacity: 0.3,
  },
}
```

### Pattern 4: "Observe a Result"

```typescript
{
  id: 'watch-line-clear-animation',
  instruction: 'Watch the blocks disappear!',
  targetSelector: null,
  
  allowedActions: {}, // User can't do anything, just watch
  
  completionCondition: (state) => {
    // Auto-complete after animation finishes
    // (In real implementation, you'd track animation state)
    return state.animationsComplete === true;
  },
  
  metadata: {
    stateModifyingActions: [], // No user actions
    requiredStateConditions: {
      totalLinesCleared: 1, // Previous step must have cleared a line
    },
    idempotent: true,
    maxActionsBeforeStuck: 0, // Not applicable
    allowSkip: true, // Let impatient users skip
  },
  
  onComplete: () => {
    // Trigger celebration animation
    showCelebration();
  },
}
```

---

## Testing

### 1. Add Your Step to Configuration

```typescript
// tutorialSteps.ts
import type { TutorialStepConfig } from './types';

export const tutorialSteps: TutorialStepConfig[] = [
  // ... existing steps
  myNewStep,
];
```

### 2. Run Static Validation

```bash
npm start  # Validation runs automatically
```

If validation fails, you'll see:
```
❌ TUTORIAL VALIDATION FAILED
  - [my-step-id] Step has no mechanism to detect if user is stuck
    💡 Add maxActionsBeforeStuck or recovery.stuckDetection
```

### 3. Test Manually

Play through the tutorial and verify:
- [ ] Instructions are clear
- [ ] Highlight appears on correct element
- [ ] Only allowed actions work
- [ ] Blocked actions show feedback
- [ ] Step completes when expected
- [ ] Recovery works if you deliberately get stuck

### 4. Run Simulation (Optional but Recommended)

```bash
npm run simulate-tutorial
```

This runs 100 simulated users through your tutorial with different behaviors:
- Optimal (does everything right)
- Random (chaos mode)
- Malicious (tries to break it)
- Confused (makes mistakes)
- Impatient (spam clicks)

If any simulation fails, you'll see:
```
❌ Tutorial has possible failure modes:
  - [my-step-id] DEAD_END_STATE: Current game state cannot satisfy completion condition
```

---

## Troubleshooting

### Error: "Step has no allowed actions that progress state"

**Problem:** Your step has no way to be completed.

**Solution:** Either:
1. Add state-modifying actions to `allowedActions`
2. Mark step as `idempotent: true` if it doesn't need user action

```typescript
// ❌ BAD
{
  allowedActions: {},
  metadata: { idempotent: false }
}

// ✅ GOOD (Option 1)
{
  allowedActions: { click: true },
  metadata: { idempotent: false }
}

// ✅ GOOD (Option 2)
{
  allowedActions: {},
  metadata: { idempotent: true }
}
```

### Error: "Step cannot be reached from previous step"

**Problem:** Previous step doesn't produce the state your step needs.

**Solution:** Check `metadata.requiredStateConditions` matches what previous step produces.

```typescript
// Step 1 produces: { score: 0 }
// Step 2 requires: { score: 100 }  ❌ IMPOSSIBLE!

// Fix:
// Step 2 requires: { score: 0 }  ✅ MATCHES
```

### Warning: "Step has no recovery mechanism"

**Problem:** If user gets stuck, they're permanently stuck.

**Solution:** Add at least one recovery option:

```typescript
recovery: {
  stuckHint: 'Hint message',
  allowReset: true,
  // OR
  autoRecover: (state) => fixState(state),
}
```

### User Gets Stuck During Testing

**Immediate Fixes:**

1. **Lower the difficulty**
   ```typescript
   constraints: {
     forcedShapes: [easyShape], // Easier shape
     gridConstraints: {
       noBlockedRows: true, // Ensure always winnable
     },
   }
   ```

2. **Add recovery**
   ```typescript
   recovery: {
     stuckHint: 'More specific hint here',
     autoRecover: (state) => {
       // Set up a winning position
       return setupWinningState(state);
     },
   }
   ```

3. **Allow skip**
   ```typescript
   metadata: {
     allowSkip: true, // Last resort
   }
   ```

---

## Best Practices

### ✅ DO

- **Use descriptive IDs**: `'place-first-shape'` not `'step1'`
- **Write clear instructions**: Be specific about what to do
- **Set maxActionsBeforeStuck**: Prevents infinite loops
- **Add recovery mechanisms**: Users should never be permanently stuck
- **Test with simulation**: Catches edge cases you won't think of
- **Use constraints**: Prevent dead-end states proactively
- **Allow skipping on complex steps**: Not everyone has patience

### ❌ DON'T

- **Don't make steps too long**: Break into smaller steps
- **Don't assume user knowledge**: Explain everything
- **Don't use vague completion conditions**: Be precise
- **Don't forget edge cases**: What if user clicks wrong thing?
- **Don't block all actions**: Give user feedback on why action blocked
- **Don't skip validation**: It's there to save you debugging time

---

## Advanced: Custom Validation Functions

For complex steps, use `validationFn` for fine-grained control:

```typescript
validationFn: (event, state) => {
  // Only allow placing shapes if grid isn't too full
  if (state.tiles.filter(t => t.isFilled).length > 50) {
    showToast('Grid is too full! Clear some lines first.');
    return false;
  }
  
  // Only allow selecting shapes that can fit somewhere
  if (event.type === 'pointerdown') {
    const shapeIndex = getShapeIndexFromEvent(event);
    const shape = state.nextShapes[shapeIndex];
    
    if (!canShapeFitAnywhere(shape, state.tiles)) {
      showToast('This shape cannot fit anywhere! Try rotating it.');
      return false;
    }
  }
  
  return true; // Allow event
},
```

---

## Example: Complete Tutorial Sequence

```typescript
export const tutorialSteps: TutorialStepConfig[] = [
  // Step 1: Introduction
  {
    id: 'welcome',
    instruction: 'Welcome to Tetrix! Click to continue.',
    allowedActions: { click: true },
    completionCondition: () => true, // Auto-complete on any click
    metadata: {
      stateModifyingActions: [],
      requiredStateConditions: {},
      idempotent: true,
      allowSkip: true,
    },
  },
  
  // Step 2: Select shape
  {
    id: 'select-first-shape',
    instruction: 'Click on this shape to pick it up',
    targetSelector: '[data-shape-index="0"]',
    allowedActions: { pointerDown: true },
    completionCondition: (state) => state.dragState.selectedShape !== null,
    metadata: {
      stateModifyingActions: ['SELECT_SHAPE'],
      requiredStateConditions: { nextShapes: [] },
      idempotent: false,
      maxActionsBeforeStuck: 5,
      allowSkip: true,
    },
    highlightConfig: {
      spotlightRadius: 120,
      dimOverlayOpacity: 0.85,
      pulse: true,
    },
  },
  
  // Step 3: Place shape
  {
    id: 'place-first-shape',
    instruction: 'Drag the shape onto the grid and release',
    targetSelector: '.grid',
    allowedActions: {
      pointerDown: true,
      pointerMove: true,
      pointerUp: true,
    },
    completionCondition: (state) => {
      return Array.from(state.tiles.values()).some(t => t.isFilled);
    },
    metadata: {
      stateModifyingActions: ['PLACE_SHAPE'],
      requiredStateConditions: {
        dragState: { selectedShape: {} },
      },
      idempotent: false,
      maxActionsBeforeStuck: 15,
      allowSkip: false,
      allowUndo: true,
    },
    constraints: {
      forcedShapes: [generateIPiece('blue')],
    },
    recovery: {
      stuckDetection: (state, history) => {
        return history.filter(a => a.type === 'RETURN_SHAPE_TO_SELECTOR').length >= 5;
      },
      stuckHint: 'Place the shape anywhere on the grid',
      allowReset: true,
    },
  },
  
  // Step 4: Complete!
  {
    id: 'tutorial-complete',
    instruction: 'Great job! You\'re ready to play!',
    allowedActions: { click: true },
    completionCondition: () => true,
    metadata: {
      stateModifyingActions: [],
      requiredStateConditions: {},
      idempotent: true,
      allowSkip: false,
    },
  },
];
```

---

## Need Help?

- Check `types.ts` for complete type definitions
- Look at `tutorialSteps.ts` for working examples
- Run validation to see specific error messages
- Use simulation to discover edge cases
- Check runtime console for stuck detection messages

Happy tutorial building! 🎓
