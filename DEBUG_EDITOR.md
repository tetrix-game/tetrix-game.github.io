# Debug Editor

A powerful in-game debugging tool for manually editing the Tetrix game grid.

## Features

### Tool Palette
- **Absolutely positioned** in the upper-right corner (top: 20px, right: 20px)
- **Three editing tools:**
  - **Fill Row (━)**: Fills an entire row except the clicked tile
  - **Fill Column (┃)**: Fills an entire column except the clicked tile  
  - **Remove (✕)**: Removes the block from the clicked tile
- **Color Picker**: Select from 7 colors (grey, red, orange, yellow, green, blue, purple)
- **Visual feedback**: Active tool highlighted with larger blue border

### Controls
- **Mouse wheel**: Scroll to cycle through tools (forward/backward)
- **Click tiles**: Apply the current tool with the selected color
- **Escape key**: Close the debug editor

## Architecture

### Self-Contained Design
The debug editor is built as a highly modular, self-contained system:

```
DebugEditor/
├── DebugEditorContext.tsx   # Context for state management
├── DebugEditor.tsx          # Main UI component (overlay + palette)
├── DebugEditor.css         # Styling
└── index.ts                # Public exports
```

### Context-Based State Management
Uses `DebugEditorContext` to avoid prop drilling:
- `isEditorOpen`: Toggle editor visibility
- `currentTool`: Active tool ('fill-row', 'fill-column', 'remove')
- `selectedColor`: Color for fill operations

### Custom Hook for Grid Interactions
`useDebugGridInteractions()` provides:
- `isDebugMode`: Boolean indicating if editor is active
- `handleDebugClick(location)`: Click handler for grid tiles

## Integration Points

### 1. Main.tsx - Provider Wrapper
```tsx
<DebugEditorProvider>
  <App />
</DebugEditorProvider>
```

### 2. App.tsx - Component Render
```tsx
<DebugEditor />
```

### 3. MenuDropdown - Entry Point
Added "Debug Editor" button in the Debug submenu to open the editor.

### 4. Grid.tsx - Click Handling
```tsx
const { isDebugMode, handleDebugClick } = useDebugGridInteractions();
// Pass click handler to TileVisual when debug mode is active
```

### 5. TileVisual.tsx - Click Propagation
Accepts optional `onClick` prop that triggers when tiles are clicked.

## Reducer Actions

Three new actions added to `TetrixReducer`:

```typescript
type DebugFillRowAction = {
  type: 'DEBUG_FILL_ROW';
  value: { row: number; excludeColumn: number; color: ColorName };
}

type DebugFillColumnAction = {
  type: 'DEBUG_FILL_COLUMN';
  value: { column: number; excludeRow: number; color: ColorName };
}

type DebugRemoveBlockAction = {
  type: 'DEBUG_REMOVE_BLOCK';
  value: { location: Location };
}
```

Each action:
- Updates the tiles in the game state
- Triggers `safeBatchSave()` for persistence
- Maintains consistent tile structure

## Usage

1. **Open Menu**: Click hamburger menu (☰) in header
2. **Expand Debug**: Click "Debug" to open submenu
3. **Launch Editor**: Click "Debug Editor"
4. **Select Tool**: Click a tool icon or scroll mouse wheel
5. **Choose Color**: Click a color swatch (for fill tools)
6. **Edit Grid**: Click any tile to apply the current tool
7. **Close**: Click "Close" button or press Escape

## Testing

Comprehensive test suite in `src/test/debugEditor.test.ts`:
- ✓ Fill row excluding clicked column
- ✓ Fill column excluding clicked row
- ✓ Remove blocks at specific locations
- ✓ Apply different colors correctly

Run tests:
```bash
npm test -- debugEditor.test.ts
```

## Styling

- **Dark theme**: Matches game aesthetic (#1a1a1a, #2a2a2a backgrounds)
- **Responsive**: Tools scale with viewport
- **Accessibility**: Color contrast for visibility
- **Smooth transitions**: 0.2s on hover states
- **GPU optimization**: Transform-based animations

## Performance

- Memoized components prevent unnecessary re-renders
- Event listeners cleaned up on unmount
- Batch saves prevent database thrashing
- Minimal DOM updates when tools/colors change

## Future Enhancements

Possible additions:
- Undo/redo functionality
- Brush size for multi-tile editing
- Pattern stamping (fill diagonals, checkerboard, etc.)
- Copy/paste tile regions
- Grid reset to empty state
- Save/load grid snapshots
