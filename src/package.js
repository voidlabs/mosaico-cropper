// Import core functionality
import { mosaicoCropper } from './js/MosaicoCropper.js';
import {
    MosaicoCropperPlugin,
    createMosaicoCropper,
    getMosaicoCropper,
    registerJQueryPlugin,
    autoRegisterJQuery
} from './js/MosaicoCropperPlugin.js';

// Auto-register with jQuery if available (backward compatibility)
if (typeof window !== 'undefined' && window.jQuery) {
    registerJQueryPlugin(window.jQuery);
}

export {
    mosaicoCropper,
    MosaicoCropperPlugin,
    createMosaicoCropper,
    getMosaicoCropper,
    registerJQueryPlugin,
    autoRegisterJQuery
};

export default {
    mosaicoCropper,
    MosaicoCropperPlugin,
    createMosaicoCropper,
    getMosaicoCropper,
    registerJQueryPlugin,
    autoRegisterJQuery
};
