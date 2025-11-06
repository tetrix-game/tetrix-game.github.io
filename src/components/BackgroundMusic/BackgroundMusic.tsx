import React, { useEffect, useRef, useState } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import { saveMusicState, loadMusicState } from '../../utils/persistenceUtils';
import './BackgroundMusic.css';

interface BackgroundMusicProps {
  isMuted: boolean;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ isMuted }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [musicStateLoaded, setMusicStateLoaded] = useState(false);
  const tetrixState = useTetrixStateContext();

  // List of available tracks (using useMemo to prevent recreation on each render)
  const tracks = React.useMemo(() => [
    '/bgm/Jazz2_KEY_C_in_C.mp3',
    '/bgm/Jazz3_KEY_Ab_in_C.mp3',
    '/bgm/Jazz4_KEY_C_in_C.mp3',
  ], []);

  // Load music state on component mount
  useEffect(() => {
    const loadSavedMusicState = async () => {
      try {
        const musicState = await loadMusicState();
        if (musicState) {
          setHasUserInteracted(musicState.hasUserInteracted);
          if (musicState.hasUserInteracted) {
            setShouldPlay(true);
          }
        }
      } catch (error) {
        console.error('Failed to load music state:', error);
      } finally {
        setMusicStateLoaded(true);
      }
    };

    loadSavedMusicState();
  }, []);

  // Save music state when interaction or mute status changes
  useEffect(() => {
    if (musicStateLoaded) {
      saveMusicState({
        isMuted,
        hasUserInteracted,
      }).catch((error: Error) => {
        console.error('Failed to save music state:', error);
      });
    }
  }, [isMuted, hasUserInteracted, musicStateLoaded]);

  // Monitor for shape placements to detect first user interaction
  useEffect(() => {
    // When a shape completes placement, it means user has interacted
    if (tetrixState.placementAnimationState === 'none' &&
      tetrixState.selectedShape === null &&
      tetrixState.tiles.some(tile => tile.block.isFilled) &&
      !hasUserInteracted) {
      setHasUserInteracted(true);
      setShouldPlay(true);
    }
  }, [tetrixState.placementAnimationState, tetrixState.selectedShape, tetrixState.tiles, hasUserInteracted]);

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