import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: 'terser',
        lib: {
            entry: resolve(__dirname, 'src/package.ts'),
            formats: ['es', 'cjs'],
            fileName: (format) => format === 'es'
                ? 'mosaico-cropper.es.js'
                : 'mosaico-cropper.cjs'
        },
        rollupOptions: {
            output: {
                exports: 'named'
            }
        }
    }
});
