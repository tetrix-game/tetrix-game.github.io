import React from 'react';
import './DailyChallenge.css';

const DailyChallenge: React.FC = () => {
  return (
    <div className="daily-challenge">
      <div className="daily-challenge-content">
        <h1>Daily Challenge</h1>
        <p className="coming-soon">Coming Soon!</p>
        <div className="daily-challenge-description">
          <p>Every day, a new unique puzzle challenge awaits.</p>
          <p>Complete it to earn special rewards and climb the global leaderboard.</p>
        </div>
      </div>
    </div>
  );
};

export default DailyChallenge;
