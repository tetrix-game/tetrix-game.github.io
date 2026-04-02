import React, { useCallback, RefObject } from 'react';

import { BoardClearIcon } from '../BoardClearIcon';
import { Particle } from '../Particle';
import { useSoundEffects } from '../SoundEffectsProvider';
import { useTetrixStateContext, useTetrixDispatchContext } from '../TetrixProvider';
import { useParticleShower } from '../useParticleShower';
import './BoardClearShower.css';

interface BoardClearShowerProps {
  boardClearIconRef: RefObject<HTMLElement>;
}

export const BoardClearShower: React.FC<BoardClearShowerProps> = ({ boardClearIconRef }) => {
  const { stats } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const { playSound } = useSoundEffects();

  const currentBoardClears = stats?.current?.fullBoardClears?.total ?? 0;

  const { particles, handleParticleComplete } = useParticleShower({
    triggerValue: currentBoardClears,
    targetIconRef: boardClearIconRef,
    particleSize: 60, // Slightly larger than gems for more impact
    particlesPerUnit: 20, // 20 sparkles per board clear
    maxParticles: 20,
    useExplosion: true,
    particleDelay: 15, // Slightly slower stagger for dramatic effect
  });

  const handleParticleArrive = useCallback(() => {
    dispatch({ type: 'TRIGGER_BOARD_CLEAR_ICON_PULSE' });
    playSound('click_into_place');
  }, [dispatch, playSound]);

  return (
    <div className="board-clear-shower-container">
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          startPosition={particle.startPosition}
          velocity={particle.velocity}
          delay={particle.delay}
          size={particle.size}
          attractTo={particle.attractTo}
          onArrive={handleParticleArrive}
          onComplete={() => handleParticleComplete(particle.id)}
          icon={<BoardClearIcon size={particle.size} />}
          glowColor="rgba(255, 215, 0, 0.8)" // Golden glow
          trailColor="rgba(255, 215, 0, 0.6)"
        />
      ))}
    </div>
  );
};
