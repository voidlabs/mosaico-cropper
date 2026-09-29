import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mosaicoCropper } from '../src/js/MosaicoCropper.js';
import {
    createTestContainer,
    cleanupTestContainer,
    createTestOptions
} from './utils/testHelpers.js';

// For this integration test, we only mock what's necessary, like ImagePreloader.
vi.mock('../src/js/utils/ImagePreloader.js');
import { ImagePreloader } from '../src/js/utils/ImagePreloader.js';
import { setupImagePreloaderMock } from './utils/testHelpers.js';

describe('MosaicoCropper Integration Test', () => {
    let testContainer;
    let testImage;

    beforeEach(() => {
        // Mock the preloader to avoid actual image loading
        setupImagePreloaderMock(ImagePreloader);
        // Create a fresh DOM container for each test
        testContainer = createTestContainer();
        testImage = testContainer.querySelector('img');
    });

    afterEach(() => {
        // Clean up the DOM
        cleanupTestContainer(testContainer);
    });

    it('should initialize correctly and create the cropper DOM structure', () => {
        // Initialize the cropper
        const instance = mosaicoCropper(testImage, createTestOptions());
        expect(instance).not.toBeNull();

        // Check for the presence of key cropper elements
        const cropperEl = testContainer.querySelector('.mo-cropper');
        expect(cropperEl).not.toBeNull();

        const draggable = testContainer.querySelector('.outer-image-container');
        expect(draggable).not.toBeNull();

        const slider = testContainer.querySelector('.cropper-zoom-slider');
        expect(slider).not.toBeNull();

        const cropFrame = testContainer.querySelector('.cropper-frame');
        expect(cropFrame).not.toBeNull();

        const resizeHandle = testContainer.querySelector('.clip-handle');
        expect(resizeHandle).not.toBeNull();

        // Clean up
        instance.dispose();
    });

    it('should expose keyboard-accessible controls with accessible names', () => {
        const instance = mosaicoCropper(testImage, createTestOptions());

        const fitButton = testContainer.querySelector('.tool-zoom');
        const cropButton = testContainer.querySelector('.tool-crop');
        const editButton = testContainer.querySelector('.mosaico-cropper-edit-trigger');
        const zoomSlider = testContainer.querySelector('.vanilla-slider');

        expect(fitButton).toBeInstanceOf(HTMLButtonElement);
        expect(fitButton.getAttribute('aria-label')).toBe('Fit image');
        expect(cropButton).toBeInstanceOf(HTMLButtonElement);
        expect(cropButton.getAttribute('aria-label')).toBe('Apply crop');
        expect(editButton).toBeInstanceOf(HTMLButtonElement);
        expect(editButton.getAttribute('aria-label')).toBe('Edit crop');
        expect(editButton.tabIndex).toBe(0);
        expect(zoomSlider.type).toBe('range');
        expect(zoomSlider.getAttribute('aria-label')).toBe('Zoom level');

        instance.dispose();
    });

    it('should update the model when a drag operation is performed', () => {
        // Use a smaller crop area to ensure dragging is possible
        const instance = mosaicoCropper(testImage, createTestOptions({ width: 200, height: 200 }));
        const draggableEl = testContainer.querySelector('.outer-image-container');

        // Get the initial position from the element's style. It's set during initialization.
        const initialLeft = draggableEl.style.left;
        const initialTop = draggableEl.style.top;

        // Simulate a purely horizontal drag operation
        const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true });
        draggableEl.dispatchEvent(mouseDownEvent);

        const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 220, clientY: 100, bubbles: true });
        document.dispatchEvent(mouseMoveEvent);

        const mouseUpEvent = new MouseEvent('mouseup', {});
        document.dispatchEvent(mouseUpEvent);

        // Get the new position from the element's style
        const newLeft = draggableEl.style.left;
        const newTop = draggableEl.style.top;

        // Assert that only the left style has changed
        expect(newLeft).not.toBe(initialLeft);
        expect(newTop).toBe(initialTop); // Top should not change

        instance.dispose();
    });
});
