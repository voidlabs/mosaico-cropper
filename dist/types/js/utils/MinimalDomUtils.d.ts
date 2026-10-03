/**
 * Minimal DOM Utilities - Optimized replacement for DomUtils
 *
 * This module contains only the essential DOM utilities actually used
 * in the codebase, removing ~400 lines of unused abstraction.
 */
/**
 * Global data storage for elements
 * This is the only DomUtils functionality actually used in the codebase
 */
export declare class ElementDataStore {
    store: WeakMap<object, Map<string, unknown>>;
    constructor();
    /**
     * Set data for element
     * @param {HTMLElement} element - Target element
     * @param {string} key - Data key
     * @param {*} value - Data value
     */
    set<T>(element: object, key: string, value: T): void;
    /**
     * Get data from element
     * @param {HTMLElement} element - Target element
     * @param {string} key - Data key
     * @returns {*}
     */
    get<T = unknown>(element: object, key: string): T | undefined;
    /**
     * Remove data from element
     * @param {HTMLElement} element - Target element
     * @param {string} [key] - Data key (if not provided, removes all)
     */
    remove(element: object, key?: string): void;
    /**
     * Check if element has data
     * @param {HTMLElement} element - Target element
     * @param {string} [key] - Optional key to check
     * @returns {boolean}
     */
    has(element: object, key?: string): boolean;
}
export declare const elementDataStore: ElementDataStore;
