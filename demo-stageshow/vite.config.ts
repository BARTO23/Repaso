import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// One self-contained HTML file (dist/index.html), so the demo opens anywhere
export default defineConfig({ plugins: [react(), viteSingleFile()], build: { target: 'es2022' } })
