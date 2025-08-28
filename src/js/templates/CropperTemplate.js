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
        <div class="toolbar">
          <div class="tool tool-zoom">
            <i class="fa fa-compress" aria-hidden="true"></i>
          </div>
          <div class="cropper-zoom-slider"></div>
          <div class="tool tool-crop">
            <i class="fa fa-check" aria-hidden="true"></i>
          </div>
        </div>
        <img draggable="false" class="clipped clipped-image original-src">
        <div class="mosaico-cropper-edit-trigger">
          <i class="fa fa-pencil" aria-hidden="true"></i>
        </div>
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
export function createElementFromTemplate(template) {
    const templateElement = document.createElement('template');
    templateElement.innerHTML = template.trim();
    return templateElement.content.firstChild;
}
