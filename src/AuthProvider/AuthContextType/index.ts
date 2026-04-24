/**
 * TypeScript interfaces for Authentication Context
 */

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin: string | null;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ message: string }>;
  clearError: () => void;
}
