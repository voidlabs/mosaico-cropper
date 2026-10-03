/**
 * MovingClassManager - Gestisce le classi CSS per animazioni di movimento
 * Refactored per utilizzare JavaScript nativo invece di jQuery
 */
export declare class MovingClassManager {
    element: HTMLElement | null;
    isMoving: boolean;
    currentMovingClass: string | null;
    movingTimeout: ReturnType<typeof setTimeout> | null;
    constructor(element: HTMLElement);
    /**
     * Aggiunge classe di movimento se non già in movimento
     * @param {string} className - Nome della classe (es. 'drag', 'slide', 'wheel')
     */
    addMovingClass(className: string): void;
    /**
     * Rimuove tutte le classi di movimento
     */
    removeMovingClass(): void;
    /**
     * Toggle delle classi di movimento
     * @param {string} className - Nome della classe
     */
    toggleMovingClass(className: string): void;
    /**
     * Imposta timeout per rimozione automatica delle classi
     * @param {number} delay - Delay in millisecondi (default 500)
     */
    setAutoRemoveTimeout(delay?: number): void;
    /**
     * Pulisce timeout attivi
     */
    clearTimeout(): void;
    /**
     * Getter per stato corrente
     */
    get state(): {
        isMoving: boolean;
        currentClass: string | null;
        hasTimeout: boolean;
    };
    /**
     * Cleanup per distruggere l'istanza
     */
    destroy(): void;
}
