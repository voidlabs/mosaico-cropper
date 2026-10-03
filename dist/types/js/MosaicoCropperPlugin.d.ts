import { MosaicoCropperPlugin as CorePlugin, getMosaicoCropper } from './core/MosaicoCropperPlugin.js';
import type { CropperOptions, JQueryLike } from '../types.js';
export { getMosaicoCropper };
/** Complete plugin: core behavior plus built-in controls. */
export declare class MosaicoCropperPlugin extends CorePlugin {
    constructor(element: HTMLImageElement | string, options?: CropperOptions);
    protected _createInstance(): import("../types.js").CropperInstance | null;
}
export declare function createMosaicoCropper(element: HTMLImageElement | string, options?: CropperOptions): MosaicoCropperPlugin;
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
