import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    // Inject <link rel="modulepreload"> for critical chunks so the browser can
    // fetch them in parallel with the main bundle parse instead of sequentially.
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          // Split Three.js into three separate chunks so only the core geometry
          // math is fetched first; R3F and Drei load separately on demand.
          'vendor-three-core':  ['three'],
          'vendor-three-fiber': ['@react-three/fiber'],
          'vendor-three-drei':  ['@react-three/drei'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui':     ['lucide-react'],
          'vendor-supa':   ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1600, // Three.js chunks are large by nature; expected
  },
})
