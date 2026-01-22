import Header from './components/Header';
import Tetrix from './components/Tetrix';
import FullScreenFloatingActionButton from './components/FullScreenButton';
import DraggingShape from './components/DraggingShape';
import ToastOverlay from './components/ToastOverlay';
import { PersistenceListener } from './components/PersistenceListener/PersistenceListener';
import UpdateNotification from './components/UpdateNotification';
import { useUpdateNotification } from './hooks/useUpdateNotification';
import { usePointerTracking } from './hooks/usePointerTracking';
import { useShapePlacement } from './hooks/useShapePlacement';
import TetrixProvider from './components/Tetrix/TetrixProvider.tsx';
import ErrorBoundary from './components/ErrorBoundary/index.ts';
import { DebugEditorProvider } from './components/DebugEditor/index.ts';
import { GridEditorProvider } from './components/GridEditor/index.ts';
import { SoundEffectsProvider } from './components/SoundEffectsContext/index.ts';
import { MusicControlProvider } from './components/Header/MusicControlContext.tsx';
import { ColorPickerProvider } from './components/ColorPicker/index.ts';
import { ThemeProvider } from './components/ThemeProvider';
import './App.css';
import { StrictMode } from 'react'


const AppContent = () => {
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

const App = () => {
  return (
    <StrictMode>
      <ErrorBoundary>
        <SoundEffectsProvider>
          <MusicControlProvider>
            <TetrixProvider>
              <DebugEditorProvider>
                <GridEditorProvider>
                  <ColorPickerProvider>
                    <ThemeProvider>
                      <AppContent />
                    </ThemeProvider>
                  </ColorPickerProvider>
                </GridEditorProvider>
              </DebugEditorProvider>
            </TetrixProvider>
          </MusicControlProvider>
        </SoundEffectsProvider>
      </ErrorBoundary>
    </StrictMode>
  );
};

export default App;

/**
 * A "shape" consists of a 4x4 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */