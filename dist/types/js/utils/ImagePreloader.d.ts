/**
 * ImagePreloader - Utility per preload immagini con callback
 * Estratto da jqueryui-mosaico-cropper.js per migliorare testabilità
 */
export declare class ImagePreloader {
    /**
     * Preload di un'immagine con callback success/error
     * @param {string} src - URL dell'immagine
     * @param {function} onSuccess - Callback(img, src) al successo
     * @param {function} onError - Callback(src, error) all'errore
     * @returns {HTMLImageElement} - Elemento image per eventuali operazioni
     */
    static preload(src: string, onSuccess?: (img: HTMLImageElement, src: string) => void, onError?: (src: string, error: Event | string) => void): HTMLImageElement;
    /**
     * Preload multiplo con Promise (per uso moderno)
     * @param {string[]} sources - Array di URL immagini
     * @returns {Promise<HTMLImageElement[]>} - Promise con array di immagini caricate
     */
    static preloadMultiple(sources: string[]): Promise<{
        img: HTMLImageElement;
        src: string;
    }[]>;
    /**
     * Check se un'immagine è già caricata
     * @param {string} src - URL dell'immagine
     * @returns {boolean} - True se caricata
     */
    static isImageLoaded(src: string): boolean;
}
