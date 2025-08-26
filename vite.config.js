import { defineConfig } from 'vite';
import { resolve } from 'path';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { imageProcessorPlugin } from './vite-plugins/image-processor-plugin.js';

export default defineConfig({
  plugins: [
    imageProcessorPlugin()
  ],

  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.js')
      },
      external: ['jquery', 'jquery-ui-package', 'jquery-ui-touch-punch'],
      output: {
        entryFileNames: 'jqueryui-mosaico-cropper.min.js',
        assetFileNames: 'jqueryui-mosaico-cropper.min.css',
        format: 'umd',
        name: 'mosaicoCropper',
        globals: {
          'jquery': 'jQuery',
          'jquery-ui-package': 'jQuery.ui',
          'jquery-ui-touch-punch': 'jQuery.ui.touchPunch'
        }
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
        cssnano({
          preset: ['default', {
            normalizeCharset: false  // Preserve @charset directive
          }]
        })
      ]
    },
    devSourcemap: true
  },
  
  server: {
    port: 9008,
    host: '0.0.0.0',
    watch: {
      usePolling: true
    }
  }
});