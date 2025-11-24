import React, { useEffect, useRef } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useMusicControl } from '../Header/MusicControlContext';
import './BackgroundMusic.css';

const BackgroundMusic: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { hasPlacedFirstShape } = useTetrixStateContext();
  const { isEnabled, volume, shouldPlayMusic, triggerAutoplay } = useMusicControl();

  // Track if we've already triggered autoplay from first shape
  const hasTriggeredFromShapeRef = useRef(false);

  // List of available tracks (using useMemo to prevent recreation on each render)
  const tracks = React.useMemo(() => [
    '/sound/bgm/Jazz2_KEY_C_in_C.mp3',
    '/sound/bgm/Jazz3_KEY_Ab_in_C.mp3',
    '/sound/bgm/Jazz4_KEY_C_in_C.mp3',
  ], []);

  // Trigger background music 1 second after first shape placement
  useEffect(() => {
    if (hasPlacedFirstShape && !hasTriggeredFromShapeRef.current) {
      const timer = setTimeout(() => {
        hasTriggeredFromShapeRef.current = true;
        triggerAutoplay();
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    } else if (!hasPlacedFirstShape && hasTriggeredFromShapeRef.current) {
      // Reset trigger if game is reset
      hasTriggeredFromShapeRef.current = false;
    }
  }, [hasPlacedFirstShape, triggerAutoplay]);

  // Update volume when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = (volume / 100) * 0.3; // Scale to 0-0.3 range
    }
  }, [volume]);

  // Set up audio and handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Function to get a random track
    const getRandomTrack = () => {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      return tracks[randomIndex];
    };

    // Function to play a random track
    const playRandomTrack = async () => {
      if (shouldPlayMusic && isEnabled && volume > 0) {
        audio.src = getRandomTrack();
        audio.loop = false;
        audio.volume = (volume / 100) * 0.3;

        try {
          await audio.play();
        } catch (error) {
          console.log('Auto-play was prevented by browser policy:', error);
        }
      }
    };

    // Handle track ending to play another random track
    const handleTrackEnd = () => {
      if (shouldPlayMusic && isEnabled && volume > 0) {
        playRandomTrack();
      }
    };

    audio.addEventListener('ended', handleTrackEnd);

    // Start playing if conditions are met and not currently playing
    if (shouldPlayMusic && isEnabled && volume > 0) {
      if (audio.paused) {
        playRandomTrack();
      }
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, [shouldPlayMusic, isEnabled, volume, tracks]);

  return (
    <div className="background-music">
      <audio
        ref={audioRef}
        preload="auto"
      >
        <track kind="captions" />
      </audio>
    </div>
  );
};

export default BackgroundMusic;