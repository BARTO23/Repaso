import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import LexClientes from './scene/LexClientes'
import './host.css'

// The host page: the demo as it would sit on the product's homepage, with a
// real Replay button that remounts the scene at its story boundary (kit.md,
// Explicit replay). The page is the ground; the stage brings its own crop.
function Page() {
  const [run, setRun] = useState(0)
  return (
    <main className="host">
      <header className="host-head">
        <h1>Encuentra a cualquier cliente en segundos</h1>
        <p>Busca por nombre, abre su ficha y programa el recordatorio de su próxima audiencia sin salir del directorio.</p>
      </header>
      <div className="host-demo">
        <LexClientes key={run} />
      </div>
      <button type="button" className="host-replay" onClick={() => setRun((n) => n + 1)}>Repetir la demostración</button>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
