import { defineConfig } from 'vite'

export default defineConfig({
  // Raíz del código fuente; el entry point lo asigna el framework UI
  // cuando se integre el front (React, Svelte, etc.)
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
})
