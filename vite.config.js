import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  console.log('Loaded env:', env.VITE_API_URL)

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // IMPORTANT: keep SPA routes local (do not proxy them)
        '/admin-login': {
          target: 'http://127.0.0.1:5173',
          bypass: (req) => req.url,
        },
        '/public': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
        '/admin': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
        '/images': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    }
  }
})