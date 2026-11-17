import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Archivo (variable, eje de anchura 62–125). Se carga aquí para que el HTML empaquetado quede autocontenido.
const font = document.createElement('link')
font.rel = 'stylesheet'
font.href = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..700&display=swap'
document.head.appendChild(font)
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
