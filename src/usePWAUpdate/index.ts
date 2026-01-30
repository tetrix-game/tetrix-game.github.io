import { useRegisterSW } from 'virtual:pwa-register/react';

interface PWAUpdateHook {
  needRefresh: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  offlineReady: boolean;
}

/**
 * Custom hook to manage PWA updates using vite-plugin-pwa
 *
 * This hook integrates with the service worker to detect when a new version
 * is available and provides methods to trigger the update.
 */
export function usePWAUpdate(): PWAUpdateHook {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // 1 hour
      }
    },
    onRegisterError() {
      // Silently handle registration error
    },
  });

  return {
    needRefresh,
    updateServiceWorker,
    offlineReady,
  };
}
