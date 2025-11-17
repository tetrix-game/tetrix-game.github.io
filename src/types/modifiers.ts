/**
 * Modifier types - Game modifiers and unlock state
 */

export type GameModifier = {
  id: number; // Prime number ID
  name: string;
  description: string;
  primeId: number; // The prime number that serves as the identifier
  unlocked: boolean; // Whether the player has unlocked this modifier
  active: boolean; // Whether the modifier is currently active
};

export type ModifierUnlockState = {
  unlockedModifiers: Set<number>; // Set of prime IDs that have been unlocked
};
