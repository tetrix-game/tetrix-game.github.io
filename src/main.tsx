import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import TetrixProvider from './components/Tetrix/TetrixProvider.tsx'
import RantErrorBoundary from './components/RantErrorBoundary'
import { DebugEditorProvider } from './components/DebugEditor'
import { SoundEffectsProvider } from './components/SoundEffectsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RantErrorBoundary>
      <SoundEffectsProvider>
        <TetrixProvider>
          <DebugEditorProvider>
            <App />
          </DebugEditorProvider>
        </TetrixProvider>
      </SoundEffectsProvider>
    </RantErrorBoundary>
  </StrictMode>,
)
