import { useState, useCallback } from 'react';
import { useTetrixDispatchContext } from '../components/Tetrix/TetrixContext';
import type { TilesSet, Shape, Tile } from '../types';

type DailyChallengeData = {
  width: number;
  height: number;
  tiles: string[];
  tileBackgrounds: [string, string][];
  shapes: Shape[];
};

export function useDailyChallengeLoader() {
  const dispatch = useTetrixDispatchContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDailyChallenge = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get today's date string YYYY-MM-DD
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // 2. Fetch the JSON file
      const response = await fetch(`/daily-challenges/${dateString}.json`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`No daily challenge found for ${dateString}`);
        }
        throw new Error(`Failed to load daily challenge: ${response.statusText}`);
      }

      const data: DailyChallengeData = await response.json();

      // 3. Parse the data into game state format
      const tiles: TilesSet = new Map();
      const tileBackgrounds = new Map(data.tileBackgrounds);

      // Initialize all tiles from the layout
      data.tiles.forEach(key => {
        const backgroundColor = (tileBackgrounds.get(key) || 'grey') as import('../types').ColorName;
        const tile: Tile = {
          position: key,
          backgroundColor: backgroundColor,
          block: { isFilled: false, color: 'grey' }, // Start empty
          activeAnimations: []
        };
        tiles.set(key, tile);
      });

      // 4. Dispatch start action
      dispatch({
        type: 'START_DAILY_CHALLENGE',
        value: {
          tiles,
          shapes: data.shapes
        }
      });

    } catch (err) {
      console.error('Daily Challenge Load Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  return {
    loadDailyChallenge,
    isLoading,
    error
  };
}
