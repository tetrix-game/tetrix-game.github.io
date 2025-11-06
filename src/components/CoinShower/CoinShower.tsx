import React, { useState, useEffect, useRef } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import { convertPointsToCurrency, CURRENCY_DENOMINATIONS } from '../../utils/currencyUtils';
import CoinParticle from '../CoinParticle';
import './CoinShower.css';

interface CoinData {
  id: string;
  denomination: typeof CURRENCY_DENOMINATIONS[0];
  startPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  delay: number;
}

const CoinShower: React.FC = () => {
  const { score, showerLocation } = useTetrixStateContext();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const lastScoreRef = useRef(score);

  // Performance thresholds for different rendering strategies
  const DOM_PARTICLE_LIMIT = 50;
  const BATCHED_DOM_LIMIT = 200;

  // Score change detection
  useEffect(() => {
    if (score > lastScoreRef.current) {
      const pointsEarned = score - lastScoreRef.current;

      // Convert points to currency breakdown
      const currencyBreakdown = convertPointsToCurrency(pointsEarned);

      if (currencyBreakdown.length === 0) {
        lastScoreRef.current = score;
        return;
      }

      // Determine emission origin - always use current shower location
      const emissionOrigin: { x: number; y: number } = {
        x: showerLocation.x,
        y: showerLocation.y
      };

      // Calculate total coins for performance optimization
      const totalCoins = currencyBreakdown.reduce((sum, breakdown) => sum + breakdown.count, 0);

      // Apply performance limits based on coin count
      let coinsToSpawn: CoinData[] = [];
      let delayIncrement = 0;

      if (totalCoins <= DOM_PARTICLE_LIMIT) {
        // Tier 1: Full individual coin particles
        delayIncrement = 10; // 10ms between each coin
        coinsToSpawn = generateCoinsFromBreakdown(currencyBreakdown, emissionOrigin, delayIncrement);
      } else if (totalCoins <= BATCHED_DOM_LIMIT) {
        // Tier 2: Batched with limited coins per denomination
        delayIncrement = 5; // 5ms between each coin
        const limitedBreakdown = currencyBreakdown.map(breakdown => ({
          ...breakdown,
          count: Math.min(breakdown.count, 20) // Max 20 coins per denomination
        }));
        coinsToSpawn = generateCoinsFromBreakdown(limitedBreakdown, emissionOrigin, delayIncrement);
      } else {
        // Tier 3: Extreme limitation - only show representative coins
        delayIncrement = 20; // 20ms between each coin for dramatic effect
        const representativeBreakdown = currencyBreakdown.map(breakdown => ({
          ...breakdown,
          count: Math.min(breakdown.count, 5) // Max 5 coins per denomination
        }));
        coinsToSpawn = generateCoinsFromBreakdown(representativeBreakdown, emissionOrigin, delayIncrement);
      }

      setCoins(prevCoins => [...prevCoins, ...coinsToSpawn]);
    }
    lastScoreRef.current = score;
  }, [score, showerLocation]);

  const generateCoinsFromBreakdown = (
    breakdown: ReturnType<typeof convertPointsToCurrency>,
    origin: { x: number; y: number },
    delayIncrement: number
  ): CoinData[] => {
    const coins: CoinData[] = [];
    let currentDelay = 0;

    for (const { denomination, count } of breakdown) {
      for (let i = 0; i < count; i++) {
        // Generate random trajectory - spread in a cone upward and outward
        const angle = (60 + Math.random() * 60) * (Math.PI / 180); // 60° to 120° (upward cone)
        const baseSpeed = 100 + Math.random() * 200; // 100-300 pixels per second

        // Higher value coins get more dramatic physics
        const denomMultiplier = Math.log10(denomination.value + 1) * 0.2;
        const adjustedSpeed = baseSpeed * (1 + denomMultiplier);

        // Random direction (left or right) with slight bias towards spreading
        const direction = Math.random() > 0.5 ? 1 : -1;
        const spreadBias = 0.3 + Math.random() * 0.7; // Add some spread bias

        const velocityX = adjustedSpeed * Math.cos(angle) * direction * spreadBias;
        const velocityY = -adjustedSpeed * Math.sin(angle); // Negative for upward

        coins.push({
          id: `${denomination.value}-${i}-${Date.now()}-${Math.random()}`,
          denomination,
          startPosition: { ...origin },
          velocity: { x: velocityX, y: velocityY },
          delay: currentDelay
        });

        currentDelay += delayIncrement;
      }
    }

    return coins;
  };

  const handleCoinComplete = (coinId: string) => {
    setCoins(prevCoins => prevCoins.filter(coin => coin.id !== coinId));
  };

  // Cleanup coins that have been around too long (failsafe)
  useEffect(() => {
    const cleanupOldCoins = (prevCoins: CoinData[]) => {
      const now = Date.now();
      return prevCoins.filter(coin => {
        // Remove coins older than 5 seconds
        const timestampStr = coin.id.split('-').pop() || '0';
        const coinAge = now - Number.parseInt(timestampStr, 10);
        return coinAge < 5000;
      });
    };

    const cleanupInterval = setInterval(() => {
      setCoins(cleanupOldCoins);
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <>
      {/* Debug: Show coin count */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '5px 10px',
        borderRadius: '5px',
        zIndex: 99999,
        fontSize: '14px'
      }}>
        Active coins: {coins.length}
      </div>

      {/* Render all coins */}
      {coins.map(coin => (
        <CoinParticle
          key={coin.id}
          denomination={coin.denomination}
          startPosition={coin.startPosition}
          velocity={coin.velocity}
          delay={coin.delay}
          onComplete={() => handleCoinComplete(coin.id)}
        />
      ))}
    </>
  );
};

export default CoinShower;