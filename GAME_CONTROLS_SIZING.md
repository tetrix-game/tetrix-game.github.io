# GameControls Sizing Refactor - Acceptance Criteria

## Core Requirements

### 1. Viewport-Based Sizing
- Identify larger viewport dimension (width or height)
- Subtract header height (10vh) from available space
- Calculate: `gridSize = (largerDimension - header) * 2/3`
- Calculate: `gameControlsPanelSize = (largerDimension - header) * 1/3`

### 2. Grid Sizing
- Grid edge length = `gridSize`
- Maintains 10x10 tile layout
- No clipping or overflow

### 3. GameControlsPanel Layout
- Size = `gameControlsPanelSize` along the main axis
- Portrait: Width matches grid, height = `gameControlsPanelSize`
- Landscape: Height matches grid, width = `gameControlsPanelSize`
- Uses `display: flex`, `justify-content: space-around`, `align-items: center`
- No explicit gap between children

### 4. ShapeQueue Sizing
- Calculate `shapeOptionSize` from `gameControlsPanelSize` accounting for:
  - 3 shapes in a row/column
  - Container padding (12px per side)
  - Space for indicator (40px)
  - Natural spacing from flex layout
- ShapeSelector sets explicit dimensions via CSS variable:
  - Portrait: `width: calc(3 * var(--shape-option-size))`, `height: auto`
  - Landscape: `height: calc(3 * var(--shape-option-size))`, `width: auto`
- ShapeQueue uses `width: fit-content` and `height: fit-content`
- Wraps to 2 lines: shapes on first line, indicator on second
- Indicator centered along long axis

### 5. PurchasesContainer Sizing
- Calculate `turnButtonSize` from `gameControlsPanelSize`
- Buttons size themselves based on this value
- Container uses `fit-content` sizing

### 6. Responsive Behavior
- Portrait: Vertical stack (Grid, then Panel)
- Landscape: Horizontal stack (Grid, then Panel)
- No clipping in either orientation
- All elements visible and usable
- Minimum sizes enforced for very small screens

### 7. Implementation Details
- Sizing logic in `useGameSizing` hook
- Pass sizing via CSS variables to components
- Remove calculated dimensions from ShapeQueue
- ShapeSelector receives `--shape-option-size` and calculates its own dimensions
- Remove gap from GameControlsPanel, rely on space-around

### 8. Unified Button Sizing
- All interactive buttons use same size: `gameControlsButtonSize`
  - ShapeOptions: square, size = `gameControlsButtonSize`
  - QueueIndicator: square, size = `gameControlsButtonSize`
  - Turn buttons: square, size = `gameControlsButtonSize`
- Base calculation accounts for 3 shapes + indicator + spacing
- ShapeSelector dimensions: `3 * gameControlsButtonSize`

### 9. Debug Controls
- Add slider in debug menu: "Button Size"
- Range: 50% to 150% of optimal size
- Default position: 100% (middle)
- Slider position persists across sessions
- Real-time update when slider changes
- Store multiplier in settings state (0.5 to 1.5)

### 10. Calculation Flow
1. `gameControlsPanelSize = (largerDimension - header) / 3`
2. `baseButtonSize = calculateOptimalButtonSize(gameControlsPanelSize)`
3. `gameControlsButtonSize = baseButtonSize * userMultiplier`
4. Pass `gameControlsButtonSize` via CSS variable `--game-controls-button-size`
5. All components reference this single variable

## Success Metrics
- [ ] No clipping of any UI elements
- [ ] Grid + Panel exactly fill the larger dimension
- [ ] ShapeQueue properly displays 3 shapes + indicator on separate lines
- [ ] Indicator centered along long axis
- [ ] Works in both portrait and landscape
- [ ] Works on mobile, tablet, and desktop sizes
- [ ] No overlap between components
- [ ] All buttons in GameControlsPanel are same size
- [ ] Debug slider ranges from 50% to 150%
- [ ] Default slider position is middle (100%)
- [ ] Slider changes update UI in real-time
- [ ] Slider position persists across page reloads
- [ ] At 50%, UI still usable (no clipping)
- [ ] At 150%, UI still fits without overflow
