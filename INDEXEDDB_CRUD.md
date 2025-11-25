# IndexedDB CRUD Access Pattern

## Overview

This system provides a clean, type-safe CRUD (Create, Read, Update, Delete) interface for IndexedDB with automatic data separation between different game views/modes.

## Architecture

### Three-Layer Design

```
┌─────────────────────────────────────┐
│   Application Layer                 │
│   (Components, Reducers)            │
└────────────┬────────────────────────┘
             │ Uses convenience functions
             ▼
┌─────────────────────────────────────┐
│   Convenience Layer                 │
│   (persistence.ts)                  │
│   - saveGameForMode()               │
│   - loadGameForMode()               │
│   - safeBatchSave()                 │
└────────────┬────────────────────────┘
             │ Uses high-level operations
             ▼
┌─────────────────────────────────────┐
│   Adapter Layer                     │
│   (persistenceAdapter.ts)           │
│   - View-aware routing              │
│   - Data transformation             │
│   - Migration logic                 │
└────────────┬────────────────────────┘
             │ Uses CRUD operations
             ▼
┌─────────────────────────────────────┐
│   CRUD Layer                        │
│   (indexedDBCrud.ts)                │
│   - write(), read(), remove()       │
│   - batchWrite(), batchRead()       │
│   - Store management                │
└─────────────────────────────────────┘
```

## Data Separation

### Store Structure

The database is organized into separate stores for complete data isolation:

**Game State Stores** (mode-specific):
- `infiniteState` - Infinite mode game data
- `dailyState` - Daily challenge game data
- `tutorialState` - Tutorial mode game data

**Shared Stores** (cross-mode):
- `settings` - Music, sound, theme, debug preferences
- `stats` - Game statistics and achievements
- `modifiers` - Unlocked game modifiers

**Legacy Stores** (for migration):
- `gameState`, `score`, `tiles`, `shapes` - Old format support

### Data Flow

```
User Action
    ↓
Reducer Action (with gameMode context)
    ↓
safeBatchSave(gameMode, { score, tiles, ... })
    ↓
Adapter routes to correct store based on gameMode
    ↓
CRUD writes to infiniteState/dailyState/tutorialState
    ↓
IndexedDB stores data separately
```

## Usage Examples

### Basic Game State Operations

```typescript
import { saveGameForMode, loadGameForMode, clearGameForMode } from './utils/persistence';

// Save game state for infinite mode
await saveGameForMode('infinite', {
  score: 1000,
  tiles: tilesArray,
  nextShapes: shapes,
  savedShape: null,
  totalLinesCleared: 10,
  shapesUsed: 20,
  hasPlacedFirstShape: true,
});

// Load game state for daily mode
const dailyGame = await loadGameForMode('daily');
if (dailyGame) {
  console.log('Daily score:', dailyGame.score);
  console.log('Tiles:', dailyGame.tiles);
}

// Clear tutorial mode
await clearGameForMode('tutorial');
```

### Batch Operations

```typescript
import { safeBatchSave } from './utils/persistence';

// Save multiple pieces of data at once
await safeBatchSave('infinite', {
  score: 500,
  tiles: updatedTiles,
  nextShapes: newShapes,
  stats: updatedStats,
  totalLinesCleared: 15,
});
```

### Settings Management

```typescript
import {
  saveMusicSettings,
  loadMusicSettings,
  saveTheme,
  loadTheme,
} from './utils/persistence';

// Save music preferences
await saveMusicSettings(false, 75, true); // unmuted, 75% volume, enabled

// Load music preferences
const music = await loadMusicSettings();
console.log('Volume:', music.volume); // 75

// Save theme
await saveTheme('dark');

// Load theme
const theme = await loadTheme(); // 'dark'
```

### Stats and Modifiers

```typescript
import { saveStats, loadStats, saveModifiers, loadModifiers } from './utils/persistence';

// Save statistics
await saveStats(statsData);

// Load statistics
const stats = await loadStats();

// Save unlocked modifiers
const unlockedSet = new Set([2, 3, 5, 7, 11]);
await saveModifiers(unlockedSet);

// Load modifiers
const modifiers = await loadModifiers(); // Set(5) { 2, 3, 5, 7, 11 }
```

