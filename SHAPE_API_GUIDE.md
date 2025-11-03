# Shape-Centric API Guide

## Overview

The codebase has been refactored to work with shapes as cohesive units rather than individual blocks. This makes it much easier to:
- Place shapes on the grid
- Move shapes around
- Calculate shape positions
- Center shapes on the mouse cursor

## Key Features

### 1. **Mouse-Centered Shape Placement**

Shapes now follow the mouse cursor and are **automatically centered** on the mouse position. The centering logic:
- Calculates the bounding box of filled blocks in the shape
- Finds the geometric center of the shape
- Positions blocks relative to that center
- So a 4-block wide shape has 2 blocks on each side of the cursor
- A 3-block wide shape has the cursor in the middle of the center block

### 2. **Shape Utility Functions** (`src/utils/shapeUtils.ts`)

Work with shapes without worrying about individual block details:

#### `getShapeBounds(shape)`
Returns the bounding box containing all filled blocks:
```typescript
const bounds = getShapeBounds(myShape);
// Returns: { minRow, maxRow, minCol, maxCol, width, height }
```

#### `getShapeCenter(shape)`
Finds the geometric center of a shape:
```typescript
const center = getShapeCenter(myShape);
// Returns: { row: 1.5, col: 1 } for example
```

#### `getFilledBlocksRelativeToCenter(shape)`
Gets all filled blocks positioned relative to the shape's center:
```typescript
const blocks = getFilledBlocksRelativeToCenter(myShape);
// Returns: [{ row: -0.5, col: -1, block }, { row: 0.5, col: 0, block }, ...]
```

#### `getShapeGridPositions(shape, centerLocation)`
Calculate where blocks will appear on the grid when centered at a location:
```typescript
const positions = getShapeGridPositions(myShape, { row: 5, column: 5 });
// Returns: [{ location: { row: 4, column: 4 }, block }, ...]
```

#### `mousePositionToGridLocation(mouseX, mouseY, gridElement, gridSize)`
Convert mouse coordinates to grid cell:
```typescript
const location = mousePositionToGridLocation(
  event.clientX, 
  event.clientY, 
  gridRef.current,
  { rows: 10, columns: 10 }
);
// Returns: { row: 3, column: 7 } or null if outside grid
```

#### Other Utilities
- `canPlaceShape()` - Check if shape fits at location
- `createEmptyShape()` - Create 3x3 empty shape
- `rotateShape()` - Rotate 90° clockwise
- `cloneShape()` - Deep clone a shape

### 3. **New State Management**

The reducer now tracks:
- `selectedShape` - Currently selected/dragging shape
- `mouseGridLocation` - Current grid cell under mouse
- `isShapeDragging` - Whether user is dragging a shape

New actions:
- `SELECT_SHAPE` - Pick up a shape from the selector
- `UPDATE_MOUSE_LOCATION` - Track mouse movement on grid
- `PLACE_SHAPE` - Place shape at current location
- `CLEAR_SELECTION` - Cancel (press Escape)

### 4. **Visual Feedback**

- Selected shapes follow the mouse with real-time preview
- Preview blocks show semi-transparent overlay
- Shapes are centered on cursor position
- Smooth hover effects on shape selector

## Usage Examples

### Creating a Custom Shape

```typescript
const makeColor = () => ({
  lightest: '#0274e6',
  light: '#0059b2',
  main: '#023f80',
  dark: '#023468',
  darkest: '#011e3f'
});

const filled = { color: makeColor(), isFilled: true };
const empty = { color: makeColor(), isFilled: false };

// Create an L-shape
const lShape: Shape = [
  [filled, empty, empty],
  [filled, empty, empty],
  [filled, filled, empty],
];
```

### Using the Shape in a Component

```typescript
import ShapeOption from '../ShapeOption';

// Just pass the shape - the component handles everything else
<ShapeOption shape={lShape} />
```

### Checking if Shape Can Be Placed

```typescript
import { canPlaceShape, getShapeGridPositions } from '../../utils/shapeUtils';

const occupied = new Set(['5,5', '5,6']); // occupied positions
const canPlace = canPlaceShape(
  myShape, 
  { row: 5, column: 5 },
  { rows: 10, columns: 10 },
  occupied
);
```

### Getting Shape Preview Positions

```typescript
const previewPositions = getShapeGridPositions(
  selectedShape, 
  mouseGridLocation
);

// Render preview
previewPositions.forEach(({ location, block }) => {
  console.log(`Block at row ${location.row}, col ${location.column}`);
});
```

## How the Centering Works

When you move your mouse over the grid:

1. Mouse position → Grid location (e.g., row 5, column 7)
2. Shape center is calculated (e.g., center at 1, 1 in 3x3 grid)
3. Filled blocks found relative to center (e.g., [-1, -1], [0, -1], [1, -1], [1, 0])
4. Grid positions calculated: `gridLocation + relativePosition`
5. Preview rendered at those positions

This ensures shapes are **always centered on the cursor**, regardless of shape size or configuration.

## Benefits of This Approach

✅ **Simpler API** - Work with shapes as units, not individual blocks
✅ **Centered Placement** - Intuitive mouse positioning
✅ **Reusable Functions** - Shape utilities work anywhere
✅ **Type Safety** - TypeScript ensures correct usage
✅ **Easy Testing** - Pure functions easy to test
✅ **Flexible** - Easy to add rotation, validation, etc.

## Next Steps

You can easily extend this system to add:
- Shape rotation (utility already exists!)
- Shape collision detection
- Animated placement
- Score calculation based on shapes
- Shape generation/randomization
- Drag and drop from shape selector
