import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { cssMinify: false },

  css: {
    postcss: './postcss.config.js',
  },

  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/app': {
        target: 'ws://127.0.0.1:8080',
        ws: true,
      }
    }
  }
})