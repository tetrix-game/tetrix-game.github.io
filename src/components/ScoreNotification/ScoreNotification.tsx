import React, { useState, useEffect } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import './ScoreNotification.css';

const ScoreNotification: React.FC = () => {
  const { score } = useTetrixStateContext();
  const [lastScore, setLastScore] = useState(score);
  const [notification, setNotification] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (score > lastScore) {
      const pointsEarned = score - lastScore;
      // For now, show a simple notification. 
      // In a full implementation, we'd calculate rows/columns cleared
      const message = `+${pointsEarned} points!`;

      setNotification(message);
      setIsVisible(true);
      setLastScore(score);

      // Hide notification after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [score, lastScore]);

  if (!isVisible || !notification) {
    return null;
  }

  return (
    <div className={`score-notification ${isVisible ? 'visible' : ''}`}>
      {notification}
    </div>
  );
};

export default ScoreNotification;