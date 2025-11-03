# Quick Start: Using the Shape-Centric API

## Try It Now!

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open** http://localhost:5173

3. **Click** on any shape on the right side (L-shape, T-shape, or Square)

4. **Move your mouse** over the grid - watch the shape follow your cursor!

5. **Notice**: The shape is **centered** on your cursor position

6. **Click** on the grid to place the shape

7. **Press Escape** to cancel placement

## Adding Your Own Shape

### 1. Open `src/components/ShapeSelector/ShapeSelector.tsx`

### 2. Add your shape definition:

```typescript
// Line shape (vertical)
const lineShape: Shape = [
  [filledBlock, emptyBlock, emptyBlock],
  [filledBlock, emptyBlock, emptyBlock],
  [filledBlock, emptyBlock, emptyBlock],
];

// Z-shape
const zShape: Shape = [
  [filledBlock, filledBlock, emptyBlock],
  [emptyBlock, filledBlock, filledBlock],
  [emptyBlock, emptyBlock, emptyBlock],
];

// Plus shape
const plusShape: Shape = [
  [emptyBlock, filledBlock, emptyBlock],
  [filledBlock, filledBlock, filledBlock],
  [emptyBlock, filledBlock, emptyBlock],
];
```

### 3. Add to the selector JSX:

```typescript
const ShapeSelector = (): JSX.Element => {
  return (
    <div className="shape-selector">
      <ShapeOption shape={lShape} />
      <ShapeOption shape={tShape} />
      <ShapeOption shape={squareShape} />
      <ShapeOption shape={lineShape} />    {/* NEW */}
      <ShapeOption shape={zShape} />       {/* NEW */}
      <ShapeOption shape={plusShape} />    {/* NEW */}
      <SavedShape shape={null} />
    </div>
  )
}
```

That's it! Your shapes are now selectable and will be centered on the cursor.

## Using Shape Utilities

### Get shape information:

```typescript
import { 
  getShapeCenter, 
  getShapeBounds, 
  getFilledBlocks 
} from './utils/shapeUtils';

// How big is this shape?
const bounds = getShapeBounds(myShape);
console.log(`Shape is ${bounds.width}×${bounds.height}`);

// Where's the center?
const center = getShapeCenter(myShape);
console.log(`Center at row ${center.row}, col ${center.col}`);

// How many blocks?
const blocks = getFilledBlocks(myShape);
console.log(`Shape has ${blocks.length} filled blocks`);
```

### Check if shape fits:

```typescript
import { canPlaceShape } from './utils/shapeUtils';

const occupied = new Set<string>();
// Add occupied positions: "row,column"
occupied.add("5,5");
occupied.add("5,6");

const fits = canPlaceShape(
  myShape,
  { row: 5, column: 7 },           // Try to place here
  { rows: 10, columns: 10 },       // Grid size
  occupied                          // Already filled positions
);

if (fits) {
  console.log("Shape fits!");
} else {
  console.log("Can't place shape there");
}
```

### Rotate a shape:

```typescript
import { rotateShape } from './utils/shapeUtils';

let shape = lShape;

// Rotate 90° clockwise
shape = rotateShape(shape);

// Rotate again (180° total)
shape = rotateShape(shape);

// Keep rotating...
shape = rotateShape(shape);  // 270°
shape = rotateShape(shape);  // 360° (back to original)
```

### Place shape programmatically:

```typescript
import { useTetrixDispatchContext } from './components/Tetrix/TetrixContext';

function MyComponent() {
  const dispatch = useTetrixDispatchContext();

  const placeMyShape = () => {
    // Select the shape
    dispatch({ 
      type: 'SELECT_SHAPE', 
      value: { shape: myShape } 
    });

    // Update mouse location
    dispatch({ 
      type: 'UPDATE_MOUSE_LOCATION', 
      value: { location: { row: 5, column: 5 } } 
    });

    // Place it
    dispatch({ type: 'PLACE_SHAPE' });
  };

  return <button onClick={placeMyShape}>Auto Place</button>;
}
```

## Common Patterns

### Creating colored shapes:

```typescript
const makeRedColor = () => ({
  lightest: '#ff6b6b',
  light: '#ff5252',
  main: '#ff3838',
  dark: '#ee2222',
  darkest: '#cc0000'
});

const redBlock = { color: makeRedColor(), isFilled: true };
const empty = { color: makeRedColor(), isFilled: false };

const redSquare: Shape = [
  [redBlock, redBlock, empty],
  [redBlock, redBlock, empty],
  [empty, empty, empty],
];
```

### Random shape from array:

```typescript
const allShapes = [lShape, tShape, squareShape, lineShape];
const randomShape = allShapes[Math.floor(Math.random() * allShapes.length)];

dispatch({ type: 'SELECT_SHAPE', value: { shape: randomShape } });
```

### Check if grid position is occupied:

```typescript
import { useTetrixStateContext } from './components/Tetrix/TetrixContext';

function useOccupiedPositions() {
  const { tiles } = useTetrixStateContext();
  
  const occupied = new Set<string>();
  tiles.forEach(tile => {
    if (tile.block.isFilled) {
      occupied.add(`${tile.location.row},${tile.location.column}`);
    }
  });
  
  return occupied;
}
```

## What You Get

✅ **Automatic centering** - Shapes center on cursor  
✅ **Real-time preview** - See before you place  
✅ **Easy shape creation** - Just define the pattern  
✅ **Utility functions** - Calculate bounds, center, positions  
✅ **Validation** - Check if placement is valid  
✅ **Rotation support** - Built-in rotation function  
✅ **Type safety** - Full TypeScript support  

## Next Steps

Read the detailed guides:
- **`SHAPE_API_GUIDE.md`** - Complete API reference
- **`CENTERING_GUIDE.md`** - How centering works (with diagrams!)
- **`REFACTORING_SUMMARY.md`** - What changed and why

## Need Help?

The shape utilities are in `src/utils/shapeUtils.ts` - all functions are documented with JSDoc comments!
