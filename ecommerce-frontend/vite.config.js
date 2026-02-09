import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const target = process.env.VITE_API_BASE_URL || 'http://localhost:5000'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  resolve: {
    // 🔥 PRO TIP: Prevent Linux/Vercel case errors
    caseSensitive: true,
  },

  server: {
    proxy: mode === 'development' ? {
      '/api': {
        target,
        changeOrigin: true,
        secure: false,
      },
    } : undefined,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}))
