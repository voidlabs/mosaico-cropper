/**
 * Cropper HTML Templates
 * Extracted from inline strings for better maintainability
 */
/**
 * Main cropper template with clean, readable structure
 */
export declare const CROPPER_TEMPLATE = "\n  <div class=\"mo-cropper cropper-hidden\" tabindex=\"-1\">\n    <div class=\"cropper-frame\">\n      <div class=\"clipping-container\">\n        <div class=\"toolbar\">\n          <button type=\"button\" class=\"tool tool-zoom\" aria-label=\"Fit image\">\n            <i class=\"fa fa-compress\" aria-hidden=\"true\"></i>\n          </button>\n          <div class=\"cropper-zoom-slider\"></div>\n          <button type=\"button\" class=\"tool tool-crop\" aria-label=\"Apply crop\">\n            <i class=\"fa fa-check\" aria-hidden=\"true\"></i>\n          </button>\n        </div>\n        <img draggable=\"false\" class=\"clipped clipped-image original-src\">\n        <button type=\"button\" class=\"mosaico-cropper-edit-trigger\" aria-label=\"Edit crop\">\n          <i class=\"fa fa-pencil\" aria-hidden=\"true\"></i>\n        </button>\n      </div>\n    </div>\n    <div class=\"outer-image-container\">\n      <img class=\"outer-image original-src\">\n    </div>\n  </div>\n";
/**
 * Create cropper element from template
 * Replaces DomUtils.createElement with native DOM approach
 * @param {string} template - HTML template string
 * @returns {HTMLElement} - Created element
 */
export declare function createElementFromTemplate(template: string): HTMLElement;
