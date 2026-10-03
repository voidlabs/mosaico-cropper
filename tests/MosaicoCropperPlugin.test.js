/**
 * Tests for refactored core functionality
 * Tests the MosaicoCropper without jQuery dependency
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mosaicoCropper } from '../src/js/MosaicoCropper.ts';
import { 
    MosaicoCropperPlugin, 
    createMosaicoCropper,
    getMosaicoCropper,
    registerJQueryPlugin
} from '../src/js/MosaicoCropperPlugin.ts';
import { 
    setupImagePreloaderMock,
    createTestContainer,
    cleanupTestContainer,
    createTestOptions
} from './utils/testHelpers.js';

// Mock all dependencies
vi.mock('../src/js/utils/ImagePreloader.ts');

import { ImagePreloader } from '../src/js/utils/ImagePreloader.ts';

describe('Refactored MosaicoCropper Core', () => {
    let testImage;
    let testContainer;

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();

        // Mock ImagePreloader to simulate successful synchronous preload
        setupImagePreloaderMock(ImagePreloader);

        // Create test DOM structure
        testContainer = createTestContainer();
        testImage = testContainer.querySelector('img');
    });

    afterEach(() => {
        cleanupTestContainer(testContainer);
    });

    describe('mosaicoCropper core function', () => {
        it('should create cropper without jQuery', () => {
            const options = createTestOptions();

            // This should work without jQuery being available
            expect(() => {
                const instance = mosaicoCropper(testImage, options);
                if (instance && instance.dispose) {
                    instance.dispose();
                }
            }).not.toThrow();
        });

        it('should handle invalid element gracefully', () => {
            const result = mosaicoCropper(null, {});
            expect(result).toBeNull();
        });
    });

    describe('MosaicoCropperPlugin Class', () => {
        let plugin;

        afterEach(() => {
            if (plugin && plugin.destroy) {
                plugin.destroy();
            }
        });

        it('should create plugin instance', () => {
            plugin = new MosaicoCropperPlugin(testImage, createTestOptions());

            expect(plugin).toBeInstanceOf(MosaicoCropperPlugin);
            expect(plugin.isReady()).toBe(true);
        });

        it('should accept string selector', () => {
            testImage.id = 'test-image';
            
            plugin = new MosaicoCropperPlugin('#test-image', createTestOptions());

            expect(plugin.element).toBe(testImage);
        });

        it('should throw error for invalid element', () => {
            expect(() => {
                new MosaicoCropperPlugin(null);
            }).toThrow('MosaicoCropperPlugin requires a valid HTMLElement');
        });

        it('should have default options', () => {
            plugin = new MosaicoCropperPlugin(testImage);
            const options = plugin.getOptions();
            
            expect(options.autoClose).toBe(true);
            expect(options.shiftWheel).toBe(false);
        });

        it('should merge custom options', () => {
            plugin = new MosaicoCropperPlugin(testImage, {
                autoClose: false,
                customOption: 'test'
            });
            
            const options = plugin.getOptions();
            expect(options.autoClose).toBe(false);
            expect(options.customOption).toBe('test');
            expect(options.shiftWheel).toBe(false); // Default preserved
        });

        it('should support method chaining', () => {
            plugin = new MosaicoCropperPlugin(testImage, {
                width: 400,
                height: 300
            });

            const result = plugin.scale(1.5).cropHeight(250);
            expect(result).toBe(plugin);
        });

        it('should update options and reinitialize', () => {
            plugin = new MosaicoCropperPlugin(testImage, {
                width: 400,
                height: 300
            });

            const initSpy = vi.spyOn(plugin, '_init');
            
            plugin.updateOptions({ width: 500 });
            
            expect(initSpy).toHaveBeenCalled();
            expect(plugin.getOptions().width).toBe(500);
        });

        it('should destroy properly', () => {
            plugin = new MosaicoCropperPlugin(testImage, {
                width: 400,
                height: 300
            });

            expect(plugin.isReady()).toBe(true);
            
            plugin.destroy();
            
            expect(plugin.isReady()).toBe(false);
            expect(plugin.element).toBeNull();
        });

        it('should trigger custom events', () => {
            plugin = new MosaicoCropperPlugin(testImage, {
                width: 400,
                height: 300
            });

            let eventFired = false;
            let eventData = null;

            testImage.addEventListener('mosaicocroppertest', (e) => {
                eventFired = true;
                eventData = e.detail;
            });

            const result = plugin._trigger('test', null, { value: 42 });

            expect(result).toBe(true);
            expect(eventFired).toBe(true);
            expect(eventData.data).toEqual({ value: 42 });
        });

        it('should emit the generated crop before preload and call onCrop', () => {
            const order = [];
            let cropEvent;
            const onCrop = vi.fn((event, data) => {
                order.push('callback');
                expect(event).toBe(cropEvent);
                expect(data).toBe(cropEvent.detail.data);
            });

            plugin = new MosaicoCropperPlugin(testImage, createTestOptions({ onCrop }));
            testImage.addEventListener('mosaicocroppercrop', (event) => {
                cropEvent = event;
                order.push('event');
            });
            ImagePreloader.preload.mockImplementationOnce((url, onSuccess) => {
                order.push('preload');
                onSuccess({ naturalWidth: 800, naturalHeight: 600 }, url);
            });

            testImage.parentNode.querySelector('.tool-crop').click();

            expect(order).toEqual(['event', 'callback', 'preload']);
            expect(cropEvent.detail.data.url).toEqual(expect.any(String));
            expect(cropEvent.detail.data.crop).toEqual(expect.objectContaining({
                width: expect.any(Number),
                height: expect.any(Number)
            }));
            expect(onCrop).toHaveBeenCalledOnce();
        });
    });

    describe('createMosaicoCropper utility', () => {
        it('should create plugin instance', () => {
            const cropper = createMosaicoCropper(testImage, {
                width: 400,
                height: 300
            });

            expect(cropper).toBeInstanceOf(MosaicoCropperPlugin);
            cropper.destroy();
        });

        it('should accept string selector', () => {
            testImage.id = 'create-test';
            
            const cropper = createMosaicoCropper('#create-test', {
                width: 400,
                height: 300
            });

            expect(cropper.element).toBe(testImage);
            cropper.destroy();
        });
    });

    describe('getMosaicoCropper utility', () => {
        it('should retrieve existing instance', () => {
            const cropper = createMosaicoCropper(testImage, {
                width: 400,
                height: 300
            });

            const retrieved = getMosaicoCropper(testImage);
            expect(retrieved).toBe(cropper);

            cropper.destroy();
        });

        it('should return null for non-existent instance', () => {
            const retrieved = getMosaicoCropper(testImage);
            expect(retrieved).toBeNull();
        });
    });

    describe('jQuery Integration', () => {
        let mockJQuery;
        let mockJQueryFn;

        beforeEach(() => {
            mockJQueryFn = {
                mosaicoCropper: null,
                data: vi.fn()
            };
            
            mockJQuery = {
                fn: mockJQueryFn,
                error: vi.fn()
            };
        });

        it('should register jQuery plugin', () => {
            registerJQueryPlugin(mockJQuery);
            
            expect(typeof mockJQueryFn.mosaicoCropper).toBe('function');
        });

        it('should handle invalid jQuery instance', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            registerJQueryPlugin(null);
            registerJQueryPlugin({});
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should simulate jQuery method calls', () => {
            registerJQueryPlugin(mockJQuery);
            
            // Create mock jQuery selection
            const mockSelection = {
                each: vi.fn((callback) => {
                    callback.call(testImage);
                    return mockSelection;
                })
            };

            // Create cropper first
            const cropper = createMosaicoCropper(testImage, {
                width: 400,
                height: 300
            });

            // Test method call
            const scaleSpy = vi.spyOn(cropper, 'scale');
            
            // Simulate jQuery method call
            mockJQueryFn.mosaicoCropper.call(mockSelection, 'scale', 1.5);
            
            // Verify the method was called on the instance
            expect(mockSelection.each).toHaveBeenCalled();

            cropper.destroy();
        });

        describe('jQuery Method Calling', () => {
            it('should call startEdit method via jQuery plugin', () => {
                registerJQueryPlugin(mockJQuery);
                const mockSelection = { each: vi.fn(cb => cb.call(testImage)) };
                const plugin = new MosaicoCropperPlugin(testImage, { editable: false });
                const startEditSpy = vi.spyOn(plugin, 'startEdit');
        
                mockJQueryFn.mosaicoCropper.call(mockSelection, 'startEdit');
        
                expect(startEditSpy).toHaveBeenCalled();
                plugin.destroy();
            });
        
            it('should return an error when calling a method before initialization', () => {
                registerJQueryPlugin(mockJQuery);
                const mockSelection = { each: vi.fn(cb => cb.call(testImage)) };
                
                mockJQueryFn.mosaicoCropper.call(mockSelection, 'startEdit');
        
                expect(mockJQuery.error).toHaveBeenCalledWith("Cannot call method 'startEdit' on mosaicoCropper prior to initialization");
            });
        
            it('should return an error when calling a non-existent method', () => {
                registerJQueryPlugin(mockJQuery);
                const mockSelection = { each: vi.fn(cb => cb.call(testImage)) };
                new MosaicoCropperPlugin(testImage, { editable: false });
        
                mockJQueryFn.mosaicoCropper.call(mockSelection, 'nonExistentMethod');
        
                expect(mockJQuery.error).toHaveBeenCalledWith("Method 'nonExistentMethod' does not exist on mosaicoCropper");
            });
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain API compatibility', () => {
            const cropper = createMosaicoCropper(testImage, {
                width: 400,
                height: 300
            });

            // Test that all expected methods exist
            expect(typeof cropper.scale).toBe('function');
            expect(typeof cropper.cropHeight).toBe('function');
            expect(typeof cropper.destroy).toBe('function');
            expect(typeof cropper.updateOptions).toBe('function');

            // Test method behavior
            expect(typeof cropper.scale()).toBe('number');
            expect(typeof cropper.cropHeight()).toBe('number');
            
            cropper.destroy();
        });

        it('should handle edge cases gracefully', () => {
            const cropper = createMosaicoCropper(testImage, {});

            // Should not throw on invalid operations
            expect(() => cropper.scale(-1)).not.toThrow();
            expect(() => cropper.cropHeight(0)).not.toThrow();
            
            cropper.destroy();
            
            // Should not throw on operations after destroy
            expect(() => cropper.scale()).not.toThrow();
            expect(() => cropper.cropHeight()).not.toThrow();
        });
    });
});

describe('Integration with Existing Components', () => {
    let testImage;
    let testContainer;

    // Define mosaico URL adapter object for integration tests
    const mosaicoUrlAdapter = {
        defaultPrefix: '/img',
        fromSrc: {
            urlPrefix: "(?:https?://[^/]*)?/img",
        },
        toSrc: {
            resize: "{urlPrefix}?method=resize&params={width}&url={encodedUrlOriginal}",
            cover: "{urlPrefix}?method=cover&params={width},{height}&url={encodedUrlOriginal}",
            cropresize: "{urlPrefix}?method=cropresize&params={cropWidth},{cropHeight},{cropX},{cropY},{width},{height}&url={encodedUrlOriginal}",
        }
    };

    beforeEach(() => {
        testContainer = document.createElement('div');
        testContainer.innerHTML = `
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                 width="400" height="300" alt="test image">
        `;
        document.body.appendChild(testContainer);
        testImage = testContainer.querySelector('img');
    });

    afterEach(() => {
        document.body.removeChild(testContainer);
    });

    it('should work with refactored components', () => {
        const cropper = createMosaicoCropper(testImage, {
            width: 400,
            height: 300,
            urlAdapter: mosaicoUrlAdapter
        });

        expect(cropper.isReady()).toBe(true);
        
        // Test component interactions
        expect(() => {
            cropper.scale(1.2);
            cropper.cropHeight(250);
        }).not.toThrow();

        cropper.destroy();
    });
});
