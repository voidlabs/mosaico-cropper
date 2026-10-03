import type { CropperOptions, Size, Position, CropMethod, CropResult } from '../types.js';
interface ModelEvents {
    scaleChanged: {
        scale: number;
        scaledSize: Size;
    };
    minScaleChanged: {
        minScale: number;
    };
    cropSizeChanged: Size;
    containerPositionChanged: Position;
    modelUpdated: {
        reason: string;
    };
}
/**
 * CropModel - Gestisce lo stato del modello di cropping separato dalla UI
 */
export declare class CropModel {
    state: {
        container: Position;
        crop: Size;
        scale: number;
        minScale: number;
    };
    originalImageSize: Size;
    options: CropperOptions;
    processedOptions: CropperOptions;
    listeners: {
        [K in keyof ModelEvents]?: Array<(data: ModelEvents[K]) => void>;
    };
    constructor(options: CropperOptions | undefined, originalImageSize: Size);
    /** EVENT SYSTEM **/
    on<K extends keyof ModelEvents>(event: K, callback: (data: ModelEvents[K]) => void): void;
    emit<K extends keyof ModelEvents>(event: K, data: ModelEvents[K]): void;
    /** GETTERS **/
    getCropHeight(): number;
    getCropWidth(): number;
    getScale(): number;
    getMinScale(): number;
    getMaxScale(): number;
    getContainerLeft(): number;
    getContainerTop(): number;
    getContainerPosition(): {
        left: number;
        top: number;
    };
    getCropDimensions(): {
        width: number;
        height: number;
    };
    getScaledImageSize(scale?: number): {
        width: number;
        height: number;
    };
    /** UTILITIES **/
    checkRange(value: number, min: number, max: number): number;
    /** PURE CALCULATIONS **/
    getCurrentComputedMethod(): CropMethod;
    getCurrentComputedSizes(): CropResult;
    /** MODEL UPDATE METHODS **/
    updateScale(newScale: number, xp?: number, yp?: number): boolean;
    updateScaledImageSize(newScale: number): boolean;
    updateCropperFrameSize(newCropHeight?: number, newCropWidth?: number): void;
    updateCropContainerPanZoom(newLeft?: number, newTop?: number, newScale?: number): boolean;
    updatePanZoomToFitCropContainer(): boolean;
    updateCropHeightInternal(method: CropMethod, newHeight: number, origHeight: number, originalOuterTop: number, maxHeight: number): void;
    updateCropHeight(newHeight: number): boolean;
    updatePanZoomCropToFitWidthAndAspect(): boolean;
    updateSmartAutoResize(): void;
    initializeSizes(): void;
}
export {};
