import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = process.env.BACKEND_ADMIN_URL || env.BACKEND_ADMIN_URL || 'http://backend_admin:5001'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
