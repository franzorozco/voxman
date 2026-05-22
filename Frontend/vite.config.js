import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  css: {
    postcss: './postcss.config.js',
  },

  server: {
    host: '0.0.0.0',
    allowedHosts: true
  }
})