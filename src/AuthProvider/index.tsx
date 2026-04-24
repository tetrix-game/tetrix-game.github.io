/**
 * Authentication Provider
 * Manages user authentication state and provides login/logout/register functions
 */

import { useState, useEffect } from 'react';

import { api } from '../api/client';
import { persistenceManager } from '../persistenceManager';

import { AuthContext } from './AuthContext';
import type { User, AuthContextType } from './AuthContextType';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check if user is already authenticated (has valid session)
   */
  const checkAuthStatus = async (): Promise<void> => {
    try {
      const response = await api.getCurrentUser();

      // Transform backend snake_case to camelCase for frontend
      const userData = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        createdAt: response.user.created_at,
        lastLogin: response.user.last_login,
      };
      setUser(userData);
      persistenceManager.setAuthenticated(true);
    } catch {
      // Not authenticated or error - that's OK
      setUser(null);
      persistenceManager.setAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      const response = await api.login(email, password);

      // Transform backend response to frontend format
      const userData = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        createdAt: response.user.created_at,
        lastLogin: response.user.last_login,
      };
      setUser(userData);
      persistenceManager.setAuthenticated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  /**
   * Register a new user account
   */
  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      setError(null);
      const response = await api.register(username, email, password);

      // Transform backend response to frontend format
      const userData = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        createdAt: response.user.created_at,
        lastLogin: response.user.last_login,
      };
      setUser(userData);
      persistenceManager.setAuthenticated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  /**
   * Logout and destroy session
   */
  const logout = async (): Promise<void> => {
    try {
      await api.logout();
      setUser(null);
      setError(null);
      persistenceManager.setAuthenticated(false);
    } catch {
      // Still clear user locally even if API call fails
      setUser(null);
      persistenceManager.setAuthenticated(false);
    }
  };

  /**
   * Request password reset
   */
  const forgotPassword = async (email: string): Promise<{ message: string }> => {
    try {
      setError(null);
      return await api.forgotPassword(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset request failed';
      setError(message);
      throw err;
    }
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    try {
      setError(null);
      return await api.resetPassword(token, newPassword);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      setError(message);
      throw err;
    }
  };

  /**
   * Clear error message
   */
  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    isAuthenticated: user !== null,
    user,
    isLoading,
    error,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
