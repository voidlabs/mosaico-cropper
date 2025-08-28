/**
 * MosaicoCropperPlugin - Native plugin system to replace jQuery UI Widget
 * 
 * This module provides a native JavaScript plugin system that doesn't require jQuery
 * but can optionally integrate with it for backward compatibility.
 */

import { mosaicoCropper } from './MosaicoCropper.js';
import { elementDataStore } from './utils/MinimalDomUtils.js';

/**
 * Native MosaicoCropper Plugin Class
 * Replaces jQuery UI Widget Factory pattern with modern ES6 class
 */
export class MosaicoCropperPlugin {
    constructor(element, options = {}) {
        // Ensure we have a native HTMLElement
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!(element instanceof HTMLElement)) {
            throw new Error('MosaicoCropperPlugin requires a valid HTMLElement');
        }
        
        this.element = element;
        this.options = Object.assign({
            autoClose: true,
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
        this.instance = mosaicoCropper(this.element, this.options, this);
        this.isInitialized = true;
    }
    
    /**
     * Get current scale value
     * @param {number} [value] - Scale value to set
     * @returns {number|MosaicoCropperPlugin} Current scale or this for chaining
     */
    scale(value) {
        if (!this.instance) return value === undefined ? 1 : this;
        
        if (value === undefined) {
            return this.instance.getScale();
        } else {
            this.instance.updateScale(value);
            return this;
        }
    }
    
    /**
     * Get/set crop height
     * @param {number} [value] - Height value to set
     * @returns {number|MosaicoCropperPlugin} Current height or this for chaining
     */
    cropHeight(value) {
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
    updateOptions(newOptions) {
        const hasChanged = Object.keys(newOptions).some(key => 
            this.options[key] !== newOptions[key]
        );
        
        if (hasChanged) {
            Object.assign(this.options, newOptions);
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
        elementDataStore.remove(this.element, 'mosaicoCropperPlugin');
        
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
    _trigger(eventType, originalEvent = null, data = null) {
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
        const result = this.element.dispatchEvent(customEvent);
        
        // Also try to call callback function if provided in options
        const callbackName = 'on' + eventType.charAt(0).toUpperCase() + eventType.slice(1);
        if (typeof this.options[callbackName] === 'function') {
            try {
                this.options[callbackName].call(this.element, customEvent, data);
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
export function createMosaicoCropper(element, options = {}) {
    return new MosaicoCropperPlugin(element, options);
}

/**
 * Get existing MosaicoCropper instance from element
 * @param {HTMLElement} element - Target element
 * @returns {MosaicoCropperPlugin|null} Existing instance or null
 */
export function getMosaicoCropper(element) {
    return elementDataStore.get(element, 'mosaicoCropperPlugin') || null;
}

/**
 * jQuery Integration Function
 * Registers the plugin with jQuery if available
 * This maintains backward compatibility with existing jQuery-based code
 * 
 * @param {Object} jQueryInstance - jQuery object
 */
export function registerJQueryPlugin(jQueryInstance) {
    if (!jQueryInstance || typeof jQueryInstance.fn !== 'object') {
        console.warn('Invalid jQuery instance provided to registerJQueryPlugin');
        return;
    }
    
    jQueryInstance.fn.mosaicoCropper = function(options) {
        const args = Array.prototype.slice.call(arguments, 1);
        let result = this;
        
        this.each(function() {
            const element = this;
            let instance = getMosaicoCropper(element);
            
            if (typeof options === 'string') {
                // Method call: $('#el').mosaicoCropper('scale', 1.5)
                if (!instance) {
                    jQueryInstance.error(`Cannot call method '${options}' on mosaicoCropper prior to initialization`);
                    return;
                }
                
                if (typeof instance[options] === 'function') {
                    const methodResult = instance[options].apply(instance, args);
                    
                    // If method returns a value (not chainable), store it as result
                    if (methodResult !== instance && methodResult !== undefined) {
                        result = methodResult;
                        return false; // Break out of each loop
                    }
                } else {
                    jQueryInstance.error(`Method '${options}' does not exist on mosaicoCropper`);
                }
            } else {
                // Initialization: $('#el').mosaicoCropper({...})
                if (instance) {
                    // Update existing instance
                    instance.updateOptions(options);
                } else {
                    // Create new instance
                    new MosaicoCropperPlugin(element, options);
                }
            }
        });
        
        return result;
    };
    
    // Add data method for retrieving instances (jQuery UI pattern)
    const originalData = jQueryInstance.fn.data;
    jQueryInstance.fn.data = function(key, value) {
        if (key === 'mosaicoCropper' && value === undefined) {
            // Get mosaicoCropper instance
            return getMosaicoCropper(this[0]);
        }
        // Call original data method
        return originalData.apply(this, arguments);
    };
}

/**
 * Auto-register with jQuery if available
 * This ensures backward compatibility without requiring explicit registration
 */
if (typeof window !== 'undefined' && window.jQuery) {
    registerJQueryPlugin(window.jQuery);
}

/**
 * Support for multiple jQuery instances
 * Allows manual registration with specific jQuery versions
 */
export function autoRegisterJQuery() {
    // Try common jQuery global names
    const jQueryGlobals = ['jQuery', '$', 'jquery'];
    
    for (const globalName of jQueryGlobals) {
        if (typeof window !== 'undefined' && window[globalName] && window[globalName].fn) {
            try {
                registerJQueryPlugin(window[globalName]);
                console.log(`MosaicoCropper registered with ${globalName}`);
            } catch (error) {
                console.warn(`Failed to register MosaicoCropper with ${globalName}:`, error);
            }
        }
    }
}

// Default export for convenience
export default {
    MosaicoCropperPlugin,
    createMosaicoCropper,
    getMosaicoCropper,
    registerJQueryPlugin,
    autoRegisterJQuery
};