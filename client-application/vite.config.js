export default {
  server: {
    proxy: {
      '/events': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/games': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}

