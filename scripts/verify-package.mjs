import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const tarball = resolve(process.argv[2]);
mkdirSync('build', { recursive: true });
const scratch = mkdtempSync(resolve('build/package-check-'));
execFileSync('tar', ['-xf', tarball, '-C', scratch]);
const root = join(scratch, 'package');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const esm = await import(pathToFileURL(join(root, pkg.module)).href);
const cjs = createRequire(import.meta.url)(join(root, pkg.main));
for (const api of ['createMosaicoCropper', 'getMosaicoCropper', 'MosaicoCropperPlugin', 'mosaicoCropper']) {
    assert.equal(typeof esm[api], 'function');
    assert.equal(typeof cjs[api], 'function');
}
if (pkg.exports['./core']) {
    const entry = pkg.exports['./core'];
    const core = await import(pathToFileURL(join(root, entry.import)).href);
    const coreCjs = createRequire(import.meta.url)(join(root, entry.require));
    assert.equal(typeof core.createMosaicoCropper, 'function');
    assert.equal(typeof coreCjs.createMosaicoCropper, 'function');
    assert.equal(core.registerJQueryPlugin, undefined);
    assert.equal(coreCjs.registerJQueryPlugin, undefined);
    for (const file of [entry.import, entry.require]) {
        const map = JSON.parse(readFileSync(join(root, file + '.map'), 'utf8'));
        assert.ok(map.sources.every(source => !source.includes('/ui/') && !source.includes('CropperSlider')));
        const code = readFileSync(join(root, file), 'utf8');
        assert.doesNotMatch(code, /tool-zoom|vanilla-slider|registerJQueryPlugin/);
    }
    const css = readFileSync(join(root, pkg.exports['./core.css']), 'utf8');
    assert.doesNotMatch(css, /\.toolbar|cropper-zoom-slider|mosaico-cropper-edit-trigger/);
    console.log('Core package excludes built-in controls, slider code, jQuery registration and toolbar CSS.');
}
const consumer = `import { createMosaicoCropper, type ZoomState } from 'mosaico-cropper';
const cropper = createMosaicoCropper('#image', { onZoomchange(event, state) {
    const value: number = state.scale;
    event.detail.widget.scale(value);
} });
const zoom: ZoomState | null = cropper.getZoomState();
cropper.scale(1).fit();
// @ts-expect-error invalid scale
cropper.scale('large');
`;
for (const extension of ['mts', 'cts']) writeFileSync(join(root, `consumer.${extension}`), consumer + (pkg.exports['./core'] ? `
import { createMosaicoCropper as createCore } from 'mosaico-cropper/core';
const core = createCore('#image', { autoClose: false });
const unsubscribe: () => void = core.onZoomChange(state => core.scale(state.scale));
core.finishEdit(); unsubscribe();
` : ''));
writeFileSync(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
    target: 'ES2020', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true,
    noEmit: true, skipLibCheck: false, types: [], lib: ['ES2020', 'DOM']
}, include: ['consumer.mts', 'consumer.cts'] }));
execFileSync(process.execPath, [resolve('node_modules/typescript/bin/tsc'), '-p', join(root, 'tsconfig.json')], { stdio: 'inherit' });
console.log(`Verified ${pkg.name}@${pkg.version}: ESM, CommonJS and installed TypeScript declarations.`);
