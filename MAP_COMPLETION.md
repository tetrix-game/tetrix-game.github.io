# Map Completion System

## Overview
A success/failure screen system for daily challenges and map-based levels that shows the player's performance with a star rating system.

## Components

### MapCompletionOverlay
A full-screen overlay that displays:
- Visual preview of the completed grid
- Star rating (0-3 stars)
- Statistics (matched tiles, missed tiles, total tiles)
- Descriptive messages based on performance
- Action buttons (Try Again, Continue/Back to Hub)

**Location**: `src/components/MapCompletionOverlay/`

### Star Rating System
- **3 Stars**: Perfect match - all blocks match their tile background colors (0 mismatches)
- **2 Stars**: Great - only 1-2 blocks don't match their tile backgrounds
- **1 Star**: Good - 3-5 blocks don't match
- **0 Stars**: Failed - more than 5 blocks don't match

## Utility Functions

### `checkMapCompletion(tiles, targetTiles)`
**Location**: `src/utils/mapCompletionUtils.ts`

Evaluates whether a map/challenge is complete and calculates the star rating based on:
1. All target tiles must be filled with blocks
2. Block colors should match their tile's background color

**Returns**: `MapCompletionResult` with:
- `isComplete`: boolean
- `matchedTiles`: number of correctly matched tiles
- `totalTiles`: total tiles that should be filled
- `missedTiles`: number of incorrect matches
- `stars`: 0-3 star rating

### `createTargetTilesSet(positions)`
Helper to create a Set of tile positions from an array (used for challenge definitions).

## State Management

### New State Properties
Added to `TetrixReducerState`:
- `mapCompletionResult`: Stores completion stats when level is finished (null otherwise)
- `targetTiles`: Set of tile positions that should be filled (from challenge data)

### New Actions
- `CHECK_MAP_COMPLETION`: Manually trigger completion check (finite modes only)
- `CLEAR_MAP_COMPLETION`: Clear completion result
- `START_DAILY_CHALLENGE`: Updated to accept optional `targetTiles` parameter

### Automatic Completion Check
In finite queue mode, when the queue is depleted:
1. System checks if `targetTiles` is defined
2. Runs `checkMapCompletion()` on current board state
3. If complete, stores results and transitions to 'gameover' state
4. Overlay is shown based on `mapCompletionResult` presence

**Location**: `src/reducers/tileReducer.ts` in `COMPLETE_PLACEMENT` action

## Integration

### Tetrix Component
Updated to conditionally show the completion overlay:
- Shows `MapCompletionOverlay` for daily/tutorial modes with completion results
- Shows standard `GameOverOverlay` for infinite mode or when no completion data exists

**Logic**:
```typescript
const showMapCompletion = gameState === 'gameover' && 
  (gameMode === 'daily' || gameMode === 'tutorial') && 
  mapCompletionResult !== null &&
  !isStatsOpen;
```

## Daily Challenge Format
The `START_DAILY_CHALLENGE` action automatically derives target tiles:
```typescript
{
  tiles: TilesSet;  // Tiles with non-grey backgrounds are automatically targets
  shapes: Shape[];
}
```

**Automatic Target Detection**: Any tile with a `backgroundColor` that is not `'grey'` is considered a target tile that should be filled. This matches the existing daily challenge format where colored tile backgrounds indicate the pattern to complete.

## Testing
Comprehensive test suite in `src/test/mapCompletion.test.ts`:
- Perfect match scenarios
- Various mismatch scenarios (1, 2, 3-5, 6+ mismatches)
- Incomplete board handling
- Target tiles filtering
- Edge cases (empty sets, missing tiles)

All 12 tests pass ✓

## Usage Example

```typescript
// Starting a daily challenge - target tiles automatically derived from tile backgrounds
dispatch({
  type: 'START_DAILY_CHALLENGE',
  value: {
    tiles: challengeTiles,  // Tiles with colored backgrounds are auto-detected as targets
    shapes: challengeShapes
  }
});

// Manual completion check (if needed)
dispatch({ type: 'CHECK_MAP_COMPLETION' });

// Clear completion overlay
dispatch({ type: 'CLEAR_MAP_COMPLETION' });
```

## Styling
CSS follows existing overlay patterns with:
- Star animation (pulse effect for filled stars)
- Responsive design for mobile/tablet
- Grid preview with reduced opacity and scale
- Color-coded stats (green for perfect, orange for misses)
- Themed buttons matching the game's style

## Future Enhancements
- Level progression tracking (which levels completed with what star rating)
- Leaderboards for best star ratings
- Special rewards for 3-star completions
- Replay functionality to see optimal solution
