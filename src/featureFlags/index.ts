/**
 * Feature Flags Configuration
 *
 * Controls which features are enabled/disabled in the application.
 * Can be controlled via environment variables or localStorage for testing.
 */

// Default feature flag values
const DEFAULT_FLAGS = {
  useCompactFormat: true, // Compact byte format for API payloads
  enableAnimations: true, // Tile clearing animations
  enableSoundEffects: true, // Sound effects
};

type FeatureFlags = typeof DEFAULT_FLAGS;

class FeatureFlagManager {
  private flags: FeatureFlags;

  constructor() {
    // Initialize with defaults
    this.flags = { ...DEFAULT_FLAGS };

    // Override from environment variables (set at build time)
    if (import.meta.env.VITE_FEATURE_COMPACT_FORMAT !== undefined) {
      this.flags.useCompactFormat = import.meta.env.VITE_FEATURE_COMPACT_FORMAT === 'true';
    }

    // Override from localStorage (for testing/debugging)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.flags = { ...this.flags, ...parsed };
          console.log('🚩 Feature flags loaded from localStorage:', this.flags);
        } catch {
          console.warn('Failed to parse feature flags from localStorage');
        }
      }
    }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  /**
   * Enable a feature flag (persists to localStorage)
   */
  enable(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
    this.saveToLocalStorage();
  }

  /**
   * Disable a feature flag (persists to localStorage)
   */
  disable(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
    this.saveToLocalStorage();
  }

  /**
   * Get all feature flags
   */
  getAll(): Readonly<FeatureFlags> {
    return { ...this.flags };
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.flags = { ...DEFAULT_FLAGS };
    if (typeof window !== 'undefined') {
      localStorage.removeItem('featureFlags');
    }
  }

  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('featureFlags', JSON.stringify(this.flags));
      console.log('🚩 Feature flags saved:', this.flags);
    }
  }
}

// Global singleton instance
export const featureFlags = new FeatureFlagManager();

// Expose to window for debugging in dev mode
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as Window & { featureFlags?: FeatureFlagManager }).featureFlags = featureFlags;
  console.log('🚩 Feature flags available on window.featureFlags');
  console.log('   Example: window.featureFlags.disable("useCompactFormat")');
}
