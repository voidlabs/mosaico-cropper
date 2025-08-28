/**
 * CropperComponent - Base class for all cropper components
 * Extracts common patterns from CropperDraggable, CropperResizer, CropperSlider
 */
export class CropperComponent {
    constructor(element, componentName = 'CropperComponent') {
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
    _initializeElement(element) {
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
    initializeBase(cropModel, movingClassManager, onChanged) {
        this.cropModel = cropModel;
        this.movingClassManager = movingClassManager;
        this.onChanged = onChanged;
    }
    
    /**
     * Get event coordinates - extracted from EventCoords.js
     * @param {Event} event - DOM event
     * @returns {Object} Coordinates object with x, y properties
     */
    getEventCoords(event) {
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
    addEventHandler(element, eventType, handler, useDocument = false) {
        const targetElement = useDocument ? document : element;
        const handlerMap = useDocument ? this._documentHandlers : this._eventHandlers;
        
        targetElement.addEventListener(eventType, handler);
        handlerMap.set(`${eventType}_${element.tagName}_${Date.now()}`, { element: targetElement, eventType, handler });
    }
    
    /**
     * Common destroy method - cleanup all event listeners
     */
    destroy() {
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
    toNativeElement(elementOrWrapper) {
        return elementOrWrapper;
    }
}