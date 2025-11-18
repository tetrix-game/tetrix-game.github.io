# Tile-Based Clearing Animation System

## Overview

The clearing animation system has been refactored to support **per-tile instanced animations** with configurable timing, durations, and wave effects. Animations now live directly in the `TileData` and persist independently of block state changes.

## Key Concepts

### 1. **Tile-Based Animations**
- Animations are stored in `TileData.activeAnimations` array
- Each animation is an independent instance with its own timing
- Multiple animations can run simultaneously on the same tile
- Animations persist even when blocks are placed/removed

### 2. **Animation Types**
- `row-cw`: Clockwise rotation for row clears
- `column-ccw`: Counterclockwise base rotation for column clears  
- `column-double`: Dynamic grow/rotate effect for column clears (layered on top)

### 3. **Wave Effects**
- **Row Wave**: Delays each tile in a row based on column index (left-to-right)
- **Column Wave**: Delays each tile in a column based on row index (top-to-bottom)
- Wave delays create cascading animation effects

## Usage

### Generating Animations

```typescript
import { generateClearingAnimations } from '../utils/clearingAnimationUtils';

// In your reducer when lines are cleared:
const updatedTiles = generateClearingAnimations(
  tiles,
  clearedRows,      // [5, 7] - rows 5 and 7 cleared
  clearedColumns,   // [3] - column 3 cleared
  {
    rowDuration: 500,        // 500ms for row animations
    columnDuration: 600,     // 600ms for column animations
    rowWaveDelay: 30,        // 30ms delay per tile in rows
    columnWaveDelay: 40,     // 40ms delay per tile in columns
    baseStartTime: performance.now(), // Optional: custom start time
  }
);
```

### Configuration Options

```typescript
export type AnimationConfig = {
  rowDuration: number;      // Duration for row animations (ms)
  columnDuration: number;   // Duration for column animations (ms)
  rowWaveDelay: number;     // Delay between each tile in a row (ms)
  columnWaveDelay: number;  // Delay between each tile in a column (ms)
  baseStartTime?: number;   // Base timestamp (defaults to performance.now())
};
```

### Wave Timing Examples

**No Wave (simultaneous):**
```typescript
{
  rowWaveDelay: 0,
  columnWaveDelay: 0,
}
// All tiles animate at the same time
```

**Fast Wave:**
```typescript
{
  rowWaveDelay: 20,    // 20ms between tiles
  columnWaveDelay: 20,
}
// Row: 0ms, 20ms, 40ms, 60ms... (10 tiles = 180ms total spread)
// Column: same pattern
```

**Dramatic Wave:**
```typescript
{
  rowWaveDelay: 50,    // 50ms between tiles
  columnWaveDelay: 60,
}
// Row: 0ms, 50ms, 100ms, 150ms... (10 tiles = 450ms total spread)
// Column: 0ms, 60ms, 120ms, 180ms... (10 tiles = 540ms total spread)
```

**Asymmetric Wave:**
```typescript
{
  rowWaveDelay: 30,    // Faster horizontal wave
  columnWaveDelay: 50, // Slower vertical wave
}
// Creates different cascade speeds for rows vs columns
```

## Animation Lifecycle

### 1. **Creation**
```typescript
// When lines clear, animations are added to tiles
const tile = tiles.get('R5C3');
// Before: { isFilled: true, color: 'blue' }
// After: { 
//   isFilled: false, 
//   color: 'grey',
//   activeAnimations: [
//     { id: 'anim-123', type: 'row-cw', startTime: 1000, duration: 500 }
//   ]
// }
```

### 2. **Rendering**
```typescript
// TileVisual filters to currently-playing animations
const currentTime = performance.now();
const playingAnimations = activeAnimations.filter(
  anim => currentTime >= anim.startTime && 
          currentTime < anim.startTime + anim.duration
);

// Renders animation overlays with calculated progress
playingAnimations.map(anim => {
  const elapsed = currentTime - anim.startTime;
  const progress = elapsed / anim.duration;
  return <div className={`tile-visual-clearing ${anim.type}`} />;
});
```

### 3. **Cleanup**
```typescript
// Periodic cleanup removes expired animations
dispatch({ type: 'CLEANUP_ANIMATIONS' });

// Runs every 1 second in Grid component
// Removes animations where: currentTime >= startTime + duration
```

## Data Structure

### TileAnimation
```typescript
export type TileAnimation = {
  id: string;           // Unique ID: 'anim-1732567890-42'
  type: 'row-cw' | 'column-ccw' | 'column-double';
  startTime: number;    // performance.now() timestamp
  duration: number;     // Animation duration in ms
};
```

### TileData (Updated)
```typescript
export type TileData = {
  isFilled: boolean;
  color: ColorName;
  activeAnimations?: TileAnimation[]; // Array of active animations
};
```

## Example Scenarios

### Scenario 1: Single Row Clear (Row 5)
```typescript
generateClearingAnimations(tiles, [5], [], {
  rowDuration: 500,
  rowWaveDelay: 30,
  columnWaveDelay: 0,
});

// Result: 10 tiles in row 5 get animations
// Tile (5,1): starts at 0ms
// Tile (5,2): starts at 30ms
// Tile (5,3): starts at 60ms
// ...
// Tile (5,10): starts at 270ms
```

### Scenario 2: 2x2 Clear (Row 5 + Column 3)
```typescript
generateClearingAnimations(tiles, [5], [3], {
  rowDuration: 500,
  columnDuration: 600,
  rowWaveDelay: 30,
  columnWaveDelay: 40,
});

// Tile (5,3) gets FOUR animations:
// 1. row-cw (from row clear) - starts at 60ms (column index 2 × 30ms)
// 2. column-ccw (from column clear) - starts at 160ms (row index 4 × 40ms)
// 3. column-double (from column clear) - starts at 160ms
```

### Scenario 3: Multiple Clears While Animations Running
```typescript
// Time 0: Clear row 5
generateClearingAnimations(tiles, [5], [], config);
// Tile (5,3) gets: [anim-1 (row-cw, 0-500ms)]

// Time 200: Clear column 3 (while row 5 still animating)
generateClearingAnimations(tiles, [], [3], config);
// Tile (5,3) now has: [
//   anim-1 (row-cw, 0-500ms),      // Still playing
//   anim-2 (column-ccw, 200-700ms),
//   anim-3 (column-double, 200-700ms)
// ]

// Result: All animations play independently!
```

## Benefits

1. **Independent Timing**: Each animation has its own start time and duration
2. **Persistent**: Animations continue even if new blocks are placed
3. **Composable**: Multiple animations can layer on the same tile
4. **Configurable**: Full control over durations and wave effects
5. **Clean Separation**: Animations live in tiles, not in global state
6. **Automatic Cleanup**: Expired animations are periodically removed

## Migration Notes

### Old System
```typescript
// Global state tracked all clearing tiles
clearingAnimations: TileClearingAnimation[]

// All animations used same timing
// No wave effects
// Animations cleared globally
```

### New System  
```typescript
// Per-tile animations
tileData.activeAnimations: TileAnimation[]

// Each animation has own timing
// Wave effects via startTime offsets
// Animations cleaned up per-tile
```

## Performance

- **RAF-based rendering**: TileVisual uses `requestAnimationFrame` only when animations are active
- **Automatic cleanup**: Expired animations removed every 1 second
- **Efficient filtering**: Only currently-playing animations are rendered
- **Memoization**: TileVisual uses `React.memo()` to prevent unnecessary re-renders
