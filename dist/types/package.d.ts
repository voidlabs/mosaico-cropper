export type * from './types.js';
import { mosaicoCropper } from './js/MosaicoCropper.js';
import { MosaicoCropperPlugin, createMosaicoCropper, getMosaicoCropper, registerJQueryPlugin, autoRegisterJQuery } from './js/MosaicoCropperPlugin.js';
export { mosaicoCropper, MosaicoCropperPlugin, createMosaicoCropper, getMosaicoCropper, registerJQueryPlugin, autoRegisterJQuery };
declare const _default: {
    mosaicoCropper: typeof mosaicoCropper;
    MosaicoCropperPlugin: typeof MosaicoCropperPlugin;
    createMosaicoCropper: typeof createMosaicoCropper;
    getMosaicoCropper: typeof getMosaicoCropper;
    registerJQueryPlugin: typeof registerJQueryPlugin;
    autoRegisterJQuery: typeof autoRegisterJQuery;
};
export default _default;
