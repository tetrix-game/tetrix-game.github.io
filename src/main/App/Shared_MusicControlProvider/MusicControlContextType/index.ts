export interface MusicControlContextType {
  volume: number;
  setVolume: (volume: number) => void;
  isEnabled: boolean;
  toggleEnabled: () => void;
  shouldPlayMusic: boolean;
  triggerAutoplay: () => void;
  /** Whether the browser has allowed audio playback (user has interacted with document) */
  isAudioUnlocked: boolean;
  /** Whether audio is waiting for user interaction to play */
  isWaitingForInteraction: boolean;
}
