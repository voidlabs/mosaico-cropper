import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mosaicoCropper } from '../src/js/MosaicoCropper.ts';
import { 
    createMockElement, 
    createMockCropModel, 
    setupImagePreloaderMock,
    setupCreateElementFromTemplateMock,
    createTestOptions
} from './utils/testHelpers.js';

// Mock all dependencies
vi.mock('../src/js/utils/UrlHandler.ts');
vi.mock('../src/js/CropModel.ts');
vi.mock('../src/js/utils/ImagePreloader.ts');
vi.mock('../src/js/utils/MovingClassManager.ts');
vi.mock('../src/js/components/CropperSlider.ts');
vi.mock('../src/js/components/CropperDraggable.ts');
vi.mock('../src/js/components/CropperResizer.ts');
vi.mock('../src/js/templates/CropperTemplate.ts');

import { urlAdapterFromSrc, urlAdapterToSrc } from '../src/js/utils/UrlHandler.ts';
import { CropModel } from '../src/js/CropModel.ts';
import { ImagePreloader } from '../src/js/utils/ImagePreloader.ts';
import { createElementFromTemplate } from '../src/js/templates/CropperTemplate.ts';

describe('MosaicoCropper Core Logic', () => {
    let imgEl, widget, cropModelInstance;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        vi.clearAllMocks();

        // Set up mock helpers
        setupCreateElementFromTemplateMock(createElementFromTemplate);
        setupImagePreloaderMock(ImagePreloader);
        
        urlAdapterFromSrc.mockReturnValue({ urlOriginal: 'http://example.com/image.jpg' });
        urlAdapterToSrc.mockReturnValue('http://example.com/processed.jpg');

        cropModelInstance = createMockCropModel();
        CropModel.mockImplementation(function MockCropModel() { return cropModelInstance; });

        // Setup DOM and base mocks
        document.body.innerHTML = '<div><img id="test-image" src="about:blank" width="400" height="300" /></div>';
        imgEl = document.getElementById('test-image');
        
        // Spy on classList methods for the image element
        vi.spyOn(imgEl.classList, 'add');
        vi.spyOn(imgEl.classList, 'remove');
        vi.spyOn(imgEl.classList, 'contains');
        vi.spyOn(imgEl.classList, 'toggle');
        
        widget = { _trigger: vi.fn(), destroy: vi.fn() };
    });

    it('should initialize correctly and return API', () => {
        // Mock parent node for imgEl
        const mockParent = createMockElement();
        mockParent.appendChild(imgEl);
        
        const api = mosaicoCropper(imgEl, createTestOptions(), widget);

        // Verify native DOM operations
        expect(mockParent.insertBefore).toHaveBeenCalled();
        expect(CropModel).toHaveBeenCalledOnce();
        expect(cropModelInstance.initializeSizes).toHaveBeenCalledOnce();
        expect(widget._trigger).toHaveBeenCalledWith('cropperready');
        expect(api).toHaveProperty('dispose');
    });

    it('should handle image preload failure', () => {
        vi.useFakeTimers();
        ImagePreloader.preload.mockImplementation((url, onSuccess, onError) => onError());
        // Mock parent node for imgEl
        const mockParent = createMockElement();
        mockParent.appendChild(imgEl);
        
        mosaicoCropper(imgEl, createTestOptions(), widget);
        vi.runAllTimers();
        expect(widget.destroy).toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('should handle options.imgLoadingClass', () => {
        const options = { ...createTestOptions(), imgLoadingClass: 'custom-loading' };
        // Mock parent node for imgEl
        const mockParent = createMockElement();
        mockParent.appendChild(imgEl);
        
        mosaicoCropper(imgEl, options, widget);
        expect(imgEl.classList.add).toHaveBeenCalledWith('custom-loading');
    });

    it('should handle options.containerSelector', () => {
        // Mock document.querySelector to return a mock container element
        const mockContainer = createMockElement();
        const originalQuerySelector = document.querySelector;
        document.querySelector = vi.fn().mockImplementation(selector => {
            if (selector === '.container') return mockContainer;
            return originalQuerySelector.call(document, selector);
        });
        
        // Mock parent node for imgEl
        const mockParent = createMockElement();
        mockParent.appendChild(imgEl);
        
        const options = { ...createTestOptions(), containerSelector: '.container' };
        const api = mosaicoCropper(imgEl, options, widget);
        
        expect(mockContainer.classList.add).toHaveBeenCalledWith('cropper-cropping');
        api.dispose();
        expect(mockContainer.classList.remove).toHaveBeenCalledWith('cropper-cropping');
        
        // Restore original querySelector
        document.querySelector = originalQuerySelector;
    });

    it('should handle aspect ratio warning', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        imgEl.width = 100;
        imgEl.height = 200; // Different aspect ratio to trigger warning
        const mockParent = createMockElement();
        mockParent.appendChild(imgEl);
        const options = { ...createTestOptions(), height: 300 }; // width=400, height=300
        mosaicoCropper(imgEl, options, widget);
        expect(consoleSpy).toHaveBeenCalledWith(
            "Unexpected aspect ratio: ", 400, 300, 100, 200, 4, 1.5
        );
        consoleSpy.mockRestore();
    });

    it('should handle URL normalization', () => {
        urlAdapterFromSrc.mockReturnValue({ urlOriginal: 'test.com/img.png' });
        // Mock parent node for imgEl
        const mockParent = createMockElement();
        mockParent.appendChild(imgEl);
        
        mosaicoCropper(imgEl, createTestOptions(), widget);
        expect(ImagePreloader.preload).toHaveBeenCalledWith('http://test.com/img.png', expect.any(Function), expect.any(Function));
    });

    it('should setup and respond to tool clicks', () => {
        const mockParent = createMockElement();
        mockParent.appendChild(imgEl);
        
        // Mock the root element's querySelector to return tool elements
        const mockToolCrop = createMockElement();
        const mockToolZoom = createMockElement();
        
        // Override the mocked createElementFromTemplate to return our custom root
        vi.mocked(createElementFromTemplate).mockImplementation(() => {
            const mockRoot = createMockElement();
            // Override querySelector to return our mock elements
            mockRoot.querySelector.mockImplementation(selector => {
                if (selector === '.tool-crop') return mockToolCrop;
                if (selector === '.tool-zoom') return mockToolZoom;
                if (selector === '.cropper-zoom-slider') return createMockElement();
                if (selector === '.clipped') return createMockElement();
                if (selector === '.cropper-frame') return createMockElement();
                if (selector === '.outer-image-container') return createMockElement();
                if (selector === '.original-src') return createMockElement();
                return createMockElement();
            });
            
            // Override querySelectorAll for original-src elements
            mockRoot.querySelectorAll.mockImplementation(selector => {
                if (selector === '.original-src') return [createMockElement()];
                return [];
            });
            
            return mockRoot;
        });
        
        mosaicoCropper(imgEl, createTestOptions(), widget);

        // Verify that event listeners were added to the tools
        expect(mockToolZoom.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        expect(mockToolCrop.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        
        // Test zoom click handler
        const zoomClickHandler = mockToolZoom.addEventListener.mock.calls[0][1];
        zoomClickHandler();
        expect(cropModelInstance.updateSmartAutoResize).toHaveBeenCalled();
        
        // Test crop click handler  
        const cropClickHandler = mockToolCrop.addEventListener.mock.calls[0][1];
        cropClickHandler();
        expect(urlAdapterToSrc).toHaveBeenCalled();
    });

    describe('API Methods', () => {
        let api;

        beforeEach(() => {
            // Mock parent node for imgEl
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            api = mosaicoCropper(imgEl, createTestOptions(), widget);
        });

        it('should expose getScale method', () => {
            cropModelInstance.getScale.mockReturnValue(1.5);
            expect(api.getScale()).toBe(1.5);
            expect(cropModelInstance.getScale).toHaveBeenCalled();
        });

        it('should expose updateScale method', () => {
            api.updateScale(2.0, 100, 150);
            expect(cropModelInstance.updateScale).toHaveBeenCalledWith(2.0, 100, 150);
        });

        it('should expose getCropHeight method', () => {
            cropModelInstance.getCropHeight.mockReturnValue(200);
            expect(api.getCropHeight()).toBe(200);
            expect(cropModelInstance.getCropHeight).toHaveBeenCalled();
        });

        it('should expose updateCropHeight method', () => {
            api.updateCropHeight(300);
            expect(cropModelInstance.updateCropHeight).toHaveBeenCalledWith(300);
        });

        it('should expose dispose method', () => {
            expect(api.dispose).toBeDefined();
            expect(typeof api.dispose).toBe('function');
        });
    });

    describe('Event Registration', () => {
        it('should register event handlers on cropModel', () => {
            // Mock parent node for imgEl
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            mosaicoCropper(imgEl, createTestOptions(), widget);
            
            expect(cropModelInstance.on).toHaveBeenCalledWith('scaleChanged', expect.any(Function));
            expect(cropModelInstance.on).toHaveBeenCalledWith('containerPositionChanged', expect.any(Function));
            expect(cropModelInstance.on).toHaveBeenCalledWith('cropSizeChanged', expect.any(Function));
            expect(cropModelInstance.on).toHaveBeenCalledWith('minScaleChanged', expect.any(Function));
            expect(cropModelInstance.on).toHaveBeenCalledWith('modelUpdated', expect.any(Function));
        });
    });

    describe('Dispose functionality', () => {
        it('should handle dispose with callback', () => {
            const options = { ...createTestOptions(), imgLoadingClass: 'loading-class' };
            
            // Mock parent nodes
            const mockParent = createMockElement();
            const mockRootParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            const api = mosaicoCropper(imgEl, options, widget);
            
            // Mock the root element's parent for removal
            const rootEl = api.dispose.__rootEl || createMockElement(); // We'll need to get this properly
            Object.defineProperty(rootEl, 'parentNode', { 
                value: mockRootParent, 
                writable: true, 
                configurable: true 
            });
            vi.spyOn(mockRootParent, 'removeChild');
            
            api.dispose();
            
            expect(imgEl.classList.remove).toHaveBeenCalledWith('loading-class');
            expect(widget.destroy).toHaveBeenCalled();
        });

        it('should handle container cleanup on dispose', () => {
            // Mock document.querySelector for container
            const mockContainer = createMockElement();
            const originalQuerySelector = document.querySelector;
            document.querySelector = vi.fn().mockImplementation(selector => {
                if (selector === '.container') return mockContainer;
                return originalQuerySelector.call(document, selector);
            });
            
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            const options = { ...createTestOptions(), containerSelector: '.container' };
            const api = mosaicoCropper(imgEl, options, widget);
            
            api.dispose();
            
            expect(mockContainer.classList.remove).toHaveBeenCalledWith('cropper-cropping');
            
            // Restore original querySelector
            document.querySelector = originalQuerySelector;
        });

        it('should handle dispose without callback', () => {
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            const api = mosaicoCropper(imgEl, createTestOptions(), widget);
            
            // Call dispose - the function internally handles cleanup
            api.dispose();
            
            // Verify that dispose was called (widget.destroy should be called)
            expect(widget.destroy).toHaveBeenCalled();
        });
    });

    describe('Edge Cases and Utility Functions', () => {
        it('should setup focusout handler', () => {
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            // Mock the created rootEl to track addEventListener calls
            const mockRoot = createMockElement();
            vi.mocked(createElementFromTemplate).mockImplementation(() => mockRoot);
            
            mosaicoCropper(imgEl, createTestOptions(), widget);
            expect(mockRoot.addEventListener).toHaveBeenCalledWith('focusout', expect.any(Function));
        });

        it('should handle URL without protocol', () => {
            urlAdapterFromSrc.mockReturnValue({ urlOriginal: 'example.com/image.jpg' });
            
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            mosaicoCropper(imgEl, createTestOptions(), widget);
            
            expect(ImagePreloader.preload).toHaveBeenCalledWith('http://example.com/image.jpg', expect.any(Function), expect.any(Function));
        });

        it('should handle URL with https protocol', () => {
            urlAdapterFromSrc.mockReturnValue({ urlOriginal: 'https://example.com/image.jpg' });
            
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            mosaicoCropper(imgEl, createTestOptions(), widget);
            
            expect(ImagePreloader.preload).toHaveBeenCalledWith('https://example.com/image.jpg', expect.any(Function), expect.any(Function));
        });

        it('should initialize cropModel with correct parameters', () => {
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            mosaicoCropper(imgEl, createTestOptions(), widget);
            
            expect(CropModel).toHaveBeenCalledWith(
                expect.objectContaining(createTestOptions()),
                expect.objectContaining({
                    width: 800,
                    height: 600
                })
            );
            expect(cropModelInstance.initializeSizes).toHaveBeenCalled();
        });

        it('should handle original src attribute setting', () => {
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            const mockOriginalSrcEl = createMockElement();
            
            // Mock the root element's querySelectorAll to return original-src elements
            vi.mocked(createElementFromTemplate).mockImplementation(() => {
                const mockRoot = createMockElement();
                mockRoot.querySelectorAll.mockImplementation(selector => {
                    if (selector === '.original-src') return [mockOriginalSrcEl];
                    return [];
                });
                return mockRoot;
            });

            mosaicoCropper(imgEl, createTestOptions(), widget);

            expect(mockOriginalSrcEl.setAttribute).toHaveBeenCalledWith('src', 'http://example.com/image.jpg');
        });
    });

    describe('Component Setup', () => {
        it('should setup DOM elements correctly', () => {
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            // Mock the root element to track querySelector calls
            const mockRoot = createMockElement();
            vi.mocked(createElementFromTemplate).mockImplementation(() => mockRoot);

            mosaicoCropper(imgEl, createTestOptions(), widget);

            expect(mockRoot.querySelector).toHaveBeenCalledWith('.cropper-zoom-slider');
            expect(mockRoot.querySelector).toHaveBeenCalledWith('.cropper-frame');
            expect(mockRoot.querySelector).toHaveBeenCalledWith('.tool-crop');
            expect(mockRoot.querySelector).toHaveBeenCalledWith('.tool-zoom');
        });

        it('should handle element removal on cleanup', () => {
            const mockParent = createMockElement();
            mockParent.appendChild(imgEl);
            
            const mockRoot = createMockElement();
            // Spy on mockParent.removeChild since that's where rootEl gets inserted
            vi.spyOn(mockParent, 'removeChild');
            
            vi.mocked(createElementFromTemplate).mockImplementation(() => mockRoot);

            const api = mosaicoCropper(imgEl, createTestOptions(), widget);
            api.dispose();

            // The rootEl should be removed from imgEl.parentNode (mockParent)
            expect(mockParent.removeChild).toHaveBeenCalledWith(mockRoot);
        });

        it('should return null and log an error for invalid element', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const result = mosaicoCropper(null, createTestOptions());
            
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('mosaicoCropper requires a valid HTMLElement as first parameter');
            
            consoleSpy.mockRestore();
        });
    });
});
