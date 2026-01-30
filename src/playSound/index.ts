import type { SoundEffect } from '../SoundEffectsProvider';

const SOUND_VOLUME_MULTIPLIERS: Partial<Record<SoundEffect, number>> = {
  click_into_place: 1.0, // -27.4 dB mean, reference level
  game_over: 0.7, // -22.1 dB mean, louder than others
  pickup_shape: 0.4, // -14.8 dB mean, much louder than others
  invalid_placement: 1.4, // -31.2 dB mean, quieter than others
  clear_combo_1: 1.0, // -27.4 dB mean
  clear_combo_2: 1.1, // -28.7 dB mean
  clear_combo_3: 1.2, // -29.8 dB mean
  clear_combo_4: 1.1, // -28.4 dB mean
  heartbeat: 1.0, // Synthesized, already calibrated
};

const BASE_SOUND_EFFECTS_VOLUME = 0.5;

let modulePlaySound: ((soundEffect: SoundEffect, startTime?: number) => void) | null = null;

function playSound(soundEffect: SoundEffect, startTime?: number): void {
  if (modulePlaySound) {
    modulePlaySound(soundEffect, startTime);
  }
}

function registerPlaySound(
  playSound: (soundEffect: SoundEffect, startTime?: number) => void,
): void {
  modulePlaySound = playSound;
}

function unregisterPlaySound(): void {
  modulePlaySound = null;
}

// Facade export to match folder name
export const playSound = {
  SOUND_VOLUME_MULTIPLIERS,
  BASE_SOUND_EFFECTS_VOLUME,
  playSound,
  registerPlaySound,
  unregisterPlaySound,
};
