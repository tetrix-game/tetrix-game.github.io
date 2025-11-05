import { useCallback } from 'react';
import { showCrashOverlay } from '../utils/crashOverlay';

export interface RantConfig {
  [key: string]: RantNode;
}

interface RantNode {
  rant: string[];
  [key: string]: RantNode | string[];
}

interface ToastOptions {
  message: string;
  duration?: number;
}

// Simple toast implementation
const showToast = ({ message, duration = 3000 }: ToastOptions) => {
  // Remove any existing toast
  const existingToast = document.getElementById('rant-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'rant-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
  `;

  // Add CSS animation
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, duration);
};

// Helper function to check if rant is completed
const isRantCompleted = (path: string): boolean => {
  return localStorage.getItem(path) === 'true';
};

// Helper function to get nested config from a rant node
const getNestedConfig = (value: RantNode): RantConfig => {
  const nestedConfig: RantConfig = {};
  const nested = Object.keys(value).filter(k => k !== 'rant');

  for (const nestedKey of nested) {
    const nestedValue = value[nestedKey];
    if (nestedValue && typeof nestedValue === 'object' && 'rant' in nestedValue) {
      nestedConfig[nestedKey] = nestedValue;
    }
  }

  return nestedConfig;
};

// Helper function to find active rant chain
const findActiveRantChain = (obj: RantConfig, basePath = ''): { path: string; rant: string[] } | null => {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = basePath ? `${basePath}.${key}` : key;

    if (value.rant && Array.isArray(value.rant)) {
      if (isRantCompleted(currentPath)) {
        const nestedConfig = getNestedConfig(value);
        if (Object.keys(nestedConfig).length > 0) {
          const nestedResult = findActiveRantChain(nestedConfig, currentPath);
          if (nestedResult) {
            return nestedResult;
          }
        }
      } else {
        return { path: currentPath, rant: value.rant };
      }
    }
  }
  return null;
};

const useRantProgression = (config: RantConfig) => {

  const handleClick = useCallback(() => {
    const activeChain = findActiveRantChain(config);

    if (!activeChain) {
      console.warn('No active rant chain found');
      return;
    }

    const { path, rant } = activeChain;
    const currentCount = Number.parseInt(localStorage.getItem(`${path}_count`) || '0', 10);

    if (currentCount >= rant.length) {
      // This shouldn't happen, but just in case
      return;
    }

    const message = rant[currentCount];
    const isLastMessage = currentCount === rant.length - 1;
    const isPostCrashRant = path.includes('PostCrashRant');

    if (isLastMessage) {
      // Last message shows crash overlay directly
      console.log('Showing crash overlay:', message);
      showCrashOverlay(message);
      return;
    } else if (isPostCrashRant && currentCount === 0) {
      // Special case: First message in PostCrashRant shows and immediately crashes
      showToast({ message, duration: 1000 });

      // Increment count first, then crash quickly
      const newCount = currentCount + 1;
      localStorage.setItem(`${path}_count`, newCount.toString());

      // Show crash overlay after a short delay
      setTimeout(() => {
        console.log('Showing post-crash overlay');
        showCrashOverlay('You never learn, do you?!');
      }, 1200);

      return;
    } else {
      // Show toast for regular messages
      showToast({ message });
    }

    // Increment count
    const newCount = currentCount + 1;
    localStorage.setItem(`${path}_count`, newCount.toString());

    // If we've completed this rant chain, set the completion flag
    if (newCount >= rant.length) {
      localStorage.setItem(path, 'true');
      localStorage.removeItem(`${path}_count`); // Clean up count
    }

    // Note: Hook will re-run on next call since localStorage has changed
  }, [config]);

  return handleClick;
};

export default useRantProgression;