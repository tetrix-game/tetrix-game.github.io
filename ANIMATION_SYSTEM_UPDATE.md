# Animation System Update - Triple Animations & Granular Control

## Overview

The clearing animation system has been extended to support **triple-tier animations** (single, double, triple) for both rows and columns, with **independent timing control** for each tier.

## New Animation Types

### Row Animations
- **`row-cw`**: Single row clear - clockwise rotation to circle (90°)
- **`row-double`**: Double row clear - grows to 150% at -45°, then shrinks while rotating (-90°)
- **`row-triple`**: Triple row clear - octagon that starts as translucent circle, gains opacity/size through 360° rotation

### Column Animations
- **`column-ccw`**: Single column clear - counterclockwise rotation to circle (-90°)
- **`column-double`**: Double column clear - grows to 150% at 45°, then shrinks while rotating (90°)
- **`column-triple`**: Triple column clear - octagon that starts as translucent circle, gains opacity/size through -360° rotation

## Animation Behavior

### Row Clears
- **1 row cleared**: `row-cw` animation
- **2+ rows cleared**: `row-cw` + `row-double` animations
- **3+ rows cleared**: `row-cw` + `row-double` + `row-triple` animations

### Column Clears
- **1 column cleared**: `column-ccw` + `column-double` animations (legacy behavior)
- **2+ columns cleared**: `column-ccw` + `column-double` + `column-triple` animations

### Intersection Tiles (Row + Column Clear)
Tiles that are part of both a cleared row and column will receive **all applicable animations**:
- Example: 2 rows + 2 columns cleared at intersection = 5 animations on that tile
  - 1 `row-cw`, 1 `row-double`, 1 `column-ccw`, 1 `column-double`, 1 `column-triple`

## Configuration

### AnimationConfig Type (Updated)

```typescript
export type AnimationConfig = {
  // Duration for each animation type (ms)
  rowSingleDuration: number;      // Duration for row-cw
  rowDoubleDuration: number;      // Duration for row-double
  rowTripleDuration: number;      // Duration for row-triple
  columnSingleDuration: number;   // Duration for column-ccw
  columnDoubleDuration: number;   // Duration for column-double
  columnTripleDuration: number;   // Duration for column-triple
  
  // Wave delays for each animation type (ms)
  rowSingleWaveDelay: number;     // Delay per tile for row-cw
  rowDoubleWaveDelay: number;     // Delay per tile for row-double
  rowTripleWaveDelay: number;     // Delay per tile for row-triple
  columnSingleWaveDelay: number;  // Delay per tile for column-ccw
  columnDoubleWaveDelay: number;  // Delay per tile for column-double
  columnTripleWaveDelay: number;  // Delay per tile for column-triple
  
  baseStartTime?: number;         // Base timestamp (defaults to performance.now())
};
```

### Default Configuration

```typescript
const DEFAULT_CONFIG: AnimationConfig = {
  rowSingleDuration: 500,
  rowDoubleDuration: 500,
  rowTripleDuration: 600,
  columnSingleDuration: 500,
  columnDoubleDuration: 500,
  columnTripleDuration: 600,
  
  rowSingleWaveDelay: 30,
  rowDoubleWaveDelay: 30,
  rowTripleWaveDelay: 40,
  columnSingleWaveDelay: 30,
  columnDoubleWaveDelay: 30,
  columnTripleWaveDelay: 40,
};
```

### Current Production Config (tileReducer.ts)

```typescript
generateClearingAnimations(
  clearedTiles,
  clearedRows,
  clearedColumns,
  {
    rowSingleDuration: 500,
    rowDoubleDuration: 600,
    rowTripleDuration: 700,
    columnSingleDuration: 500,
    columnDoubleDuration: 600,
    columnTripleDuration: 700,
    rowSingleWaveDelay: 30,
    rowDoubleWaveDelay: 25,
    rowTripleWaveDelay: 20,
    columnSingleWaveDelay: 30,
    columnDoubleWaveDelay: 25,
    columnTripleWaveDelay: 20,
  }
);
```

