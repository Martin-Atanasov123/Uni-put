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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-three':  ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui':     ['lucide-react'],
          'vendor-supa':   ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1600, // Three.js is lazy-loaded; large chunk is expected
  },
})
