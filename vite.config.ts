import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],

  // ⚠️ CRITICAL: Base path configuration for GitHub Pages deployment
  //
  // Development (npm run dev): Uses root path '/'
  // Production (npm run build): Uses '/finance-tracker/' subdirectory
  //
  // ⛔ DO NOT CHANGE THIS WITHOUT UPDATING DEPLOYMENT CONFIGURATION
  //
  // Current deployment: https://cj-1981.github.io/finance-tracker/
  // - Changing to '/' will break all asset loading in production
  // - Assets will 404, causing blank pages on mobile/desktop
  // - Router navigation will fail without correct base path
  //
  // To change deployment path:
  // 1. Update 'homepage' in package.json
  // 2. Update base path below (match repo name)
  // 3. Update GitHub Pages repository settings
  base: command === 'serve' ? '/' : '/finance-tracker/',

  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {},
      },
    },
  },
}))
