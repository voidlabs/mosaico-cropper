import type { CropModel } from '../CropModel.js';
import type { MovingClassManager } from '../utils/MovingClassManager.js';
/**
 * CropperComponent - Base class for all cropper components
 * Extracts common patterns from CropperDraggable, CropperResizer, CropperSlider
 */
export class CropperComponent {
    componentName: string;
    element: HTMLElement | null;
    cropModel: CropModel | null;
    movingClassManager: MovingClassManager | null;
    onChanged: ((reason?: string) => void) | null;
    sliderInput: HTMLInputElement | null = null;
    handleElement: HTMLElement | null = null;
    _eventHandlers: Map<string, EventListener>;
    _documentHandlers: Map<string, EventListener>;
    private trackedHandlers: Array<{ target: EventTarget; type: string; handler: EventListener }> = [];
    constructor(element: HTMLElement, componentName = 'CropperComponent') {
        this.componentName = componentName;
        this.element = null;
        
        // Shared element wrapper logic
        this._initializeElement(element);
        
        // Shared component properties
        this.cropModel = null;
        this.movingClassManager = null;
        this.onChanged = null;
        
        // Event handler maps for cleanup
        this._eventHandlers = new Map();
        this._documentHandlers = new Map();
    }
    
    /**
     * Common element wrapper initialization logic
     * @private
     */
    _initializeElement(element: HTMLElement) {
        if (element instanceof HTMLElement) {
            this.element = element;
        } else {
            throw new Error(`${this.componentName} requires a valid HTMLElement`);
        }
    }
    
    /**
     * Common initialize method setup
     * @param {Object} cropModel - The crop model instance
     * @param {Object} movingClassManager - The moving class manager instance
     * @param {Function} onChanged - Change callback function
     */
    initializeBase(cropModel: CropModel, movingClassManager: MovingClassManager, onChanged: (reason?: string) => void) {
        this.cropModel = cropModel;
        this.movingClassManager = movingClassManager;
        this.onChanged = onChanged;
    }
    
    /**
     * Get event coordinates - extracted from EventCoords.js
     * @param {Event} event - DOM event
     * @returns {Object} Coordinates object with x, y properties
     */
    getEventCoords(input: Event) {
        const event = input as Event & Partial<MouseEvent & TouchEvent> & { originalEvent?: Partial<MouseEvent & TouchEvent> };
        if (event.type?.indexOf('touch') === 0) {
            const touch = event.originalEvent?.touches?.[0] || event.touches?.[0];
            return touch ? { x: touch.clientX, y: touch.clientY } : { x: 0, y: 0 };
        }
        return { 
            x: event.clientX || event.originalEvent?.clientX || 0,
            y: event.clientY || event.originalEvent?.clientY || 0
        };
    }
    
    /**
     * Add event listener and track it for cleanup
     * @param {HTMLElement} element - Element to add listener to
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler
     * @param {boolean} useDocument - Whether to add to document (for global events)
     */
    addEventHandler(element: HTMLElement, eventType: string, handler: EventListener, useDocument = false) {
        const targetElement = useDocument ? document : element;
        
        targetElement.addEventListener(eventType, handler);
        this.trackedHandlers.push({ target: targetElement, type: eventType, handler });
    }
    
    /**
     * Common destroy method - cleanup all event listeners
     */
    destroy() {
        for (const { target, type, handler } of this.trackedHandlers) target.removeEventListener(type, handler);
        this.trackedHandlers = [];
        // Handle the existing event handler pattern used by components
        // Remove element event handlers
        if (this.element && this._eventHandlers.size > 0) {
            for (const [eventType, handler] of this._eventHandlers) {
                // For CropperSlider, events are on sliderInput
                if (this.sliderInput) {
                    this.sliderInput.removeEventListener(eventType, handler);
                } 
                // For CropperResizer, events are on handleElement
                else if (this.handleElement) {
                    this.handleElement.removeEventListener(eventType, handler);
                }
                // For CropperDraggable and others, events are on main element
                else {
                    this.element.removeEventListener(eventType, handler);
                }
            }
            this._eventHandlers.clear();
        }
        
        // Remove document event handlers
        if (this._documentHandlers.size > 0) {
            for (const [eventType, handler] of this._documentHandlers) {
                document.removeEventListener(eventType, handler);
            }
            this._documentHandlers.clear();
        }
        
        // Clean up references
        this.cropModel = null;
        this.movingClassManager = null;
        this.onChanged = null;
        this.element = null;
    }
    
    /**
     * Convert element wrapper to native HTMLElement if needed
     * @param {HTMLElement|Object} elementOrWrapper - Element or wrapper
     * @returns {HTMLElement} Native HTMLElement
     */
    toNativeElement(elementOrWrapper: HTMLElement) {
        return elementOrWrapper;
    }
}
