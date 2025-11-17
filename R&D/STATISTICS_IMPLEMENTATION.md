# Statistics Tracking Implementation Guide (Phases 2 & 3)

## Overview

This document outlines the implementation plan for comprehensive statistics tracking in the Tetrix game. This includes tracking various line clearing combinations (single, double, triple, quadruple lines and row/column combos) both globally and per-level.

## Phase 2: Data Structure & State Management

### 2.1 New Type Definitions

Add the following types to `src/utils/types.ts`:

```typescript
export type LineComboStats = {
  single: number;        // 1x1 (1 row OR 1 column cleared)
  double: number;        // 1x2 (2 rows OR 2 columns cleared)
  triple: number;        // 1x3 (3 rows OR 3 columns cleared)
  quad: number;          // 1x4 (4 rows OR 4 columns cleared)
  doubleDouble: number;  // 2x2 (2 rows AND 2 columns cleared simultaneously)
  doubleTriple: number;  // 2x3 (2 rows AND 3 columns cleared simultaneously)
  tripleDouble: number;  // 3x2 (3 rows AND 2 columns cleared simultaneously)
  tripleTriple: number;  // 3x3 (3 rows AND 3 columns cleared simultaneously)
  quadDouble: number;    // 4x2 (4 rows AND 2 columns cleared simultaneously)
  quadTriple: number;    // 4x3 (4 rows AND 3 columns cleared simultaneously)
  quadQuad: number;      // 4x4 (4 rows AND 4 columns cleared simultaneously)
};

export type LevelStatistics = {
  levelId: number;
  totalRowsCleared: number;
  totalColumnsCleared: number;
  lineCombos: LineComboStats;
  completedAt?: number; // timestamp when level was completed
  bestScore?: number;   // best score achieved on this level
};

export type GameStatistics = {
  global: {
    totalRowsCleared: number;
    totalColumnsCleared: number;
    totalShapesPlaced: number;
    totalLinesCleared: number; // sum of rows + columns cleared
    lineCombos: LineComboStats;
    totalPlayTime: number; // in milliseconds
    gamesPlayed: number;
    highScore: number;
  };
  perLevel: {
    [levelId: number]: LevelStatistics;
  };
  lastUpdated: number;
};

export type StatisticsPersistenceData = {
  statistics: GameStatistics;
  lastUpdated: number;
};
```

### 2.2 Update Reducer State

Modify `TetrixReducerState` in `src/utils/types.ts`:

```typescript
export type TetrixReducerState = {
  // ... existing properties ...
  
  // Add new statistics tracking
  gameStatistics: GameStatistics;
  sessionStartTime: number; // timestamp when current session started
  totalShapesPlaced: number; // track shapes placed in current session
}
```

### 2.3 Update Initial State

Modify `src/components/Tetrix/TetrixReducer.ts` initial state:

```typescript
const createEmptyLineComboStats = (): LineComboStats => ({
  single: 0,
  double: 0,
  triple: 0,
  quad: 0,
  doubleDouble: 0,
  doubleTriple: 0,
  tripleDouble: 0,
  tripleTriple: 0,
  quadDouble: 0,
  quadTriple: 0,
  quadQuad: 0,
});

const createInitialGameStatistics = (): GameStatistics => ({
  global: {
    totalRowsCleared: 0,
    totalColumnsCleared: 0,
    totalShapesPlaced: 0,
    totalLinesCleared: 0,
    lineCombos: createEmptyLineComboStats(),
    totalPlayTime: 0,
    gamesPlayed: 0,
    highScore: 0,
  },
  perLevel: {},
  lastUpdated: Date.now(),
});

const initialState: TetrixReducerState = {
  // ... existing properties ...
  gameStatistics: createInitialGameStatistics(),
  sessionStartTime: Date.now(),
  totalShapesPlaced: 0,
};
```

### 2.4 New Reducer Actions

Add new action types to `src/utils/types.ts`:

```typescript
type UpdateStatisticsAction = {
  type: 'UPDATE_STATISTICS';
  value: {
    clearedRows: number[];
    clearedColumns: number[];
    currentLevel: number;
    pointsEarned: number;
  };
};

type LoadStatisticsAction = {
  type: 'LOAD_STATISTICS';
  value: { statistics: GameStatistics };
};

type ResetStatisticsAction = {
  type: 'RESET_STATISTICS';
};

// Update the main TetrixAction union type to include these new actions
```

## Phase 3: Statistics Calculation Logic

### 3.1 Create Statistics Utility

Create new file `src/utils/statisticsUtils.ts`:

