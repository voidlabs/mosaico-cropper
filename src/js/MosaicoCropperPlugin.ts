import { MosaicoCropperPlugin as CorePlugin, getMosaicoCropper } from './core/MosaicoCropperPlugin.js';
import { mosaicoCropper } from './MosaicoCropper.js';
import type { CropperOptions, JQueryLike, JQueryCollectionLike } from '../types.js';
export { getMosaicoCropper };

/** Complete plugin: core behavior plus built-in controls. */
export class MosaicoCropperPlugin extends CorePlugin {
    constructor(element: HTMLImageElement | string, options: CropperOptions = {}) {
        super(element, { toolbar: true, ...options });
    }
    protected _createInstance() { return mosaicoCropper(this.element!, this.options!, this); }
}
export function createMosaicoCropper(element: HTMLImageElement | string, options: CropperOptions = {}) {
    return new MosaicoCropperPlugin(element, options);
}

/**
 * jQuery Integration Function
 * Registers the plugin with jQuery if available
 * This maintains backward compatibility with existing jQuery-based code
 * 
 * @param {Object} jQueryInstance - jQuery object
 */
export function registerJQueryPlugin(jQueryInstance: JQueryLike) {
    if (!jQueryInstance || typeof jQueryInstance.fn !== 'object') {
        console.warn('Invalid jQuery instance provided to registerJQueryPlugin');
        return;
    }
    
    jQueryInstance.fn.mosaicoCropper = function(options, ...args: unknown[]) {
        let result: unknown = this;
        
        this.each(function() {
            const element = this;
            let instance = getMosaicoCropper(element);
            
            if (typeof options === 'string') {
                // Method call: $('#el').mosaicoCropper('scale', 1.5)
                if (!instance) {
                    jQueryInstance.error(`Cannot call method '${options}' on mosaicoCropper prior to initialization`);
                    return;
                }
                
                const method = (instance as unknown as Record<string, unknown>)[options];
                if (typeof method === 'function') {
                    const methodResult = method.apply(instance, args);
                    
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
                    instance.updateOptions(options || {});
                } else {
                    // Create new instance
                    new MosaicoCropperPlugin(element as HTMLImageElement, options);
                }
            }
        });
        
        return result;
    };
    
    // Add data method for retrieving instances (jQuery UI pattern)
    const originalData = jQueryInstance.fn.data;
    jQueryInstance.fn.data = function(this: JQueryCollectionLike, key: unknown, value?: unknown) {
        if (key === 'mosaicoCropper' && value === undefined) {
            // Get mosaicoCropper instance
            return getMosaicoCropper(this[0]);
        }
        // Call original data method
        return originalData.call(this, key, value);
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
    const jQueryGlobals = ['jQuery', '$', 'jquery'] as const;
    
    for (const globalName of jQueryGlobals) {
        if (typeof window !== 'undefined' && window[globalName] && window[globalName].fn) {
            try {
                registerJQueryPlugin(window[globalName]!);
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
