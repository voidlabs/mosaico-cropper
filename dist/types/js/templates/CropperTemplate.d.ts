/**
 * Cropper HTML Templates
 * Extracted from inline strings for better maintainability
 */
/**
 * Main cropper template with clean, readable structure
 */
export declare const CROPPER_TEMPLATE = "\n  <div class=\"mo-cropper cropper-hidden\" tabindex=\"-1\">\n    <div class=\"cropper-frame\">\n      <div class=\"clipping-container\">\n        <img draggable=\"false\" class=\"clipped clipped-image original-src\">\n      </div>\n    </div>\n    <div class=\"outer-image-container\">\n      <img class=\"outer-image original-src\">\n    </div>\n  </div>\n";
/**
 * Create cropper element from template
 * Replaces DomUtils.createElement with native DOM approach
 * @param {string} template - HTML template string
 * @returns {HTMLElement} - Created element
 */
export declare function createElementFromTemplate(template: string): HTMLElement;
