
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/events': {
        target: 'https://localhost:3000', // ✅ your backend
        changeOrigin: true,
        secure: false, // ✅ REQUIRED for HTTPS localhost
      },
    },
  },
})

