/**
 * Persistence Manager
 * Global singleton that manages which persistence adapter to use
 * Based on authentication state
 */

import * as apiPersistence from '../apiPersistenceAdapter';
import { persistenceAdapter } from '../persistenceAdapter';

class PersistenceManager {
  private useAPI = false;

  setAuthenticated(isAuthenticated: boolean): void {
    this.useAPI = isAuthenticated;
  }

  getCurrentAdapter(): typeof persistenceAdapter {
    return this.useAPI ? apiPersistence : persistenceAdapter;
  }
}

export const persistenceManager = new PersistenceManager();
