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
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  build: {
    sourcemap: false,
    modulePreload: {
      polyfill: true,
      // Surgically exclude Three.js chunks from modulepreload injection.
      // Without this filter, Vite would add <link rel="modulepreload"> for the
      // 189 kB three-core chunk on EVERY page, stealing bandwidth from the 32 kB
      // React bundle and delaying FCP/LCP by 300-700 ms on slow connections.
      // Three.js is only needed after first paint (see AnoAI deferral in Home.jsx),
      // so we let it download lazily instead of eagerly.
      resolveDependencies: (filename, deps) =>
        deps.filter(dep => !/vendor-three/.test(dep)),
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          // Three.js split into three chunks so each can be cached independently.
          // No modulepreload hint (filtered above) — loads lazily after first paint.
          'vendor-three-core':  ['three'],
          'vendor-three-fiber': ['@react-three/fiber'],
          'vendor-three-drei':  ['@react-three/drei'],
          'vendor-motion': ['motion'],
          'vendor-ui':     ['lucide-react'],
          'vendor-supa':   ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1600,
  },
})