```typescript
import type { LineComboStats, GameStatistics, LevelStatistics } from './types';

/**
 * Determine the type of line combo based on cleared rows and columns
 */
export function calculateLineCombo(
  clearedRowsCount: number,
  clearedColumnsCount: number
): keyof LineComboStats | null {
  // Single direction clears (only rows OR only columns)
  if (clearedColumnsCount === 0) {
    switch (clearedRowsCount) {
      case 1: return 'single';
      case 2: return 'double';
      case 3: return 'triple';
      case 4: return 'quad';
    }
  }
  
  if (clearedRowsCount === 0) {
    switch (clearedColumnsCount) {
      case 1: return 'single';
      case 2: return 'double';
      case 3: return 'triple';
      case 4: return 'quad';
    }
  }
  
  // Multi-direction clears (both rows AND columns)
  if (clearedRowsCount === 2 && clearedColumnsCount === 2) return 'doubleDouble';
  if (clearedRowsCount === 2 && clearedColumnsCount === 3) return 'doubleTriple';
  if (clearedRowsCount === 3 && clearedColumnsCount === 2) return 'tripleDouble';
  if (clearedRowsCount === 3 && clearedColumnsCount === 3) return 'tripleTriple';
  if (clearedRowsCount === 4 && clearedColumnsCount === 2) return 'quadDouble';
  if (clearedRowsCount === 4 && clearedColumnsCount === 3) return 'quadTriple';
  if (clearedRowsCount === 4 && clearedColumnsCount === 4) return 'quadQuad';
  
  // For any other combinations (like 1x2, 1x3, etc.), classify based on the larger count
  const maxCount = Math.max(clearedRowsCount, clearedColumnsCount);
  switch (maxCount) {
    case 1: return 'single';
    case 2: return 'double';
    case 3: return 'triple';
    case 4: return 'quad';
    default: return null; // For counts > 4, not tracked
  }
}

/**
 * Update line combo statistics with a new combo
 */
export function updateLineComboStats(
  currentStats: LineComboStats,
  comboType: keyof LineComboStats
): LineComboStats {
  return {
    ...currentStats,
    [comboType]: currentStats[comboType] + 1,
  };
}

/**
 * Update global statistics with new line clearing data
 */
export function updateGlobalStatistics(
  currentGlobal: GameStatistics['global'],
  clearedRowsCount: number,
  clearedColumnsCount: number,
  pointsEarned: number,
  sessionTime: number
): GameStatistics['global'] {
  const comboType = calculateLineCombo(clearedRowsCount, clearedColumnsCount);
  
  let updatedLineCombos = currentGlobal.lineCombos;
  if (comboType) {
    updatedLineCombos = updateLineComboStats(currentGlobal.lineCombos, comboType);
  }
  
  return {
    ...currentGlobal,
    totalRowsCleared: currentGlobal.totalRowsCleared + clearedRowsCount,
    totalColumnsCleared: currentGlobal.totalColumnsCleared + clearedColumnsCount,
    totalLinesCleared: currentGlobal.totalLinesCleared + clearedRowsCount + clearedColumnsCount,
    totalShapesPlaced: currentGlobal.totalShapesPlaced + 1,
    lineCombos: updatedLineCombos,
    totalPlayTime: currentGlobal.totalPlayTime + sessionTime,
    highScore: Math.max(currentGlobal.highScore, pointsEarned),
  };
}

/**
 * Update or create per-level statistics
 */
export function updateLevelStatistics(
  currentLevelStats: LevelStatistics | undefined,
  levelId: number,
  clearedRowsCount: number,
  clearedColumnsCount: number,
  pointsEarned: number
): LevelStatistics {
  const comboType = calculateLineCombo(clearedRowsCount, clearedColumnsCount);
  
  if (!currentLevelStats) {
    // Create new level statistics
    const newStats: LevelStatistics = {
      levelId,
      totalRowsCleared: clearedRowsCount,
      totalColumnsCleared: clearedColumnsCount,
      lineCombos: {
        single: 0, double: 0, triple: 0, quad: 0,
        doubleDouble: 0, doubleTriple: 0, tripleDouble: 0,
        tripleTriple: 0, quadDouble: 0, quadTriple: 0, quadQuad: 0,
      },
      bestScore: pointsEarned,
    };
    
    if (comboType) {
      newStats.lineCombos[comboType] = 1;
    }
    
    return newStats;
  }
  
  // Update existing level statistics
  let updatedLineCombos = currentLevelStats.lineCombos;
  if (comboType) {
    updatedLineCombos = updateLineComboStats(currentLevelStats.lineCombos, comboType);
  }
  
  return {
    ...currentLevelStats,
    totalRowsCleared: currentLevelStats.totalRowsCleared + clearedRowsCount,
    totalColumnsCleared: currentLevelStats.totalColumnsCleared + clearedColumnsCount,
    lineCombos: updatedLineCombos,
    bestScore: Math.max(currentLevelStats.bestScore || 0, pointsEarned),
  };
}

/**
 * Update complete game statistics with new line clearing event
 */
export function updateGameStatistics(
  currentStats: GameStatistics,
  clearedRows: number[],
  clearedColumns: number[],
  currentLevel: number,
  currentScore: number,
  sessionStartTime: number
): GameStatistics {
  const clearedRowsCount = clearedRows.length;
  const clearedColumnsCount = clearedColumns.length;
  const sessionTime = Date.now() - sessionStartTime;
  
  // Update global statistics
  const updatedGlobal = updateGlobalStatistics(
    currentStats.global,
    clearedRowsCount,
    clearedColumnsCount,
    currentScore,
    sessionTime
  );
  
  // Update per-level statistics
  const currentLevelStats = currentStats.perLevel[currentLevel];
  const updatedLevelStats = updateLevelStatistics(
    currentLevelStats,
    currentLevel,
    clearedRowsCount,
    clearedColumnsCount,
    currentScore
  );
  
  return {
    global: updatedGlobal,
    perLevel: {
      ...currentStats.perLevel,
      [currentLevel]: updatedLevelStats,
    },
    lastUpdated: Date.now(),
  };
}

/**
 * Get statistics summary for display
 */
export function getStatisticsSummary(stats: GameStatistics) {
  return {
    totalLinesCleared: stats.global.totalLinesCleared,
    totalShapesPlaced: stats.global.totalShapesPlaced,
    highScore: stats.global.highScore,
    levelsPlayed: Object.keys(stats.perLevel).length,
    totalPlayTime: stats.global.totalPlayTime,
    favoriteCombo: getFavoriteCombo(stats.global.lineCombos),
  };
}

/**
 * Find the most frequently used combo
 */
function getFavoriteCombo(combos: LineComboStats): keyof LineComboStats | null {
  let maxCount = 0;
  let favoriteCombo: keyof LineComboStats | null = null;
  
  for (const [combo, count] of Object.entries(combos)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteCombo = combo as keyof LineComboStats;
    }
  }
  
  return favoriteCombo;
}
```

