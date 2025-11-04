# Console Log Guide

## What to Look For

### Expected Flow for Click → Animation → Placement

1. **[Grid] Click event** - User clicks a cell
2. **[Grid] Click location: {row, column}** - Location calculated
3. **[Grid] Dispatching UPDATE_MOUSE_LOCATION and START_PLACEMENT_ANIMATION**

4. **[tetrixReducer] Action: UPDATE_MOUSE_LOCATION** - Updates mouse location
5. **[tetrixReducer] Action: START_PLACEMENT_ANIMATION** - Begins animation
   - Should log: **Calculated animation positions** with startPosition and targetPosition
   - New state: `placementAnimationState: 'animating'`

6. **[DraggingShape] Render** - Component re-renders
   - Should show: `placementAnimationState: 'animating'`
   - Should have: `animationStartPosition` and `animationTargetPosition`

7. **[usePlacementAnimation] Hook called** - Hook runs with new state
8. **[usePlacementAnimation] Effect triggered: animating** - Animation effect starts
9. **[usePlacementAnimation] Starting animation phase**

10. **[DraggingShape] Animation effect triggered** - Position animation starts
11. **[DraggingShape] Starting position animation**

12. **[usePlacementAnimation] Animation frame** - Multiple frames (progress 0 → 1)
13. **[DraggingShape] Position animation frame** - Multiple frames (eased progress)
14. **[DraggingShape] Calculating animated position** - Position interpolation
15. **[DraggingShape] Final animated container position** - Rendered position

16. **[usePlacementAnimation] Animation complete, dispatching COMPLETE_PLACEMENT_ANIMATION** - After 300ms

17. **[tetrixReducer] Action: COMPLETE_PLACEMENT_ANIMATION**
   - New state: `placementAnimationState: 'settling'`

18. **[DraggingShape] Hiding for settling phase** - DraggingShape unmounts
19. **[TileVisual] Multiple logs** - Should show:
   - `placementAnimationState: 'settling'`
   - `shouldShowHoveredBlock: true` for affected tiles
   - `isSettling: true`

20. **[BlockVisual]** logs for hovered blocks:
   - `isHovered: true, isSettling: true, isSmall: false`
   - `width/height: 'calc(100% + 2px)'` (full size)

21. **[usePlacementAnimation] Settling complete, dispatching FINISH_SETTLING_ANIMATION** - After 200ms

22. **[tetrixReducer] Action: FINISH_SETTLING_ANIMATION**
   - Places shape on grid
   - Clears lines
   - Auto-selects next shape
   - Resets animation state to 'none'

## Red Flags to Look For

❌ **DraggingShape disappears immediately**: Check if animation frames are being logged
❌ **animationProgress stays at 0**: Position animation effect not triggering
❌ **No "Calculating animated position" logs**: Animation interpolation not running
❌ **TileVisual shows shouldShowHoveredBlock: false**: Tiles aren't detecting settling phase
❌ **BlockVisual logs isSmall: true during settling**: Should be false for full size
❌ **Missing START_PLACEMENT_ANIMATION**: Click handler not firing
❌ **Animation positions are null**: State not being set properly in reducer

## Key State Values

- `placementAnimationState`: 'none' | 'animating' | 'settling'
- `isShapeDragging`: Should be false during animation
- `animationStartPosition`: Mouse position at click time
- `animationTargetPosition`: Center of target cell
- `animationProgress`: 0 to 1 during animation phase
