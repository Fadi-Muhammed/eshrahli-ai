import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy Zamzar API calls through Vite dev server to avoid CORS
      '/zamzar-api': {
        target: 'https://api.zamzar.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zamzar-api/, ''),
      },
    },
  },
})
