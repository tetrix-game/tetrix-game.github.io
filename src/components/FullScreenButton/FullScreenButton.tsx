import "./FullScreenButton.css";
import { useEffect, useState } from "react";

function FullScreenButton() {
  const [isFullScreen, setIsFullScreen] = useState(false);

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
    !isFullScreen ? (
      <button className="full-screen-button" onClick={goFullScreen}>
        <span>+</span>
      </button>
    ) : null
  )
}

export default FullScreenButton;