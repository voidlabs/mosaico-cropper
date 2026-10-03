import type { MosaicoCropperPlugin } from './js/core/MosaicoCropperPlugin.js';

export interface Size { width: number; height: number }
export interface Position { left: number; top: number }
export interface ZoomState { scale: number; minScale: number; maxScale: number }
export type CropMethod = 'original' | 'resize' | 'cover' | 'cropresize' | 'resizecrop';
export interface CropResult extends Size {
    resizeWidth: number; resizeHeight: number;
    offsetX: number; offsetY: number;
    cropX: number; cropY: number; cropX2: number; cropY2: number;
    cropWidth: number; cropHeight: number;
    _scale: number;
    method: CropMethod;
    urlPrefix?: string; urlPostfix?: string; urlOriginal?: string; encodedUrlOriginal?: string;
}
export type ParsedUrl = Record<string, string | undefined>;
export type UrlTemplate = string | ((crop: CropResult) => string);
export interface UrlAdapter {
    fromSrc: string | Record<string, string> | ((src: string) => ParsedUrl | null);
    toSrc: UrlTemplate | Partial<Record<CropMethod, UrlTemplate>>;
    defaultPrefix?: string;
}
export interface CropperEventMap {
    cropperready: null;
    zoomchange: ZoomState;
    crop: { url: string; crop: CropResult };
    cropheight: { value: number };
}
export interface CropperEventDetail<T> {
    data: T;
    originalEvent: Event | null;
    widget: MosaicoCropperPlugin;
}
export type CropperEvent<T = unknown> = CustomEvent<CropperEventDetail<T>>;
export type CropperCallback<T> = (this: HTMLImageElement, event: CropperEvent<T>, data: T) => void;
export interface CropperOptions {
    autoClose?: boolean; shiftWheel?: boolean; autoZoom?: boolean; maxScale?: number;
    toolbar?: boolean; editable?: boolean; editTrigger?: 'button' | 'click' | 'none';
    width?: number; height?: number;
    cropX?: number; cropY?: number; cropX2?: number; cropY2?: number;
    cropWidth?: number; cropHeight?: number;
    offsetX?: number; offsetY?: number; resizeWidth?: number; resizeHeight?: number; ppp?: number;
    urlAdapter?: UrlAdapter;
    urlPrefix?: string; urlPostfix?: string; urlOriginal?: string;
    containerSelector?: string; imgLoadingClass?: string;
    onCropperready?: CropperCallback<null>;
    onZoomchange?: CropperCallback<ZoomState>;
    onCrop?: CropperCallback<CropperEventMap['crop']>;
    onCropheight?: CropperCallback<CropperEventMap['cropheight']>;
}
export interface CropperWidget {
    _trigger<K extends keyof CropperEventMap>(type: K, event?: Event | null, data?: CropperEventMap[K]): boolean | void;
    destroy?(): unknown;
}
export interface CropperInstance {
    scale(): number;
    scale(value: number): CropperInstance;
    onZoomChange(listener: (state: ZoomState) => void): () => void;
    finishEdit(): void;
    fit(): void;
    getZoomState(): ZoomState;
    getScale(): number;
    updateScale(value: number, xp?: number, yp?: number): boolean;
    getCropHeight(): number;
    updateCropHeight(value: number): boolean;
    dispose(noCallback?: boolean): void;
    finalizeCrop(): void;
    startEdit(): void;
}
/** UI extension contract. Contains no model or gesture-component references. */
export type CropperUIFactory = (host: HTMLElement, cropper: CropperInstance, options: Readonly<CropperOptions>) => { destroy(): void };
// Structural integration boundary: jQuery remains an optional runtime dependency.
export interface JQueryCollectionLike {
    [index: number]: HTMLElement;
    each(callback: (this: HTMLElement) => false | void): unknown;
}
export interface JQueryLike {
    fn: {
        mosaicoCropper?: (this: JQueryCollectionLike, options?: CropperOptions | string, ...args: unknown[]) => unknown;
        data: (this: JQueryCollectionLike, ...args: unknown[]) => unknown;
    };
    error(message: string): void;
}
declare global {
    interface Window { jQuery?: JQueryLike; $?: JQueryLike; jquery?: JQueryLike }
    interface HTMLElementEventMap {
        mosaicocroppercropperready: CropperEvent<null>;
        mosaicocropperzoomchange: CropperEvent<ZoomState>;
        mosaicocroppercrop: CropperEvent<CropperEventMap['crop']>;
        mosaicocroppercropheight: CropperEvent<CropperEventMap['cropheight']>;
    }
}
