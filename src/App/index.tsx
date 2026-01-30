import { StrictMode } from 'react';

import { DraggingShape } from '../DraggingShape';
import { ErrorBoundary } from '../ErrorBoundary';
import { FullScreenButton as FullScreenFloatingActionButton } from '../FullScreenButton';
import { Header } from '../Header';
import { PersistenceListener } from '../PersistenceListener';
import { MusicControlProvider } from '../MusicControlProvider';
import { SoundEffectsProvider } from '../SoundEffectsProvider';
import { TetrixProvider } from '../TetrixProvider';
import { Tetrix } from '../Tetrix';
import { ThemeProvider } from '../ThemeProvider';
import { ToastOverlay } from '../ToastOverlay';
import { UpdateNotification } from '../UpdateNotification';

import { usePointerTracking } from '../usePointerTracking';
import { useShapePlacement } from '../useShapePlacement';
import { useUpdateNotification } from '../useUpdateNotification';
import './App.css';

const AppContent = (): JSX.Element => {
  // Custom hooks encapsulate all React hook logic
  const { showUpdateNotification, handleUpdate, handleDismissUpdate } = useUpdateNotification();
  usePointerTracking();
  useShapePlacement();

  return (
    <>
      <PersistenceListener />

      <Header />
      <div className="game-container">
        <Tetrix />
      </div>
      <FullScreenFloatingActionButton />
      <DraggingShape />
      <ToastOverlay />

      {showUpdateNotification && (
        <UpdateNotification
          onUpdate={handleUpdate}
          onDismiss={handleDismissUpdate}
        />
      )}
    </>
  );
};

export const App = (): JSX.Element => {
  return (
    <StrictMode>
      <ErrorBoundary>
        <SoundEffectsProvider>
          <MusicControlProvider>
            <TetrixProvider>
              <ThemeProvider>
                <AppContent />
              </ThemeProvider>
            </TetrixProvider>
          </MusicControlProvider>
        </SoundEffectsProvider>
      </ErrorBoundary>
    </StrictMode>
  );
};

/**
 * A "shape" consists of a 4x4 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */
