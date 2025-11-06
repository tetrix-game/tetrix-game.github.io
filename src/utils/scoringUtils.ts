import type { ScoreData } from './types';

/**
 * Calculates score using exponential formula:
 * (rows_cleared)² + (columns_cleared)² + (rows × columns × 2)
 * 
 * Examples:
 * - 1 row: 1² = 1 point
 * - 2 rows: 2² = 4 points  
 * - 1 row + 1 column: 1² + 1² + (1×1×2) = 4 points
 * - 3 rows + 2 columns: 3² + 2² + (3×2×2) = 9 + 4 + 12 = 25 points
 */
export function calculateScore(rowsCleared: number, columnsCleared: number): ScoreData {
  const rowScore = Math.pow(rowsCleared, 2);
  const columnScore = Math.pow(columnsCleared, 2);
  const mixedBonus = rowsCleared > 0 && columnsCleared > 0 ? rowsCleared * columnsCleared * 2 : 0;

  const pointsEarned = rowScore + columnScore + mixedBonus;

  return {
    rowsCleared,
    columnsCleared,
    pointsEarned
  };
}

/**
 * Formats score for display with thousand separators
 */
export function formatScore(score: number): string {
  return score.toLocaleString();
}

/**
 * Creates a descriptive message about what was cleared and points earned
 */
export function getScoreMessage(scoreData: ScoreData): string {
  const { rowsCleared, columnsCleared, pointsEarned } = scoreData;

  if (pointsEarned === 0) return '';

  const parts: string[] = [];

  if (rowsCleared > 0) {
    parts.push(`${rowsCleared} row${rowsCleared > 1 ? 's' : ''}`);
  }

  if (columnsCleared > 0) {
    parts.push(`${columnsCleared} column${columnsCleared > 1 ? 's' : ''}`);
  }

  const clearedText = parts.join(' and ');
  const pointText = pointsEarned === 1 ? 'point' : 'points';

  return `Cleared ${clearedText}! +${pointsEarned} ${pointText}`;
}