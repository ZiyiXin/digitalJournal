import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  root: path.resolve(__dirname, 'gh-pages-site'),
  base: './',
  plugins: [
    {
      name: 'github-pages-demo-api-alias',
      enforce: 'pre',
      resolveId(source, importer) {
        if (
          importer &&
          importer.endsWith('/src/App.tsx') &&
          (source === './lib/api' || source === './lib/api.ts')
        ) {
          return path.resolve(__dirname, 'src/gh-pages/api.ts');
        }

        return null;
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-gh-pages'),
    emptyOutDir: true,
  },
});
