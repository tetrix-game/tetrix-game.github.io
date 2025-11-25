import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './TutorialOverlay.css';

interface TutorialOverlayProps {
  onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Assuming that any user action indicates they want to start playing, and that they never want to see the tutorial again
  const handleStartPlaying = useCallback(() => {
    localStorage.setItem('hasSeenTutorial', 'true');
    onClose();
  }, [onClose]);

  const slides = [
    {
      title: "Drag & Drop",
      content: (
        <div className="tutorial-media">
          <img src="/assets/DragAndDrop.gif" alt="Drag and drop demonstration" />
          <p className="tutorial-description">Drag shapes from the queue and place them on the 10x10 grid.</p>
        </div>
      )
    },
    {
      title: "Clear Lines",
      content: (
        <div className="tutorial-media">
          <img src="/assets/Get10InARow.gif" alt="Clear lines demonstration" />
          <p className="tutorial-description">Fill an entire row or column to clear it and earn points.</p>
        </div>
      )
    },
    {
      title: "Combo Bonuses",
      content: (
        <div className="tutorial-media">
          <img src="/assets/ClearUpTo4LinesInARow.gif" alt="Combo bonus demonstration" />
          <p className="tutorial-description">Clear multiple lines at once to earn massive point bonuses!</p>
        </div>
      )
    },
    {
      title: "Rotate Shapes",
      content: (
        <div className="tutorial-media">
          <img src="/assets/TurnShapes.gif" alt="Rotate shapes demonstration" />
          <p className="tutorial-description">Spend your hard-earned points to rotate shapes that don't fit.</p>
        </div>
      )
    }
  ];

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  }, [currentSlide, slides.length]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  }, [currentSlide]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleStartPlaying();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStartPlaying]);

  return createPortal(
    <div
      className="tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="tutorial-content">
        <button
          className="tutorial-close-x"
          onClick={handleStartPlaying}
          aria-label="Close tutorial"
          title="Close tutorial"
        >
          ✕
        </button>

        <div className="tutorial-slide">
          <h2 id="tutorial-title" className="tutorial-title">{slides[currentSlide].title}</h2>
          <div className="tutorial-body">{slides[currentSlide].content}</div>
        </div>

        <div className="tutorial-navigation">
          <button
            className="tutorial-nav-button"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            aria-label="Previous slide"
          >
            ← Previous
          </button>

          <div className="tutorial-dots">
            {slides.map((slide, index) => (
              <button
                key={`slide-${index}-${slide.title}`}
                className={`tutorial-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {currentSlide < slides.length - 1 ? (
            <button
              className="tutorial-nav-button"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              Next →
            </button>
          ) : (
            <button
              className="tutorial-nav-button tutorial-close-button"
              onClick={handleStartPlaying}
              aria-label="Close tutorial"
            >
              Start Playing
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TutorialOverlay;
