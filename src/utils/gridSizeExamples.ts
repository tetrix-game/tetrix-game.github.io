/**
 * Example: Variable Board Size Usage
 * 
 * This file demonstrates how to use the variable board size feature
 * in the Tetrix game. It shows practical examples of changing grid
 * sizes for different game modes and difficulty levels.
 */

import { setGridSize, GRID_SIZE, GRID_ADDRESSES } from './gridConstants';

/**
 * Preset grid sizes for different game modes
 */
export const GRID_SIZE_PRESETS = {
  MINI: 6,      // Quick 6x6 games
  EASY: 8,      // Beginner-friendly 8x8
  NORMAL: 10,   // Classic 10x10 (default)
  HARD: 12,     // Challenging 12x12
  EXPERT: 15,   // Very difficult 15x15
  CHALLENGE: 20 // Maximum 20x20
} as const;

/**
 * Apply a preset grid size
 */
export function applyGridSizePreset(preset: keyof typeof GRID_SIZE_PRESETS): void {
  const size = GRID_SIZE_PRESETS[preset];
  setGridSize(size);
  console.log(`Grid size set to ${size}x${size} (${preset} mode)`);
}

/**
 * Example: Level-based progression
 * Grid size increases as player advances through levels
 */
export function setGridSizeForLevel(level: number): void {
  if (level <= 5) {
    applyGridSizePreset('EASY');
  } else if (level <= 10) {
    applyGridSizePreset('NORMAL');
  } else if (level <= 15) {
    applyGridSizePreset('HARD');
  } else {
    applyGridSizePreset('EXPERT');
  }
}

/**
 * Example: Score-based difficulty scaling
 * Grid grows larger as player's score increases
 */
export function setGridSizeForScore(score: number): void {
  if (score < 1000) {
    setGridSize(8);
  } else if (score < 5000) {
    setGridSize(10);
  } else if (score < 15000) {
    setGridSize(12);
  } else {
    setGridSize(15);
  }
}

/**
 * Example: Custom game mode with specific grid size
 */
export function initializeCustomMode(mode: 'quick' | 'standard' | 'marathon'): void {
  switch (mode) {
    case 'quick':
      setGridSize(6);  // Small grid for quick games
      break;
    case 'standard':
      setGridSize(10); // Standard size
      break;
    case 'marathon':
      setGridSize(15); // Large grid for long games
      break;
  }
  
  console.log(`${mode} mode initialized with ${GRID_SIZE}x${GRID_SIZE} grid`);
}

/**
 * Example: Verify grid size before starting game
 */
export function validateGameSetup(): boolean {
  const tileCount = GRID_ADDRESSES.length;
  const expectedTileCount = GRID_SIZE * GRID_SIZE;
  
  if (tileCount !== expectedTileCount) {
    console.error(`Grid mismatch: expected ${expectedTileCount} tiles, got ${tileCount}`);
    return false;
  }
  
  console.log(`✓ Grid validated: ${GRID_SIZE}x${GRID_SIZE} with ${tileCount} tiles`);
  return true;
}

/**
 * Example: Get current grid info
 */
export function getGridInfo() {
  return {
    size: GRID_SIZE,
    totalTiles: GRID_ADDRESSES.length,
    firstTile: GRID_ADDRESSES[0],
    lastTile: GRID_ADDRESSES[GRID_ADDRESSES.length - 1],
    dimensions: `${GRID_SIZE}x${GRID_SIZE}`,
  };
}

/**
 * Example: Safe grid size change with validation
 */
export function safeSetGridSize(size: number): boolean {
  try {
    setGridSize(size);
    console.log(`✓ Grid size changed to ${size}x${size}`);
    return true;
  } catch (error) {
    console.error(`✗ Invalid grid size: ${size}`, error);
    return false;
  }
}

/**
 * Example: Reset to default grid size
 */
export function resetToDefaultGrid(): void {
  setGridSize(10);
  console.log('Grid reset to default 10x10');
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * EXAMPLE 1: Initialize game with different modes
 */
export function example1_InitializeGame() {
  console.log('\n=== Example 1: Initialize Game ===');
  
  // Start with easy mode
  applyGridSizePreset('EASY');
  console.log(getGridInfo());
  
  // Switch to normal mode
  applyGridSizePreset('NORMAL');
  console.log(getGridInfo());
  
  // Try challenge mode
  applyGridSizePreset('CHALLENGE');
  console.log(getGridInfo());
  
  // Reset
  resetToDefaultGrid();
}

/**
 * EXAMPLE 2: Level progression system
 */
export function example2_LevelProgression() {
  console.log('\n=== Example 2: Level Progression ===');
  
  const levels = [1, 6, 11, 16];
  levels.forEach(level => {
    setGridSizeForLevel(level);
    console.log(`Level ${level}: ${GRID_SIZE}x${GRID_SIZE} grid`);
  });
  
  resetToDefaultGrid();
}

/**
 * EXAMPLE 3: Dynamic difficulty adjustment
 */
export function example3_DynamicDifficulty() {
  console.log('\n=== Example 3: Dynamic Difficulty ===');
  
  const scores = [500, 2500, 7500, 20000];
  scores.forEach(score => {
    setGridSizeForScore(score);
    console.log(`Score ${score}: ${GRID_SIZE}x${GRID_SIZE} grid`);
  });
  
  resetToDefaultGrid();
}

/**
 * EXAMPLE 4: Safe grid size changes
 */
export function example4_SafeChanges() {
  console.log('\n=== Example 4: Safe Grid Changes ===');
  
  safeSetGridSize(8);   // ✓ Valid
  safeSetGridSize(15);  // ✓ Valid
  safeSetGridSize(3);   // ✗ Too small
  safeSetGridSize(25);  // ✗ Too large
  
  resetToDefaultGrid();
}

/**
 * Run all examples
 */
export function runAllExamples() {
  example1_InitializeGame();
  example2_LevelProgression();
  example3_DynamicDifficulty();
  example4_SafeChanges();
  
  console.log('\n=== All Examples Complete ===');
  console.log('Final grid state:', getGridInfo());
}

// Uncomment to run examples in development:
// runAllExamples();
