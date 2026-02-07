import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_DEV_SERVER_URL ? '/' : './',
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
      ignored: ['**/pos.db*', '**/startup_debug.txt', '**/dist-electron/**']
    },
    proxy: {
      '/tally-api': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/tally-api/, '')
      }
    }
  }
})
