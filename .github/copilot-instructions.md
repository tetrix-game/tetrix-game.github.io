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
    ├── Header (music controls, menu, score, location)
    │   ├── BackgroundMusic (with MusicControlContext)
    │   ├── MenuDropdown (settings, debug tools)
    │   ├── ScoreDisplay (numeric score with gem count)
    │   ├── LocationButton (rant progression system)
    ├── Tetrix (game container)
    │   ├── Grid (10x10 game board + mouse events)
    │   │   └── TileVisual × 100 → BlockVisual
    │   └── ShapeSelector (shape management)
    │       ├── ShapeOption × N → PurchaseMenu, rotation controls
    │       └── SavedShape (optional saved shape display)
    ├── GameMap (level selection overlay)
    ├── GemShower (animated gem particles)
    └── Various overlays/notifications
```



### Critical Components

- **GemShower + GemParticle**: Physics-based gem animation system
- **MenuDropdown**: Hamburger menu with music controls, debug tools, new game
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
- **Debug tools**: MenuDropdown has "New Game" to reset all data, "Test Score" for gem testing



## Code Conventions

### File Structure

- **Components**: `ComponentName/index.ts` exports from `ComponentName.tsx`
- **Utils**: Specialized utility files (currencyUtils, scoringUtils, lineUtils, persistenceUtils)
- **Types**: Centralized in `src/utils/types.ts` with extensive type coverage
- **Tests**: Mirror structure in `src/test/` with descriptive names



### Performance Considerations

- **Memoization**: React.memo() for expensive renders (TileVisual, etc.)
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



### TypeScript Patterns

- Explicit action types with discriminated unions (`TetrixAction`)
- React.Dispatch typed as `TetrixDispatch` for type safety
- Use `React.memo()` for performance (see TileVisual)
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



## When Making Changes

- **New features**: Add reducer action + reducer state + tests + persistence if needed
- **Gem changes**: Update `currencyUtils.ts` and related tests
- **UI animations**: Consider performance implications and GPU optimization
- **Scoring changes**: Update both `scoringUtils.ts` and gem conversion
- **Shape modifications**: Check rotation, placement, and visualization systems
- **Persistence**: Use `safeBatchSave()` for any state that should persist
- **Adding actions**: Update `TetrixAction` union type + reducer switch + tests
- **State changes**: Always go through reducer actions - no direct state mutation



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