# Shape-Centric Refactoring Summary

## What Changed

### 1. **New Shape Utilities Module** (`src/utils/shapeUtils.ts`)

A comprehensive set of utilities for working with shapes as cohesive units:

- **`getShapeBounds()`** - Calculate the bounding box of a shape
- **`getShapeCenter()`** - Find the geometric center of a shape
- **`getFilledBlocksRelativeToCenter()`** - Get block positions relative to center
- **`getShapeGridPositions()`** - Calculate grid positions for shape placement
- **`mousePositionToGridLocation()`** - Convert mouse coords to grid location
- **`canPlaceShape()`** - Validate shape placement
- **`rotateShape()`** - Rotate shape 90° clockwise
- **`cloneShape()`** - Deep clone a shape
- **`createEmptyShape()`** - Create empty 3x3 shape

### 2. **Enhanced State Management**

**New State Properties:**
```typescript
{
  selectedShape: Shape | null;      // Currently dragging shape
  mouseGridLocation: Location | null; // Mouse position on grid
  isShapeDragging: boolean;          // Drag state flag
}
```

**New Actions:**
- `SELECT_SHAPE` - Select a shape from the shape selector
- `UPDATE_MOUSE_LOCATION` - Update mouse position on grid
- `PLACE_SHAPE` - Place selected shape at current location
- `CLEAR_SELECTION` - Cancel placement (Escape key)

### 3. **Grid Component with Mouse Tracking**

The `Grid` component now:
- Tracks mouse position in real-time
- Converts mouse coordinates to grid locations
- Displays shape preview at cursor position
- Handles click to place shape
- Supports Escape key to cancel

### 4. **Shape Preview System**

- Semi-transparent overlay shows where shape will be placed
- Preview is **centered on mouse cursor**
- Real-time visual feedback as you move the mouse
- Preview blocks use the shape's actual colors

### 5. **Interactive Shape Selector**

- Click any shape to select it
- Visual feedback on hover
- Shapes are pre-defined (L-shape, T-shape, Square)
- Easy to add more shapes

## Mouse-Centered Placement Logic

The key feature: **shapes are centered on the mouse cursor**, not top-left aligned.

### How It Works:

1. **Calculate Shape Center**
   ```typescript
   // For an L-shape that occupies positions (0,0), (1,0), (2,0), (2,1)
   // The center is at (1, 0.5)
   ```

2. **Get Blocks Relative to Center**
   ```typescript
   // Blocks are offset from center:
   // (-1, -0.5), (0, -0.5), (1, -0.5), (1, 0.5)
   ```

3. **Apply to Grid Position**
   ```typescript
   // If mouse is at grid (5, 5), blocks appear at:
   // (4, 4), (5, 4), (6, 4), (6, 5)
   ```

This means:
- **4-block wide shape**: 2 blocks on each side of cursor
- **3-block wide shape**: cursor in middle of center block  
- **2-block wide shape**: cursor between the two blocks

## Usage Guide

### Selecting and Placing a Shape

1. **Click** on a shape in the shape selector (right side)
2. **Move** your mouse over the grid - shape follows cursor, centered
3. **Click** on the grid to place the shape
4. **Press Escape** to cancel placement

### Working with Shapes in Code

#### Create a New Shape
```typescript
import type { Shape } from './utils/types';

const makeColor = () => ({
  lightest: '#0274e6',
  light: '#0059b2', 
  main: '#023f80',
  dark: '#023468',
  darkest: '#011e3f'
});

const filled = { color: makeColor(), isFilled: true };
const empty = { color: makeColor(), isFilled: false };

const myShape: Shape = [
  [filled, filled, empty],
  [empty, filled, empty],
  [empty, filled, empty],
]; // Creates an I-shape
```

