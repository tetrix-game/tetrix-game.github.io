import { describe, it, expect } from 'vitest';

import type { TilesSet } from '../main/App/types/core';
import { solveDailyChallenge } from '../main/App/utils/dailyChallengeSolver';

describe('solveDailyChallenge', () => {
  it('should solve a simple 2x2 grid', () => {
    // Mock TilesSet
    const tiles = new Map() as TilesSet;
    // Add a 2x2 square of red tiles
    tiles.set('R1C1', { position: 'R1C1', backgroundColor: 'grey', block: { color: 'red', isFilled: true }, activeAnimations: [] });
    tiles.set('R1C2', { position: 'R1C2', backgroundColor: 'grey', block: { color: 'red', isFilled: true }, activeAnimations: [] });
    tiles.set('R2C1', { position: 'R2C1', backgroundColor: 'grey', block: { color: 'red', isFilled: true }, activeAnimations: [] });
    tiles.set('R2C2', { position: 'R2C2', backgroundColor: 'grey', block: { color: 'red', isFilled: true }, activeAnimations: [] });

    const seed = 12345;
    const solution = solveDailyChallenge(tiles, seed);


    expect(solution).not.toBeNull();
    expect(solution!.length).toBeGreaterThan(0);
  });
});
