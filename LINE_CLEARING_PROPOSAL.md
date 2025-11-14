# Line Clearing Ripple Animation Proposal

## Overview

Add a visually satisfying "ripple wave cascade" animation when lines are cleared, where tiles pulse outward from cleared lines with intensity based on combo size.

## Design Philosophy

- **No derived state in reducer** - Animation state is component-local and ephemeral
- **Performance-first** - CSS-driven animations with GPU acceleration
- **Integration-focused** - Works seamlessly with scoring, currency, and sound systems

## Visual Behavior

### Ripple Propagation

The ripple effect propagates across **every block in the entire 10x10 grid**. When a line is cleared, all 100 tiles receive ripple animation with timing staggered by distance from cleared lines (20ms per tile distance). Only blocks are affected visually - empty tiles calculate timing but don't pulse.

### Cleared Block Animation

Blocks being cleared undergo a special "animate out" sequence:

1. **Shrink (0-150ms)**: Block shrinks to a point at center
2. **Line Expansion (150-300ms)**: Point expands into a line:
   - Horizontal for row clears
   - Vertical for column clears
   - Both directions for intersection blocks
3. **Fade (300-450ms)**: Line expands to 1.5× block size while fading to 0% opacity

Blocks at intersections (part of both row and column clear) render both horizontal and vertical lines simultaneously.

### Animation Effects

**Single Line Clear:**
- Subtle scale (1.0 → 1.05 → 1.0) and brightness increase
- 20ms delay per tile distance from cleared line
- Cleared blocks undergo "animate out" sequence

**Multi-Line Clear:**
- More dramatic effects scale with combo size
- 2 lines: 1.10 scale, brighter pulse
- 3+ lines: 1.15+ scale, intense brightness
- Duration: 150ms + (combo × 30ms)

**Cross Pattern:**
- Ripples from both row and column simultaneously
- Intersection blocks draw both horizontal and vertical lines

## Technical Architecture

### State Management

**Reducer state:**
- `clearedLinesInfo`: Which rows/columns cleared and when (for distance calculation)
- `animatingOutBlocks`: Blocks in "animate out" state with clearing directions (horizontal/vertical/both)

**Component-local state:**
- Ripple animation (scale, brightness, timing) in TileVisual
- "Animate out" rendering based on `animatingOutBlocks` in BlockVisual

### Animation Flow

```
PLACE_SHAPE → COMPLETE_PLACEMENT
  ↓
clearFullLines() updates tiles
  ↓
Store clearedLinesInfo + animatingOutBlocks in state
  ↓
All 100 TileVisuals calculate ripple delay based on distance
  ↓
TileVisuals with blocks trigger ripple animation
BlockVisuals at cleared locations render "animate out" overlay
  ↓
Grid clears clearedLinesInfo after 400ms
Grid clears animatingOutBlocks after 450ms
```

### Reducer Changes

**Modify COMPLETE_PLACEMENT:**
1. Clear full lines with existing `clearFullLines()`
2. Store `clearedLinesInfo` (rows/columns + timestamp)
3. Create `animatingOutBlocks` with locations and directions
4. Play line clear sounds

**New Actions:**
- `CLEAR_CLEARED_LINES_INFO`: Remove ripple metadata after 400ms
- `CLEAR_ANIMATING_OUT_BLOCKS`: Remove "animate out" metadata after 450ms

### Grid Component

**Responsibilities:**
1. Pass `clearedLinesInfo` and `animatingOutBlocks` to each TileVisual
2. Dispatch `CLEAR_CLEARED_LINES_INFO` after 400ms (ripple complete)
3. Dispatch `CLEAR_ANIMATING_OUT_BLOCKS` after 450ms ("animate out" complete)

### TileVisual Component

**Responsibilities:**
1. Calculate distance from tile to any cleared row/column
2. Calculate ripple intensity based on combo size
3. Detect intersection tiles (row + column crossings)
4. Apply ripple properties via CSS custom properties
5. Use `React.memo` to prevent unnecessary re-renders

