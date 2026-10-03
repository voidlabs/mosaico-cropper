import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBuiltInControls } from '../src/js/ui/BuiltInControls.ts';

describe('Built-in controls use only the public extension contract', () => {
    let root, api, state, listeners, ui;
    beforeEach(() => {
        root = document.createElement('div');
        root.innerHTML = '<div class="clipping-container"></div>';
        document.body.append(root);
        state = { scale: 1, minScale: 0.25, maxScale: 2 };
        listeners = new Set();
        api = {
            fit: vi.fn(), finalizeCrop: vi.fn(), startEdit: vi.fn(), finishEdit: vi.fn(),
            getZoomState: () => ({ ...state }),
            onZoomChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
            scale: vi.fn(value => { state.scale = Math.max(state.minScale, Math.min(state.maxScale, value)); })
        };
    });
    afterEach(() => { ui?.destroy(); root.remove(); });

    it('renders accessible controls and the initial zoom state without a model', () => {
        ui = createBuiltInControls(root, api, {});
        expect(root.querySelectorAll('button')).toHaveLength(3);
        const slider = root.querySelector('input');
        expect(slider.getAttribute('aria-label')).toBe('Zoom level');
        expect(Math.exp(Number(slider.value))).toBeCloseTo(1);
        expect(slider.getAttribute('aria-valuetext')).toBe('100%');
        expect(Math.exp(Number(slider.min))).toBeCloseTo(0.25);
        expect(Math.exp(Number(slider.max))).toBeCloseTo(2);
    });
    it('updates from notifications of scale and both limits', () => {
        ui = createBuiltInControls(root, api, {});
        state = { scale: 1.2, minScale: 0.6, maxScale: 3 };
        for (const listener of listeners) listener(state);
        const slider = root.querySelector('input');
        expect(Math.exp(Number(slider.value))).toBeCloseTo(1.2);
        expect(slider.getAttribute('aria-valuetext')).toBe('120%');
        expect(Math.exp(Number(slider.min))).toBeCloseTo(0.6);
        expect(Math.exp(Number(slider.max))).toBeCloseTo(3);
        expect(api.scale).not.toHaveBeenCalled();
    });
    it('handles native input including keyboard changes without mousedown', () => {
        ui = createBuiltInControls(root, api, {});
        const slider = root.querySelector('input');
        slider.value = String(Math.log(1.5));
        slider.dispatchEvent(new Event('input'));
        expect(api.scale).toHaveBeenCalledWith(1.5);
        expect(Math.exp(Number(slider.value))).toBeCloseTo(state.scale);
    });
    it('delegates fit, confirmation and edit to public commands', () => {
        ui = createBuiltInControls(root, api, {});
        root.querySelector('.tool-zoom').click();
        root.querySelector('.tool-crop').click();
        root.querySelector('.mosaico-cropper-edit-trigger').click();
        expect(api.fit).toHaveBeenCalledOnce();
        expect(api.finalizeCrop).toHaveBeenCalledOnce();
        expect(api.startEdit).toHaveBeenCalledOnce();
    });
    it('preserves temporary edit mode confirmation', () => {
        ui = createBuiltInControls(root, api, { editable: false });
        root.querySelector('.tool-crop').click();
        expect(api.finishEdit).toHaveBeenCalledOnce();
        expect(api.finalizeCrop).not.toHaveBeenCalled();
    });
    it('omits toolbar and zoom subscription when toolbar is false', () => {
        ui = createBuiltInControls(root, api, { toolbar: false });
        expect(root.querySelector('.toolbar')).toBeNull();
        expect(root.querySelector('.mosaico-cropper-edit-trigger')).not.toBeNull();
        expect(listeners.size).toBe(0);
    });
    it('removes subscriptions and handlers, including retained detached controls', () => {
        ui = createBuiltInControls(root, api, {});
        const fit = root.querySelector('.tool-zoom');
        const slider = root.querySelector('input');
        ui.destroy();
        expect(listeners.size).toBe(0);
        expect(root.querySelector('button')).toBeNull();
        fit.click(); slider.dispatchEvent(new Event('input'));
        expect(api.fit).not.toHaveBeenCalled();
        expect(api.scale).not.toHaveBeenCalled();
    });
});
