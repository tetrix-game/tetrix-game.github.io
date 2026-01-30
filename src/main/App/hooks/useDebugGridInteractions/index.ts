import { useCallback } from 'react';

import type { Location } from '../../types/core';

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
