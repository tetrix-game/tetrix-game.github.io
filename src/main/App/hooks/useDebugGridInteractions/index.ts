import { useCallback } from 'react';

import { Shared_core } from '../../types/core';

type Location = Shared_core['Location'];

/**
 * Custom hook for handling debug grid interactions
 * Returns a click handler that can be attached to grid tiles
 */
export function useDebugGridInteractions(): {
  isDebugMode: boolean;
  handleDebugClick: (_location: Location) => void;
} {
  const handleDebugClick = useCallback((_location: Location): void => {
    // Debug editor has been removed
    return;
  }, []);

  return {
    isDebugMode: false,
    handleDebugClick,
  };
}

// Facade export to match folder name
export const useDebugGridInteractions_export = {
  useDebugGridInteractions,
};
