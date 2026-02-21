import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/finance-tracker/',
  server: {
    port: 3000,
    // Ensure proper handling of the base path
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure proper asset paths
    rollupOptions: {
      output: {
        // Manual chunk splitting for better loading
        manualChunks: {},
      },
    },
  },
})
