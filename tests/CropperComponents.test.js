import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CropperSlider } from '../src/js/components/CropperSlider.ts';
import { CropperDraggable } from '../src/js/components/CropperDraggable.ts';
import { CropperResizer } from '../src/js/components/CropperResizer.ts';
import { 
    createMockCropModel, 
    createMockMovingClassManager, 
    createMockWidget,
    createMockElement 
} from './utils/testHelpers.js';

// EventCoords functionality moved to CropperComponent base class
// Local copy for testing
function getEventCoords(event) {
    if (event.type?.indexOf('touch') === 0) {
        const touch = event.originalEvent?.touches?.[0] || event.touches?.[0];
        return touch ? { x: touch.clientX, y: touch.clientY } : { x: 0, y: 0 };
    }
    return { 
        x: event.clientX || event.originalEvent?.clientX || 0,
        y: event.clientY || event.originalEvent?.clientY || 0
    };
}

describe('CropperComponents', () => {
    let mockCropModel, mockRootEl, mockMovingClassManager, mockWidget;
    
    beforeEach(() => {
        mockCropModel = createMockCropModel();
        mockRootEl = { focus: vi.fn() };
        mockMovingClassManager = createMockMovingClassManager();
        mockWidget = createMockWidget();
        
        vi.clearAllMocks();
    });
    
    describe('CropperSlider', () => {
        let slider, mockElement;
        
        beforeEach(() => {
            // Create real DOM element for native component
            mockElement = document.createElement('div');
            mockElement.className = 'cropper-slider';
            document.body.appendChild(mockElement);
            slider = new CropperSlider(mockElement);
        });
        
        afterEach(() => {
            slider?.destroy();
            if (mockElement && mockElement.parentNode) {
                mockElement.parentNode.removeChild(mockElement);
            }
        });
        
        it('should initialize correctly', () => {
            const onChanged = vi.fn();
            slider.initialize(mockCropModel, mockMovingClassManager, onChanged);
            
            expect(mockElement.innerHTML).toContain('input');
            expect(mockElement.innerHTML).toContain('vanilla-slider');
            expect(slider.sliderInput).toBeTruthy();
        });
        
        it('should update from scale', () => {
            slider.initialize(mockCropModel, mockMovingClassManager, vi.fn());
            slider.updateFromScale(1.5);
            
            const expectedValue = Math.round(CropperSlider._fromScaleToSliderValue(1.5));
            expect(parseInt(slider.sliderInput.value)).toBe(expectedValue);
        });
        
        it('should update min scale', () => {
            slider.initialize(mockCropModel, mockMovingClassManager, vi.fn());
            slider.updateMinScale(0.2);
            
            const expectedMin = Math.floor(CropperSlider._fromScaleToSliderValue(0.2));
            expect(parseInt(slider.sliderInput.getAttribute('min'))).toBe(expectedMin);
        });
        
        it('should handle static conversions', () => {
            const scale = 1.0;
            const sliderValue = CropperSlider._fromScaleToSliderValue(scale);
            const convertedScale = CropperSlider._fromSliderValueToScale(sliderValue);
            expect(convertedScale).toBeCloseTo(scale, 3);
        });
        
        it('should cleanup on destroy', () => {
            slider.initialize(mockCropModel, mockMovingClassManager, vi.fn());
            slider.destroy();
            
            expect(mockElement.innerHTML).toBe('');
            expect(slider.sliderInput).toBeNull();
        });

        it('should handle input events during slide and update slider value', () => {
            const onChanged = vi.fn();
            slider.initialize(mockCropModel, mockMovingClassManager, onChanged);
            
            // Simulate mousedown to start sliding
            const mousedownEvent = new Event('mousedown');
            slider.sliderInput.dispatchEvent(mousedownEvent);
            expect(mockMovingClassManager.addMovingClass).toHaveBeenCalledWith('slide');
            
            // Mock the updateScale to return a different scale
            mockCropModel.updateScale.mockImplementation(() => {
                mockCropModel.getScale.mockReturnValue(1.5);
            });
            
            // Simulate input event
            slider.sliderInput.value = '50';
            const inputEvent = new Event('input');
            Object.defineProperty(inputEvent, 'target', { value: slider.sliderInput });
            slider.sliderInput.dispatchEvent(inputEvent);
            
            expect(mockCropModel.updateScale).toHaveBeenCalled();
            expect(onChanged).toHaveBeenCalledWith('slide');
        });

        it('should handle mouseup/touchend to stop sliding', () => {
            const onChanged = vi.fn();
            slider.initialize(mockCropModel, mockMovingClassManager, onChanged);
            
            // Start sliding
            const mousedownEvent = new Event('mousedown');
            slider.sliderInput.dispatchEvent(mousedownEvent);
            
            // Stop sliding
            const mouseupEvent = new Event('mouseup');
            slider.sliderInput.dispatchEvent(mouseupEvent);
            
            expect(mockMovingClassManager.removeMovingClass).toHaveBeenCalled();
        });

        it('should handle keyboard navigation', () => {
            const onChanged = vi.fn();
            slider.initialize(mockCropModel, mockMovingClassManager, onChanged);
            
            // Test left arrow key
            const leftArrowEvent = new KeyboardEvent('keydown', { keyCode: 37 });
            slider.sliderInput.dispatchEvent(leftArrowEvent);
            
            expect(mockMovingClassManager.addMovingClass).toHaveBeenCalledWith('slide');
            
            vi.clearAllMocks();
            
            // Test right arrow key
            const rightArrowEvent = new KeyboardEvent('keydown', { keyCode: 39 });
            slider.sliderInput.dispatchEvent(rightArrowEvent);
            
            expect(mockMovingClassManager.addMovingClass).toHaveBeenCalledWith('slide');
        });

        it('should ignore non-arrow keys', () => {
            const onChanged = vi.fn();
            slider.initialize(mockCropModel, mockMovingClassManager, onChanged);
            
            // Test other key (e.g., space bar)
            const spaceEvent = new KeyboardEvent('keydown', { keyCode: 32 });
            slider.sliderInput.dispatchEvent(spaceEvent);
            
            expect(mockMovingClassManager.addMovingClass).not.toHaveBeenCalled();
        });

        it('should handle propertychange events for IE compatibility', () => {
            const onChanged = vi.fn();
            slider.initialize(mockCropModel, mockMovingClassManager, onChanged);
            
            // Start sliding first
            const mousedownEvent = new Event('mousedown');
            slider.sliderInput.dispatchEvent(mousedownEvent);
            
            // Test propertychange event (IE compatibility)
            slider.sliderInput.value = '60';
            const propertyChangeEvent = new Event('propertychange');
            Object.defineProperty(propertyChangeEvent, 'target', { value: slider.sliderInput });
            Object.defineProperty(propertyChangeEvent, 'originalEvent', { 
                value: { propertyName: 'value' } 
            });
            slider.sliderInput.dispatchEvent(propertyChangeEvent);
            
            expect(mockCropModel.updateScale).toHaveBeenCalled();
            expect(onChanged).toHaveBeenCalledWith('slide');
        });
    });
    
    describe('CropperDraggable', () => {
        let draggable, mockElement;
        
        beforeEach(() => {
            // Create real DOM element for native component
            mockElement = document.createElement('div');
            mockElement.className = 'cropper-draggable';
            document.body.appendChild(mockElement);
            draggable = new CropperDraggable(mockElement, { shiftWheel: true });
        });
        
        afterEach(() => {
            draggable?.destroy();
            if (mockElement && mockElement.parentNode) {
                mockElement.parentNode.removeChild(mockElement);
            }
        });
        
        it('should initialize correctly', () => {
            const onChanged = vi.fn();
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            // Check if component initialized properly
            expect(draggable.cropModel).toBe(mockCropModel);
            expect(draggable.rootEl).toBe(mockRootEl);
            expect(draggable.movingClassManager).toBe(mockMovingClassManager);
            expect(draggable.onChanged).toBe(onChanged);
        });
        
        it('should handle options correctly', () => {
            expect(draggable.shiftWheel).toBe(true);
        });
        
        it('should cleanup on destroy', () => {
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, vi.fn());
            draggable.destroy();
            
            expect(draggable.hasDragged).toBe(false);
            expect(draggable.cropModel).toBeNull();
            expect(draggable.rootEl).toBeNull();
        });

        it('should handle mouse drag sequence and track drag state', () => {
            vi.useFakeTimers();
            
            const onChanged = vi.fn();
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            // Initially hasDragged should be false
            expect(draggable.hasDragged).toBe(false);
            
            // Simulate mousedown
            const mousedownEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 50 });
            mockElement.dispatchEvent(mousedownEvent);
            
            expect(mockCropModel.getContainerLeft).toHaveBeenCalled();
            expect(mockCropModel.getContainerTop).toHaveBeenCalled();
            expect(mockRootEl.focus).toHaveBeenCalled();
            expect(mockMovingClassManager.addMovingClass).toHaveBeenCalledWith('drag');
            
            // Simulate mousemove (significant movement)
            const mousemoveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 80 });
            document.dispatchEvent(mousemoveEvent);
            
            expect(mockCropModel.updateCropContainerPanZoom).toHaveBeenCalled();
            expect(onChanged).toHaveBeenCalledWith('dragging');
            // After significant movement, hasDragged should be true
            expect(draggable.hasDragged).toBe(true);
            
            // Simulate mouseup
            const mouseupEvent = new MouseEvent('mouseup', { clientX: 150, clientY: 80 });
            document.dispatchEvent(mouseupEvent);
            
            expect(onChanged).toHaveBeenCalledWith('dragged');
            expect(mockMovingClassManager.removeMovingClass).toHaveBeenCalled();
            
            // Advance timers to trigger the setTimeout that resets hasDragged
            vi.advanceTimersByTime(100);
            expect(draggable.hasDragged).toBe(false);
            
            vi.useRealTimers();
        });

        it('should handle wheel zoom event', () => {
            const onChanged = vi.fn();
            
            // Create draggable WITHOUT shiftWheel requirement
            draggable.destroy();
            if (mockElement.parentNode) {
                mockElement.parentNode.removeChild(mockElement);
            }
            mockElement = document.createElement('div');
            document.body.appendChild(mockElement);
            draggable = new CropperDraggable(mockElement, { shiftWheel: false });
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            // Test wheel zoom in
            const wheelEvent = new WheelEvent('wheel', { 
                deltaY: -100, 
                offsetX: 200, 
                offsetY: 150 
            });
            mockElement.dispatchEvent(wheelEvent);
            
            expect(mockRootEl.focus).toHaveBeenCalled();
            expect(mockMovingClassManager.addMovingClass).toHaveBeenCalledWith('wheel');
            expect(mockMovingClassManager.setAutoRemoveTimeout).toHaveBeenCalledWith(500);
            expect(mockCropModel.getScaledImageSize).toHaveBeenCalled();
            expect(mockCropModel.updateScale).toHaveBeenCalled();
            expect(onChanged).toHaveBeenCalledWith('wheel');
        });

        it('should respect shiftWheel option', () => {
            const onChanged = vi.fn();
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            // Test wheel without shift key when shiftWheel is true
            const wheelEventNoShift = new WheelEvent('wheel', { 
                deltaY: -100, 
                offsetX: 200, 
                offsetY: 150,
                shiftKey: false 
            });
            mockElement.dispatchEvent(wheelEventNoShift);
            
            // Should not handle because shiftWheel is true but no shift pressed
            expect(mockCropModel.updateScale).not.toHaveBeenCalled();
        });

        it('should handle dblclick for smart auto-resize', () => {
            const onChanged = vi.fn();
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            const dblClickEvent = new MouseEvent('dblclick');
            mockElement.dispatchEvent(dblClickEvent);
            
            expect(mockCropModel.updateSmartAutoResize).toHaveBeenCalled();
        });

        it('should handle click without drag', () => {
            const onChanged = vi.fn();
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            // Click without drag (hasDragged should be false)
            draggable.hasDragged = false;
            const clickEvent = new MouseEvent('click');
            mockElement.dispatchEvent(clickEvent);
            
            expect(mockRootEl.focus).toHaveBeenCalled();
            expect(mockMovingClassManager.toggleMovingClass).toHaveBeenCalledWith('click');
        });

        it('should ignore click after drag', () => {
            const onChanged = vi.fn();
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            // Click after drag (hasDragged should be true)
            draggable.hasDragged = true;
            const clickEvent = new MouseEvent('click');
            mockElement.dispatchEvent(clickEvent);
            
            expect(mockMovingClassManager.toggleMovingClass).not.toHaveBeenCalled();
        });

        it('should handle wheel zoom with shift key when shiftWheel is enabled', () => {
            const onChanged = vi.fn();
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            // Test wheel WITH shift key when shiftWheel is true
            const wheelEventWithShift = new WheelEvent('wheel', { 
                deltaY: -100, 
                offsetX: 200, 
                offsetY: 150,
                shiftKey: true 
            });
            mockElement.dispatchEvent(wheelEventWithShift);
            
            expect(mockCropModel.updateScale).toHaveBeenCalled();
        });

        it('should handle wheel zoom out', () => {
            const onChanged = vi.fn();
            
            // Create draggable WITHOUT shiftWheel requirement
            draggable.destroy();
            if (mockElement.parentNode) {
                mockElement.parentNode.removeChild(mockElement);
            }
            mockElement = document.createElement('div');
            document.body.appendChild(mockElement);
            draggable = new CropperDraggable(mockElement, { shiftWheel: false });
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            // Test wheel zoom out (positive delta)
            const wheelEvent = new WheelEvent('wheel', { 
                deltaY: 100, 
                offsetX: 200, 
                offsetY: 150 
            });
            mockElement.dispatchEvent(wheelEvent);
            
            expect(mockCropModel.updateScale).toHaveBeenCalled();
        });

        it('should handle wheel event with zero delta', () => {
            const onChanged = vi.fn();
            
            draggable.destroy();
            if (mockElement.parentNode) {
                mockElement.parentNode.removeChild(mockElement);
            }
            mockElement = document.createElement('div');
            document.body.appendChild(mockElement);
            draggable = new CropperDraggable(mockElement, { shiftWheel: false });
            draggable.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            // Test wheel with zero delta
            const wheelEvent = new WheelEvent('wheel', { 
                deltaY: 0, 
                offsetX: 200, 
                offsetY: 150 
            });
            mockElement.dispatchEvent(wheelEvent);
            
            expect(mockCropModel.updateScale).not.toHaveBeenCalled();
            expect(mockMovingClassManager.addMovingClass).not.toHaveBeenCalledWith('wheel');
        });




    });
    
    describe('CropperResizer', () => {
        let resizer, mockElement;
        
        beforeEach(() => {
            // Create real DOM element for native component
            mockElement = document.createElement('div');
            mockElement.className = 'cropper-frame';
            mockElement.style.height = '200px';
            document.body.appendChild(mockElement);
            resizer = new CropperResizer(mockElement);
        });
        
        afterEach(() => {
            resizer?.destroy();
            if (mockElement && mockElement.parentNode) {
                mockElement.parentNode.removeChild(mockElement);
            }
        });
        
        it('should initialize correctly', () => {
            const onChanged = vi.fn();
            resizer.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged, mockWidget);
            
            expect(resizer.handleElement).toBeTruthy();
            expect(resizer.handleElement.className).toContain('clip-handle');
            expect(mockElement.contains(resizer.handleElement)).toBe(true);
        });
        
        it('should cleanup on destroy', () => {
            resizer.initialize(mockCropModel, mockRootEl, mockMovingClassManager, vi.fn());
            resizer.destroy();
            
            expect(resizer.handleElement).toBe(null);
            expect(resizer.cropModel).toBe(null);
            expect(resizer.rootEl).toBe(null);
        });

        it('should handle basic resize initialization', () => {
            const onChanged = vi.fn();
            resizer.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged, mockWidget);
            
            // Simulate mousedown on handle
            const mousedownEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 200 });
            resizer.handleElement.dispatchEvent(mousedownEvent);
            
            expect(mockRootEl.focus).toHaveBeenCalled();
            expect(mockMovingClassManager.addMovingClass).toHaveBeenCalledWith('handle');
            expect(mockCropModel.getContainerTop).toHaveBeenCalled();
            expect(mockCropModel.getCurrentComputedMethod).toHaveBeenCalled();
            expect(mockCropModel.getScaledImageSize).toHaveBeenCalled();
        });

        it('should handle dblclick for auto-resize', () => {
            const onChanged = vi.fn();
            resizer.initialize(mockCropModel, mockRootEl, mockMovingClassManager, onChanged);
            
            const dblclickEvent = new MouseEvent('dblclick');
            resizer.handleElement.dispatchEvent(dblclickEvent);
            
            expect(mockCropModel.updateCropHeight).toHaveBeenCalledWith(mockCropModel.getScaledImageSize().height);
            expect(onChanged).toHaveBeenCalledWith('resized');
        });






    });

    describe('EventCoords', () => {
        it('should extract coordinates from mouse events', () => {
            const mouseEvent = {
                clientX: 150,
                clientY: 200,
                type: 'mousedown'
            };
            
            const coords = getEventCoords(mouseEvent);
            expect(coords).toEqual({ x: 150, y: 200 });
        });

        it('should extract coordinates from touch events', () => {
            const touchEvent = {
                touches: [{ clientX: 100, clientY: 150 }],
                type: 'touchstart'
            };
            
            const coords = getEventCoords(touchEvent);
            expect(coords).toEqual({ x: 100, y: 150 });
        });

        it('should handle touch events with multiple touches', () => {
            const touchEvent = {
                touches: [
                    { clientX: 100, clientY: 150 },
                    { clientX: 200, clientY: 250 }
                ],
                type: 'touchmove'
            };
            
            // Should return first touch coordinates
            const coords = getEventCoords(touchEvent);
            expect(coords).toEqual({ x: 100, y: 150 });
        });

        it('should handle empty touch events', () => {
            const touchEvent = {
                touches: [],
                type: 'touchend'
            };
            
            const coords = getEventCoords(touchEvent);
            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('should extract coordinates from originalEvent for mouse events', () => {
            const mouseEvent = {
                originalEvent: {
                    clientX: 300,
                    clientY: 400
                },
                type: 'mousedown'
            };
            
            const coords = getEventCoords(mouseEvent);
            expect(coords).toEqual({ x: 300, y: 400 });
        });

        it('should prioritize direct properties over originalEvent for mouse events', () => {
            const mouseEvent = {
                clientX: 150,
                clientY: 200,
                originalEvent: {
                    clientX: 300,
                    clientY: 400
                },
                type: 'mousedown'
            };
            
            const coords = getEventCoords(mouseEvent);
            expect(coords).toEqual({ x: 150, y: 200 });
        });

        it('should extract coordinates from originalEvent.touches for touch events', () => {
            const touchEvent = {
                originalEvent: {
                    touches: [{ clientX: 250, clientY: 350 }]
                },
                type: 'touchstart'
            };
            
            const coords = getEventCoords(touchEvent);
            expect(coords).toEqual({ x: 250, y: 350 });
        });

        it('should prioritize originalEvent.touches over touches for touch events', () => {
            const touchEvent = {
                touches: [{ clientX: 100, clientY: 150 }],
                originalEvent: {
                    touches: [{ clientX: 250, clientY: 350 }]
                },
                type: 'touchstart'
            };
            
            const coords = getEventCoords(touchEvent);
            expect(coords).toEqual({ x: 250, y: 350 });
        });

        it('should handle mouse events without clientX/clientY', () => {
            const mouseEvent = {
                type: 'mousedown'
                // no clientX/clientY properties
            };
            
            const coords = getEventCoords(mouseEvent);
            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('should handle events without type property', () => {
            const event = {
                clientX: 150,
                clientY: 200
                // no type property
            };
            
            const coords = getEventCoords(event);
            expect(coords).toEqual({ x: 150, y: 200 });
        });

        it('should handle touch events with null touches arrays', () => {
            const touchEvent = {
                touches: null,
                originalEvent: {
                    touches: null
                },
                type: 'touchstart'
            };
            
            const coords = getEventCoords(touchEvent);
            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('should handle touch events where originalEvent is null', () => {
            const touchEvent = {
                originalEvent: null,
                type: 'touchstart'
            };
            
            const coords = getEventCoords(touchEvent);
            expect(coords).toEqual({ x: 0, y: 0 });
        });
    });
});