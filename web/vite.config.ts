import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    // File-based routes in src/routes; must run before the React plugin.
    tanstackRouter({ target: 'react', autoCodeSplitting: true, generatedRouteTree: './src/app/route-tree.gen.ts' }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': import.meta.dirname + '/src',
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
