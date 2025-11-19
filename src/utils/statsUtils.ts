
import type { StatsPersistenceData, StatCategory } from '../types/stats';
import type { ColorName } from '../types/core';

/**
 * Updates the stats based on the cleared lines and placed shape
 */
export function updateStats(
  currentStats: StatsPersistenceData,
  clearedRows: { index: number; color?: string }[],
  clearedColumns: { index: number; color?: string }[]
): StatsPersistenceData {
  const newStats: StatsPersistenceData = JSON.parse(JSON.stringify(currentStats));
  const now = Date.now();
  newStats.lastUpdated = now;

  // Helper to increment a stat
  const incrementStat = (category: StatCategory, color?: string, amount: number = 1) => {
    // Update current game
    newStats.current[category].total += amount;
    if (color) {
      const colorName = color as ColorName;
      newStats.current[category].colors[colorName] = (newStats.current[category].colors[colorName] || 0) + amount;
    }

    // Update all time
    newStats.allTime[category].total += amount;
    if (color) {
      const colorName = color as ColorName;
      newStats.allTime[category].colors[colorName] = (newStats.allTime[category].colors[colorName] || 0) + amount;
    }

    // Update high score (check if current game exceeds high score)
    if (newStats.current[category].total > newStats.highScore[category].total) {
      newStats.highScore[category].total = newStats.current[category].total;
    }
    if (color) {
      const colorName = color as ColorName;
      const currentVal = newStats.current[category].colors[colorName] || 0;
      const highVal = newStats.highScore[category].colors[colorName] || 0;
      if (currentVal > highVal) {
        newStats.highScore[category].colors[colorName] = currentVal;
      }
    }
  };

  // 1. Shapes Placed
  incrementStat('shapesPlaced');

  // 2. Lines Cleared (Total)
  const totalLines = clearedRows.length + clearedColumns.length;
  if (totalLines > 0) {
    incrementStat('linesCleared', undefined, totalLines);
    // Track colors for lines cleared? User said "All of the stats for cleared elements should be tracked for every specific color too"
    // But a line might not have a uniform color. 
    // The `clearedRows` object has a `color` property if it was uniform.
    clearedRows.forEach(row => {
      if (row.color) incrementStat('linesCleared', row.color);
    });
    clearedColumns.forEach(col => {
      if (col.color) incrementStat('linesCleared', col.color);
    });
  }

  // 3. Rows Cleared
  if (clearedRows.length > 0) {
    incrementStat('rowsCleared', undefined, clearedRows.length);
    clearedRows.forEach(row => {
      if (row.color) incrementStat('rowsCleared', row.color);
    });
  }

  // 4. Columns Cleared
  if (clearedColumns.length > 0) {
    incrementStat('columnsCleared', undefined, clearedColumns.length);
    clearedColumns.forEach(col => {
      if (col.color) incrementStat('columnsCleared', col.color);
    });
  }

  const r = clearedRows.length;
  const c = clearedColumns.length;

  // Helper to get common color if all lines in the combo share the same color
  const getComboColor = (rows: typeof clearedRows, cols: typeof clearedColumns): string | undefined => {
    const allLines = [...rows, ...cols];
    if (allLines.length === 0) return undefined;
    const firstColor = allLines[0].color;
    if (!firstColor) return undefined;
    for (const line of allLines) {
      if (line.color !== firstColor) return undefined;
    }
    return firstColor;
  };

  const comboColor = getComboColor(clearedRows, clearedColumns);

  // Row Combos
  if (r === 2 && c === 0) incrementStat('doubleRows', comboColor);
  if (r === 3 && c === 0) incrementStat('tripleRows', comboColor);
  if (r === 4 && c === 0) incrementStat('quadrupleRows', comboColor);

  // Column Combos
  if (c === 2 && r === 0) incrementStat('doubleColumns', comboColor);
  if (c === 3 && r === 0) incrementStat('tripleColumns', comboColor);
  if (c === 4 && r === 0) incrementStat('quadrupleColumns', comboColor);

  // Mixed Combos
  if (r === 2 && c === 1) incrementStat('doubleRowsWithSingleColumns', comboColor);
  if (r === 3 && c === 1) incrementStat('tripleRowsWithSingleColumns', comboColor);
  if (r === 3 && c === 2) incrementStat('tripleRowsWithDoubleColumns', comboColor);
  if (r === 4 && c === 1) incrementStat('quadrupleRowsWithSingleColumns', comboColor);
  
  if (c === 2 && r === 1) incrementStat('doubleColumnsWithSingleRows', comboColor);
  if (c === 3 && r === 2) incrementStat('tripleColumnsWithDoubleRows', comboColor);
  if (c === 3 && r === 1) incrementStat('tripleColumnsWithSingleRows', comboColor);
  if (c === 4 && r === 1) incrementStat('quadrupleColumnsWithSingleRows', comboColor);

  if (r === 1 && c === 1) incrementStat('singleColumnBySingleRow', comboColor);
  if (r === 2 && c === 2) incrementStat('doubleColumnByDoubleRow', comboColor);
  if (r === 4 && c === 4) incrementStat('quadrupleRowByQuadrupleColumn', comboColor);

  return newStats;
}