## CSS Implementation

### Row-Double Animation
Similar to column-double but rotates clockwise (negative rotation):
- Starts as square border
- Grows to 150% at -45°
- Shrinks back to normal at -90°
- Becomes circle and fades out

### Triple Animations (Row & Column)
Both use the same octagon pattern but rotate in opposite directions:

**Keyframe Structure:**
- **0%**: Small translucent circle (scale 0.5, opacity 0.3)
- **75%**: Full-size octagon at 360° rotation (scale 1.2, opacity 1.0)
  - Uses `clip-path: polygon()` to create octagon shape
- **100%**: Fades out (opacity 0) while maintaining octagon shape

**Octagon Polygon Points:**
```css
clip-path: polygon(
  30% 0%, 70% 0%,      /* Top edge */
  100% 30%, 100% 70%,  /* Right edge */
  70% 100%, 30% 100%,  /* Bottom edge */
  0% 70%, 0% 30%       /* Left edge */
);
```

## Z-Index Layering

Animations render at different z-index levels to create visual depth:
- Base tile: `z-index: 1`
- Single animations (`row-cw`, `column-ccw`): `z-index: 10`
- Double animations (`row-double`, `column-double`): `z-index: 11`
- Triple animations (`row-triple`, `column-triple`): `z-index: 12`

## Wave Effects

Each animation type can have independent wave timing:
- **Wave delay**: Time offset between each tile in the line
- **Row waves**: Progress left-to-right (column index × delay)
- **Column waves**: Progress top-to-bottom (row index × delay)

### Example Wave Patterns

**Fast cascade:**
```typescript
rowSingleWaveDelay: 20,
rowDoubleWaveDelay: 15,
rowTripleWaveDelay: 10,
```
Creates accelerating cascade effect (triple layer catches up)

**Synchronized:**
```typescript
rowSingleWaveDelay: 30,
rowDoubleWaveDelay: 30,
rowTripleWaveDelay: 30,
```
All animation layers cascade together

**Reverse stagger:**
```typescript
rowSingleWaveDelay: 40,
rowDoubleWaveDelay: 35,
rowTripleWaveDelay: 30,
```
Triple layer animates first, single layer last

## Performance Considerations

- Each tile can have up to 6 simultaneous animations (3 row + 3 column)
- RAF-based rendering only when animations are active
- Automatic cleanup removes expired animations every 1 second
- CSS GPU acceleration via `transform` and `will-change`
- Z-index layering prevents overdraw issues

## Tuning Tips

### Duration Tuning
- **Shorter durations** (300-500ms): Snappy, arcade feel
- **Medium durations** (500-700ms): Balanced, satisfying
- **Longer durations** (700-1000ms): Dramatic, emphasis on achievement

### Wave Delay Tuning
- **No wave** (0ms): Instant, simultaneous burst
- **Fast wave** (10-20ms): Quick cascade
- **Medium wave** (20-40ms): Noticeable cascade effect
- **Slow wave** (40-60ms): Dramatic sweep across board

### Layer Coordination
- **Same duration/delay**: All layers perfectly synchronized
- **Increasing duration**: Layers extend over time (visual complexity builds)
- **Decreasing delay**: Layers accelerate through cascade (catches up effect)

## Migration Notes

### Breaking Changes
- Old `rowDuration`/`columnDuration` → Now 6 separate duration fields
- Old `rowWaveDelay`/`columnWaveDelay` → Now 6 separate delay fields

### Backward Compatibility
- Column clears still generate both `column-ccw` and `column-double` by default
- Single row/column clears work exactly as before (just with more granular config)

## Future Enhancements

Potential additions to the system:
- Quad/quad+ animations for 4+ simultaneous clears
- Custom animation types per level/theme
- Dynamic timing based on combo chains
- Particle effects integrated with animation phases
- Color-coded animations based on block colors
