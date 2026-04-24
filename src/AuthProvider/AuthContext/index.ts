/**
 * Authentication Context
 * Provides context creation and custom hook for auth state
 */

import { createContext, useContext } from 'react';

import type { AuthContextType } from '../AuthContextType';

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Custom hook to access auth context
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
