/**
 * Cropper HTML Templates
 * Extracted from inline strings for better maintainability
 */

/**
 * Main cropper template with clean, readable structure
 */
export const CROPPER_TEMPLATE = `
  <div class="mo-cropper cropper-hidden" tabindex="-1">
    <div class="cropper-frame">
      <div class="clipping-container">
        <img draggable="false" class="clipped clipped-image original-src">
      </div>
    </div>
    <div class="outer-image-container">
      <img class="outer-image original-src">
    </div>
  </div>
`;

/**
 * Create cropper element from template
 * Replaces DomUtils.createElement with native DOM approach
 * @param {string} template - HTML template string
 * @returns {HTMLElement} - Created element
 */
export function createElementFromTemplate(template: string): HTMLElement {
    const templateElement = document.createElement('template');
    templateElement.innerHTML = template.trim();
    return templateElement.content.firstElementChild as HTMLElement;
}
