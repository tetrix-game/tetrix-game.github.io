import { StrictMode } from 'react';

import { DraggingShape } from './components/DraggingShape';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FullScreenButton as FullScreenFloatingActionButton } from './components/FullScreenButton';
import { Header } from './components/Header';
import { PersistenceListener } from './components/PersistenceListener';
import { Tetrix } from './components/Tetrix';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastOverlay } from './components/ToastOverlay';
import { UpdateNotification } from './components/UpdateNotification';
import { GridEditorProvider } from './contexts/GridEditorContext';
import { usePointerTracking } from './hooks/usePointerTracking';
import { useShapePlacement } from './hooks/useShapePlacement';
import { useUpdateNotification } from './hooks/useUpdateNotification';
import { Shared_MusicControlProvider, Shared_SoundEffectsProvider, Shared_TetrixProvider } from './Shared';

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

const App = (): JSX.Element => {
  return (
    <StrictMode>
      <ErrorBoundary>
        <Shared_SoundEffectsProvider>
          <Shared_MusicControlProvider>
            <Shared_TetrixProvider>
              <GridEditorProvider>
                <ThemeProvider>
                  <AppContent />
                </ThemeProvider>
              </GridEditorProvider>
            </Shared_TetrixProvider>
          </Shared_MusicControlProvider>
        </Shared_SoundEffectsProvider>
      </ErrorBoundary>
    </StrictMode>
  );
};

export { App };

/**
 * A "shape" consists of a 4x4 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */
