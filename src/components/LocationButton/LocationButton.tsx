import useRantProgression from '../../hooks/useRantProgression';
import './LocationButton.css';

const mapRantConfig = {
  CandyCrushMapRant: {
    rant: [
      'Candy crush map progression anybody?',
      'Coming soon!',
      'Hold your horses! I\'m doing this in my spare time!',
      'Really, just play while you wait',
      'I\'m doing this with AI, it shouldn\'t take that long XD',
      'Stop it, I\'m busy',
      'I can\'t focus if you keep doing that.',
      'Stop, or I\'ll frickin crash this page!',
      'Told you I\'d do it'
    ],
    PostCrashRant: {
      rant: [
        'Don\'t I know you?',
        'You never learn, do you?!'
      ]
    }
  }
};

const LocationButton = () => {
  const handleClick = useRantProgression(mapRantConfig);

  return (
    <button className="location_button" onClick={handleClick} aria-label="Location">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Map pin shape */}
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        {/* Star inside the pin */}
        <path
          d="M12 6.5l1.09 2.21 2.44.36-1.77 1.72.42 2.44L12 11.77l-2.18 1.46.42-2.44-1.77-1.72 2.44-.36L12 6.5z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
};

export default LocationButton;