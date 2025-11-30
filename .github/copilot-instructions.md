# Tetrix Game - AI Coding Agent Instructions

## Project Overview

This is a Tetris-inspired puzzle game built with React, TypeScript, and Vite. Players drag and drop shapes (stored as 4x4 grids) onto a 10x10 grid. The game has evolved into a comprehensive system with scoring, level progression, and advanced features.



## Architecture & State Management
Prefer changes that REMOVE complexity and state where possible.

### Core State Pattern (Reducer-Based)

- **Central reducer**: `src/components/Tetrix/TetrixReducer.ts` manages all game state
- **Context split**: Separate contexts for state (`TetrixStateContext`) and dispatch (`TetrixDispatchContext`) in `TetrixContext.ts`
- **Global provider**: `TetrixProvider` wraps the entire app in `Main.tsx` (NOT in `App.tsx`)
- Always use custom hooks `useTetrixStateContext()` and `useTetrixDispatchContext()` - they enforce provider usage with error checks



### State Shape (TetrixReducerState)
- found in `src/components/Tetrix/TetrixReducer.ts`

## Key Systems

### Scoring System (`src/utils/currencyUtils.ts`)

- **Exponential scoring**: `(rows)² + (columns)² + (rows × columns × 2)`
- **Gem shower**: Animated blue gem particles appear when scoring
- **Performance tiers**: Different rendering strategies based on gem count
- Key functions: Simplified currency system using only blue gems



### Shape Rotation & Purchase System

- **Rotation menus**: Per-shape UI for clockwise/counterclockwise rotation
- **Gem spending**: Spend 1 gem to unlock rotation for individual shapes
- **State tracking**: `openRotationMenus[]` array tracks menu visibility per shape
- **Animation states**: `removingShapeIndex`, `shapesSliding` for smooth transitions



### Persistence System (`src/utils/persistenceUtils.ts`)

- **IndexedDB primary**: Granular data storage (score, tiles, shapes, settings separately)
- **Batch saving**: `safeBatchSave()` for efficient multi-data updates
- **Fallback systems**: localStorage for backward compatibility
- **Data types**: Score, Tiles, Shapes, MusicSettings all persist separately



### Level & Map System

- **GameState**: 'playing' vs 'map' modes
- **Level progression**: currentLevel tracking with SET_LEVEL action
- **Map unlock**: Costs points, provides level selection interface
- **Future expansion**: Placeholder for full level map implementation



## Component Architecture

### Updated Component Hierarchy

```
Main.tsx (wraps with TetrixProvider)
└── App.tsx
    ├── MainMenu (hub menu for mode selection)
    ├── Header (music controls, back button/settings, score, location)
    │   ├── BackgroundMusic (with MusicControlContext)
    │   ├── SettingsOverlay (settings, debug tools) OR Back button (in infinite mode)
    │   ├── ScoreDisplay (numeric score with gem count)
    │   ├── LocationButton (rant progression system)
    ├── Tetrix (game container)
    │   ├── Grid (10x10 game board + mouse events)
    │   │   └── TetrixTile × 100 → BlockVisual
    │   └── GameControlsPanel (layout container for game controls)
    │       ├── ShapeQueue (flex container for shapes + indicator)
    │       │   ├── ShapeSelector (shape content wrapper)
    │       │   │   └── ShapeOption × N → PurchaseMenu, rotation controls
    │       │   └── QueueIndicator (next shape preview)
    │       └── PurchasesContainer (turn buttons)
    ├── GameMap (level selection overlay)
    ├── GemShower (animated gem particles)
    └── Various overlays/notifications
```



### Critical Components

- **GemShower + GemParticle**: Physics-based gem animation system
- **MainMenu**: Hub-and-spokes menu for game mode selection (formerly HubMenu)
- **SettingsOverlay**: Settings overlay with music controls, debug tools, new game (formerly MenuDropdown)
- **Header**: Shows back button in infinite mode, settings overlay in other modes
- **PurchaseMenu**: Gem spending UI for shape rotation unlock
- **GameMap**: Level selection interface (placeholder for future expansion)
- **ScoreDisplay**: Shows numeric score with gem count



