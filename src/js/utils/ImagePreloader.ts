/**
 * ImagePreloader - Utility per preload immagini con callback
 * Estratto da jqueryui-mosaico-cropper.js per migliorare testabilità
 */
export class ImagePreloader {
    
    /**
     * Preload di un'immagine con callback success/error
     * @param {string} src - URL dell'immagine
     * @param {function} onSuccess - Callback(img, src) al successo
     * @param {function} onError - Callback(src, error) all'errore
     * @returns {HTMLImageElement} - Elemento image per eventuali operazioni
     */
    static preload(src: string, onSuccess?: (img: HTMLImageElement, src: string) => void, onError?: (src: string, error: Event | string) => void) {
        if (typeof src !== 'string' || !src) {
            throw new Error('ImagePreloader requires a valid src string');
        }
        
        const img = new Image();
        
        img.onload = function() {
            if (onSuccess) {
                onSuccess(img, src);
            }
        };
        
        img.onerror = function(error) {
            console.log("Image preload failed:", error);
            if (onError) {
                onError(src, error);
            }
        };
        
        img.src = src;
        return img;
    }
    
    /**
     * Preload multiplo con Promise (per uso moderno)
     * @param {string[]} sources - Array di URL immagini
     * @returns {Promise<HTMLImageElement[]>} - Promise con array di immagini caricate
     */
    static preloadMultiple(sources: string[]) {
        const promises = sources.map(src => 
            new Promise<{ img: HTMLImageElement; src: string }>((resolve, reject) => {
                ImagePreloader.preload(src, 
                    (img, src) => resolve({img, src}),
                    (src, error) => reject({src, error})
                );
            })
        );
        
        return Promise.all(promises);
    }
    
    /**
     * Check se un'immagine è già caricata
     * @param {string} src - URL dell'immagine
     * @returns {boolean} - True se caricata
     */
    static isImageLoaded(src: string) {
        const img = new Image();
        img.src = src;
        return img.complete && img.naturalWidth !== 0;
    }
}