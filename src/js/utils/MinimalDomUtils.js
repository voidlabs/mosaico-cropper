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
export class ElementDataStore {
    constructor() {
        this.store = new WeakMap();
    }

    /**
     * Set data for element
     * @param {HTMLElement} element - Target element
     * @param {string} key - Data key
     * @param {*} value - Data value
     */
    set(element, key, value) {
        if (!this.store.has(element)) {
            this.store.set(element, new Map());
        }
        this.store.get(element).set(key, value);
    }

    /**
     * Get data from element
     * @param {HTMLElement} element - Target element
     * @param {string} key - Data key
     * @returns {*}
     */
    get(element, key) {
        if (!this.store.has(element)) return undefined;
        return this.store.get(element).get(key);
    }

    /**
     * Remove data from element
     * @param {HTMLElement} element - Target element
     * @param {string} [key] - Data key (if not provided, removes all)
     */
    remove(element, key) {
        if (!this.store.has(element)) return;
        
        if (key === undefined) {
            this.store.delete(element);
        } else {
            this.store.get(element).delete(key);
        }
    }
    
    /**
     * Check if element has data
     * @param {HTMLElement} element - Target element
     * @param {string} [key] - Optional key to check
     * @returns {boolean}
     */
    has(element, key) {
        if (!this.store.has(element)) return false;
        if (key === undefined) return true;
        return this.store.get(element).has(key);
    }
}

// Create global instance (maintaining backward compatibility)
export const elementDataStore = new ElementDataStore();

