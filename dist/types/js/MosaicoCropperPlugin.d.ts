import type { CropperOptions, CropperInstance, CropperEventMap, JQueryLike } from '../types.js';
/**
 * Native MosaicoCropper Plugin Class
 * Replaces jQuery UI Widget Factory pattern with modern ES6 class
 */
export declare class MosaicoCropperPlugin {
    element: HTMLImageElement | null;
    options: CropperOptions | null;
    instance: CropperInstance | null;
    isInitialized: boolean;
    constructor(element: HTMLImageElement | string, options?: CropperOptions);
    /**
     * Initialize the cropper instance
     * @private
     */
    _init(): void;
    /**
     * Get current scale value
     * @param {number} [value] - Scale value to set
     * @returns {number|MosaicoCropperPlugin} Current scale or this for chaining
     */
    scale(): number;
    scale(value: number): this;
    /** Fit using the same smart cycle as the built-in Fit image button. */
    fit(): this;
    /** Independent zoom snapshot; null after destruction, throws while loading. */
    getZoomState(): import("../types.js").ZoomState | null;
    /**
     * Get/set crop height
     * @param {number} [value] - Height value to set
     * @returns {number|MosaicoCropperPlugin} Current height or this for chaining
     */
    cropHeight(): number;
    cropHeight(value: number): this;
    /**
     * Get current options
     * @returns {Object} Current options object
     */
    getOptions(): CropperOptions;
    /**
     * Update options and reinitialize if necessary
     * @param {Object} newOptions - New options to merge
     * @returns {MosaicoCropperPlugin} This for chaining
     */
    updateOptions(newOptions: CropperOptions): this;
    /**
     * Finalize crop and dispose the cropper (for view mode)
     * @returns {MosaicoCropperPlugin} This for chaining
     */
    finalizeCrop(): this;
    /**
     * Programmatically starts the editing mode for a non-editable cropper.
     * @returns {MosaicoCropperPlugin} This for chaining
     */
    startEdit(): this;
    /**
     * Check if cropper is initialized
     * @returns {boolean} True if initialized
     */
    isReady(): boolean;
    /**
     * Destroy the cropper instance
     * @returns {MosaicoCropperPlugin} This for chaining
     */
    destroy(): this;
    /**
     * Emit custom events (replaces jQuery UI Widget's _trigger)
     * @param {string} eventType - Event type name
     * @param {Event} [originalEvent] - Original DOM event if any
     * @param {*} [data] - Event data
     * @returns {boolean} True if event was not cancelled
     */
    _trigger<K extends keyof CropperEventMap>(eventType: K, originalEvent?: Event | null, data?: CropperEventMap[K]): boolean;
}
/**
 * Factory function for creating MosaicoCropper instances
 * Provides a simpler API for one-off usage
 *
 * @param {HTMLElement|string} element - Target element or selector
 * @param {Object} [options] - Configuration options
 * @returns {MosaicoCropperPlugin} New plugin instance
 */
export declare function createMosaicoCropper(element: HTMLImageElement | string, options?: CropperOptions): MosaicoCropperPlugin;
/**
 * Get existing MosaicoCropper instance from element
 * @param {HTMLElement} element - Target element
 * @returns {MosaicoCropperPlugin|null} Existing instance or null
 */
export declare function getMosaicoCropper(element: HTMLElement): MosaicoCropperPlugin | null;
/**
 * jQuery Integration Function
 * Registers the plugin with jQuery if available
 * This maintains backward compatibility with existing jQuery-based code
 *
 * @param {Object} jQueryInstance - jQuery object
 */
export declare function registerJQueryPlugin(jQueryInstance: JQueryLike): void;
/**
 * Support for multiple jQuery instances
 * Allows manual registration with specific jQuery versions
 */
export declare function autoRegisterJQuery(): void;
declare const _default: {
    MosaicoCropperPlugin: typeof MosaicoCropperPlugin;
    createMosaicoCropper: typeof createMosaicoCropper;
    getMosaicoCropper: typeof getMosaicoCropper;
    registerJQueryPlugin: typeof registerJQueryPlugin;
    autoRegisterJQuery: typeof autoRegisterJQuery;
};
export default _default;
