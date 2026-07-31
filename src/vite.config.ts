import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@stores': path.resolve(__dirname, 'stores'),
    },
  },
  clearScreen: false,
  server: {
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../tests/frontend/setup.ts'],
    include: ['../tests/frontend/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['**/*.{ts,svelte}'],
      exclude: ['main.ts', 'vite.config.ts', '**/*.d.ts', 'icons/**'],
    },
  },
})
