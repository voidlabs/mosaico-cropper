import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CropModel } from '../src/js/CropModel.ts';
import { createTestOptions } from './utils/testHelpers.js';

describe('CropModel', () => {
    let cropModel;
    let mockOptions;
    let mockOriginalImageSize;

    beforeEach(() => {
        mockOptions = createTestOptions({
            maxScale: 2
        });
        mockOriginalImageSize = { width: 800, height: 600 };
        cropModel = new CropModel(mockOptions, mockOriginalImageSize);
    });

    describe('Constructor', () => {
        it('should throw error when originalImageSize is not provided', () => {
            expect(() => {
                new CropModel(mockOptions);
            }).toThrow('CropModel requires originalImageSize parameter');
        });

        it('should setup event handlers when provided', () => {
            const onScaleChanged = vi.fn();
            const onCropSizeChanged = vi.fn();
            
            const model = new CropModel(mockOptions, mockOriginalImageSize);
            model.on('scaleChanged', onScaleChanged);
            model.on('cropSizeChanged', onCropSizeChanged);
            
            // Trigger events to verify handlers are set up
            model.updateScaledImageSize(1.5);
            model.updateCropperFrameSize(200, 300);
            
            expect(onScaleChanged).toHaveBeenCalledWith({
                scale: 1.5,
                scaledSize: { width: 1200, height: 900 }
            });
            expect(onCropSizeChanged).toHaveBeenCalledWith({
                width: 300,
                height: 200
            });
        });
    });

    describe('Event System', () => {
        it('should register and emit events correctly', () => {
            const mockCallback = vi.fn();
            cropModel.on('testEvent', mockCallback);
            
            cropModel.emit('testEvent', { data: 'test' });
            
            expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should support multiple listeners for the same event', () => {
            const mockCallback1 = vi.fn();
            const mockCallback2 = vi.fn();
            
            cropModel.on('testEvent', mockCallback1);
            cropModel.on('testEvent', mockCallback2);
            
            cropModel.emit('testEvent', { data: 'test' });
            
            expect(mockCallback1).toHaveBeenCalledWith({ data: 'test' });
            expect(mockCallback2).toHaveBeenCalledWith({ data: 'test' });
        });
    });

    describe('Getters', () => {
        it('should return correct crop height', () => {
            cropModel.state.crop.height = 200;
            expect(cropModel.getCropHeight()).toBe(200);
        });

        it('should return correct crop width', () => {
            cropModel.state.crop.width = 150;
            expect(cropModel.getCropWidth()).toBe(150);
        });

        it('should return correct scale', () => {
            cropModel.state.scale = 1.5;
            expect(cropModel.getScale()).toBe(1.5);
        });

        it('should return correct min scale', () => {
            cropModel.state.minScale = 0.75;
            expect(cropModel.getMinScale()).toBe(0.75);
        });

        it('should return correct container left position', () => {
            cropModel.state.container.left = -50;
            expect(cropModel.getContainerLeft()).toBe(-50);
        });

        it('should return correct container top position', () => {
            cropModel.state.container.top = -30;
            expect(cropModel.getContainerTop()).toBe(-30);
        });

        it('should return complete container position object', () => {
            cropModel.state.container.left = -100;
            cropModel.state.container.top = -80;
            
            const position = cropModel.getContainerPosition();
            expect(position).toEqual({ left: -100, top: -80 });
            
            // Verify it returns a new object, not a reference to state
            position.left = -200;
            expect(cropModel.state.container.left).toBe(-100);
        });

        it('should return complete crop dimensions object', () => {
            cropModel.state.crop.width = 300;
            cropModel.state.crop.height = 250;
            
            const dimensions = cropModel.getCropDimensions();
            expect(dimensions).toEqual({ width: 300, height: 250 });
            
            // Verify it returns a new object, not a reference to state
            dimensions.width = 400;
            expect(cropModel.state.crop.width).toBe(300);
        });

        it('should return correct max scale from options', () => {
            expect(cropModel.getMaxScale()).toBe(2);
        });

        it('should return crop dimensions as a new object', () => {
            cropModel.state.crop.width = 300;
            cropModel.state.crop.height = 250;
            
            const dimensions1 = cropModel.getCropDimensions();
            const dimensions2 = cropModel.getCropDimensions();
            
            // Should return same values
            expect(dimensions1).toEqual({ width: 300, height: 250 });
            expect(dimensions2).toEqual({ width: 300, height: 250 });
            
            // But should be different object instances
            expect(dimensions1).not.toBe(dimensions2);
        });

        it('should return default max scale when not in options', () => {
            const model = new CropModel({}, { width: 100, height: 100 });
            expect(model.getMaxScale()).toBe(2);
        });

        it('should calculate scaled image size correctly', () => {
            cropModel.state.scale = 0.5;
            const size = cropModel.getScaledImageSize();
            
            expect(size.width).toBe(400); // 800 * 0.5
            expect(size.height).toBe(300); // 600 * 0.5
        });

        it('should calculate scaled image size with custom scale', () => {
            const size = cropModel.getScaledImageSize(2);
            
            expect(size.width).toBe(1600); // 800 * 2
            expect(size.height).toBe(1200); // 600 * 2
        });

        it('should have all getter methods available', () => {
            // Verify all getter methods exist and are functions
            expect(typeof cropModel.getCropHeight).toBe('function');
            expect(typeof cropModel.getCropWidth).toBe('function');
            expect(typeof cropModel.getScale).toBe('function');
            expect(typeof cropModel.getMinScale).toBe('function');
            expect(typeof cropModel.getContainerLeft).toBe('function');
            expect(typeof cropModel.getContainerTop).toBe('function');
            expect(typeof cropModel.getContainerPosition).toBe('function');
            expect(typeof cropModel.getCropDimensions).toBe('function');
            expect(typeof cropModel.getMaxScale).toBe('function');
            expect(typeof cropModel.getScaledImageSize).toBe('function');
        });

        it('should return consistent values on multiple calls', () => {
            // Test that getters return consistent values
            const height1 = cropModel.getCropHeight();
            const height2 = cropModel.getCropHeight();
            expect(height1).toBe(height2);
            
            const position1 = cropModel.getContainerPosition();
            const position2 = cropModel.getContainerPosition();
            expect(position1).toEqual(position2);
            // But they should be different object instances
            expect(position1).not.toBe(position2);
        });
    });

    describe('Utility Functions', () => {
        it('should check range correctly', () => {
            expect(cropModel.checkRange(5, 0, 10)).toBe(5);
            expect(cropModel.checkRange(-1, 0, 10)).toBe(0);
            expect(cropModel.checkRange(15, 0, 10)).toBe(10);
        });
    });

    describe('Model Updates', () => {
        it('should emit scaleChanged event when scale updates', () => {
            const mockCallback = vi.fn();
            cropModel.on('scaleChanged', mockCallback);
            
            cropModel.updateScaledImageSize(1.5);
            
            expect(mockCallback).toHaveBeenCalledWith({
                scale: 1.5,
                scaledSize: { width: 1200, height: 900 }
            });
        });

        it('should not emit event when scale is the same', () => {
            const mockCallback = vi.fn();
            cropModel.on('scaleChanged', mockCallback);
            cropModel.state.scale = 1.5;
            
            const result = cropModel.updateScaledImageSize(1.5);
            
            expect(result).toBe(false);
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should emit cropSizeChanged event when crop size updates', () => {
            const mockCallback = vi.fn();
            cropModel.on('cropSizeChanged', mockCallback);
            
            cropModel.updateCropperFrameSize(250, 350);
            
            expect(mockCallback).toHaveBeenCalledWith({
                width: 350,
                height: 250
            });
        });

        it('should emit containerPositionChanged when position updates', () => {
            const mockCallback = vi.fn();
            cropModel.on('containerPositionChanged', mockCallback);
            cropModel.state.crop = { width: 400, height: 300 };
            cropModel.state.scale = 1;
            
            cropModel.updateCropContainerPanZoom(-50, -30);
            
            expect(mockCallback).toHaveBeenCalledWith({
                left: -50,
                top: -30
            });
        });

        it('should constrain container position within bounds', () => {
            const mockCallback = vi.fn();
            cropModel.on('containerPositionChanged', mockCallback);
            cropModel.state.crop = { width: 400, height: 300 };
            cropModel.state.scale = 1;
            
            // Try to move beyond bounds
            cropModel.updateCropContainerPanZoom(-1000, -1000);
            
            // Should be constrained to valid range
            expect(cropModel.state.container.left).toBe(-400); // crop.width - scaledSize.width = 400 - 800 = -400
            expect(cropModel.state.container.top).toBe(-300);  // crop.height - scaledSize.height = 300 - 600 = -300
        });
        
        it('should not emit event when container position is unchanged', () => {
            const mockCallback = vi.fn();
            cropModel.on('containerPositionChanged', mockCallback);
            cropModel.state.container = { left: -100, top: -50 };
            
            // Try to update with same values
            const result = cropModel.updateCropContainerPanZoom(-100, -50);
            
            expect(result).toBe(false);
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('Scale Updates', () => {
        beforeEach(() => {
            cropModel.state.crop = { width: 400, height: 300 };
            cropModel.state.minScale = 0.5;
            cropModel.state.scale = 1;
            cropModel.state.container = { left: 0, top: 0 };
        });

        it('should update scale within valid range', () => {
            const result = cropModel.updateScale(1.5);
            
            expect(result).toBe(true);
            expect(cropModel.state.scale).toBe(1.5);
        });

        it('should constrain scale to max value', () => {
            cropModel.updateScale(5); // Above maxScale of 2
            
            expect(cropModel.state.scale).toBe(2); // Should be clamped to maxScale
        });

        it('should constrain scale to min value', () => {
            cropModel.updateScale(0.1); // Below minScale of 0.5
            
            expect(cropModel.state.scale).toBe(0.5); // Should be clamped to minScale
        });

        it('should calculate new position based on zoom point', () => {
            const mockCallback = vi.fn();
            cropModel.on('containerPositionChanged', mockCallback);
            
            // Zoom with specific point (center = 0.5, 0.5)
            cropModel.updateScale(2, 0.5, 0.5);
            
            expect(cropModel.state.scale).toBe(2);
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('getCurrentComputedSizes', () => {
        beforeEach(() => {
            cropModel.state = {
                container: { left: -100, top: -50 },
                crop: { width: 400, height: 300 },
                scale: 1,
                minScale: 0.5
            };
        });

        it('should calculate current computed sizes correctly', () => {
            const sizes = cropModel.getCurrentComputedSizes();
            
            expect(sizes).toMatchObject({
                width: 400,
                height: 300,
                _scale: 1,
                cropX: 100,
                cropY: 50,
                cropWidth: 400,
                cropHeight: 300
            });
        });

        it('should determine correct method for different scenarios', () => {
            // Default method is 'cropresize' when resizeWidth is not defined
            let sizes = cropModel.getCurrentComputedSizes();
            expect(sizes.method).toBe('cropresize');

            // Test 'resizecrop' method when resizeWidth is defined
            cropModel.processedOptions.resizeWidth = 400;
            sizes = cropModel.getCurrentComputedSizes();
            expect(sizes.method).toBe('resizecrop');
        });
    });

    describe('initializeSizes', () => {
        it('should initialize with resize mode when only width provided', () => {
            const model = new CropModel({ width: 400 }, { width: 800, height: 600 });
            
            model.initializeSizes();
            
            expect(model.state.scale).toBe(0.5); // 400/800
            expect(model.state.crop.height).toBe(300); // 600 * 0.5
        });

        it('should initialize with cover mode when width and height provided', () => {
            const model = new CropModel({ width: 400, height: 200 }, { width: 800, height: 600 });
            
            model.initializeSizes();
            
            // Should use the larger of width ratio (0.5) or height ratio (0.33)
            expect(model.state.scale).toBe(0.5); // max(400/800, 200/600) = max(0.5, 0.33) = 0.5
        });

        it('should handle ppp (pixels per point) scaling', () => {
            const model = new CropModel({ width: 800, height: 600, ppp: 2 }, { width: 800, height: 600 });
            
            model.initializeSizes();
            
            // ProcessedOptions should be scaled down by ppp factor, original options unchanged
            expect(model.processedOptions.width).toBe(400); // 800/2
            expect(model.processedOptions.height).toBe(300); // 600/2
            // Original options should remain unchanged
            expect(model.options.width).toBe(800);
            expect(model.options.height).toBe(600);
        });
    });

    describe('Complex Update Scenarios', () => {
        beforeEach(() => {
            cropModel.state = {
                container: { left: 0, top: 0 },
                crop: { width: 400, height: 300 },
                scale: 1,
                minScale: 0.5
            };
        });

        it('should handle updateCropHeight correctly', () => {
            const mockCallback = vi.fn();
            cropModel.on('cropSizeChanged', mockCallback);
            
            const result = cropModel.updateCropHeight(350);
            
            expect(result).toBe(true);
            expect(cropModel.state.crop.height).toBe(350);
            expect(mockCallback).toHaveBeenCalled();
        });

        it('should handle updatePanZoomToFitCropContainer', () => {
            cropModel.state.minScale = 0.75;
            
            const result = cropModel.updatePanZoomToFitCropContainer();
            
            expect(result).toBe(true);
            expect(cropModel.state.scale).toBe(0.75);
        });
    });
});