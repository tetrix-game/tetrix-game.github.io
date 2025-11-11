import { useState } from 'react';
import './TestCrashButton.css';

const TestCrashButton = () => {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Test crash from TestCrashButton');
  }

  return (
    <button
      onClick={() => setShouldCrash(true)}
      className="test-crash-button"
    >
      TEST CRASH
    </button>
  );
};

export default TestCrashButton;