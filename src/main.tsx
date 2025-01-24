import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import TetrixProvider from './components/Tetrix/TetrixProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TetrixProvider>
      <App />
    </TetrixProvider>
  </StrictMode>,
)
