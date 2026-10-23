export default {
  server: {
    proxy: {
      '/events': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/games': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/user': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}

