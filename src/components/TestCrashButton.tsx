import { useState } from 'react';

const TestCrashButton = () => {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Test crash from TestCrashButton');
  }

  return (
    <button
      onClick={() => setShouldCrash(true)}
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        padding: '10px',
        backgroundColor: 'red',
        color: 'white',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      TEST CRASH
    </button>
  );
};

export default TestCrashButton;