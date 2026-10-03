import type { CropModel } from '../CropModel.js';
import type { MovingClassManager } from '../utils/MovingClassManager.js';
/**
 * CropperComponent - Base class for all cropper components
 * Extracts common patterns from CropperDraggable, CropperResizer, CropperSlider
 */
export declare class CropperComponent {
    componentName: string;
    element: HTMLElement | null;
    cropModel: CropModel | null;
    movingClassManager: MovingClassManager | null;
    onChanged: ((reason?: string) => void) | null;
    sliderInput: HTMLInputElement | null;
    handleElement: HTMLElement | null;
    _eventHandlers: Map<string, EventListener>;
    _documentHandlers: Map<string, EventListener>;
    private trackedHandlers;
    constructor(element: HTMLElement, componentName?: string);
    /**
     * Common element wrapper initialization logic
     * @private
     */
    _initializeElement(element: HTMLElement): void;
    /**
     * Common initialize method setup
     * @param {Object} cropModel - The crop model instance
     * @param {Object} movingClassManager - The moving class manager instance
     * @param {Function} onChanged - Change callback function
     */
    initializeBase(cropModel: CropModel, movingClassManager: MovingClassManager, onChanged: (reason?: string) => void): void;
    /**
     * Get event coordinates - extracted from EventCoords.js
     * @param {Event} event - DOM event
     * @returns {Object} Coordinates object with x, y properties
     */
    getEventCoords(input: Event): {
        x: number;
        y: number;
    };
    /**
     * Add event listener and track it for cleanup
     * @param {HTMLElement} element - Element to add listener to
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler
     * @param {boolean} useDocument - Whether to add to document (for global events)
     */
    addEventHandler(element: HTMLElement, eventType: string, handler: EventListener, useDocument?: boolean): void;
    /**
     * Common destroy method - cleanup all event listeners
     */
    destroy(): void;
    /**
     * Convert element wrapper to native HTMLElement if needed
     * @param {HTMLElement|Object} elementOrWrapper - Element or wrapper
     * @returns {HTMLElement} Native HTMLElement
     */
    toNativeElement(elementOrWrapper: HTMLElement): HTMLElement;
}
