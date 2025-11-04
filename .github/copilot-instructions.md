# Tetrix Game - AI Coding Agent Instructions

## Project Overview
This is a Tetris-inspired puzzle game built with React, TypeScript, and Vite. Players drag and drop shapes (stored as 3x3 grids) onto a 10x10 grid. The game uses a reducer pattern for state management with React Context.

## Architecture & State Management

### Core State Pattern (Reducer-Based)
- **Central reducer**: `src/components/Tetrix/tetrixReducer.ts` manages all game state
- **Context split**: Separate contexts for state (`TetrixStateContext`) and dispatch (`TetrixDispatchContext`) in `TetrixContext.ts`
- **Global provider**: `TetrixProvider` wraps the entire app in `Main.tsx` (NOT in `App.tsx`)
- Always use custom hooks `useTetrixStateContext()` and `useTetrixDispatchContext()` - they enforce provider usage with error checks

### State Shape (TetrixReducerState)
```typescript
{
  tiles: Tile[];              // 100 tiles (10x10 grid), 1-indexed locations
  nextShapes: Shape[];        // Available shapes to place
  selectedShape: Shape | null;
  mouseGridLocation: Location | null;  // Current hover position
  isShapeDragging: boolean;
  hoveredBlockPositions: Array<{ location: Location; block: Block }>;
}
```

### Reducer Actions
- `SELECT_SHAPE`: Sets selectedShape, enables dragging, calculates hover preview
- `UPDATE_MOUSE_LOCATION`: Tracks mouse position, recalculates hover positions
- `PLACE_SHAPE`: Applies shape to grid, auto-selects next shape if available
- `CLEAR_SELECTION`: Resets drag state (triggered by ESC key)
- `SET_AVAILABLE_SHAPES`: Updates available shapes pool

## Key Data Structures

### Shape System
- **Shape**: 3x3 grid of `Block[][]` - NOT all blocks are filled
- **Block**: `{ color: {...}, isFilled: boolean }` - color has 5 shades for 3D effect
- **Location**: `{ row, column }` - **1-indexed** (1-10, not 0-9)
- Shapes are positioned by their **center point**, not top-left corner

### Shape Utilities (`src/utils/shapeUtils.ts`)
Critical functions that handle shape-to-grid mapping:
- `getShapeCenter()`: Calculates center based on filled blocks only
- `getFilledBlocksRelativeToCenter()`: Maps filled blocks relative to center
- `getShapeGridPositions()`: Converts shape + center location → grid positions
- `mousePositionToGridLocation()`: Converts mouse coords → grid location
- Use these instead of manual coordinate math - they handle the center-based positioning

## Component Architecture

### Component Hierarchy
```
Main.tsx (wraps with TetrixProvider)
└── App.tsx
    ├── Header
    ├── Tetrix (game container)
    │   ├── Grid (10x10 game board)
    │   │   └── TileVisual × 100
    │   │       └── BlockVisual
    │   └── ShapeSelector (shape picker)
    │       ├── ShapeOption × 3
    │       │   └── BlockVisual × 9
    │       └── SavedShape
    └── FullScreenButton
```

### Component Patterns
- **Grid.tsx**: Event hub - handles mousemove, click, mouseleave, ESC key
- **TileVisual.tsx**: Memoized tile renderer, shows hover preview via `isHovered` prop
- **BlockVisual.tsx**: Pure visual component with 3D border effect using 5 color shades
- **ShapeSelector.tsx**: Generates random shapes on mount, dispatches `SET_AVAILABLE_SHAPES`

### Hover Preview System
1. User selects shape → `SELECT_SHAPE` action
2. Mouse moves over grid → `UPDATE_MOUSE_LOCATION` calculates `hoveredBlockPositions`
3. Grid maps hover positions to tiles, passes `isHovered` + `hoveredBlock` to TileVisual
4. TileVisual displays hovered block (semi-transparent preview) over actual tile

## Development Workflow

### Essential Commands
```bash
npm run dev          # Start dev server (Vite)
npm run build        # TypeScript compile + Vite build
npm run publish      # Build + deploy to gh-pages branch (LIVE SITE)
npm run test         # Run Vitest in watch mode
npm run test:run     # Run tests once (CI)
npm run lint         # ESLint check
```

### Testing Strategy
- **Vitest** with `@testing-library/react` and `jsdom`
- Test reducer actions in `src/test/tetrixReducer.test.ts` - tests state transitions
- Test files: `bugs.test.tsx`, `hoverEffect.test.tsx` document specific fixes
- Run tests as you develop - state bugs are common with the reducer pattern

### Deployment Flow
- **Main branch**: Development code (TypeScript source)
- **gh-pages branch**: Compiled dist (auto-created by `npm run publish`)
- Push to main = safe, push to gh-pages = LIVE for users
- Fast and loose: Committing directly to main is acceptable

## Code Conventions

### File Structure
- Components: `ComponentName/index.ts` exports from `ComponentName.tsx`
- Co-locate styles: `ComponentName.css` next to component file
- Types: Centralized in `src/utils/types.ts`
- No prop-types - TypeScript types only

### Styling Approach
- Mix of CSS files and inline `style` objects (especially in Grid, ShapeOption)
- BlockVisual uses inline styles for dynamic color borders
- Grid uses `gridTemplateColumns/Rows: "repeat(10, 1fr)"` for 10x10 layout
- Z-index layers: tiles (z-index: 1), blocks (z-index: 2)

### TypeScript Patterns
- Explicit action types with discriminated unions (`TetrixAction`)
- React.Dispatch typed as `TetrixDispatch` for type safety
- Use `React.memo()` for performance (see TileVisual)
- Prefer `useCallback` for event handlers to prevent re-renders

## Common Gotchas

1. **1-indexed locations**: Grid locations are 1-10, not 0-9 (see `makeTiles()`)
2. **Shape center positioning**: Shapes place based on center of filled blocks, not [0,0]
3. **Auto-select behavior**: After placing shape, first `nextShape` auto-selects if available
4. **Context split**: State and dispatch are separate contexts - need both hooks
5. **Color structure**: Block colors have 5 shades (lightest, light, main, dark, darkest) for 3D effect
6. **Event listeners**: Grid.tsx adds listeners to DOM - remember cleanup in useEffect return

## When Making Changes

- **Adding actions**: Update `TetrixAction` union type + reducer switch + tests
- **Modifying shape logic**: Check `shapeUtils.ts` first - don't reinvent coordinate math
- **UI changes**: Check both `Grid.tsx` (game logic) and visual components separately
- **State changes**: Always go through reducer actions - no direct state mutation
- **New shapes**: Follow 3x3 grid pattern with random colors (see `ShapeSelector.tsx`)

## Project Quirks
- README.md has casual tone - matches project vibe (fast/loose, player-focused)
- TypeScript errors are acknowledged but not strictly enforced
- No formal CI/CD - manual `npm run publish` for deployment
- Development setup assumes macOS + nvm + VSCode with format-on-save
