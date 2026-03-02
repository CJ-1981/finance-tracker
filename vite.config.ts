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
        // Split code into chunks for better caching and parallel loading
        manualChunks: {
          // Vendor chunk for React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-i18next', 'i18next', 'i18next-browser-languagedetector'],
          // Chart library chunk
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          // Supabase chunk
          'supabase-vendor': ['@supabase/supabase-js'],
          // CSV parsing chunk
          'csv-vendor': ['papaparse'],
        },
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  // Pre-bundle dependencies for faster development server start
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-i18next', 'i18next', '@supabase/supabase-js', 'chart.js', 'react-chartjs-2', 'papaparse'],
  },
}))
