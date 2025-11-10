// Simplified currency system using only blue gems
export const BLUE_GEM_COLOR = '#4169E1'; // Royal Blue

/**
 * Simple gem count - just return the score as gem count
 */
export function getGemCount(points: number): number {
  return Math.floor(points);
}

/**
 * Gets the blue gem color for display
 */
export function getGemColor(): string {
  return BLUE_GEM_COLOR;
}