import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createMosaicoCropper, getMosaicoCropper } from '../src/core.ts';
import { createTestOptions, createTestContainer } from './utils/testHelpers.js';
import { ImagePreloader } from '../src/js/utils/ImagePreloader.ts';
vi.mock('../src/js/utils/ImagePreloader.ts');

describe('Core-only entry', () => {
    let container, image, cropper, load;
    beforeEach(() => {
        container = createTestContainer(); image = container.querySelector('img');
        ImagePreloader.preload.mockImplementation((url, success) => { load = () => success({ naturalWidth: 800, naturalHeight: 600 }, url); });
        cropper = createMosaicoCropper(image, createTestOptions({ autoClose: false }));
        load();
    });
    afterEach(() => { cropper.destroy(); container.remove(); vi.restoreAllMocks(); });
    it('omits all built-in controls while retaining the crop surface and resize gesture', () => {
        expect(container.querySelector('.mo-cropper')).not.toBeNull();
        expect(container.querySelector('.clip-handle')).not.toBeNull();
        expect(container.querySelector('button, input, .toolbar')).toBeNull();
        expect(getMosaicoCropper(image)).toBe(cropper);
    });
    it('supports bidirectional zoom, fit and finalization through public API', async () => {
        const updates = vi.fn();
        const unsubscribe = cropper.onZoomChange(updates);
        cropper.scale(1);
        await Promise.resolve();
        expect(updates).toHaveBeenLastCalledWith(cropper.getZoomState());
        container.querySelector('.outer-image-container').dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
        await Promise.resolve();
        expect(updates).toHaveBeenCalledTimes(2);
        expect(updates).toHaveBeenLastCalledWith(cropper.getZoomState());
        cropper.fit(); await Promise.resolve();
        expect(cropper.scale()).toBe(0.5);
        unsubscribe(); cropper.scale(1.5); await Promise.resolve();
        expect(updates).toHaveBeenCalledTimes(3);
        cropper.finalizeCrop(); load();
        expect(container.querySelector('.mo-cropper')).toBeNull();
    });
    it('supports startEdit/finishEdit with externally owned controls', () => {
        cropper.updateOptions({ editable: false, editTrigger: 'none' }); load();
        const root = container.querySelector('.mo-cropper');
        cropper.startEdit();
        expect(root.classList.contains('mosaico-cropper--view-mode')).toBe(false);
        cropper.finishEdit();
        expect(root.classList.contains('mosaico-cropper--view-mode')).toBe(true);
        expect(root.querySelector('button, input')).toBeNull();
    });
    it('isolates snapshots and clears subscriptions on destroy and reinitialize', async () => {
        cropper.onZoomChange(state => { state.scale = 99; });
        const listener = vi.fn(); cropper.onZoomChange(listener);
        cropper.scale(1); await Promise.resolve();
        expect(listener).toHaveBeenLastCalledWith({ scale: 1, minScale: 0.5, maxScale: 2 });
        cropper.scale(1.5); cropper.updateOptions({ maxScale: 3 }); load();
        await Promise.resolve();
        expect(listener).toHaveBeenCalledOnce();
        cropper.onZoomChange(listener); cropper.scale(2); cropper.destroy();
        await Promise.resolve();
        expect(listener).toHaveBeenCalledOnce();
    });
});
