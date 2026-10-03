/**
 * MovingClassManager - Gestisce le classi CSS per animazioni di movimento
 * Refactored per utilizzare JavaScript nativo invece di jQuery
 */
export class MovingClassManager {
    
    element: HTMLElement | null;
    isMoving: boolean;
    currentMovingClass: string | null;
    movingTimeout: ReturnType<typeof setTimeout> | null;
    constructor(element: HTMLElement) {
        // Accept HTMLElement
        if (element instanceof HTMLElement) {
            this.element = element;
        } else {
            throw new Error('MovingClassManager requires a native HTMLElement');
        }
        
        this.isMoving = false;
        this.currentMovingClass = null;
        this.movingTimeout = null;
    }
    
    /**
     * Aggiunge classe di movimento se non già in movimento
     * @param {string} className - Nome della classe (es. 'drag', 'slide', 'wheel')
     */
    addMovingClass(className: string) {
        if (typeof className !== 'string' || !className) {
            throw new Error('addMovingClass requires a valid className string');
        }
        
        this.clearTimeout();
        
        if (!this.isMoving) {
            // Use native classList instead of jQuery addClass
            this.element!.classList.add("cropper-moving");
            this.element!.classList.add("cropper-moving-" + className);
            this.isMoving = true;
            this.currentMovingClass = className;
        }
    }
    
    /**
     * Rimuove tutte le classi di movimento
     */
    removeMovingClass() {
        this.clearTimeout();
        
        if (this.isMoving && this.currentMovingClass) {
            // Use native classList instead of jQuery removeClass
            this.element!.classList.remove("cropper-moving");
            this.element!.classList.remove("cropper-moving-" + this.currentMovingClass);
            this.isMoving = false;
            this.currentMovingClass = null;
        }
    }
    
    /**
     * Toggle delle classi di movimento
     * @param {string} className - Nome della classe
     */
    toggleMovingClass(className: string) {
        if (this.isMoving) {
            this.removeMovingClass();
        } else {
            this.addMovingClass(className);
        }
    }
    
    /**
     * Imposta timeout per rimozione automatica delle classi
     * @param {number} delay - Delay in millisecondi (default 500)
     */
    setAutoRemoveTimeout(delay = 500) {
        this.clearTimeout();
        this.movingTimeout = setTimeout(() => {
            this.removeMovingClass();
        }, delay);
    }
    
    /**
     * Pulisce timeout attivi
     */
    clearTimeout() {
        if (this.movingTimeout) {
            clearTimeout(this.movingTimeout);
            this.movingTimeout = null;
        }
    }
    
    /**
     * Getter per stato corrente
     */
    get state() {
        return {
            isMoving: this.isMoving,
            currentClass: this.currentMovingClass,
            hasTimeout: !!this.movingTimeout
        };
    }
    
    /**
     * Cleanup per distruggere l'istanza
     */
    destroy() {
        this.clearTimeout();
        if (this.isMoving) {
            this.removeMovingClass();
        }
        this.element = null;
    }
}