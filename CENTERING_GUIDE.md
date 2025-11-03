# Shape Centering Visual Guide

## How Shapes Are Centered on the Mouse Cursor

### Example: L-Shape

```
Original 3x3 Shape Grid:
┌─┬─┬─┐
│■│ │ │  Row 0
├─┼─┼─┤
│■│ │ │  Row 1
├─┼─┼─┤
│■│■│ │  Row 2
└─┴─┴─┘
 0 1 2
 Col

Filled blocks at: (0,0), (1,0), (2,0), (2,1)
```

### Step 1: Calculate Bounding Box

```
Bounds: {
  minRow: 0,
  maxRow: 2,
  minCol: 0,
  maxCol: 1,
  width: 2,
  height: 3
}
```

### Step 2: Calculate Center Point

```
Center = {
  row: minRow + (height - 1) / 2 = 0 + (3 - 1) / 2 = 1.0
  col: minCol + (width - 1) / 2  = 0 + (2 - 1) / 2 = 0.5
}

Center is at (1.0, 0.5) ← This is where the mouse cursor will align
```

### Step 3: Calculate Relative Positions

```
Each filled block relative to center (1.0, 0.5):

Block at (0, 0): offset (-1.0, -0.5)
Block at (1, 0): offset ( 0.0, -0.5)
Block at (2, 0): offset ( 1.0, -0.5)
Block at (2, 1): offset ( 1.0,  0.5)
```

### Step 4: Apply to Mouse Position

```
If mouse is at grid cell (5, 5):

Block 1: (5, 5) + (-1.0, -0.5) = (4, 4.5) → rounds to (4, 4)
Block 2: (5, 5) + ( 0.0, -0.5) = (5, 4.5) → rounds to (5, 4)
Block 3: (5, 5) + ( 1.0, -0.5) = (6, 4.5) → rounds to (6, 4)
Block 4: (5, 5) + ( 1.0,  0.5) = (6, 5.5) → rounds to (6, 5)

Result on 10x10 Grid:
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│ │ │ │ │ │ │ │ │ │ │  Row 1
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │ │ │  Row 2
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │ │ │  Row 3
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │■│ │ │ │ │ │  Row 4  ← Top of L-shape
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │■│☒│ │ │ │ │  Row 5  ← Mouse cursor at (5,5)
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │■│■│ │ │ │ │  Row 6  ← Bottom of L-shape
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │ │ │  Row 7
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘
          ↑
       Col 5 (Mouse is here)

Legend:
■ = Placed shape block
☒ = Mouse cursor position (center of shape)
```

## More Examples

### 2×2 Square Shape

```
Original Shape:
┌─┬─┬─┐
│■│■│ │
├─┼─┼─┤
│■│■│ │
├─┼─┼─┤
│ │ │ │
└─┴─┴─┘

Center: (0.5, 0.5)

On Grid at (5, 5):
┌─┬─┬─┬─┬─┬─┬─┬─┐
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │■│■│ │ │  Row 4
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │■│☒│ │ │  Row 5  ← Cursor between blocks
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
└─┴─┴─┴─┴─┴─┴─┴─┘
          Col 5

The mouse cursor is at the intersection of all 4 blocks!
```

### T-Shape

```
Original Shape:
┌─┬─┬─┐
│ │■│ │
├─┼─┼─┤
│■│■│■│
├─┼─┼─┤
│ │ │ │
└─┴─┴─┘

Center: (0.5, 1.0)

On Grid at (5, 5):
┌─┬─┬─┬─┬─┬─┬─┬─┐
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │■│ │ │  Row 4  ← Top of T
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │■│■│☒│ │ │  Row 5  ← Cursor on right side of middle block
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
└─┴─┴─┴─┴─┴─┴─┴─┘
          Col 5
```

### Single Block

```
Original Shape:
┌─┬─┬─┐
│ │ │ │
├─┼─┼─┤
│ │■│ │
├─┼─┼─┤
│ │ │ │
└─┴─┴─┘

Center: (1.0, 1.0)

On Grid at (5, 5):
┌─┬─┬─┬─┬─┬─┬─┬─┐
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │☒│ │ │  Row 5  ← Cursor centered in block
├─┼─┼─┼─┼─┼─┼─┼─┤
│ │ │ │ │ │ │ │ │
└─┴─┴─┴─┴─┴─┴─┴─┘
          Col 5

Perfect center alignment!
```

## Key Insight

The algorithm ensures that:

1. **Odd-width shapes** (1, 3, etc.): Cursor is in the CENTER of the middle column
2. **Even-width shapes** (2, 4, etc.): Cursor is BETWEEN columns
3. **Odd-height shapes**: Cursor is in the CENTER of the middle row
4. **Even-height shapes**: Cursor is BETWEEN rows

This creates the most intuitive placement experience where the shape "pivots" around the cursor position naturally!

## Implementation Detail

```typescript
export function getShapeCenter(shape: Shape): { row: number; col: number } {
  const bounds = getShapeBounds(shape);
  
  return {
    row: bounds.minRow + (bounds.height - 1) / 2,  // ← Division by 2 creates centering
    col: bounds.minCol + (bounds.width - 1) / 2,   // ← Works for both odd and even sizes
  };
}
```

The `(size - 1) / 2` formula:
- For size 1: (1-1)/2 = 0.0 (center)
- For size 2: (2-1)/2 = 0.5 (between)
- For size 3: (3-1)/2 = 1.0 (center)
- For size 4: (4-1)/2 = 1.5 (between)

Perfect for centering!
