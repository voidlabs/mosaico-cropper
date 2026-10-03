import type { CropModel } from '../CropModel.js';
import type { MovingClassManager } from '../utils/MovingClassManager.js';
import type { CropperWidget } from '../../types.js';
import { CropperComponent } from './CropperComponent.js';
/**
 * CropperResizer - Resize verticale compatto
 * Refactored per utilizzare JavaScript nativo invece di jQuery
 */
export declare class CropperResizer extends CropperComponent {
    cropperFrameEl: HTMLElement;
    rootEl: HTMLElement | null;
    widget: CropperWidget | null;
    constructor(cropperFrameEl: HTMLElement);
    initialize(cropModel: CropModel, rootEl: HTMLElement, movingClassManager: MovingClassManager, onChanged: (reason?: string) => void, widget?: CropperWidget | null): void;
    destroy(): void;
}
