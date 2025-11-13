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
      title: "Welcome to Tetrix!",
      content: (
        <>
          <p>This is a relaxing puzzle game where you place shapes on a 10×10 grid. The goal is to clear lines and score points.</p>
          <p>There's no time pressure—take your time and enjoy the puzzle!</p>
        </>
      )
    },
    {
      title: "How Lines Get Cleared",
      content: (
        <>
          <p>When you place a shape on the grid, the game checks if you've completed any full rows or columns:</p>
          <ul>
            <li><strong>Complete a row:</strong> Fill all 10 blocks horizontally across any row, and that row clears.</li>
            <li><strong>Complete a column:</strong> Fill all 10 blocks vertically down any column, and that column clears.</li>
            <li><strong>Multiple clears:</strong> You can clear multiple rows and columns at the same time with a single placement! The more lines you clear at once, the higher your score.</li>
          </ul>
          <p>When lines clear, the blocks disappear and you earn points. The cleared spaces become available for new shapes.</p>
        </>
      )
    },
    {
      title: "How to Turn Shapes",
      content: (
        <>
          <p>Each shape can be rotated to fit better on the grid:</p>
          <ul>
            <li><strong>Unlock rotation:</strong> Tap or click the 🔄 button on a shape to spend 1 coin and unlock rotation for that shape.</li>
            <li><strong>Rotate clockwise:</strong> After unlocking, click the clockwise arrow (↻) to rotate the shape 90° clockwise.</li>
            <li><strong>Rotate counterclockwise:</strong> After unlocking, click the counterclockwise arrow (↺) to rotate the shape 90° counterclockwise.</li>
            <li><strong>One coin per shape:</strong> You only need to pay once per shape. After unlocking, you can rotate it as many times as you want.</li>
          </ul>
        </>
      )
    },
    {
      title: "Controls and Scoring",
      content: (
        <>
          <p><strong>How to play:</strong></p>
          <ul>
            <li><strong>Drag and drop:</strong> Click and hold a shape, drag it over the grid, and release it where you want to place it.</li>
            <li><strong>Valid placement:</strong> The game shows you if the placement is valid (the shape will appear bright and colorful). If it's invalid (overlapping or out of bounds), the shape appears faded.</li>
            <li><strong>Save a shape:</strong> You can save one shape for later use. This helps when you don't want to use a shape right away.</li>
          </ul>
          <p><strong>How scoring works:</strong></p>
          <ul>
            <li><strong>Clear lines to score:</strong> The more rows and columns you clear at once, the higher your score!</li>
            <li><strong>Currency breakdown:</strong> Your score is converted into a multi-tier currency system: Diamond 💎, Sapphire 💙, Ruby ♦️, Gold 🥇, Silver 🥈, Bronze 🥉.</li>
            <li><strong>Use coins strategically:</strong> Spend coins to unlock shape rotation when you need it most.</li>
          </ul>
        </>
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
