
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default {
  server: {
    proxy: {
      '/events': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/games': { // ✅ ADD THIS
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}


