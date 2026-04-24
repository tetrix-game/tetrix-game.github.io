import { StrictMode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '../AuthProvider';
import { ErrorBoundary } from '../ErrorBoundary';
import { GamePage } from '../GamePage';
import { LoginPage } from '../LoginPage';
import { MusicControlProvider } from '../MusicControlProvider';
import { ResetPasswordOverlay } from '../ResetPasswordOverlay';
import { SoundEffectsProvider } from '../SoundEffectsProvider';
import { TetrixProvider } from '../TetrixProvider';
import { ThemeProvider } from '../ThemeProvider';
import './App.css';

export const App = (): JSX.Element => {
  return (
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <SoundEffectsProvider>
              <MusicControlProvider>
                <TetrixProvider>
                  <ThemeProvider>
                    <Routes>
                      <Route path="/" element={<LoginPage />} />
                      <Route path="/game" element={<GamePage />} />
                      <Route path="/reset-password" element={<ResetPasswordOverlay />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </ThemeProvider>
                </TetrixProvider>
              </MusicControlProvider>
            </SoundEffectsProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  );
};

/**
 * A "shape" consists of a 4x4 grid of Blocks.
 * Each Block, of course, has a color, and a boolean value indicating whether it is filled or not.
 */
