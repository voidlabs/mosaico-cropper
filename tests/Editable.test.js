import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mosaicoCropper } from '../src/js/MosaicoCropper.ts';
import { 
    setupImagePreloaderMock,
    createTestContainer,
    cleanupTestContainer,
    createTestOptions
} from './utils/testHelpers.js';

// Mock all dependencies
vi.mock('../src/js/utils/ImagePreloader.ts');

import { ImagePreloader } from '../src/js/utils/ImagePreloader.ts';

describe('Editable Feature', () => {
    let testImage;
    let testContainer;

    beforeEach(() => {
        vi.clearAllMocks();
        setupImagePreloaderMock(ImagePreloader);
        
        testContainer = createTestContainer();
        testImage = testContainer.querySelector('img');
    });

    afterEach(() => {
        cleanupTestContainer(testContainer);
    });

    describe('editable: false (View Mode)', () => {

        it('should initialize in view mode when editable is false', () => {
            const options = createTestOptions({ editable: false });
            const instance = mosaicoCropper(testImage, options);
            const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
            expect(cropperEl.classList.contains('mosaico-cropper--view-mode')).toBe(true);
            instance.dispose();
        });

        describe("editTrigger: 'button' (default)", () => {
            it('should show edit trigger button', () => {
                const options = createTestOptions({ editable: false, editTrigger: 'button' });
                const instance = mosaicoCropper(testImage, options);
                const editTrigger = testImage.parentNode.querySelector('.mosaico-cropper-edit-trigger');
                expect(editTrigger).toBeTruthy();
                instance.dispose();
            });

            it('should switch to edit mode when edit trigger button is clicked', () => {
                const options = createTestOptions({ editable: false, editTrigger: 'button' });
                const instance = mosaicoCropper(testImage, options);
                const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
                const editTrigger = testImage.parentNode.querySelector('.mosaico-cropper-edit-trigger');
                
                editTrigger.click();
                
                expect(cropperEl.classList.contains('mosaico-cropper--view-mode')).toBe(false);
                instance.dispose();
            });

            it('should return to view mode when crop tool is clicked', () => {
                const options = createTestOptions({ editable: false, editTrigger: 'button' });
                const instance = mosaicoCropper(testImage, options);
                const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
                const editTrigger = testImage.parentNode.querySelector('.mosaico-cropper-edit-trigger');
                const toolCrop = testImage.parentNode.querySelector('.tool-crop');
                
                editTrigger.click(); // enter edit mode
                toolCrop.click(); // save and exit edit mode
                
                expect(cropperEl.classList.contains('mosaico-cropper--view-mode')).toBe(true);
                instance.dispose();
            });
        });

        describe("editTrigger: 'click'", () => {
            it('should not show the edit trigger button', () => {
                const options = createTestOptions({ editable: false, editTrigger: 'click' });
                const instance = mosaicoCropper(testImage, options);
                const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
                expect(cropperEl.classList.contains('mosaico-cropper--no-trigger')).toBe(true);
                instance.dispose();
            });

            it('should add trigger-click class', () => {
                const options = createTestOptions({ editable: false, editTrigger: 'click' });
                const instance = mosaicoCropper(testImage, options);
                const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
                expect(cropperEl.classList.contains('mosaico-cropper--trigger-click')).toBe(true);
                instance.dispose();
            });

            it('should switch to edit mode when cropper frame is clicked', () => {
                const options = createTestOptions({ editable: false, editTrigger: 'click' });
                const instance = mosaicoCropper(testImage, options);
                const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
                const cropperFrame = testImage.parentNode.querySelector('.cropper-frame');

                cropperFrame.click();

                expect(cropperEl.classList.contains('mosaico-cropper--view-mode')).toBe(false);
                instance.dispose();
            });
        });

        describe("editTrigger: 'none'", () => {
            it('should not show the edit trigger button', () => {
                const options = createTestOptions({ editable: false, editTrigger: 'none' });
                const instance = mosaicoCropper(testImage, options);
                const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
                expect(cropperEl.classList.contains('mosaico-cropper--no-trigger')).toBe(true);
                instance.dispose();
            });

            it('should not switch to edit mode on click', () => {
                const options = createTestOptions({ editable: false, editTrigger: 'none' });
                const instance = mosaicoCropper(testImage, options);
                const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
                const cropperFrame = testImage.parentNode.querySelector('.cropper-frame');

                cropperFrame.click();

                expect(cropperEl.classList.contains('mosaico-cropper--view-mode')).toBe(true);
                instance.dispose();
            });
        });
    });

    describe('editable: true (Default Mode)', () => {
        it('should initialize in editable mode by default', () => {
            const instance = mosaicoCropper(testImage, createTestOptions());
            const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
            expect(cropperEl.classList.contains('mosaico-cropper--view-mode')).toBe(false);
            instance.dispose();
        });

        it('should not have any trigger-related classes', () => {
            const instance = mosaicoCropper(testImage, createTestOptions({ editable: true }));
            const cropperEl = testImage.parentNode.querySelector('.mo-cropper');
            expect(cropperEl.classList.contains('mosaico-cropper--no-trigger')).toBe(false);
            expect(cropperEl.classList.contains('mosaico-cropper--trigger-click')).toBe(false);
            instance.dispose();
        });
    });
});