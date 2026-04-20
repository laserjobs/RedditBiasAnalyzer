import { defineConfig } from 'vite';
import fs from 'fs-extra';

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: 'src/background.js',
        content: 'src/content.js',
        offscreen: 'src/offscreen.js',
        offscreenHtml: 'src/offscreen.html'
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  plugins: [
    {
      name: 'copy-transformers-assets',
      buildEnd() {
        fs.copySync(
          'node_modules/@huggingface/transformers/dist',
          'dist/transformers',
          { overwrite: true }
        );
        console.log('✅ Transformers WASM assets copied for Chrome MV3');
      }
    }
  ]
});
