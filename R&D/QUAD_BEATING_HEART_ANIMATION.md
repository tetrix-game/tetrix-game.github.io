# Quad (4-Line) Beating Heart Animation

## Overview

A new animation tier has been added for clearing 4 lines (rows or columns) simultaneously. This animation displays a **beating heart effect** that pulses multiple times before fading out.

## Visual Effect

The beating heart animation:
- **Starts**: As a round circle (50% border-radius) at 25% tile size with 3px border
- **Pulses**: Transforms to a square (0% border-radius) at 50% tile size with 6px border
- **Repeats**: Multiple beats (default: 3 beats)
- **Color**: Deep red (#ff1744) to signify a powerful combo
- **Fades**: Gradually fades out after the final beat

## Configuration

### Default Settings

Located in `src/utils/clearingAnimationUtils.ts`:

```typescript
quad: { 
  duration: 1200,      // Total animation time (ms)
  waveDelay: 20,       // Delay between tiles in wave (ms)
  startDelay: 750,     // Delay before starting (ms)
  beatCount: 3,        // Number of heartbeats
  beatSpeed: 1.0       // Speed multiplier (1.0 = normal)
}
```

### Customization in Game

The quad animation can be configured when line clearing occurs in `src/reducers/tileReducer.ts`:

```typescript
const finalTiles = generateClearingAnimations(
  clearedTiles,
  clearedRows,
  clearedColumns,
  {
    rows: {
      quad: { 
        duration: 1200,    // Total animation length
        waveDelay: 20,     // Wave cascade speed
        startDelay: 750,   // When to start
        beatCount: 3,      // How many beats
        beatSpeed: 1.0     // Beat speed multiplier
      },
    },
    columns: {
      quad: { 
        duration: 1200, 
        waveDelay: 20, 
        startDelay: 750, 
        beatCount: 3, 
        beatSpeed: 1.0 
      },
    },
  }
);
```

### Parameters

- **duration** (ms): Total animation time from start to fade out
- **waveDelay** (ms): Delay between each tile in the wave cascade effect
- **startDelay** (ms): Delay before the animation begins (to layer after other animations)
- **beatCount**: Number of expansion/contraction cycles (recommended: 2-5)
- **beatSpeed**: Multiplier for beat timing (higher = faster beats, not currently used in CSS but prepared for future)

## Technical Implementation

### Type System

Added `row-quad` and `column-quad` to the `TileAnimation` type:

```typescript
export type TileAnimation = {
  id: string;
  type: 'row-cw' | 'row-double' | 'row-triple' | 'row-quad' | 
        'column-ccw' | 'column-double' | 'column-triple' | 'column-quad';
  startTime: number;
  duration: number;
  beatCount?: number;  // Optional: number of heartbeats
  beatSpeed?: number;  // Optional: speed multiplier
};
```

### Animation Logic

The animation is triggered when **4 or more lines** are cleared:

1. **Detection**: `if (rowCount >= 4)` or `if (columnCount >= 4)`
2. **Generation**: Creates `row-quad` or `column-quad` animation instances
3. **Layering**: Plays on top of single, double, and triple animations (z-index: 13)
4. **Timing**: Wave offset calculated per tile for cascade effect

### CSS Keyframes

Located in `src/components/TileVisual/TileVisual.css`:

- `@keyframes tile-clear-row-quad`: Beating heart for row clears
- `@keyframes tile-clear-column-quad`: Beating heart for column clears

Both use the same visual pattern:
1. 0%: Fade in from opacity 0
2. 5%: Full opacity, small circle (37.5% from edges, 3px border, 50% radius)
3. 15%, 35%, 55%: Expand to square (25% from edges, 6px border, 0% radius)
4. 25%, 45%, 65%: Contract to circle (37.5% from edges, 3px border, 50% radius)
5. 85%: Hold with reduced opacity (0.5)
6. 100%: Fade to opacity 0

## Usage Example

### 4 Rows Cleared
When a player clears 4 rows simultaneously:
- Each tile in those rows displays the beating heart
- Hearts cascade from left to right (column-based wave)
- Deep red color indicates exceptional combo

### 4 Columns Cleared
When a player clears 4 columns simultaneously:
- Each tile in those columns displays the beating heart
- Hearts cascade from top to bottom (row-based wave)
- Same deep red visual effect

### 4x4 Clear (Mega Combo)
When a player clears 4 rows AND 4 columns:
- Intersection tiles display BOTH row-quad and column-quad
- Creates an intense overlapping beating heart effect
- Maximum visual impact for the ultimate combo

## Testing

Comprehensive test coverage in `src/test/quadAnimation.test.ts`:

- ✅ Row quad animation triggers for 4+ rows
- ✅ Column quad animation triggers for 4+ columns
- ✅ Custom beat count and speed configuration
- ✅ No quad animation for less than 4 lines
- ✅ Both animations for 4x4 clears
- ✅ Proper layering with single/double/triple animations

## Future Enhancements

Potential improvements:
- Use `beatSpeed` parameter to dynamically adjust CSS animation timing
- Add particle effects synchronized with beats
- Different beat patterns (accelerating, decelerating, irregular)
- Color variation based on combo score
- Sound effects synchronized with each beat
- Shake effect on the grid itself for ultimate impact
