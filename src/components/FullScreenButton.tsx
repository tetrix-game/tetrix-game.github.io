import { useEffect, useState } from "react";

function FullScreenFloatingActionButton() {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const style = {
    position: "absolute",
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: "4em",
    bottom: "1em",
    right: "1em",
    top: "auto",
    left: "auto",
    width: "2em",
    height: "2em",
    borderRadius: "50%",
    backgroundColor: "lightblue",
    border: "none",
    padding: "0.5em 1em",
    cursor: "pointer",
  }

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
      <button style={style} onClick={goFullScreen}>
        <span>+</span>
      </button>
    ) : null
  )
}

export default FullScreenFloatingActionButton;