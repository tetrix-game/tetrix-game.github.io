/**
 * Leaderboard Overlay
 * Shows user-specific leaderboard with top 10, user rank, and next milestone
 */

import { Button } from '@mui/material';
import { useState, useEffect } from 'react';

import { api } from '../api/client';
import { Overlay } from '../Overlay';
import './LeaderboardOverlay.css';

interface LeaderboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeaderboardEntry {
  username: string;
  score: number;
  rank: number;
}

interface LeaderboardData {
  topPlayers: LeaderboardEntry[];
  totalActivePlayers: number;
  userRank: number;
  userScore: number;
  pointsToNextMilestone: {
    milestone: string;
    pointsNeeded: number;
  } | null;
}

export const LeaderboardOverlay: React.FC<LeaderboardOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    if (isOpen && !data && !isLoading) {
      loadLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadLeaderboard = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setRateLimited(false);

    try {
      const result = await api.getUserLeaderboard();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
      if (message.includes('Too many requests') || message.includes('429')) {
        setRateLimited(true);
        setError('Please wait a few seconds before refreshing the leaderboard');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = (): void => {
    if (!rateLimited && !isLoading) {
      loadLeaderboard();
    }
  };

  return (
    <Overlay
      isOpen={isOpen}
      onEscapeKey={onClose}
      onBackdropClick={onClose}
      className="leaderboard-overlay"
      contentClassName="leaderboard-content"
      ariaLabel="Leaderboard"
    >
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h2>Leaderboard</h2>
          <Button
            onClick={handleRefresh}
            disabled={isLoading || rateLimited}
            size="small"
            variant="outlined"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {error && <div className="leaderboard-error">{error}</div>}

        {!error && data && (
          <>
            <div className="leaderboard-stats">
              <div className="stat">
                <span className="stat-label">Your Rank</span>
                <span className="stat-value">#{data.userRank}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Your Score</span>
                <span className="stat-value">{data.userScore.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Active Players</span>
                <span className="stat-value">{data.totalActivePlayers}</span>
              </div>
            </div>

            {data.pointsToNextMilestone && (
              <div className="milestone-info">
                <p>
                  <strong>{data.pointsToNextMilestone.pointsNeeded.toLocaleString()}</strong>{' '}
                  points to reach <strong>{data.pointsToNextMilestone.milestone}</strong>
                </p>
              </div>
            )}

            <div className="leaderboard-list">
              <h3>Top 10 Players</h3>
              {data.topPlayers.map((player) => (
                <div key={player.rank} className="leaderboard-entry">
                  <span className="rank">#{player.rank}</span>
                  <span className="username">{player.username}</span>
                  <span className="score">{player.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {isLoading && !data && (
          <div className="leaderboard-loading">Loading leaderboard...</div>
        )}

        <div className="leaderboard-actions">
          <Button onClick={onClose} variant="contained" fullWidth>
            Close
          </Button>
        </div>
      </div>
    </Overlay>
  );
};
