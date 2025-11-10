import React, { useState, useEffect, useRef } from 'react';
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
  const { score, showerLocation } = useTetrixStateContext();
  const [gems, setGems] = useState<GemData[]>([]);
  const lastScoreRef = useRef(score);

  // Performance thresholds for different rendering strategies
  const DOM_PARTICLE_LIMIT = 20; // Lower limit since we're only showing one type

  // Score change detection
  useEffect(() => {
    if (score !== lastScoreRef.current) {
      const scoreChange = score - lastScoreRef.current;
      const pointsForEffect = Math.abs(scoreChange); // Use absolute value for gem shower

      if (pointsForEffect === 0) {
        lastScoreRef.current = score;
        return;
      }

      // Capture emission origin at time of score change
      const emissionOrigin: { x: number; y: number } = {
        x: showerLocation.x,
        y: showerLocation.y
      };

      // Calculate number of gems to show based on points
      // For small scores, show 1 gem per point
      // For larger scores, limit the number of gems but make them more dramatic
      let gemsToShow = Math.min(pointsForEffect, DOM_PARTICLE_LIMIT);
      if (pointsForEffect > DOM_PARTICLE_LIMIT) {
        // For large scores, show fewer gems but they represent more points
        gemsToShow = Math.min(DOM_PARTICLE_LIMIT, Math.ceil(Math.log10(pointsForEffect + 1) * 3));
      }

      const coinsToSpawn = generateGems(gemsToShow, emissionOrigin);
      setGems(prevGems => [...prevGems, ...coinsToSpawn]);
    }
    lastScoreRef.current = score;
  }, [score]); // Removed showerLocation dependency to prevent animation interruption

  const generateGems = (
    gemCount: number,
    origin: { x: number; y: number }
  ): GemData[] => {
    const gems: GemData[] = [];
    const delayIncrement = 10; // 10ms between each gem
    let currentDelay = 0;

    for (let i = 0; i < gemCount; i++) {
      // Generate random trajectory - spread in a cone upward and outward
      const angle = (60 + Math.random() * 60) * (Math.PI / 180); // 60° to 120° (upward cone)
      const baseSpeed = 100 + Math.random() * 200; // 100-300 pixels per second

      // Random direction (left or right) with slight bias towards spreading
      const direction = Math.random() > 0.5 ? 1 : -1;
      const spreadBias = 0.3 + Math.random() * 0.7; // Add some spread bias

      const velocityX = baseSpeed * Math.cos(angle) * direction * spreadBias;
      const velocityY = -baseSpeed * Math.sin(angle); // Negative for upward

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
    <>
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
    </>
  );
};

export default GemShower;