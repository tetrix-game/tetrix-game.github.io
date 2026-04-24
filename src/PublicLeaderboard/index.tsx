/**
 * Public Leaderboard
 * Shows top 3 players and active player count (no auth required)
 */

import { useState, useEffect } from 'react';

import { api } from '../api/client';
import './PublicLeaderboard.css';

interface LeaderboardEntry {
  username: string;
  score: number;
  rank: number;
}

export const PublicLeaderboard: React.FC = () => {
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [activePlayers, setActivePlayers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async (): Promise<void> => {
    try {
      const data = await api.getPublicLeaderboard();
      setTopPlayers(data.topPlayers);
      setActivePlayers(data.totalActivePlayers);
    } catch (err) {
      // Silently fail - leaderboard is not critical
      // eslint-disable-next-line no-console
      console.error('Failed to load public leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="public-leaderboard loading">
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="public-leaderboard">
      <h3>Top Players</h3>
      {topPlayers.length > 0 ? (
        <>
          <div className="public-leaderboard-list">
            {topPlayers.map((player, index) => (
              <div key={player.rank} className="public-leaderboard-entry">
                <span className="rank-badge">{index + 1}</span>
                <span className="username">{player.username}</span>
                <span className="score">{player.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="active-players">
            <span className="label">Active Players:</span>
            <span className="count">{activePlayers}</span>
          </div>
        </>
      ) : (
        <p className="no-data">No players yet. Be the first!</p>
      )}
    </div>
  );
};
