import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    // The output directory for the build
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Entry point for the side panel React app
        main: resolve(__dirname, 'index.html'),
        // Entry point for the background script
        background: resolve(__dirname, 'src/background.js'),
        // Entry point for the content script
        content: resolve(__dirname, 'src/content.js'),
      },
      output: {
        // Use static, predictable names for the output files
        // This is crucial for the manifest.json to find them
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