### Data Flow Patterns

- **Scoring events**: ADD_SCORE → GemShower animation → Score display update
- **Shape management**: Drag → Place → Line clearing → Scoring → Auto-select next
- **Persistence**: All major state changes trigger `safeBatchSave()` calls
- **Music context**: Separate context in Header for music controls



## Key Data Structures

### Shape System (Updated)

- **Shape**: 4x4 grid of `Block[][]` (expanded from 3x3)
- **Block**: `{ color: {...}, isFilled: boolean }` - color has 5 shades for 3D effect
- **Location**: `{ row, column }` - **1-indexed** (1-10, not 0-9)
- Shapes are positioned by their **center point**, not top-left corner



### Shape Utilities (`src/utils/shapeUtils.ts`)

Critical functions that handle shape-to-grid mapping:
- `getShapeCenter()`: Calculates center based on filled blocks only
- `getFilledBlocksRelativeToCenter()`: Maps filled blocks relative to center
- `getShapeGridPositions()`: Converts shape + center location → grid positions
- `mousePositionToGridLocation()`: Converts mouse coords → grid location
- `rotateShape()`: Handles clockwise/counterclockwise rotation
- Use these instead of manual coordinate math - they handle the center-based positioning



## Development Workflow

### Subagent Delegation Pattern

**CRITICAL MANDATE**: Subagents are a **standard development tool**, not an edge case. Use them proactively for efficiency.

**When to Use Subagents**:
- ✅ Complex multi-file refactors with clear acceptance criteria (see `GAME_CONTROLS_SIZING.md` as example)
- ✅ Repetitive but coordinated work across many components
- ✅ When primary agent approaches token budget limits (>50% consumed)
- ✅ Tasks requiring extensive testing/validation cycles
- ✅ Work that can be clearly scoped with concrete deliverables
- ✅ Parallel workstreams (one for implementation, one for tests, one for docs)

**When NOT to Use Subagents**:
- ❌ Simple single-file edits
- ❌ Exploratory work without clear success criteria
- ❌ User questions requiring back-and-forth clarification
- ❌ Tasks where coordination overhead exceeds efficiency gains

**How to Use Subagents Effectively**:

1. **Provide Comprehensive Context**:
   - Reference relevant documentation files (like `GAME_CONTROLS_SIZING.md`)
   - Summarize completed work and remaining tasks
   - Include code snippets showing patterns to follow
   - Specify exactly what changed and what needs to change

2. **Define Clear Deliverables**:
   ```markdown
   DELIVERABLES:
   - [ ] Update 5 components to use new CSS variable pattern
   - [ ] Add 3 new test cases covering edge cases
   - [ ] Document new patterns in copilot-instructions.md
   - [ ] Verify no TypeScript errors
   - [ ] Report back with summary of changes made
   ```

3. **Give Autonomy Within Constraints**:
   - "Use CSS variables for sizing" = good constraint
   - "Must use exactly 42.7px" = overly prescriptive
   - Let subagent make implementation decisions within architectural guidelines

4. **Parallel Workstreams**:
   ```typescript
   // Example delegation strategy
   Subagent 1: Implement CSS variable propagation in 5 components
   Subagent 2: Write integration tests for new sizing system
   Subagent 3: Update documentation files
   Main Agent: Coordinate, review, synthesize results
   ```

5. **Acceptance Criteria as Specifications**:
   - Create `[FEATURE]_ACCEPTANCE_CRITERIA.md` files upfront
   - Use them as specifications for subagent tasks
   - Example: `GAME_CONTROLS_SIZING.md` provided complete success metrics

**Subagent Coordination Responsibilities**:
- **Main agent**: Task breakdown, context gathering, acceptance criteria creation
- **Subagents**: Autonomous execution within defined scope
- **Main agent**: Results synthesis, user communication, final validation

