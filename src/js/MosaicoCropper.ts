import { mosaicoCropper as createCore } from './core/MosaicoCropper.js';
import { createBuiltInControls } from './ui/BuiltInControls.js';
import type { CropperOptions, CropperWidget } from '../types.js';

/** Complete cropper, with the optional built-in controls. */
export function mosaicoCropper(image: HTMLImageElement, options: CropperOptions = {}, widget: CropperWidget | null = null) {
    return createCore(image, { toolbar: true, ...options }, widget, createBuiltInControls);
}
