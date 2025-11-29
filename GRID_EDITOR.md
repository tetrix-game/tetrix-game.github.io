# Grid Editor

A powerful visual editor for designing custom tile layouts in the Tetrix game. Create sparse grids, circular patterns, island layouts, and more!

## Features

### 🎨 Visual Tile Painting
- **Paint Mode**: Click tiles to add them to your layout
- **Erase Mode**: Click tiles to remove them from the layout
- **Color Preview**: See translucent color indicators while designing
- **Real-time Updates**: Changes appear instantly on the game grid

### 📐 Dynamic Grid Sizing
- **Width & Height**: Adjust from 2x2 to 20x20
- **Scroll to Adjust**: Use mouse wheel to quickly change dimensions
- **Input Fields**: Type exact values for precise control
- **Smart Tile Management**: Tiles outside new dimensions are automatically removed

### 🖌️ Brush System
- **Color Palette**: Choose from 7 block colors (grey, red, orange, yellow, green, blue, purple)
- **Eraser Tool**: Special tool to remove tiles
- **Scroll Through Colors**: Quick navigation with mouse wheel
- **Visual Feedback**: Selected color clearly indicated in menu

### 🎮 Navigation & Controls
- **Tab**: Navigate between menu sections
- **Space**: Open/close submenus
- **Mouse Wheel**: Scroll to change values in active section
- **Escape**: Close the editor
- **Keyboard Shortcut**: `Ctrl/Cmd + G` to open from anywhere in the app

### 📋 Export & Import
- **Export Layout**: Copy grid configuration to clipboard as JSON
- **Console Logging**: Layout data automatically logged for debugging
- **Importable Format**: Designed for use in game configurations
- **Sparse Encoding**: Only stores tiles that exist (efficient)

## How to Use

### Opening the Editor
1. Open the Settings menu (hamburger icon in top-right)
2. Click to expand the **Debug** section (may need to unlock by clicking hidden area 20 times)
3. Click **"Grid Editor"** button
4. The Grid Editor palette appears as a draggable overlay
5. First-time users see instructions (can be dismissed)

### Creating a Layout

#### Setting Grid Dimensions
1. Click or Tab to the **Rows** section
2. Press Space to open the submenu
3. Use +/- buttons, type a number, or scroll to adjust height (2-20)
4. Repeat for **Columns** section to set width

#### Painting Tiles
1. Navigate to the **Brush** section
2. Select a color from the palette (or choose the eraser)
3. Space to close the submenu
4. Click tiles on the game grid to paint/erase them
5. Scroll while brush is active to cycle through colors

#### Examples

**Creating a Circle Grid (10x10 with corners removed)**:
1. Set dimensions to 10x10
2. Select eraser
3. Click corner tiles: R1C1, R1C2, R2C1 (top-left)
4. Repeat for all four corners
5. Result: Circular layout with ~88 tiles

**Creating Island Patterns**:
1. Set desired dimensions (e.g., 15x15)
2. Use eraser to remove large sections
3. Leave small "islands" of connected tiles
4. Creates challenging layouts with separated play areas

**Creating a Cross Pattern**:
1. Set dimensions to 11x11
2. Use eraser to remove all tiles except row 6 and column 6
3. Result: Plus-sign shaped grid

### Exporting Your Design
1. Navigate to **Actions** section
2. Click "📋 Export Layout"
3. Layout is copied to clipboard and logged to console
4. Paste into your configuration files

## Architecture

### Components

