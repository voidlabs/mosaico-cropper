import type { CropperOptions, CropperInstance, CropperEventMap, CropperEvent, CropperCallback } from '../../types.js';
/**
 * MosaicoCropperPlugin - Native plugin system to replace jQuery UI Widget
 * 
 * This module provides a native JavaScript plugin system that doesn't require jQuery
 * but can optionally integrate with it for backward compatibility.
 */

import { mosaicoCropper } from './MosaicoCropper.js';
import { elementDataStore } from '../utils/MinimalDomUtils.js';

/**
 * Native MosaicoCropper Plugin Class
 * Replaces jQuery UI Widget Factory pattern with modern ES6 class
 */
export class MosaicoCropperPlugin {
    element: HTMLImageElement | null;
    options: CropperOptions | null;
    instance: CropperInstance | null;
    isInitialized: boolean;
    constructor(element: HTMLImageElement | string, options: CropperOptions = {}) {
        // Ensure we have a native HTMLElement
        if (typeof element === 'string') {
            element = document.querySelector<HTMLImageElement>(element)!;
        }
        
        if (!(element instanceof HTMLElement)) {
            throw new Error('MosaicoCropperPlugin requires a valid HTMLElement');
        }
        
        this.element = element;
        this.options = Object.assign({
            autoClose: true,
            toolbar: false,
            shiftWheel: false
        }, options);
        
        // Store reference on element for later retrieval
        elementDataStore.set(this.element, 'mosaicoCropperPlugin', this);
        
        this.instance = null;
        this.isInitialized = false;
        
        this._init();
    }
    
    /**
     * Initialize the cropper instance
     * @private
     */
    _init() {
        if (this.instance) {
            this.instance.dispose(true);
        }
        
        // Create cropper instance without jQuery dependency
        this.instance = this._createInstance();
        this.isInitialized = true;
    }
    
    protected _createInstance(): CropperInstance | null {
        return mosaicoCropper(this.element!, this.options!, this);
    }

    /** Subscribe without DOM listeners; returns an unsubscribe function. */
    onZoomChange(listener: (state: import('../../types.js').ZoomState) => void): () => void {
        return this.instance?.onZoomChange(listener) || (() => {});
    }

    /** Return to view mode without finalizing or destroying the cropper. */
    finishEdit(): this {
        this.instance?.finishEdit();
        return this;
    }

    /**
     * Get current scale value
     * @param {number} [value] - Scale value to set
     * @returns {number|MosaicoCropperPlugin} Current scale or this for chaining
     */
    scale(): number;
    scale(value: number): this;
    scale(value?: number): number | this {
        if (!this.instance) return value === undefined ? 1 : this;
        
        if (value === undefined) {
            return this.instance.getScale();
        } else {
            this.instance.scale(value);
            return this;
        }
    }
    
    /** Fit using the same smart cycle as the built-in Fit image button. */
    fit() {
        if (this.instance) this.instance.fit();
        return this;
    }

    /** Independent zoom snapshot; null after destruction, throws while loading. */
    getZoomState() {
        return this.instance ? this.instance.getZoomState() : null;
    }

    /**
     * Get/set crop height
     * @param {number} [value] - Height value to set
     * @returns {number|MosaicoCropperPlugin} Current height or this for chaining
     */
    cropHeight(): number;
    cropHeight(value: number): this;
    cropHeight(value?: number): number | this {
        if (!this.instance) return value === undefined ? 0 : this;
        
        if (value === undefined) {
            return this.instance.getCropHeight();
        } else {
            this.instance.updateCropHeight(value);
            return this;
        }
    }
    
    /**
     * Get current options
     * @returns {Object} Current options object
     */
    getOptions() {
        return Object.assign({}, this.options);
    }
    
