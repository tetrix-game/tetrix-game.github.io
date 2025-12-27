import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import TetrixProvider from './components/Tetrix/TetrixProvider.tsx'
import RantErrorBoundary from './components/RantErrorBoundary/index.ts'
import { DebugEditorProvider } from './components/DebugEditor/index.ts'
import { GridEditorProvider } from './components/GridEditor/index.ts'
import { SoundEffectsProvider } from './components/SoundEffectsContext/index.ts'
import { MusicControlProvider } from './components/Header/MusicControlContext.tsx'
import { ColorPickerProvider } from './components/ColorPicker/index.ts'

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