**Example Delegation**:
```markdown
Task: "Update all game control buttons to unified sizing system"

Context:
- See GAME_CONTROLS_SIZING.md for complete specification
- buttonSizeMultiplier now in state (0.5-1.5 range)
- GameControlsPanel sets --game-controls-button-size CSS variable
- Components already identified: ShapeOption, QueueIndicator, TurnButton

Deliverables:
- Remove hardcoded sizes from identified components
- Use var(--game-controls-button-size) in all CSS/styles
- Verify buttons are perfectly square
- Test at 50%, 100%, 150% multiplier values
- Report any components that don't fit the pattern

Success: All buttons same size, scale together, no clipping
```

**Token Budget Management**:
- Monitor token usage proactively
- At 40-50% budget: Consider delegating remaining work
- At 60%+ budget: Strong signal to delegate
- Don't wait until 90% - leaves no room for coordination

**Benefits of Subagent Pattern**:
- Parallel execution speeds up development
- Main agent maintains architectural oversight
- Deep work happens in focused sub-contexts
- Better token budget management across complex tasks
- Enables tackling larger refactors with confidence



### Essential Commands

```bash
npm run build        # TypeScript compile + Vite build
npm run publish      # Build + deploy to gh-pages branch (LIVE SITE)
npm run test         # Run Vitest tests
npm start           # Development server
```



### Testing Strategy

- **Comprehensive test suite**: scoringSystem, lineCleaning, spendGem, etc.
- **Integration tests**: lineClearingIntegration.test.ts for full score+gem flow
- **Reducer testing**: TetrixReducer.test.ts for state transitions
- **Feature-specific tests**: rotationMenuIsolation, shapeGeneration, virtualShapes
- Tests cover both unit functionality and integration between systems



### Deployment & Data Safety

- **Main branch**: Development code (safe to push directly)
- **gh-pages branch**: Live production site (created by `npm run publish`)
- **Persistent data**: IndexedDB storage means users don't lose progress on updates
- **Debug tools**: SettingsOverlay has "New Game" to reset all data, "Test Score" for gem testing



## Code Conventions

### File Structure

- **Components**: `ComponentName/index.ts` exports from `ComponentName.tsx`
- **Utils**: Specialized utility files (currencyUtils, scoringUtils, lineUtils, persistenceUtils)
- **Types**: Centralized in `src/utils/types.ts` with extensive type coverage
- **Tests**: Mirror structure in `src/test/` with descriptive names



### Performance Considerations

- **Memoization**: React.memo() for expensive renders (TetrixTile, etc.)
- **Animation optimization**: GPU hints, will-change, transform-based animations
- **Gem particle limits**: Performance tiers for different gem amounts
- **Batch operations**: Database saves bundled via `safeBatchSave()`



### Styling Approach

- Mix of CSS files and inline `style` objects (especially in Grid, ShapeOption)
- BlockVisual uses inline styles for dynamic color borders
- Grid uses `gridTemplateColumns/Rows: "repeat(10, 1fr)"` for 10x10 layout
- **Z-index layers**: Use CSS variables defined in `App.css` (e.g., `var(--z-board)`, `var(--z-overlay)`) instead of hardcoded values.
  - `--z-board` (10): Grid tiles
  - `--z-block` (20): Placed blocks
  - `--z-ui` (100): Header, standard UI
  - `--z-drag` (500): Dragging shapes
  - `--z-overlay` (1000): Game Over, Map
  - `--z-particles` (3000): Gem shower effects
  - `--z-critical` (10000): Error boundaries



### CSS Variable Propagation Strategy

**Pattern**: Parent components calculate and set CSS variables, children consume them via `var(--variable-name)`.

**Why**: Creates single source of truth for sizing, enables easy UI scaling, avoids prop drilling for styling concerns.

**Example - Unified Button Sizing**:
```typescript
// Parent (GameControlsPanel) calculates and sets CSS variable
const panelStyle = {
  '--game-controls-button-size': `${gameControlsButtonSize}px`,
} as React.CSSProperties;

// All descendants use the same variable
// ShapeOption, QueueIndicator, TurnButton all reference:
.shape-option {
  width: var(--game-controls-button-size);
  height: var(--game-controls-button-size);
}
```

