// Import CSS
import './css/main.less';

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

// Export modern API
export {
    // Core function (for advanced usage)
    mosaicoCropper,
    
    // Modern plugin class
    MosaicoCropperPlugin,
    
    // Convenience functions
    createMosaicoCropper,
    getMosaicoCropper,
    
    // jQuery integration
    registerJQueryPlugin,
    autoRegisterJQuery
};

// Default export for convenience
export default {
    mosaicoCropper,
    MosaicoCropperPlugin,
    createMosaicoCropper,
    getMosaicoCropper,
    registerJQueryPlugin,
    autoRegisterJQuery
};