    /**
     * Update options and reinitialize if necessary
     * @param {Object} newOptions - New options to merge
     * @returns {MosaicoCropperPlugin} This for chaining
     */
    updateOptions(newOptions: CropperOptions) {
        const hasChanged = (Object.keys(newOptions) as Array<keyof CropperOptions>).some(key => 
            this.options![key] !== newOptions[key]
        );
        
        if (hasChanged) {
            Object.assign(this.options!, newOptions);
            this._init(); // Reinitialize with new options
        }
        
        return this;
    }
    
    /**
     * Finalize crop and dispose the cropper (for view mode)
     * @returns {MosaicoCropperPlugin} This for chaining
     */
    finalizeCrop() {
        if (this.instance && typeof this.instance.finalizeCrop === 'function') {
            this.instance.finalizeCrop();
        }
        return this;
    }

    /**
     * Programmatically starts the editing mode for a non-editable cropper.
     * @returns {MosaicoCropperPlugin} This for chaining
     */
    startEdit() {
        if (this.instance && typeof this.instance.startEdit === 'function') {
            this.instance.startEdit();
        }
        return this;
    }
    
    /**
     * Check if cropper is initialized
     * @returns {boolean} True if initialized
     */
    isReady() {
        return this.isInitialized && this.instance !== null;
    }
    
    /**
     * Destroy the cropper instance
     * @returns {MosaicoCropperPlugin} This for chaining
     */
    destroy() {
        if (this.instance) {
            this.instance.dispose(true);
            this.instance = null;
        }
        
        // Remove from element data storage
        elementDataStore.remove(this.element!, 'mosaicoCropperPlugin');
        
        this.isInitialized = false;
        this.element = null;
        this.options = null;
        
        return this;
    }
    
    /**
     * Emit custom events (replaces jQuery UI Widget's _trigger)
     * @param {string} eventType - Event type name
     * @param {Event} [originalEvent] - Original DOM event if any
     * @param {*} [data] - Event data
     * @returns {boolean} True if event was not cancelled
     */
    _trigger<K extends keyof CropperEventMap>(eventType: K, originalEvent: Event | null = null, data: CropperEventMap[K] = null as CropperEventMap[K]) {
        // Create event name following jQuery UI convention
        const eventName = 'mosaicocropper' + eventType;
        
        let customEvent;
        try {
            // Modern browsers
            customEvent = new CustomEvent(eventName, {
                detail: { 
                    data: data,
                    originalEvent: originalEvent,
                    widget: this
                },
                bubbles: true,
                cancelable: true
            });
        } catch (e) {
            // Fallback for older browsers
            customEvent = document.createEvent('CustomEvent');
            customEvent.initCustomEvent(eventName, true, true, {
                data: data,
                originalEvent: originalEvent,
                widget: this
            });
        }
        
        // Dispatch on element
        const result = this.element!.dispatchEvent(customEvent);
        
        // Also try to call callback function if provided in options
        const callbackName = ('on' + eventType.charAt(0).toUpperCase() + eventType.slice(1)) as keyof CropperOptions;
        const callback = this.options?.[callbackName] as CropperCallback<CropperEventMap[K]> | undefined;
        if (typeof callback === 'function' && this.element) {
            try {
                callback.call(this.element, customEvent as CropperEvent<CropperEventMap[K]>, data);
            } catch (error) {
                console.error('Error in cropper callback:', error);
            }
        }
        
        return result;
    }
}

/**
 * Factory function for creating MosaicoCropper instances
 * Provides a simpler API for one-off usage
 * 
 * @param {HTMLElement|string} element - Target element or selector
 * @param {Object} [options] - Configuration options
 * @returns {MosaicoCropperPlugin} New plugin instance
 */
export function createMosaicoCropper(element: HTMLImageElement | string, options: CropperOptions = {}) {
    return new MosaicoCropperPlugin(element as HTMLImageElement, options);
}

/**
 * Get existing MosaicoCropper instance from element
 * @param {HTMLElement} element - Target element
 * @returns {MosaicoCropperPlugin|null} Existing instance or null
 */
export function getMosaicoCropper(element: HTMLElement) {
    return elementDataStore.get<MosaicoCropperPlugin>(element, 'mosaicoCropperPlugin') || null;
}
