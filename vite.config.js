import { defineConfig } from 'vite';
import { resolve } from 'path';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default defineConfig({
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.js')
      },
      output: {
        entryFileNames: 'jqueryui-mosaico-cropper.min.js',
        assetFileNames: 'jqueryui-mosaico-cropper.min.css',
        format: 'umd',
        name: 'mosaicoCropper',
      }
    },
    minify: 'terser',
    terserOptions: {
      format: {
        comments: 'some'
      }
    },
    sourcemap: true
  },
  
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        charset: "utf-8"
      }
    },
    postcss: {
      plugins: [
        autoprefixer(),
        cssnano()
      ]
    },
    devSourcemap: true
  },
  
  server: {
    port: 9009,
    host: '0.0.0.0',
    watch: {
      usePolling: true
    },
    proxy: {
      '/img': 'http://localhost:9009'
    }
  }
});