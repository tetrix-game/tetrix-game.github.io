export type SoundEffect =
  | 'click_into_place'
  | 'game_over'
  | 'pickup_shape'
  | 'invalid_placement'
  | 'clear_combo_1'
  | 'clear_combo_2'
  | 'clear_combo_3'
  | 'clear_combo_4'
  | 'heartbeat';

export interface Shared_SoundEffectsContextValue {
  playSound: (soundEffect: SoundEffect, startTime?: number) => void;
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
  volume: number;
  isEnabled: boolean;
}
