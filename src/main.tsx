import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import TetrixProvider from './components/Tetrix/TetrixProvider.tsx'
import RantErrorBoundary from './components/RantErrorBoundary'
import { DebugEditorProvider } from './components/DebugEditor'
import { GridEditorProvider } from './components/GridEditor'
import { SoundEffectsProvider } from './components/SoundEffectsContext'
import { MusicControlProvider } from './components/Header/MusicControlContext'
import { ColorPickerProvider } from './components/ColorPicker'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RantErrorBoundary>
      <SoundEffectsProvider>
        <MusicControlProvider>
          <TetrixProvider>
            <DebugEditorProvider>
              <GridEditorProvider>
                <ColorPickerProvider>
                  <App />
                </ColorPickerProvider>
              </GridEditorProvider>
            </DebugEditorProvider>
          </TetrixProvider>
        </MusicControlProvider>
      </SoundEffectsProvider>
    </RantErrorBoundary>
  </StrictMode>,
)