**Key Principles**:
- Calculation happens once at highest level with complete context
- CSS variables flow down naturally via inheritance
- Children don't need to know HOW size is calculated
- User preferences (like `buttonSizeMultiplier`) affect entire UI from one place
- Prefer CSS variables over props for styling concerns (color, size, spacing)

**When to use**:
- Sizing that affects multiple related components
- Values that should scale together uniformly
- User-configurable styling (theme, size multipliers)
- Responsive breakpoints that affect layout

**When NOT to use**:
- Component-specific state or behavior
- Values that need validation or transformation per component
- Data that affects logic, not just presentation



### Responsive Design & Layout Conventions

**Viewport Distribution** (see `GAME_CONTROLS_SIZING.md` for full spec):
- Identify larger viewport dimension (width or height)
- Subtract header height: `10vh`
- Grid gets **2/3** of available space: `gridSize = (largerDim - header) * 2/3`
- Controls get **1/3** of available space: `controlsSize = (largerDim - header) * 1/3`

**Unified Button Sizing**:
- All game control buttons use identical size (perfect squares)
- Base calculation: `controlsSize / 3.5` (allows 3 shapes + indicator + spacing)
- User multiplier applied: `finalSize = baseSize * buttonSizeMultiplier` (0.5 to 1.5)
- Affects: ShapeOptions, QueueIndicator, TurnButtons - all same size

**Component Hierarchy Pattern** (ShapeQueue → ShapeSelector):
- **Parent manages layout/positioning**: ShapeQueue handles flex container, orientation, wrapping
- **Child manages content**: ShapeSelector handles shape rendering, interaction states
- Parent sets explicit dimensions via CSS variables
- Child uses `width: fit-content` and `height: fit-content` to adapt

**Orientation-Aware Flexbox**:
```typescript
// Portrait: vertical stack, controls below grid
flexDirection: isPortrait ? 'column' : 'row'

// ShapeQueue adapts orientation
flexDirection: isPortrait ? 'row' : 'column'  // Perpendicular to main layout
```

**Why 3.5 divisor**: Allows 3 shapes + queue indicator + natural spacing from `space-around` to fit comfortably without clipping

**Responsive Sizing Hook**: `useGameSizing()` calculates all dimensions, sets CSS variables at top level

**Layout Best Practices**:
- Use `flex` with `space-around` for consistent spacing (no explicit gap)
- Use `flex-wrap: wrap` for 2D responsive layouts (shapes wrap to multiple rows)
- Parent calculates, child consumes - no component calculates its own size independently
- Test at 50% (minimum), 100% (default), 150% (maximum) multiplier values
- Ensure no clipping at any screen size or orientation



### TypeScript Patterns

- Explicit action types with discriminated unions (`TetrixAction`)
- React.Dispatch typed as `TetrixDispatch` for type safety
- Use `React.memo()` for performance (see TetrixTile)
- Prefer `useCallback` for event handlers to prevent re-renders



## Common Gotchas

1. **1-indexed locations**: Grid locations are 1-10, not 0-9 (`makeTiles()`)
2. **Score vs gems**: Score is numeric points, gems are used for rotation unlocks
3. **Shape center positioning**: Always use `shapeUtils.ts` functions for coordinates
4. **Context isolation**: TetrixContext vs MusicControlContext are separate
5. **Persistence timing**: `safeBatchSave()` is async - don't block on it
6. **Animation state**: Multiple animation states can be active simultaneously
7. **IndexedDB first**: Always try IndexedDB before localStorage fallback
8. **Gem shower performance**: Be aware of DOM particle limits for large gem amounts
9. **CSS variable inheritance**: Child components consume via `var()`, don't recalculate
10. **Unified sizing**: All game control buttons must use same CSS variable, no individual sizing
11. **Multiplier clamping**: `buttonSizeMultiplier` clamped 0.5-1.5 in reducer, not in components



## When Making Changes