#### Use Shape Utilities
```typescript
import { 
  getShapeCenter, 
  getShapeGridPositions,
  canPlaceShape 
} from './utils/shapeUtils';

// Get center point
const center = getShapeCenter(myShape);

// Get positions when placed at (5, 5)
const positions = getShapeGridPositions(myShape, { row: 5, column: 5 });

// Check if can be placed
const occupied = new Set<string>(); // Set of "row,col" strings
const canPlace = canPlaceShape(
  myShape,
  { row: 5, column: 5 },
  { rows: 10, columns: 10 },
  occupied
);
```

#### Dispatch Actions
```typescript
import { useTetrixDispatchContext } from './components/Tetrix/TetrixContext';

const dispatch = useTetrixDispatchContext();

// Select a shape
dispatch({ type: 'SELECT_SHAPE', value: { shape: myShape } });

// Clear selection
dispatch({ type: 'CLEAR_SELECTION' });

// Place shape (automatic based on mouse location)
dispatch({ type: 'PLACE_SHAPE' });
```

## Benefits

### Before (Block-Centric)
```typescript
// Had to manually calculate each block position
for (let row = 0; row < shape.length; row++) {
  for (let col = 0; col < shape[row].length; col++) {
    if (shape[row][col].isFilled) {
      // Place at row + offsetRow, col + offsetCol
      // But what's the offset? How to center?
    }
  }
}
```

### After (Shape-Centric)
```typescript
// Just use the utility!
const positions = getShapeGridPositions(shape, centerLocation);
// Done! Automatically centered.
```

## Architecture

```
User clicks shape
    ↓
SELECT_SHAPE dispatched
    ↓
selectedShape stored in state
    ↓
User moves mouse over grid
    ↓
Mouse event → mousePositionToGridLocation()
    ↓
UPDATE_MOUSE_LOCATION dispatched
    ↓
Grid renders preview using getShapeGridPositions()
    ↓
User clicks grid
    ↓
PLACE_SHAPE dispatched
    ↓
Tiles updated with shape blocks
    ↓
Selection cleared
```

## Future Enhancements

With this foundation, you can easily add:

- ✅ **Rotation**: Use `rotateShape()` before placing
- ✅ **Validation**: Use `canPlaceShape()` to prevent invalid placement
- ✅ **Animation**: Animate blocks into place
- ✅ **Scoring**: Calculate points based on shape size/complexity
- ✅ **Random Generation**: Generate random shapes
- ✅ **Shape Queue**: Show next 3 shapes coming up
- ✅ **Saved Shape**: Store one shape for later use

## Testing

The shape utilities are pure functions, making them easy to test:

```typescript
describe('getShapeCenter', () => {
  it('centers a 3x3 L-shape correctly', () => {
    const center = getShapeCenter(lShape);
    expect(center).toEqual({ row: 1, col: 0.5 });
  });
});

describe('getShapeGridPositions', () => {
  it('places blocks centered at location', () => {
    const positions = getShapeGridPositions(
      squareShape,
      { row: 5, column: 5 }
    );
    expect(positions).toHaveLength(4);
    // Verify each position...
  });
});
```

## Files Changed

1. ✅ `src/utils/shapeUtils.ts` - **NEW** - Shape utility functions
2. ✅ `src/utils/types.ts` - Added state & action types
3. ✅ `src/components/Tetrix/tetrixReducer.ts` - New actions & logic
4. ✅ `src/components/Grid/Grid.tsx` - Mouse tracking & preview
5. ✅ `src/components/TileVisual/TileVisual.tsx` - Preview display
6. ✅ `src/components/ShapeOption/ShapeOption.tsx` - Clickable shapes
7. ✅ `src/components/ShapeSelector/ShapeSelector.tsx` - Sample shapes
8. ✅ `SHAPE_API_GUIDE.md` - **NEW** - Detailed API guide

## Demo

Run `npm run dev` and:
1. Click the L-shape on the right
2. Move your mouse over the grid
3. Notice how the shape **stays centered** under your cursor
4. Click to place it
5. The shape appears exactly where you clicked, centered!