### Utility Functions

```typescript
import {
  hasSavedGameData,
  getSavedGameModes,
  getPrimaryGameMode,
  clearAllGameData,
} from './utils/persistence';

// Check if any saved game exists
const hasData = await hasSavedGameData();

// Get list of modes with saved data
const modes = await getSavedGameModes(); // ['infinite', 'daily']

// Get primary active mode
const primary = await getPrimaryGameMode(); // 'infinite'

// Clear all game data (preserves settings)
await clearAllGameData();
```

## Key Features

### 1. **Complete Data Isolation**
Each game mode has its own store, preventing any cross-contamination:
```typescript
// These are completely separate
saveGameForMode('infinite', data1);
saveGameForMode('daily', data2);
```

### 2. **Type Safety**
Full TypeScript support with strict typing:
```typescript
type GameModeContext = 'infinite' | 'daily' | 'tutorial';
type ViewGameState = {
  score: number;
  tiles: Array<{ key: string; data: TileData }>;
  nextShapes: Shape[];
  // ... other fields
};
```

### 3. **Automatic Migration**
Legacy data is automatically migrated to the new format:
```typescript
await initializePersistence(); // Migrates old data if found
```

### 4. **Batch Operations**
Efficient multi-record operations:
```typescript
await batchWrite([
  { storeName: 'infiniteState', key: 'current', data: state1 },
  { storeName: 'settings', key: 'current', data: settings },
]);
```

### 5. **Error Handling**
Graceful degradation with fallbacks:
```typescript
try {
  await saveGameForMode('infinite', data);
} catch (error) {
  console.warn('Save failed, continuing without persistence');
}
```

## Testing

Comprehensive test suite using `fake-indexeddb`:

```bash
npm test -- indexedDBCrud.test.ts persistenceAdapter.test.ts
```

Tests cover:
- Basic CRUD operations
- Store separation guarantees
- Batch operations
- Data type handling
- View-specific isolation
- Settings persistence
- Migration logic

## Migration Guide

### From Old System

**Old way:**
```typescript
import { saveScore, saveTiles, saveShapes } from './persistenceUtils';

await saveScore(score);
await saveTiles(tiles);
await saveShapes(shapes, savedShape);
```

**New way:**
```typescript
import { safeBatchSave } from './utils/persistence';

await safeBatchSave('infinite', {
  score,
  tiles,
  nextShapes: shapes,
  savedShape,
});
```

### Benefits

1. **One call instead of three** - More efficient
2. **Mode-aware** - Data goes to correct store
3. **Type-safe** - TypeScript catches errors
4. **Atomic** - All data saved in one transaction
5. **Isolated** - No cross-mode contamination

## Performance Considerations

### Optimizations

1. **Connection Pooling**: Database connection is reused across operations
2. **Batch Transactions**: Multiple writes in single transaction
3. **Lazy Loading**: Only load data when needed
4. **Type Serialization**: Efficient data format for storage

### Best Practices

```typescript
// ✅ Good: Batch related updates
await safeBatchSave('infinite', {
  score: newScore,
  tiles: newTiles,
  stats: newStats,
});

// ❌ Avoid: Multiple separate calls
await saveGameForMode('infinite', { score: newScore, tiles, nextShapes, savedShape });
await saveStats(newStats);
await saveGameForMode('infinite', { score: newScore, tiles: newTiles, nextShapes, savedShape });
```

## Debugging

### Enable Console Logs

The system logs important events:
```
Game state saved for infinite mode
Game state loaded for daily mode
Settings saved
Modifiers saved: [2, 3, 5, 7, 11]
```

### Inspect Database

Use browser DevTools → Application → IndexedDB → TetrixGameDB

### Clear Data

```typescript
import { clearAllGameData, clearAllDataAndReload } from './utils/persistence';

// Clear game data only (keep settings)
await clearAllGameData();

// Nuclear option (clear everything and reload)
await clearAllDataAndReload();
```

## Future Enhancements

Possible additions:
- [ ] Compression for large datasets
- [ ] Encryption for sensitive data
- [ ] Cloud sync with conflict resolution
- [ ] Versioned snapshots/undo
- [ ] Import/export functionality
- [ ] Data analytics/telemetry