### 3.2 Update Reducer Integration

Modify the PLACE_SHAPE action in `src/components/Tetrix/TetrixReducer.ts`:

```typescript
case "PLACE_SHAPE": {
  // ... existing placement logic ...

  // Check for and clear full lines
  const { tiles: newTiles, clearedRows, clearedColumns } = clearFullLines(tilesWithShape);

  // Play sound effects for line clearing
  playLineClearSounds(clearedRows, clearedColumns);

  // Calculate score for lines cleared
  const scoreData = calculateScore(clearedRows.length, clearedColumns.length);
  const newScore = state.score + scoreData.pointsEarned;
  const newTotalLinesCleared = state.totalLinesCleared + clearedRows.length + clearedColumns.length;

  // Update statistics if any lines were cleared
  let updatedGameStatistics = state.gameStatistics;
  if (clearedRows.length > 0 || clearedColumns.length > 0) {
    updatedGameStatistics = updateGameStatistics(
      state.gameStatistics,
      clearedRows,
      clearedColumns,
      state.currentLevel,
      newScore,
      state.sessionStartTime
    );
  }

  // ... rest of existing logic ...

  return {
    ...state,
    tiles: newTiles,
    score: newScore,
    totalLinesCleared: newTotalLinesCleared,
    gameStatistics: updatedGameStatistics,
    totalShapesPlaced: state.totalShapesPlaced + 1,
    // ... rest of existing state updates ...
  };
}
```

### 3.3 Add Reducer Actions

Add the new action handlers to the reducer:

```typescript
case "UPDATE_STATISTICS": {
  const { clearedRows, clearedColumns, currentLevel, pointsEarned } = action.value;
  const updatedStats = updateGameStatistics(
    state.gameStatistics,
    clearedRows,
    clearedColumns,
    currentLevel,
    pointsEarned,
    state.sessionStartTime
  );
  
  return {
    ...state,
    gameStatistics: updatedStats,
  };
}

case "LOAD_STATISTICS": {
  return {
    ...state,
    gameStatistics: action.value.statistics,
  };
}

case "RESET_STATISTICS": {
  return {
    ...state,
    gameStatistics: createInitialGameStatistics(),
    sessionStartTime: Date.now(),
    totalShapesPlaced: 0,
  };
}
```

