import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Reutiliza o public/manifest.json existente em vez de gerar um novo
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      },
    }),
  ],
  // Os componentes usam JSX dentro de ficheiros .js — diz ao esbuild para os tratar como JSX
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  // O frontend roda em 5173; a porta 3001 fica reservada para o backend (api/index.js),
  // que é para onde src/services/api.js envia as requisições em desenvolvimento.
  server: { port: 5173 },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        // Separa as bibliotecas grandes em chunks próprios para melhor cache
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          charts: ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
});