**Key implementation:**
- All tiles calculate timing, only filled tiles show visual effect
- Staggered delay: 20ms × distance
- Intersection enhancement: 20% larger scale
- RAF cleanup for smooth timing

### BlockVisual Component

**Responsibilities:**
1. Check if block location is in `animatingOutBlocks`
2. Render "animate out" overlay with appropriate direction(s)
3. Support horizontal, vertical, or dual-direction rendering
4. Maintain proper z-index layering

### CSS Animations

**Ripple Pulse (TileVisual.css):**
- Applied to all tiles when `clearedLinesInfo` exists
- Uses CSS custom properties (delay, scale, brightness, duration)
- Keyframe: 0% → 50% (scale + brighten) → 100% (normal)
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- GPU optimizations: `transform: translateZ(0)`, `will-change`, `isolation: isolate`
- Accessibility: prefers-reduced-motion support

**Animate Out (BlockVisual.css):**
- Three phases: shrink (0-150ms) → line expand (150-300ms) → fade (300-450ms)
- Directional variants: horizontal (scaleX), vertical (scaleY), or both
- Keyframe at 300ms: 1.5× size, 50% opacity
- Uses white outline for visibility
- GPU-accelerated via `transform` and `opacity`

## Performance

**Optimization strategies:**
- Minimal reducer state (metadata only)
- Component-local animation state
- CSS-driven GPU-accelerated animations
- Pre-calculated values in JS
- `will-change` and `isolation` for layer creation
- Custom `React.memo` to prevent re-renders
- RAF cleanup for smooth timing

**Expected performance:**
- Consistent 60fps on modern devices
- Minimal memory footprint
- No blocking operations

## Integration

**Works seamlessly with:**
- Scoring System: Intensity scales with score
- Sound Effects: Synced with `playLineClearSounds()`
- Currency System: Ripple completes before GemShower
- Persistence: Animation state not persisted (ephemeral)

**Timeline:**
```
0ms:    Shape placed, lines cleared, sounds play
0ms:    All tiles begin ripple calculation
0ms:    Cleared blocks start "animate out"
50ms:   GemShower begins
400ms:  Ripple completes
450ms:  "Animate out" completes
600ms:  GemShower completes
```

## Visual Examples

### Ripple Propagation
```
Cleared row = 5, all 100 tiles calculate distance:

Row 1: distance = 4, delay = 80ms
Row 2: distance = 3, delay = 60ms
Row 3: distance = 2, delay = 40ms
Row 4: distance = 1, delay = 20ms
Row 5: distance = 0, delay = 0ms (cleared)
Row 6: distance = 1, delay = 20ms
...

Wave propagates from row 5 across entire grid.
```

### Animate Out Sequence
```
0ms:    Normal block
150ms:  Shrunk to point at center
300ms:  Line at 1.5× block width, 50% opacity
450ms:  Fade complete

Intersection blocks render both horizontal and vertical lines.
```

### Intensity Scaling
```
1 line:  scale=1.05, brightness=1.15, duration=200ms
2 lines: scale=1.10, brightness=1.30, duration=230ms
3 lines: scale=1.15, brightness=1.45, duration=260ms
4 lines: scale=1.20, brightness=1.60, duration=290ms

Intersections: scale×1.2, brightness×1.1
```

## Implementation Summary

**1. Full-Grid Ripple Wave:**
- Propagates across all 100 tiles with staggered timing
- Creates visible wave from cleared lines to edges
- Only blocks show visible effect
- Intensity scales with combo size

**2. Cleared Block "Animate Out":**
- Three-phase animation: shrink → line expansion → fade
- Directional rendering (horizontal/vertical/both for intersections)
- Completes at 450ms (ripple completes at 400ms)

**Architecture:**
- Minimal reducer state (metadata only)
- Component-local animation state
- GPU-accelerated CSS animations
- Coordinated cleanup timers
- Integrates with scoring and GemShower systems
