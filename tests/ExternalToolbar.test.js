import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMosaicoCropper, registerJQueryPlugin } from '../src/js/MosaicoCropperPlugin.js';
import { createTestContainer, createTestOptions } from './utils/testHelpers.js';
import { ImagePreloader } from '../src/js/utils/ImagePreloader.js';

vi.mock('../src/js/utils/ImagePreloader.js');

describe('External toolbar public contract', () => {
    let container, image, cropper, loads, changes;
    const flush = () => Promise.resolve();
    const load = () => {
        const [url, success] = loads.shift();
        success({ naturalWidth: 800, naturalHeight: 600 }, url);
    };
    const create = (options = {}) => {
        cropper = createMosaicoCropper(image, createTestOptions({
            toolbar: false, autoClose: false, onZoomchange: changes, ...options
        }));
        return cropper;
    };

    beforeEach(() => {
        container = createTestContainer();
        image = container.querySelector('img');
        loads = [];
        changes = vi.fn();
        ImagePreloader.preload.mockImplementation((...args) => loads.push(args));
    });
    afterEach(() => {
        cropper?.destroy();
        container.remove();
        vi.restoreAllMocks();
    });

    it('exposes a complete independent snapshot at ready, with no initial change event', async () => {
        const ready = vi.fn(() => expect(cropper.getZoomState()).toEqual({ scale: 0.5, minScale: 0.5, maxScale: 2 }));
        image.addEventListener('mosaicocroppercropperready', ready);
        create();
        expect(() => cropper.getZoomState()).toThrow(/still loading/);
        expect(() => cropper.fit()).toThrow(/still loading/);
        load();
        await flush();
        expect(ready).toHaveBeenCalledOnce();
        expect(changes).not.toHaveBeenCalled();
        cropper.getZoomState().scale = 99;
        expect(cropper.scale()).toBe(0.5);
        cropper.destroy();
        expect(cropper.getZoomState()).toBeNull();
        expect(cropper.fit()).toBe(cropper);
    });

    it('clamps, batches coherent changes and prevents feedback loops', async () => {
        create({ autoZoom: true }); load();
        const event = vi.fn(e => {
            expect(e.detail.data).toEqual(cropper.getZoomState());
            cropper.scale(e.detail.data.scale);
            e.detail.data.scale = -10; // Subscribers cannot corrupt deduplication.
        });
        image.addEventListener('mosaicocropperzoomchange', event);
        cropper.scale(100);
        await flush();
        expect(cropper.scale()).toBe(2);
        expect(event).toHaveBeenCalledOnce();
        cropper.scale(2);
        await flush();
        expect(event).toHaveBeenCalledOnce();
        cropper.scale(-1);
        cropper.cropHeight(450);
        await flush();
        expect(cropper.getZoomState()).toEqual({ scale: 0.75, minScale: 0.75, maxScale: 2 });
        expect(event).toHaveBeenCalledTimes(2);
    });

    it('synchronizes wheel and external range in both directions on each event', async () => {
        create({ shiftWheel: true }); load();
        expect(container.querySelector('.toolbar')).toBeNull();
        expect(container.querySelector('.vanilla-slider')).toBeNull();
        const slider = document.createElement('input');
        slider.type = 'range'; slider.step = 'any';
        container.append(slider);
        const sync = state => {
            slider.min = state.minScale; slider.max = state.maxScale; slider.value = state.scale;
        };
        sync(cropper.getZoomState());
        image.addEventListener('mosaicocropperzoomchange', e => sync(e.detail.data));
        slider.addEventListener('input', () => cropper.scale(Number(slider.value)));
        const surface = container.querySelector('.outer-image-container');
        surface.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
        expect(cropper.scale()).toBe(0.5);
        for (let i = 0; i < 3; i++) {
            surface.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, shiftKey: true }));
            await flush();
            expect(Number(slider.value)).toBe(cropper.scale());
            expect(changes).toHaveBeenCalledTimes(i + 1);
        }
        slider.focus();
        slider.value = '1.25';
        slider.dispatchEvent(new Event('input'));
        expect(cropper.scale()).toBe(1.25);
        await flush();
        expect(Number(slider.value)).toBe(1.25);
        expect(container.querySelector('.mo-cropper')).not.toBeNull();
    });

    it('keeps pan, resize and finalization working without a toolbar', async () => {
        create(); load(); cropper.scale(1);
        await flush(); changes.mockClear();
        const surface = container.querySelector('.outer-image-container');
        const left = surface.style.left;
        surface.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 100 }));
        document.dispatchEvent(new MouseEvent('mouseup'));
        expect(surface.style.left).not.toBe(left);
        const frame = container.querySelector('.cropper-frame');
        Object.defineProperty(frame, 'offsetHeight', { value: 300 });
        container.querySelector('.clip-handle').dispatchEvent(new MouseEvent('mousedown', { clientY: 300 }));
        document.dispatchEvent(new MouseEvent('mousemove', { clientY: 450 }));
        document.dispatchEvent(new MouseEvent('mouseup'));
        await flush();
        expect(cropper.cropHeight()).toBe(450);
        expect(changes).toHaveBeenCalledOnce();
        expect(changes.mock.calls[0][1]).toEqual(cropper.getZoomState());
        const onCrop = vi.fn();
        image.addEventListener('mosaicocroppercrop', onCrop);
        cropper.finalizeCrop(); load();
        expect(onCrop).toHaveBeenCalledOnce();
        expect(container.querySelector('.mo-cropper')).toBeNull();
    });

    it('uses the same smart fit cycle for public API and built-in button', async () => {
        create({ toolbar: true }); load();
        const otherImage = image.cloneNode(); container.append(otherImage);
        const external = createMosaicoCropper(otherImage, createTestOptions({ toolbar: false, autoClose: false }));
        load();
        try {
            for (const height of [300, 400, 200]) {
                cropper.cropHeight(height).scale(1.5);
                external.cropHeight(height).scale(1.5);
                for (let i = 0; i < 4; i++) {
                    container.querySelector('.tool-zoom').click();
                    expect(external.fit()).toBe(external);
                    await flush();
                    expect(external.getZoomState()).toEqual(cropper.getZoomState());
                    expect(external.cropHeight()).toBe(cropper.cropHeight());
                    const surfaces = container.querySelectorAll('.outer-image-container');
                    expect(surfaces[0].style.cssText).toBe(surfaces[1].style.cssText);
                }
            }
            const slider = container.querySelector('.vanilla-slider');
            slider.dispatchEvent(new MouseEvent('mousedown'));
            slider.value = slider.max;
            slider.dispatchEvent(new Event('input'));
            slider.dispatchEvent(new MouseEvent('mouseup'));
            await flush();
            expect(changes.mock.lastCall[1]).toEqual(cropper.getZoomState());
        } finally { external.destroy(); }
    });

    it('ignores stale loads, pending notifications and active drag listeners after destroy', async () => {
        const ready = vi.fn();
        create({ onCropperready: ready }); cropper.destroy(); load();
        expect(ready).not.toHaveBeenCalled();
        create(); load();
        const surface = container.querySelector('.outer-image-container');
        surface.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
        cropper.scale(1); cropper.destroy();
        const previous = surface.style.cssText;
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 100 }));
        await flush();
        expect(surface.style.cssText).toBe(previous);
        expect(changes).not.toHaveBeenCalled();
        expect(container.querySelector('.mo-cropper')).toBeNull();
    });

    it('preserves edit triggers without toolbar and historical autoClose', () => {
        create({ editable: false }); load();
        container.querySelector('.mosaico-cropper-edit-trigger').click();
        expect(container.querySelector('.mo-cropper').classList.contains('mosaico-cropper--view-mode')).toBe(false);
        expect(container.querySelector('.toolbar')).toBeNull();
        cropper.destroy();
        create({ autoClose: true }); load();
        const button = document.createElement('button'); container.append(button); button.focus();
        load();
        expect(container.querySelector('.mo-cropper')).toBeNull();
    });

    it('exposes getters and chainable commands through the jQuery bridge', () => {
        const jquery = { fn: { data: vi.fn() }, error: vi.fn() };
        registerJQueryPlugin(jquery);
        const selection = { each(callback) { callback.call(image); return this; } };
        const call = (...args) => jquery.fn.mosaicoCropper.call(selection, ...args);
        create(); load();
        expect(call('scale', 1.25)).toBe(selection);
        expect(call('getZoomState')).toEqual({ scale: 1.25, minScale: 0.5, maxScale: 2 });
        expect(call('fit')).toBe(selection);
        expect(call('getZoomState').scale).toBe(0.5);
        expect(jquery.error).not.toHaveBeenCalled();
    });

    it('ignores replaced initialization and finalized-image loads after destruction', () => {
        const ready = vi.fn();
        create({ onCropperready: ready });
        cropper.updateOptions({ maxScale: 3 });
        load();
        expect(ready).not.toHaveBeenCalled();
        load();
        expect(ready).toHaveBeenCalledOnce();
        expect(cropper.getZoomState().maxScale).toBe(3);
        const src = image.src;
        cropper.scale(1).finalizeCrop().destroy();
        load();
        expect(image.src).toBe(src);
    });
});
