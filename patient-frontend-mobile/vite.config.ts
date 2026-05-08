import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// MEIOSIS Patient Frontend — Mobile Fork
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5175,
  },
})
