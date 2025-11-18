import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import GemParticle from '../GemParticle';
import './GemShower.css';

interface GemData {
  id: string;
  startPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  delay: number;
  size?: number;
}

const GemShower: React.FC = () => {
  const { score, gemIconPosition, hasLoadedPersistedState } = useTetrixStateContext();
  const [gems, setGems] = useState<GemData[]>([]);
  const lastScoreRef = useRef<number | null>(null);

  // Calculate the two possible emission origins
  const centerScreenPosition = useMemo(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }), []);

  const gemIconOrigin = useMemo(() => gemIconPosition, [gemIconPosition]);

  // Score change detection
  useEffect(() => {
    // Skip if we haven't loaded persisted state yet (prevents shower on async load)
    if (!hasLoadedPersistedState) {
      return;
    }
    // Skip gem shower on initial mount until persisted state is loaded
    if (lastScoreRef.current === null) {
      lastScoreRef.current = score;
      return;
    }

    // Only proceed if score actually changed
    if (score === lastScoreRef.current) {
      return;
    }

    const scoreChange = score - lastScoreRef.current;
    const pointsForEffect = Math.abs(scoreChange);
    const isGainingPoints = scoreChange > 0;

    if (pointsForEffect === 0) {
      lastScoreRef.current = score;
      return;
    }

    // Emit from center screen when gaining points, from gem icon when losing points
    const emissionOrigin: { x: number; y: number } = isGainingPoints
      ? centerScreenPosition
      : gemIconOrigin;

    // Determine gem size and count based on points earned:
    // - For 10+ points: show large gems (80px), 1 gem per 10 points, max 10 gems
    // - For <10 points: show normal gems (40px), 1 gem per point, max 100 gems
    const useLargeGems = pointsForEffect >= 10;
    const gemsToShow = useLargeGems
      ? Math.min(Math.floor(pointsForEffect / 10), 10)  // 10-100 points = 1-10 large gems
      : pointsForEffect;                                  // 1-9 points = 1-9 normal gems
    console.log(`GemShower: score change=${scoreChange}, pointsForEffect=${pointsForEffect}, gemsToShow=${gemsToShow}, useLargeGems=${useLargeGems}`);

    const coinsToSpawn = generateGems(gemsToShow, emissionOrigin, isGainingPoints, useLargeGems);
    console.log(`GemShower: generated ${coinsToSpawn.length} gems`);
    setGems(prevGems => [...prevGems, ...coinsToSpawn]);

    lastScoreRef.current = score;
  }, [score, centerScreenPosition, gemIconOrigin, hasLoadedPersistedState]);

  const generateGems = (
    gemCount: number,
    origin: { x: number; y: number },
    isGainingPoints: boolean,
    useLargeGems: boolean = false
  ): GemData[] => {
    const gems: GemData[] = [];
    const delayIncrement = 10; // Stagger each gem by 10ms
    let currentDelay = 0;

    for (let i = 0; i < gemCount; i++) {
      let velocityX: number;
      let velocityY: number;

      if (isGainingPoints) {
        // Gaining points: shoot gems upward in a cone pattern from center screen
        const angle = (60 + Math.random() * 60) * (Math.PI / 180); // Random angle between 60° and 120°
        const baseSpeed = 100 + Math.random() * 200; // Random speed between 100-300 px/s
        const direction = Math.random() > 0.5 ? 1 : -1; // Randomly left or right
        const spreadBias = 0.3 + Math.random() * 0.7; // Random spread factor

        velocityX = baseSpeed * Math.cos(angle) * direction * spreadBias;
        velocityY = -baseSpeed * Math.sin(angle); // Negative Y = upward
      } else {
        // Losing points: gems fall downward from gem icon with slight horizontal drift
        velocityX = (Math.random() * 3 - 1.5) * 60; // Random drift between -30 and 30 px/s
        velocityY = 0; // Gravity will pull them down
      }

      gems.push({
        id: `gem-${i}-${Date.now()}-${Math.random()}`,
        startPosition: { ...origin },
        velocity: { x: velocityX, y: velocityY },
        delay: currentDelay,
        size: useLargeGems ? 80 : 40 // 80px for large gems, 40px for normal gems
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
          size={gem.size}
          onComplete={() => handleGemComplete(gem.id)}
        />
      ))}
    </div>
  );
};

export default GemShower;