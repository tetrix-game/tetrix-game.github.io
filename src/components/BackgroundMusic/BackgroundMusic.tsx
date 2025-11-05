import React, { useEffect, useRef, useState } from 'react';
import './BackgroundMusic.css';

const BackgroundMusic: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // List of available tracks (using useMemo to prevent recreation on each render)
  const tracks = React.useMemo(() => [
    '/bgm/Jazz2_KEY_C_in_C.mp3',
    '/bgm/Jazz3_KEY_Ab_in_C.mp3',
    '/bgm/Jazz4_KEY_C_in_C.mp3',
  ], []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set up the audio element
    audio.src = tracks[currentTrackIndex];
    audio.loop = false; // We'll handle track changes manually
    audio.volume = 0.3; // Set a reasonable default volume

    // Auto-play the music
    const playMusic = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.log('Auto-play was prevented by browser policy:', error);
      }
    };

    playMusic();

    // Handle track ending to play next track
    const handleTrackEnd = () => {
      setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % tracks.length);
    };

    audio.addEventListener('ended', handleTrackEnd);

    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, [currentTrackIndex, tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.log('Play was prevented:', error);
      });
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="background-music">
      <audio
        ref={audioRef}
        preload="auto"
      >
        <track kind="captions" />
      </audio>
      <button
        className={`music-toggle ${isMuted ? 'muted' : 'playing'}`}
        onClick={toggleMute}
        title={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {isMuted ? '🔇' : '🎵'}
      </button>
    </div>
  );
};

export default BackgroundMusic;