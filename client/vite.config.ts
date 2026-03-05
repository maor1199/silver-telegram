import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      // In dev, /api and /upload go to the backend so "Failed to fetch" is avoided when backend runs on 3001.
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/upload': { target: 'http://localhost:3001', changeOrigin: true },
      '/generate': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})