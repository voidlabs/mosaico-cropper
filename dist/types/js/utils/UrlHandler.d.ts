import type { CropperOptions, CropResult, UrlAdapter, ParsedUrl } from '../../types.js';
export declare class UrlHandler {
    options: UrlAdapter;
    constructor(options: UrlAdapter);
    decodeSrc(urlData: CropperOptions, src: string): ParsedUrl | null;
    encodeSrc(urlData: CropperOptions, res: CropResult): string;
}
export declare function urlAdapterFromSrc(urlAdapter: UrlAdapter, urlData: CropperOptions, src: string): ParsedUrl | null;
export declare function urlAdapterToSrc(urlAdapter: UrlAdapter, urlData: CropperOptions, res: CropResult): string;