## Phase 4: Persistence Integration

### 4.1 Update Persistence Utils

Add to `src/utils/persistenceUtils.ts`:

```typescript
const STATISTICS_STORE = 'statistics';

// Update database initialization to include new store
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // ... existing store creation ...
      
      // Create statistics store if it doesn't exist
      if (!db.objectStoreNames.contains(STATISTICS_STORE)) {
        db.createObjectStore(STATISTICS_STORE);
      }
    };
    
    // ... rest of implementation ...
  });
}

/**
 * Save game statistics to IndexedDB
 */
export async function saveStatistics(statistics: GameStatistics): Promise<void> {
  try {
    const db = await initializeDatabase();
    const data: StatisticsPersistenceData = {
      statistics,
      lastUpdated: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STATISTICS_STORE], 'readwrite');
      const store = transaction.objectStore(STATISTICS_STORE);

      const request = store.put(data, 'current');

      request.onsuccess = () => {
        console.log('Statistics saved successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save statistics:', request.error);
        reject(new Error(`Failed to save statistics: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error saving statistics:', error);
    throw error;
  }
}

/**
 * Load game statistics from IndexedDB
 */
export async function loadStatistics(): Promise<GameStatistics | null> {
  try {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STATISTICS_STORE], 'readonly');
      const store = transaction.objectStore(STATISTICS_STORE);

      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result?.statistics) {
          resolve(result.statistics);
        } else {
          resolve(null); // No statistics saved yet
        }
      };

      request.onerror = () => {
        console.error('Failed to load statistics:', request.error);
        reject(new Error(`Failed to load statistics: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('Error loading statistics:', error);
    return null; // Return null on error
  }
}

// Update safeBatchSave to include statistics
export async function safeBatchSave(
  score?: number,
  tiles?: Tile[],
  nextShapes?: Shape[],
  savedShape?: Shape | null,
  statistics?: GameStatistics // Add new parameter
): Promise<void> {
  // ... existing implementation ...
  
  if (statistics !== undefined) {
    savePromises.push(saveStatistics(statistics));
  }
  
  // ... rest of implementation ...
}
```

### 4.2 Integration with Provider

Update `src/components/Tetrix/TetrixProvider.tsx` to load statistics on initialization:

```typescript
const loadSavedData = async () => {
  try {
    const [gameData, modifierData, statisticsData] = await Promise.all([
      loadCompleteGameState(),
      loadModifiers(),
      loadStatistics() // Add statistics loading
    ]);
    
    if (statisticsData) {
      dispatch({
        type: 'LOAD_STATISTICS',
        value: { statistics: statisticsData }
      });
    }
    
    // ... rest of existing logic ...
  } catch (error) {
    console.error('Error loading saved data:', error);
  }
};
```

## Phase 5: Testing Strategy

### 5.1 Unit Tests

Create `src/test/statisticsCalculation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateLineCombo,
  updateLineComboStats,
  updateGameStatistics
} from '../utils/statisticsUtils';

describe('Statistics Calculation', () => {
  describe('calculateLineCombo', () => {
    it('should identify single line clears correctly', () => {
      expect(calculateLineCombo(1, 0)).toBe('single');
      expect(calculateLineCombo(0, 1)).toBe('single');
    });
    
    it('should identify multi-direction combos correctly', () => {
      expect(calculateLineCombo(2, 2)).toBe('doubleDouble');
      expect(calculateLineCombo(3, 2)).toBe('tripleDouble');
      expect(calculateLineCombo(4, 4)).toBe('quadQuad');
    });
  });
  
  // Add more comprehensive tests...
});
```

### 5.2 Integration Tests

Create `src/test/statisticsIntegration.test.ts` to test the full statistics flow with the reducer.

### 5.3 Persistence Tests

Add tests for statistics persistence round-trip functionality.

## Implementation Timeline

1. **Week 1**: Implement Phase 2 (data structures and state management)
2. **Week 2**: Implement Phase 3 (calculation logic and reducer integration)  
3. **Week 3**: Implement Phase 4 (persistence) and Phase 5 (testing)
4. **Week 4**: Integration testing, bug fixes, and optimization

## Performance Considerations

- Statistics updates only occur when lines are actually cleared
- Persistence is asynchronous and doesn't block UI
- Statistics calculations are O(1) operations
- Consider adding debouncing for rapid successive line clears

## Future Enhancements

- Statistics visualization dashboard
- Achievement system based on statistics
- Leaderboards and comparisons
- Export statistics to CSV/JSON
- Statistics-based difficulty adjustment