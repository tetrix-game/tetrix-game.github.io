import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import GemParticle from '../GemParticle';
import './GemShower.css';

interface GemData {
  id: string;
  startPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  delay: number;
}

const GemShower: React.FC = () => {
  const { score, gemIconPosition } = useTetrixStateContext();
  const [gems, setGems] = useState<GemData[]>([]);
  const lastScoreRef = useRef(score);

  // Performance thresholds for different rendering strategies
  const DOM_PARTICLE_LIMIT = 20; // Lower limit since we're only showing one type

  // Calculate the two possible emission origins
  const centerScreenPosition = useMemo(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }), []);

  const gemIconOrigin = useMemo(() => gemIconPosition, [gemIconPosition]);

  // Score change detection
  useEffect(() => {
    if (score !== lastScoreRef.current) {
      const scoreChange = score - lastScoreRef.current;
      const pointsForEffect = Math.abs(scoreChange); // Use absolute value for gem shower
      const isGainingPoints = scoreChange > 0;

      if (pointsForEffect === 0) {
        lastScoreRef.current = score;
        return;
      }

      // Use center screen for positive scores, gem icon for negative scores
      const emissionOrigin: { x: number; y: number } = isGainingPoints
        ? centerScreenPosition
        : gemIconOrigin;

      // Calculate number of gems to show based on points
      // For small scores, show 1 gem per point
      // For larger scores, limit the number of gems but make them more dramatic
      let gemsToShow = Math.min(pointsForEffect, DOM_PARTICLE_LIMIT);
      if (pointsForEffect > DOM_PARTICLE_LIMIT) {
        // For large scores, show fewer gems but they represent more points
        gemsToShow = Math.min(DOM_PARTICLE_LIMIT, Math.ceil(Math.log10(pointsForEffect + 1) * 3));
      }

      const coinsToSpawn = generateGems(gemsToShow, emissionOrigin, isGainingPoints);
      setGems(prevGems => [...prevGems, ...coinsToSpawn]);
    }
    lastScoreRef.current = score;
  }, [score, centerScreenPosition, gemIconOrigin]);

  const generateGems = (
    gemCount: number,
    origin: { x: number; y: number },
    isGainingPoints: boolean
  ): GemData[] => {
    const gems: GemData[] = [];
    const delayIncrement = 10; // 10ms between each gem
    let currentDelay = 0;

    for (let i = 0; i < gemCount; i++) {
      let velocityX: number;
      let velocityY: number;

      if (isGainingPoints) {
        // Gaining points: gems shoot upward and outward from center screen
        const angle = (60 + Math.random() * 60) * (Math.PI / 180); // 60° to 120° (upward cone)
        const baseSpeed = 100 + Math.random() * 200; // 100-300 pixels per second

        // Random direction (left or right) with slight bias towards spreading
        const direction = Math.random() > 0.5 ? 1 : -1;
        const spreadBias = 0.3 + Math.random() * 0.7; // Add some spread bias

        velocityX = baseSpeed * Math.cos(angle) * direction * spreadBias;
        velocityY = -baseSpeed * Math.sin(angle); // Negative for upward
      } else {
        // Losing points: gems fall straight down from gem icon with zero initial velocity
        // They'll be affected by gravity in GemParticle component
        velocityX = 0;
        velocityY = 0;
      }

      gems.push({
        id: `gem-${i}-${Date.now()}-${Math.random()}`,
        startPosition: { ...origin },
        velocity: { x: velocityX, y: velocityY },
        delay: currentDelay
      });

      currentDelay += delayIncrement;
    }

    return gems;
  };

  const handleGemComplete = (gemId: string) => {
    setGems(prevGems => prevGems.filter(gem => gem.id !== gemId));
  };

  return (
    <div className="gem-shower-container">
      {/* Render all gems */}
      {gems.map(gem => (
        <GemParticle
          key={gem.id}
          startPosition={gem.startPosition}
          velocity={gem.velocity}
          delay={gem.delay}
          onComplete={() => handleGemComplete(gem.id)}
        />
      ))}
    </div>
  );
};

export default GemShower;