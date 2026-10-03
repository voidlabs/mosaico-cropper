import type { CropModel } from '../CropModel.js';
import type { MovingClassManager } from '../utils/MovingClassManager.js';
import { CropperComponent } from './CropperComponent.js';
/**
 * CropperSlider - Slider logaritmico compatto
 * Refactored per utilizzare JavaScript nativo invece di jQuery
 */
export declare class CropperSlider extends CropperComponent {
    constructor(element: HTMLElement);
    static _fromSliderValueToScale(value: number): number;
    static _fromScaleToSliderValue(scale: number): number;
    initialize(cropModel: CropModel, movingClassManager: MovingClassManager, onChanged: (reason?: string) => void): void;
    updateFromScale(scale: number): void;
    updateMinScale(minScale: number): void;
    destroy(): void;
}
