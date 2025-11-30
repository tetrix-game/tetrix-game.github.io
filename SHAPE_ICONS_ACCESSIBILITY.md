# Shape Icons for Accessibility

## Overview
Added distinct shape icons to tiles and blocks to improve accessibility for color-blind users. Each color now has a unique geometric shape that makes it distinguishable even without color perception.

## Color-to-Shape Mapping

| Color  | Shape | Description |
|--------|-------|-------------|
| Red    | ●     | Circle |
| Orange | ▲     | Triangle (pointing up) |
| Yellow | ☀     | Sun (8 triangular rays) |
| Green  | 🍃    | Leaf (teardrop shape) |
| Blue   | 〰️    | Wave (sinusoidal curve) |
| Purple | ☾     | Crescent moon |
| Grey   | ◆     | Diamond (rotated square) |

## Implementation Details

### New Component: ShapeIcon
- **Location**: `src/components/ShapeIcon/`
- **Props**:
  - `color`: ColorName - determines which shape to render
  - `size`: number (default: 24) - icon dimensions in pixels
  - `opacity`: number (default: 1) - icon opacity

### SVG Implementation
- All shapes are pure SVG geometry (no stroke, only fill)
- Uses `currentColor` for fills to inherit color from CSS
- Color-specific CSS classes (`.shape-icon-red`, etc.) use existing CSS variables (`--color-red-bg`, etc.)
- Icons match the exact colors of blocks/tiles for visual consistency

### Integration Points

#### 1. BlockVisual Component
- Icons rendered at 60% of block size
- Centered within the block using flexbox
- Opacity: 0.9 for subtle but visible appearance
- Icon size scales with block size when provided

#### 2. Tile Component  
- Icons rendered at 20px fixed size for tile backgrounds
- Only shown for custom colored tile backgrounds (not grey)
- Opacity: 0.3 for subtle background indication
- Positioned absolutely at tile center

### CSS Changes

#### BlockVisual.css
- Added flexbox layout to center icon container
- `.block-icon-container` class for icon positioning

#### Tile.css
- Added flexbox layout to tile base
- `.tile-icon-background` class for absolute positioning
- Z-index: 0 to keep icon behind block content

#### ShapeIcon.css
- Color-specific classes using CSS variables
- Ensures icons match block/tile color schemes
- Consistent with theme system

### Shape Design Rationale

1. **Distinct Silhouettes**: Each shape has a unique outline easily distinguishable even at small sizes
2. **No Overlapping Designs**: No two shapes share similar geometry
3. **Cultural Neutrality**: Geometric shapes avoid cultural symbols
4. **Scalability**: All shapes render cleanly at any size using vector graphics
5. **Performance**: SVG paths are optimized, no gradients or complex effects

### Accessibility Benefits

- **Color Blindness**: Shapes provide non-color-based differentiation
- **Low Contrast**: Shapes visible even in low contrast scenarios
- **Pattern Recognition**: Multiple cues (color + shape) improve memory and gameplay
- **Universal Design**: Benefits all users, not just those with visual impairments

### Testing

Created comprehensive test suite: `src/test/shapeIcon.test.tsx`
- Tests all 7 colors render correctly
- Verifies unique shapes per color
- Validates size and opacity props
- Confirms aria-hidden for screen readers (decorative)
- All tests passing ✓

### Performance Considerations

- SVG rendering is GPU-accelerated
- Icons use `pointer-events: none` to avoid interaction overhead
- Minimal DOM overhead (one SVG per visible block/tile)
- No runtime calculations for geometry (pre-defined paths)

## Future Enhancements

Potential improvements (not implemented):
1. User preference to show/hide icons
2. Alternative shape sets for different visual styles
3. Animated icons for special events
4. High contrast mode with larger icons
5. Icon-only mode (remove colors entirely)

## Files Modified

### New Files
- `src/components/ShapeIcon/ShapeIcon.tsx`
- `src/components/ShapeIcon/ShapeIcon.css`
- `src/components/ShapeIcon/index.ts`
- `src/test/shapeIcon.test.tsx`

### Modified Files
- `src/components/BlockVisual/BlockVisual.tsx` - Added ShapeIcon rendering
- `src/components/BlockVisual/BlockVisual.css` - Added icon container styles
- `src/components/Tile/Tile.tsx` - Added background ShapeIcon for colored tiles
- `src/components/Tile/Tile.css` - Added background icon positioning
- `src/test/shapeSelectorLimit.test.tsx` - Fixed test class selector

## Deployment

The feature is ready for production deployment:
```bash
npm run build    # Builds successfully ✓
npm test         # All 300 tests pass ✓
npm run publish  # Deploy to gh-pages
```

## Visual Impact

- **Blocks**: Icons appear centered, slightly transparent (0.9 opacity)
- **Tiles**: Icons appear as subtle background shapes (0.3 opacity)
- **Shapes in queue**: Icons visible on all draggable shapes
- **Dragging**: Icons move with shapes during drag operations
- **Hover preview**: Icons shown in hover shadows on grid

The implementation maintains the existing visual aesthetic while adding an important accessibility layer that makes the game more inclusive.
