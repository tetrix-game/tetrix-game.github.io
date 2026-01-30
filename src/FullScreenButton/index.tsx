import './FullScreenButton.css';
import { useEffect, useState, useRef } from 'react';

import { CallToActionPointer } from '../Pointer/CallToActionPointer';

export function FullScreenButton(): JSX.Element {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect((): (() => void) | void => {
    // Check if running in standalone mode (PWA)
    const checkStandalone = (): void => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
        || window.matchMedia('(display-mode: fullscreen)').matches
        || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listen for changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)');

    const handleChange = (): void => checkStandalone();

    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener('change', handleChange);
      fullscreenQuery.addEventListener('change', handleChange);
      return (): void => {
        standaloneQuery.removeEventListener('change', handleChange);
        fullscreenQuery.removeEventListener('change', handleChange);
      };
    }
    // Fallback for older browsers
    standaloneQuery.addListener(handleChange);
    fullscreenQuery.addListener(handleChange);
    return (): void => {
      standaloneQuery.removeListener(handleChange);
      fullscreenQuery.removeListener(handleChange);
    };
  }, []);

  const goFullScreen = (): void => {
    // make the browser full screen
    const doc = document.documentElement;
    if (doc.requestFullscreen && !isFullScreen) {
      doc.requestFullscreen();
      setIsFullScreen(true);
    }
  };

  useEffect((): (() => void) => {
    const fullScreenChangeHandler = (): void => {
      if (document.fullscreenElement) {
        setIsFullScreen(true);
      } else {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', fullScreenChangeHandler);
    return (): void => {
      document.removeEventListener('fullscreenchange', fullScreenChangeHandler);
    };
  });

  return (
    <>
      {!isFullScreen && !isStandalone ? (
        <button
          ref={buttonRef}
          className="full-screen-button"
          onClick={goFullScreen}
          aria-label="Enter Full Screen"
        >
          <span>+</span>
        </button>
      ) : null}

      {!isStandalone && (
        <CallToActionPointer
          targetRef={buttonRef}
          callKey="fullscreen-button"
          label="Try fullscreen mode!"
          timeout={5 * 60 * 60 * 1000}
          offsetFromTarget={80}
        />
      )}
    </>
  );
}