- **GridEditor.tsx**: Main editor component with ScrollableMenu integration
- **GridEditorContext.tsx**: State management for editor (width, height, tiles, tools)
- **NumberInputSubmenu.tsx**: Reusable numeric input component for dimensions
- **ColorBrushSubmenu.tsx**: Color palette selector with eraser option
- **ScrollableMenu/**: Generic draggable menu framework (shared with DebugEditor)

### State Management

The editor maintains its own context separate from game state:

```typescript
type GridLayout = {
  width: number;        // Number of columns (2-20)
  height: number;       // Number of rows (2-20)
  tiles: Set<string>;   // Sparse set of tile keys ('R1C1', 'R5C10', etc.)
}
```

### Integration with Grid Component

The Grid component automatically detects when the GridEditor is open and:
- Renders only tiles present in the sparse layout
- Adjusts grid dimensions dynamically
- Maintains proper spacing between tiles using CSS Grid positioning
- Shows visual indication (blue outline) that editor is active

### Export Format

Exported layouts use this JSON structure:

```json
{
  "width": 10,
  "height": 10,
  "tiles": [
    "R1C3", "R1C4", "R1C5", "R1C6", "R1C7", "R1C8",
    "R2C2", "R2C3", "R2C4", "R2C5", "R2C6", "R2C7", "R2C8", "R2C9",
    ...
  ]
}
```

Only tiles that exist are stored, making it efficient for sparse layouts.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate menu sections |
| `Shift + Tab` | Navigate backwards |
| `Space` | Open/close active section |
| `Mouse Wheel` | Navigate or adjust values |
| `Escape` | Close editor |

## Use Cases

### Game Design
- Create custom challenge levels
- Design themed grids (circles, diamonds, stars)
- Test gameplay with unusual layouts
- Prototype new game modes

### Testing
- Verify shape placement with sparse grids
- Test edge cases (minimal tiles, disconnected sections)
- Debug layout-specific issues
- Validate grid rendering performance

### Content Creation
- Design level progressions
- Create seasonal themed layouts
- Export layouts for sharing
- Build community challenges

## Technical Details

### Sparse Grid Implementation

The Grid component uses explicit CSS Grid positioning for each tile:

```css
.tile-visual {
  grid-column: var(--tile-column);
  grid-row: var(--tile-row);
}
```

This allows tiles to be positioned correctly even with gaps in the layout. The grid container sets dimensions:

```css
.grid {
  grid-template-columns: repeat(var(--grid-width), 1fr);
  grid-template-rows: repeat(var(--grid-height), 1fr);
}
```

### Performance Considerations

- **Sparse Encoding**: Only stores existing tiles (Set<string>)
- **Memoized Rendering**: Grid only re-renders when layout changes
- **Efficient Updates**: Individual tile add/remove operations
- **Minimal State**: No redundant data storage

### Accessibility

- **Keyboard Navigation**: Full keyboard support for all actions
- **Visual Feedback**: Clear indication of active section and selected tool
- **Instructions**: First-time guidance with dismissible overlay
- **Draggable UI**: Move palette to avoid obscuring work area

## Future Enhancements

Potential additions for future versions:

- **Presets**: Common patterns (circle, diamond, cross) as quick-start options
- **Symmetry Tools**: Mirror or rotate patterns automatically
- **Undo/Redo**: Step through design changes
- **Pattern Brush**: Paint multiple tiles at once with custom shapes
- **Grid Templates**: Save and load favorite layouts
- **Visual Preview**: Show what shapes can fit in current layout
- **Color Zones**: Assign different colors to tile regions
- **Import from File**: Load layouts from JSON files

## Testing

Comprehensive test suite in `src/test/gridEditor.test.tsx`:

- ✅ Grid dimension adjustment with bounds checking
- ✅ Individual tile add/remove operations
- ✅ Clear all functionality
- ✅ Color cycling and tool switching
- ✅ Export and import layout data
- ✅ Sparse layout creation (circle pattern example)
- ✅ Grid shrinking removes out-of-bounds tiles

Run tests with:
```bash
npm test -- gridEditor.test.tsx
```

## Related Documentation

- [Debug Editor](./IMPLEMENTATION_SUMMARY.md) - Similar menu-based editor for blocks
- [Grid Constants](../src/utils/gridConstants.ts) - Grid addressing and validation
- [Scrollable Menu](../src/components/ScrollableMenu/) - Reusable menu framework