- **New features**: Add reducer action + reducer state + tests + persistence if needed
- **Gem changes**: Update `currencyUtils.ts` and related tests
- **UI animations**: Consider performance implications and GPU optimization
- **Scoring changes**: Update both `scoringUtils.ts` and gem conversion
- **Shape modifications**: Check rotation, placement, and visualization systems
- **Persistence**: Use `safeBatchSave()` for any state that should persist
- **Adding actions**: Update `TetrixAction` union type + reducer switch + tests
- **State changes**: Always go through reducer actions - no direct state mutation
- **UI sizing changes**: Update CSS variables, test at 50%/100%/150% multiplier, verify no clipping
- **New UI preferences**: Add to state, create action with validation, include in GameSettings persistence
- **Responsive layout**: Test both portrait and landscape, ensure 2/3-1/3 split maintained
- **Complex refactors**: Create acceptance criteria doc, consider delegating to subagent



## Project Characteristics

- **Rapid development**: "Fast and loose" approach with direct main branch commits
- **User-focused**: Prioritizes player experience over perfect code
- **AI-assisted**: Built with AI coding tools, pragmatic TypeScript usage
- **Performance-conscious**: Optimized for smooth animations and responsiveness
- **Extensible**: Architecture supports future features (full level map, more game modes)
- **Development setup**: Assumes macOS + nvm + VSCode with format-on-save

## State Management Principles

### Avoid Derived State
State should NOT be derived from other state. The source of state should be user actions or loading from persistent data stores (localStorage, IndexedDB). 

**NEVER use useEffect to update one piece of React state based on another piece of React state.** This creates unnecessary re-renders and complexity.

#### Example of BAD state derivation:
```typescript
// VERY bad use of useEffect hook to force re-renders and derive state with no real reason
const defaultState = false
const [state, setState] = useState(defaultState);
const [moreState, setMoreState] = useState(!defaultState); // Exists to be the opposite, which could easily be derived in a non-state value inline
const onClickHandler = useCallback(() => {
  setState(!state);
}, [state]);
useEffect(() => {
  setMoreState(!!state);
}, [state, setMoreState]);
const componentWithState = <div onClick={onClickHandler}>{state ? 'State is true' : 'State is false'}</div>;
const oppositeComponentWithDerivedState = <div>{moreState ? 'opposite State is true' : 'opposite State is false'}</div>;
```

#### Example of GOOD state management:
```typescript
// MUCH better to use the same piece of state
const [singleState, setSingleState] = useState();
const onClickHandlerSingle = useCallback(() => {
  setSingleState(!singleState);
}, [singleState]);
const componentWithSingleState = <div onClick={onClickHandlerSingle}>{singleState ? 'State is true' : 'State is false'}</div>;
const oppositeComponentWithInlineCalculatedValues = <div>{!singleState ? 'opposite State is true' : 'opposite State is false'}</div>;
```

### Key Rules:
- Derive values inline during render, not in separate state
- Use the reducer pattern for complex state that needs coordination
- Only persist actual source state, not derived calculations
- User interactions and data loading are the only valid state sources



### UI Preferences in State

**Pattern**: User-configurable UI preferences belong in reducer state, not local component state.

**Example - Button Size Multiplier**:
```typescript
// In gameStateReducer.ts initial state
buttonSizeMultiplier: 1.0,  // Range: 0.5 to 1.5, default: 1.0

// Action with validation/clamping in reducer
case "SET_BUTTON_SIZE_MULTIPLIER": {
  const { multiplier } = action.value;
  const clampedMultiplier = Math.max(0.5, Math.min(1.5, multiplier));
  return {
    ...state,
    buttonSizeMultiplier: clampedMultiplier,
  };
}
```

**Why in global state**:
- Persists across sessions (via GameSettings persistence)
- Affects multiple components uniformly
- Single source of truth for UI scaling
- Accessible to sizing calculations at any level
- Can be controlled by debug tools, accessibility features, etc.

**Persistence Pattern**:
- UI preferences included in `GameSettings` type
- `safeBatchSave()` includes settings when state changes
- Loaded during app initialization via `LOAD_PERSISTED_STATE`

**Other UI preferences in state**:
- `currentTheme`: Color scheme preference
- `isMusicPlaying`: Audio preferences
- Future: Font size, animation speed, contrast settings

**Convention**: If it's user-configurable AND affects presentation across multiple components, it belongs in reducer state, not local state.