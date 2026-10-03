import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: 'terser',
        lib: {
            entry: { 'mosaico-cropper': resolve(__dirname, 'src/package.ts'), 'mosaico-cropper.core': resolve(__dirname, 'src/core.ts') },
            formats: ['es', 'cjs'],
            fileName: (format, entry) => format === 'es' ? `${entry}.es.js` : `${entry}.cjs`
        },
        rollupOptions: {
            output: {
                exports: 'named'
            }
        }
    }
});
