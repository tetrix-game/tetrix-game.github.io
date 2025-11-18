import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './TutorialOverlay.css';

interface TutorialOverlayProps {
  onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Drag shapes from the Shape Queue",
      content: (
        <div className="gif-placeholder">
          GIF
        </div>
      )
    },
    {
      title: "Place them on the Grid",
      content: (
        <div className="gif-placeholder">
          GIF
        </div>
      )
    },
    {
      title: "Fill in Rows and Columns to clear lines",
      content: (
        <div className="gif-placeholder">
          GIF
        </div>
      )
    },
    {
      title: "Clear lines to get points",
      content: (
        <div className="gif-placeholder">
          GIF
        </div>
      )
    },
    {
      title: "Use points to turn shapes",
      content: (
        <div className="gif-placeholder">
          GIF
        </div>
      )
    },
    {
      title: "Get stuck? Start a new game from the menu",
      content: (
        <div className="gif-placeholder">
          GIF
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

  const handleClose = useCallback(() => {
    localStorage.setItem('hasSeenTutorial', 'true');
    onClose();
  }, [onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay (not its children)
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  return createPortal(
    <div
      className="tutorial-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="tutorial-content">
        <button
          className="tutorial-close-x"
          onClick={handleClose}
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
              onClick={handleClose}
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
