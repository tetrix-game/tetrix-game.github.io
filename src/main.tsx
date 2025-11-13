import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import TetrixProvider from './components/Tetrix/TetrixProvider.tsx'
import RantErrorBoundary from './components/RantErrorBoundary'
import { DebugEditorProvider } from './components/DebugEditor'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RantErrorBoundary>
      <TetrixProvider>
        <DebugEditorProvider>
          <App />
        </DebugEditorProvider>
      </TetrixProvider>
    </RantErrorBoundary>
  </StrictMode>,
)
