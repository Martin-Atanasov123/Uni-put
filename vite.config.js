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
        // Function-based grouping keeps shared React internals (especially
        // react/jsx-runtime) out of the Three.js chunk. The object form let
        // Rollup attach that shared module to @react-three/fiber, which made
        // ordinary JSX pages download the full 3D dependency chain at startup.
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router') ||
            id.includes('/node_modules/scheduler/')
          ) return 'vendor-react'
          if (id.includes('/node_modules/@react-three/fiber/')) return 'vendor-three-fiber'
          if (id.includes('/node_modules/three/')) return 'vendor-three-core'
          if (id.includes('/node_modules/motion/')) return 'vendor-motion'
          if (id.includes('/node_modules/lucide-react/')) return 'vendor-ui'
          if (id.includes('/node_modules/@supabase/')) return 'vendor-supa'
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 1600,
  },
})
