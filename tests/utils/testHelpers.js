import { vi } from 'vitest';

/**
 * Factory per creare mock DOM elements che funzionano con API native
 */
export const createMockElement = (tagName = 'div', additionalMethods = {}) => {
    const element = document.createElement(tagName);
    
    // Spy on native methods instead of replacing them
    vi.spyOn(element.classList, 'add');
    vi.spyOn(element.classList, 'remove');
    vi.spyOn(element.classList, 'contains');
    vi.spyOn(element.classList, 'toggle');
    vi.spyOn(element, 'querySelector').mockImplementation(() => createMockElement());
    vi.spyOn(element, 'querySelectorAll').mockImplementation(() => []);
    vi.spyOn(element, 'setAttribute');
    vi.spyOn(element, 'getAttribute').mockReturnValue('');
    vi.spyOn(element, 'removeAttribute');
    vi.spyOn(element, 'appendChild');
    vi.spyOn(element, 'removeChild');
    vi.spyOn(element, 'insertBefore');
    vi.spyOn(element, 'addEventListener');
    vi.spyOn(element, 'removeEventListener');
    
    // Add properties that might be needed
    element.src = '';
    element.width = 400;
    element.height = 300;
    
    // Apply additional methods
    Object.assign(element, additionalMethods);
    
    return element;
};

/**
 * Mock CropModel standard con metodi comuni
 */
export const createMockCropModel = (customProps = {}) => ({
    state: { 
        minScale: 0.1, 
        container: { left: 100, top: 50 }, 
        crop: { height: 200, width: 300 },
        scale: 1.0
    },
    on: vi.fn(),
    emit: vi.fn(),
    initializeSizes: vi.fn(),
    getCurrentComputedMethod: vi.fn(() => 'resize'),
    getCurrentComputedSizes: vi.fn(() => ({})),
    getScaledImageSize: vi.fn(() => ({ width: 400, height: 300 })),
    updateSmartAutoResize: vi.fn(),
    getScale: vi.fn(() => 1.0),
    getMaxScale: vi.fn(() => 3.0),
    getMinScale: vi.fn(() => 0.1),
    getContainerLeft: vi.fn(() => 100),
    getContainerTop: vi.fn(() => 50),
    getCropHeight: vi.fn(() => 200),
    getCropWidth: vi.fn(() => 300),
    getContainerPosition: vi.fn(() => ({ left: 100, top: 50 })),
    getCropDimensions: vi.fn(() => ({ width: 300, height: 200 })),
    updateScale: vi.fn(),
    updateCropHeight: vi.fn(),
    updateCropContainerPanZoom: vi.fn(),
    updateCropHeightInternal: vi.fn(),
    updateScaledImageSize: vi.fn(),
    updateCropperFrameSize: vi.fn(),
    updatePanZoomToFitCropContainer: vi.fn(),
    checkRange: vi.fn((value, min, max) => Math.max(min, Math.min(max, value))),
    ...customProps
});

/**
 * Mock MovingClassManager standard
 */
export const createMockMovingClassManager = () => ({
    state: {
        isMoving: false,
        currentClass: null,
        hasTimeout: false
    },
    addMovingClass: vi.fn(),
    removeMovingClass: vi.fn(),
    toggleMovingClass: vi.fn(),
    setDelayedRemove: vi.fn(),
    setAutoRemoveTimeout: vi.fn()
});

/**
 * Mock Widget standard per jQuery-like behavior
 */
export const createMockWidget = () => ({
    _trigger: vi.fn(),
    element: createMockElement(),
    options: {}
});

/**
 * Setup standard per ImagePreloader mock
 */
export const setupImagePreloaderMock = (ImagePreloader, customBehavior = {}) => {
    const defaultBehavior = {
        preload: vi.fn((url, onSuccess) => {
            if (onSuccess) onSuccess({ naturalWidth: 800, naturalHeight: 600 }, url);
        }),
        preloadMultiple: vi.fn().mockResolvedValue([]),
        isImageLoaded: vi.fn().mockReturnValue(true)
    };
    
    Object.assign(ImagePreloader, { ...defaultBehavior, ...customBehavior });
};

/**
 * Setup mock per createElementFromTemplate standard
 */
export const setupCreateElementFromTemplateMock = (createElementFromTemplate) => {
    vi.mocked(createElementFromTemplate).mockImplementation(() => {
        const element = document.createElement('div');
        element.innerHTML = `
            <div class="clipped"></div>
            <div class="cropper-frame"></div>
            <div class="outer-image-container"></div>
            <div class="cropper-zoom-slider"></div>
            <div class="tool-crop"></div>
            <div class="tool-zoom"></div>
            <div class="original-src"></div>
        `;
        
        vi.spyOn(element, 'querySelector');
        vi.spyOn(element, 'querySelectorAll');
        vi.spyOn(element, 'addEventListener');
        vi.spyOn(element, 'focus');
        
        return element;
    });
};

/**
 * Url adapter mock standard per i test
 */
export const createMockUrlAdapter = () => ({
    fromSrc: '{urlPrefix:https?://[^/]*/img}.*method=resize.*params={width:[0-9]+}.*url={encodedUrlOriginal:[^ &\\?]+}',
    toSrc: {
        resize: '{urlPrefix}?method=resize&params={width}&url={encodedUrlOriginal}',
        cover: '{urlPrefix}?method=cover&params={width},{height}&url={encodedUrlOriginal}',
        cropresize: '{urlPrefix}?method=cropresize&params={cropWidth},{cropHeight},{cropX},{cropY},{width},{height}&url={encodedUrlOriginal}'
    },
    defaultPrefix: 'https://proxy.example.com/img'
});

/**
 * Opzioni di test standard per mosaicoCropper
 */
export const createTestOptions = (customOptions = {}) => ({
    width: 400,
    height: 300,
    urlAdapter: createMockUrlAdapter(),
    ...customOptions
});

/**
 * Helper per creare un test DOM container
 */
export const createTestContainer = (innerHTML = '') => {
    const container = document.createElement('div');
    if (innerHTML) {
        container.innerHTML = innerHTML;
    } else {
        container.innerHTML = `
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                 width="400" height="300" alt="test image">
        `;
    }
    document.body.appendChild(container);
    return container;
};

/**
 * Cleanup function per rimuovere test container
 */
export const cleanupTestContainer = (container) => {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
};

/**
 * Mock console.log per evitare spam nei test
 */
export const mockConsoleLog = () => {
    return vi.spyOn(console, 'log').mockImplementation(() => {});
};