import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: 'workspace',
  base: '/git-visualizer/',
  server: {
    open: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./workspace/js', import.meta.url))
    }
  }
});
