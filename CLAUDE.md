# CLAUDE.md - AI Assistant Context

## Project Overview

**Tetrix** is a Tetris-inspired block puzzle game built with React and TypeScript. The game was created for the developer's mom, who deserves an ad-free gaming experience.

Core gameplay: Place Tetris-like shapes onto a 10x10 grid to clear rows and columns, earning points and unlocking features.

## Key Architecture Files

Before making changes, **always read these base context files first**:

### 1. Core Type System
- **`src/types/core.ts`** - Foundation of everything
  - Defines: `Block`, `Tile`, `Shape`, `Location`, `ColorName`, `TileAnimation`
  - All other types build on these primitives
  - Contains serialization utilities: `tilesToArray()`, `tilesFromArray()`

- **`src/types/index.ts`** - Unified type exports
  - Single import point for all types: `import type { ... } from '../types'`

### 2. Grid System
- **`src/utils/gridConstants.ts`** - Grid configuration
  - `GRID_SIZE = 10` (configurable)
  - `GRID_ADDRESSES` - All grid keys ("R1C1" through "R10C10")
  - Helper functions: `makeTileKey()`, `parseTileKey()`

### 3. State Management
- **`src/types/gameState.ts`** - State shape and actions
  - `TetrixReducerState` - Complete application state
  - `TetrixAction` - Union of all action types
  - `GameState` - `'playing' | 'gameover'`
  - `GameMode` - `'hub' | 'infinite' | 'daily' | 'tutorial'`

- **`src/reducers/index.ts`** - Combined reducer
  - Exports `initialState` (starting state)
  - Exports `tetrixReducer` (handles all actions)
  - Composes domain-specific reducers in sequence

### 4. Context Provider
- **`src/components/Tetrix/TetrixProvider.tsx`** - App initialization
  - Loads persisted state from IndexedDB
  - Provides state and dispatch to components
  - Handles initialization lifecycle

- **`src/components/Tetrix/TetrixContext.ts`** - React Context
  - `useTetrixStateContext()` - Read state
  - `useTetrixDispatchContext()` - Dispatch actions

## Reducer Architecture

The codebase uses a **modular reducer pattern**:

1. **`tileReducer`** - Grid operations, placement, line clearing
2. **`dragReducer`** - Shape selection, mouse tracking, drag animations
3. **`shapeReducer`** - Shape queue, rotation, addition/removal
4. **`scoringReducer`** - Score, gems, coin display
5. **`gameStateReducer`** - Game modes, levels, modifiers, settings

Order matters! `tileReducer` runs first to update tiles/score before other reducers need that state.

## Common Patterns

### Reading State
```tsx
const { tiles, score, gameState } = useTetrixStateContext();
```

### Dispatching Actions
```tsx
const dispatch = useTetrixDispatchContext();
dispatch({ type: 'PLACE_SHAPE', value: { location } });
```

### Working with Tiles
- Tiles are stored in a `Map<string, Tile>` keyed by position ("R1C1")
- Always use `makeTileKey(row, col)` to create keys
- Grid uses 1-indexed coordinates (R1C1 is top-left, not R0C0)

### Persistence
- Handled by `PersistenceListener` component (observes state changes)
- Uses IndexedDB via `src/utils/persistence.ts`
- Never persist derived state (like `gameState === 'gameover'`)

## Before Making Changes

1. **Read the relevant reducer** to understand action handling
2. **Check existing actions** in `src/types/gameState.ts` before adding new ones
3. **Test grid operations** at boundary conditions (R1C1, R10C10)
4. **Consider persistence** - will this state need to be saved/loaded?

## ESLint Architecture Rules

This project uses custom ESLint architecture plugin rules that enforce structural conventions. **IMPORTANT:** Error messages from these rules are written as step-by-step instructions for fixing the violations. Always read and follow the error message guidance.

### Key Architecture Rules

1. **`architecture/folder-export-must-match`** - React folders with declarations must be named after their exported symbol
   - Example: A folder exporting `Shared_MusicControlContext` must be named `Shared_MusicControlContext/`, not `contexts/`
   - For multiple exports, create separate folders for each
   - Error messages specify exactly what the folder should export or be named

2. **`architecture/import-from-sibling-directory-or-shared`** - Enforce proper import hierarchy
   - Modules should import from siblings or the Shared directory
   - Error messages tell you the correct import path

3. **`architecture/no-reexports`** - Prevent re-exporting from index files
   - Declare exports directly or import from the source
   - Helps maintain clear dependency graphs

4. **`architecture/shared-must-be-multi-imported`** - Shared components must be imported from 2+ files
   - Ensures components in `src/Shared/` are actually shared
   - **Test files are excluded** - imports from `src/test/` or `*.test.ts(x)` don't count
   - Only runs in CI mode (`npm run lint:ci`)

### Fixing Architecture Violations

When you encounter an architecture error:
1. **Read the error message completely** - it contains fix instructions
2. **Follow the suggested action** (rename folder, move file, change import)
3. **Update all import paths** that reference the moved/renamed module
4. **Run `npm run lint:ci`** to verify the fix

## Testing
```bash
npm run test          # Run Vitest tests
npm run dev          # Development server
npm run build        # Production build
```

## Important Constraints

- **1-indexed grid**: Rows and columns start at 1, not 0
- **Immutable state**: Always return new objects from reducers
- **Animation timing**: Uses `performance.now()` for frame-perfect animations
- **No derived state**: Calculate on-the-fly, don't store

## File Organization

```
src/
├── types/              # Type definitions (core, gameState, etc.)
├── reducers/           # State management (modular reducers)
├── components/         # React components
├── utils/              # Shared utilities (gridConstants, persistence, etc.)
└── App.tsx            # Main app component
```

## Contact

Questions? Email: tannerbroberts@gmail.com
