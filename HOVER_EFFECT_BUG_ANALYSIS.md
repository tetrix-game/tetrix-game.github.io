# Hover Effect Bug Analysis

## Bug Description

When hovering over the grid with a selected shape, a portion of tiles above the mouse position are getting a whitish tint when they shouldn't. The tint overlay is being applied to tiles that are not part of the actual shape preview.

## Expected Behavior

### When Shape CAN Be Placed
1. Show full-sized block visualizations at the exact positions where the shape would be placed
2. Apply a whitish tint overlay (`rgba(255, 255, 255, 0.2)`) to these blocks
3. Blocks should be centered on the hover location according to the shape's geometric center

### When Shape CANNOT Be Placed
1. Show **half-sized** block visualizations
2. Blocks should be **centered** where the full-sized blocks would have been placed
3. **NO whitish tint overlay** should be applied
4. Spacing between block centers should remain the same as full-sized version
5. If you were to mark a dot on each block center, those dots would appear in the same screen positions in both states

## Current Implementation Issues

### In `TileVisual.tsx`

```tsx
{isPreview && (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    pointerEvents: 'none',
    zIndex: 3,
  }} />
)}
```

**Problem:** This code applies the whitish tint to ALL tiles where `isPreview === true`, without checking if the shape can actually be placed.

### In `Grid.tsx`

```tsx
const previewPositions = selectedShape && mouseGridLocation
  ? getShapeGridPositions(selectedShape, mouseGridLocation)
  : [];

const previewSet = new Set(
  previewPositions.map(p => `${p.location.row},${p.location.column}`)
);

// Later in render:
const isPreview = previewSet.has(key);
```

**Missing:** There's no validation to check if the shape can actually be placed at the current location using `canPlaceShape()`.

## Required Changes

### 1. Add Placement Validation in Grid Component

```tsx
// In Grid.tsx
import { canPlaceShape, getShapeGridPositions } from '../../utils/shapeUtils';

// Calculate if shape can be placed
const occupiedPositions = new Set(
  tiles
    .filter(tile => tile.block.isFilled)
    .map(tile => `${tile.location.row},${tile.location.column}`)
);

const canPlace = selectedShape && mouseGridLocation
  ? canPlaceShape(
      selectedShape, 
      mouseGridLocation, 
      { rows: 10, columns: 10 },
      occupiedPositions
    )
  : false;

// Pass to TileVisual
<TileVisual
  key={tile.id}
  tile={tile}
  isPreview={isPreview}
  canPlaceShape={canPlace}
  previewBlock={...}
/>
```

### 2. Update TileVisual to Handle Both States

```tsx
// In TileVisual.tsx
type TileVisualProps = {
  tile: Tile;
  isPreview?: boolean;
  canPlaceShape?: boolean;  // NEW
  previewBlock?: Block;
}

const TileVisual = ({ 
  tile, 
  isPreview = false, 
  canPlaceShape = false,  // NEW
  previewBlock 
}: TileVisualProps) => {
  
  // Display logic
  const displayBlock = isPreview && previewBlock ? {
    ...previewBlock,
    isFilled: true,
  } : tile.block;

  return (
    <div onClick={onClick} style={style(tile.location.row, tile.location.column)}>
      {/* For non-placeable preview, render half-sized centered block */}
      {isPreview && !canPlaceShape ? (
        <div style={{
          position: 'absolute',
          top: '25%',      // Center the half-sized block
          left: '25%',     // Center the half-sized block
          width: '50%',    // Half size
          height: '50%',   // Half size
        }}>
          <BlockVisual block={displayBlock} />
        </div>
      ) : (
        <BlockVisual block={displayBlock} />
      )}
      
      {/* Only apply tint when preview AND can place */}
      {isPreview && canPlaceShape && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          pointerEvents: 'none',
          zIndex: 3,
        }} />
      )}
    </div>
  )
}
```

## Visual Alignment Requirements

The key requirement is that block center points remain consistent between states:

### Placeable State (Full-Size)
- Block fills 100% of tile
- Center is at tile center
- Tint overlay applied

### Non-Placeable State (Half-Size)
- Block fills 50% of tile
- **Center is still at tile center** (positioned at 25% offset from top-left)
- NO tint overlay

This ensures that:
1. The visual "center of mass" doesn't shift when placement becomes invalid
2. If you mark a dot at the center of each block, those dots stay in the same screen positions
3. The spacing between blocks (distance between centers) remains constant

## Test Coverage

The test file `src/test/hoverEffect.test.tsx` includes:

1. **Position Calculation Tests**
   - Verify `getShapeGridPositions` returns correct number of blocks
   - Verify positions are centered around hover location
   - Verify positions are unique (no duplicates)
   - Verify relative distances between blocks are maintained

2. **Placement Validation Tests**
   - Verify `canPlaceShape` returns true for valid placements
   - Verify it returns false for out-of-bounds placements
   - Verify it returns false for overlapping occupied tiles
   - Verify it returns true for adjacent but non-overlapping tiles

3. **Preview Consistency Tests**
   - Verify shape center point is consistent across locations
   - Verify half-sized rendering maintains visual alignment
   - Verify preview overlay only applies to exact shape positions
   - Verify distinction between placeable and non-placeable states

## Implementation Checklist

- [ ] Add `canPlaceShape` validation in Grid component
- [ ] Pass `canPlaceShape` boolean to TileVisual component
- [ ] Update TileVisual to render half-sized blocks when not placeable
- [ ] Update TileVisual to only apply tint overlay when placeable
- [ ] Verify block centering in both states
- [ ] Test edge cases (boundaries, overlaps)
- [ ] Verify no tiles outside shape bounds receive preview styling

## Visual Testing

To manually test:
1. Select a shape from the shape selector
2. Hover over the middle of the grid → should see full-sized blocks with tint
3. Hover near the grid edge → should see half-sized blocks WITHOUT tint
4. Hover over an occupied tile → should see half-sized blocks WITHOUT tint
5. Verify that block centers don't shift when transitioning between states
