import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TextSizeProvider } from './context/TextSizeContext'

// Perf: mark app start for startup timing
if (import.meta.env.DEV) {
  performance.mark('app_start');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TextSizeProvider>
      <App />
    </TextSizeProvider>
  </StrictMode>,
)
