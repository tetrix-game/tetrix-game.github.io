import { loadSoundEffectsSettings } from './persistenceUtils';

// Sound Effects Utility
// Handles playing various game sound effects
// NOTE: This is legacy code kept for backwards compatibility with reducer
// New components should use useSoundEffects hook from SoundEffectsContext

export type SoundEffect =
  | 'click_into_place'
  | 'game_over'
  | 'pickup_shape'
  | 'clear_combo_1'
  | 'clear_combo_2'
  | 'clear_combo_3'
  | 'clear_combo_4'
  | 'clear_combo_5';

// Module-level callback that can be set by SoundEffectsContext
let contextPlaySound: ((soundEffect: SoundEffect, startTime?: number) => void) | null = null;

export function setContextPlaySound(callback: (soundEffect: SoundEffect, startTime?: number) => void) {
  contextPlaySound = callback;
}

class SoundEffectsManager {
  private readonly audioElements = new Map<SoundEffect, HTMLAudioElement>();
  private hasUserInteracted = false;

  constructor() {
    // Initialize user interaction detection
    this.initializeUserInteraction();

    // Preload audio files
    this.preloadSounds();
  }

  private initializeUserInteraction() {
    const handleUserInteraction = () => {
      this.hasUserInteracted = true;
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
  }

  private preloadSounds() {
    const soundFiles: Record<SoundEffect, string> = {
      click_into_place: '/sound/soundEffects/click_into_place.mp3',
      game_over: '/sound/soundEffects/game_over.mp3',
      pickup_shape: '/sound/soundEffects/pickup_shape.mp3',
      clear_combo_1: '/sound/soundEffects/clear-combo-1.mp3',
      clear_combo_2: '/sound/soundEffects/clear-combo-2.mp3',
      clear_combo_3: '/sound/soundEffects/clear-combo-3.mp3',
      clear_combo_4: '/sound/soundEffects/clear-combo-4.mp3',
      clear_combo_5: '/sound/soundEffects/clear-combo-5.mp3',
    };

    for (const [soundName, filePath] of Object.entries(soundFiles)) {
      const audio = new Audio(filePath);
      audio.preload = 'auto';
      audio.volume = 0.2; // Quieter volume for sound effects
      this.audioElements.set(soundName as SoundEffect, audio);
    }
  }

  public async playSound(soundEffect: SoundEffect, startTime?: number) {
    // Don't play if user hasn't interacted yet
    if (!this.hasUserInteracted) {
      return;
    }

    // Check sound effects mute state fresh each time (in case user changed it)
    let isMuted = false;
    try {
      isMuted = await loadSoundEffectsSettings();
    } catch {
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem('tetrix-soundeffects-muted');
        isMuted = saved ? JSON.parse(saved) : false;
      } catch {
        isMuted = false;
      }
    }

    // Don't play if muted
    if (isMuted) {
      return;
    }

    const audio = this.audioElements.get(soundEffect);
    if (audio) {
      // Set audio to start time (default 0)
      audio.currentTime = startTime ?? 0;

      audio.play().catch(error => {
        console.log(`Sound effect '${soundEffect}' play was prevented:`, error);
      });
    } else {
      console.warn(`Sound effect '${soundEffect}' not found`);
    }
  }

  public setVolume(volume: number) {
    // Set volume for all sound effects (0.0 to 1.0)
    for (const audio of this.audioElements.values()) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

// Create singleton instance
export const soundEffectsManager = new SoundEffectsManager();

// Convenience function for easy usage
// Will use context callback if available (fast), otherwise falls back to manager (slow)
export function playSound(soundEffect: SoundEffect, startTime?: number) {
  if (contextPlaySound) {
    // Use context for instant playback
    contextPlaySound(soundEffect, startTime);
  } else {
    // Fallback to legacy manager (slower due to async DB check)
    return soundEffectsManager.playSound(soundEffect, startTime);
  }
}