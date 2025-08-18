// Import CSS
import './css/jqueryui-mosaico-cropper.less';

// Import JavaScript
import './js/jqueryui-mosaico-cropper.js';

// Export the widget for use as an ES module
// Note: The mosaicoCropper function is attached to jQuery, so we don't need to export it directly
// Instead, we export the jQuery object which will have the widget attached
export default window.jQuery;