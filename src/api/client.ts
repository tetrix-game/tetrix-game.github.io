/**
 * API Client for Tetrix Game Backend
 * Provides type-safe methods for all backend endpoints
 */

import type { SavedGameState } from '../types';

interface Stats {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

interface GridTile {
  isFilled: boolean;
  color?: string;
}

interface QueueShape {
  blocks: Array<{ row: number; column: number }>;
  color: string;
}

interface PlaceShapeResponse {
  valid: boolean;
  reason?: string;
  newScore?: number;
  linesCleared?: number;
  updatedTiles?: GridTile[];
  nextQueue?: QueueShape[];
}

class TetrixAPI {
  private baseURL: string;

  constructor() {
    // Use VITE_API_URL if set, otherwise use relative path
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
  }

  /**
   * Helper method for making authenticated requests
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      credentials: 'include', // Send session cookie
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================

  /**
   * Register a new user account
   */
  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Logout and destroy session
   */
  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  /**
   * Request a password reset email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // ============================================================================
  // GAME STATE ENDPOINTS
  // ============================================================================

  /**
   * Load game state from backend
   */
  async getGameState(): Promise<SavedGameState> {
    return this.request<SavedGameState>('/game/state');
  }

  /**
   * Save game state to backend (supports partial updates)
   */
  async saveGameState(
    state: Partial<SavedGameState>,
  ): Promise<{ message: string; updatedAt: number }> {
    return this.request<{ message: string; updatedAt: number }>(
      '/game/state',
      {
        method: 'POST',
        body: JSON.stringify(state),
      },
    );
  }

  /**
   * Place a shape on the board (with server-side validation)
   */
  async placeShape(
    location: { row: number; column: number },
    shape: QueueShape,
    shapeIndex: number,
  ): Promise<PlaceShapeResponse> {
    return this.request<PlaceShapeResponse>('/game/place-shape', {
      method: 'POST',
      body: JSON.stringify({ location, shape, shapeIndex }),
    });
  }

  /**
   * Rotate a shape in the queue
   */
  async rotateShape(
    shapeIndex: number,
    clockwise: boolean,
  ): Promise<{ rotatedShape: QueueShape; updatedQueue: QueueShape[] }> {
    return this.request<{ rotatedShape: QueueShape; updatedQueue: QueueShape[] }>(
      '/game/rotate-shape',
      {
        method: 'POST',
        body: JSON.stringify({ shapeIndex, clockwise }),
      },
    );
  }

  /**
   * Unlock a shape slot
   */
  async unlockSlot(
    slotNumber: number,
    cost: number,
  ): Promise<{
    newScore: number;
    unlockedSlots: number[];
    updatedQueue: QueueShape[];
  }> {
    return this.request<{
      newScore: number;
      unlockedSlots: number[];
      updatedQueue: QueueShape[];
    }>('/game/unlock-slot', {
      method: 'POST',
      body: JSON.stringify({ slotNumber, cost }),
    });
  }

  /**
   * Reset game state (preserves all-time stats)
   */
  async resetGame(): Promise<{ message: string; stats: Stats }> {
    return this.request<{ message: string; stats: Stats }>('/game/reset', {
      method: 'POST',
    });
  }

  // ============================================================================
  // LEADERBOARD ENDPOINTS
  // ============================================================================

  /**
   * Get public leaderboard (no auth required)
   */
  async getPublicLeaderboard(): Promise<{
    topPlayers: Array<{ username: string; score: number; rank: number }>;
    totalActivePlayers: number;
  }> {
    return this.request<{
      topPlayers: Array<{ username: string; score: number; rank: number }>;
      totalActivePlayers: number;
    }>('/leaderboard/public');
  }

  /**
   * Get user-specific leaderboard (requires auth)
   */
  async getUserLeaderboard(): Promise<{
    topPlayers: Array<{ username: string; score: number; rank: number }>;
    totalActivePlayers: number;
    userRank: number;
    userScore: number;
    pointsToNextMilestone: {
      milestone: string;
      pointsNeeded: number;
    } | null;
  }> {
    return this.request<{
      topPlayers: Array<{ username: string; score: number; rank: number }>;
      totalActivePlayers: number;
      userRank: number;
      userScore: number;
      pointsToNextMilestone: {
        milestone: string;
        pointsNeeded: number;
      } | null;
    }>('/leaderboard/user');
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    environment: string;
  }> {
    return this.request<{
      status: string;
      timestamp: string;
      environment: string;
    }>('/health');
  }
}

// Export singleton instance
export const api = new TetrixAPI();
