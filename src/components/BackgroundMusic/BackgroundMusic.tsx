import React, { useEffect, useRef, useState } from 'react';
import './BackgroundMusic.css';

interface BackgroundMusicProps {
  isMuted: boolean;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ isMuted }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasUserInteractedRef = useRef(false);
  const [shouldPlay, setShouldPlay] = useState(false);

  // List of available tracks (using useMemo to prevent recreation on each render)
  const tracks = React.useMemo(() => [
    '/sound/bgm/Jazz2_KEY_C_in_C.mp3',
    '/sound/bgm/Jazz3_KEY_Ab_in_C.mp3',
    '/sound/bgm/Jazz4_KEY_C_in_C.mp3',
  ], []);

  // Simple user interaction detection - any click or keypress enables audio
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasUserInteractedRef.current) {
        hasUserInteractedRef.current = true;
        setShouldPlay(true);
      }
    };

    // Listen for any user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

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
      if (shouldPlay && !isMuted) {
        audio.src = getRandomTrack();
        audio.loop = false;
        audio.volume = 0.3;

        try {
          await audio.play();
        } catch (error) {
          console.log('Auto-play was prevented by browser policy:', error);
        }
      }
    };

    // Handle track ending to play another random track
    const handleTrackEnd = () => {
      if (shouldPlay && !isMuted) {
        playRandomTrack();
      }
    };

    // Start playing if conditions are met
    if (shouldPlay && !isMuted) {
      playRandomTrack();
    }

    audio.addEventListener('ended', handleTrackEnd);

    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, [shouldPlay, isMuted, tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.pause();
    } else if (shouldPlay) {
      audio.play().catch(error => {
        console.log('Play was prevented:', error);
      });
    }
  }, [isMuted, shouldPlay]);

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