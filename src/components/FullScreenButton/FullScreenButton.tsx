import "./FullScreenButton.css";
import { useEffect, useState, useRef } from "react";
import { CallToActionPointer } from "../Pointer";

function FullScreenButton() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const goFullScreen = () => {
    // make the browser full screen
    const doc = document.documentElement;
    if (doc.requestFullscreen && !isFullScreen) {
      doc.requestFullscreen();
      setIsFullScreen(true);
    }
  }

  useEffect(() => {
    const fullScreenChangeHandler = () => {
      if (document.fullscreenElement) {
        setIsFullScreen(true);
      }
      else {
        setIsFullScreen(false);
      }
    }
    document.addEventListener("fullscreenchange", fullScreenChangeHandler);
    return () => {
      document.removeEventListener("fullscreenchange", fullScreenChangeHandler);
    }
  })

  return (
    <>
      {!isFullScreen ? (
        <button
          ref={buttonRef}
          className="full-screen-button"
          onClick={goFullScreen}
          aria-label="Enter Full Screen"
        >
          <span>+</span>
        </button>
      ) : null}
      
      <CallToActionPointer
        targetRef={buttonRef}
        callKey="fullscreen-button"
        label="Try fullscreen mode!"
        timeout={5 * 60 * 60 * 1000}
        offsetFromTarget={80}
      />
    </>
  )
}

export default FullScreenButton;