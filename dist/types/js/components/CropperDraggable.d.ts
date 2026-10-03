import type { CropModel } from '../CropModel.js';
import type { MovingClassManager } from '../utils/MovingClassManager.js';
import { CropperComponent } from './CropperComponent.js';
/**
 * CropperDraggable - Drag/pan/zoom compatto
 * Refactored per utilizzare JavaScript nativo invece di jQuery
 */
export declare class CropperDraggable extends CropperComponent {
    shiftWheel: boolean;
    rootEl: HTMLElement | null;
    hasDragged: boolean;
    constructor(element: HTMLElement, options?: {
        shiftWheel?: boolean;
    });
    initialize(cropModel: CropModel, rootEl: HTMLElement, movingClassManager: MovingClassManager, onChanged: (reason?: string) => void): void;
    destroy(): void;
}
