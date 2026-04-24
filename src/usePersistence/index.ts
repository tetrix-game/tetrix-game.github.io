/**
 * Hook to get the appropriate persistence adapter based on auth state
 * Returns API persistence when authenticated, IndexedDB persistence otherwise
 */

import { useMemo } from 'react';

import * as apiPersistence from '../apiPersistenceAdapter';
import { useAuth } from '../AuthProvider/AuthContext';
import { persistenceAdapter } from '../persistenceAdapter';

export function usePersistence(): typeof persistenceAdapter {
  const { isAuthenticated } = useAuth();

  return useMemo(() => {
    return isAuthenticated ? apiPersistence : persistenceAdapter;
  }, [isAuthenticated]);
}
