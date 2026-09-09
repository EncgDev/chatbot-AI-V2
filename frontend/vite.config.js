import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables .env pour les utiliser dans la config
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      // En dev : proxy vers le backend Flask pour éviter les soucis CORS
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Vite 6+ : manualChunks doit être une fonction
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
              return 'three-vendor'
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'motion-vendor'
            }
          },
        },
      },
    },
  }
})
