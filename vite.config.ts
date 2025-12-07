import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        chickenTender: resolve(__dirname, 'applications/web/chicken-tender/index.html')
      }
    }
  },
  server: {
    fs: {
      // Allow serving files from both root and applications directory
      allow: ['.', 'applications/web/chicken-tender']
    }
  }
})
