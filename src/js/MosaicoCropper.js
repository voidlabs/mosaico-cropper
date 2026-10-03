// Importa le nuove funzioni di gestione URL
import { urlAdapterFromSrc, urlAdapterToSrc } from './utils/UrlHandler.js';
// Importa il modello di cropping
import { CropModel } from './CropModel.js';
// Importa utility per preload immagini
import { ImagePreloader } from './utils/ImagePreloader.js';
// Importa il gestore per le classi di movimento
import { MovingClassManager } from './utils/MovingClassManager.js';
// Importa i componenti consolidati per il cropper
import { CropperSlider } from './components/CropperSlider.js';
import { CropperDraggable } from './components/CropperDraggable.js';
import { CropperResizer } from './components/CropperResizer.js';
// Importa utilities DOM ottimizzate
import { elementDataStore } from './utils/MinimalDomUtils.js';
// Importa template e helper ottimizzati
import { CROPPER_TEMPLATE, createElementFromTemplate } from './templates/CropperTemplate.js';

// The main function is now exported and no longer requires jQuery
export function mosaicoCropper(imgEl, options, widget = null) {
    // Validate input element
    if (!imgEl || !(imgEl instanceof HTMLElement)) {
        console.error('mosaicoCropper requires a valid HTMLElement as first parameter');
        return null;
    }
    
    // Default mosaico URL adapter configuration
    const defaultMosaicoAdapter = {
        defaultPrefix: '/img',
        fromSrc: {
            urlPrefix: "(?:https?://[^/]*)?/img",
        },
        toSrc: {
            resize: "{urlPrefix}?method=resize&params={width}&url={encodedUrlOriginal}",
            cover: "{urlPrefix}?method=cover&params={width},{height}&url={encodedUrlOriginal}",
            cropresize: "{urlPrefix}?method=cropresize&params={cropWidth},{cropHeight},{cropX},{cropY},{width},{height}&url={encodedUrlOriginal}",
        }
    };

    // Set default options using modern spread syntax
    options = {
        urlAdapter: defaultMosaicoAdapter, // Default adapter
        autoClose: true,
        shiftWheel: false,
        maxScale: 2,
        toolbar: true,
        editable: true, // Default to editable mode
        editTrigger: 'button', // 'button', 'click', 'none'
        ...options
    };

    // HTML template now imported from separate template file

    /** GETTERS **/


    function getCropHeight() {
        return cropModel.getCropHeight();
    }

    function getScale() {
        return cropModel.getScale();
    }



    /** UTILITIES **/

    // Safety function to ensure cropModel is initialized before use
    function getCropModel() {
        if (disposing) throw new Error('MosaicoCropper has been destroyed.');
        if (!cropModel) {
            throw new Error('MosaicoCropper is not ready yet. The image is still loading.');
        }
        return cropModel;
    }

    function fit() {
        getCropModel().updateSmartAutoResize();
    }

    function getZoomState() {
        const model = getCropModel();
        return { scale: model.getScale(), minScale: model.getMinScale(), maxScale: model.getMaxScale() };
    }

    let zoomReady = false;
    let zoomPending = false;
    let lastZoomState;

    // Model events can describe intermediate steps of fit/resize. Publish only
    // the settled state, once per synchronous batch, before the next paint.
    function scheduleZoomChange() {
        if (!zoomReady || disposing || zoomPending) return;
        zoomPending = true;
        Promise.resolve().then(() => {
            zoomPending = false;
            if (disposing) return;
            const state = getZoomState();
            if (Object.keys(state).every(key => state[key] === lastZoomState[key])) return;
            lastZoomState = { ...state };
            if (widget && typeof widget._trigger === 'function') {
                widget._trigger('zoomchange', null, state);
            }
        });
    }


    /** INITIALIZATION METHODS */

    let componentsInitialized = false;

    function initializeEditingComponents() {
        if (componentsInitialized) return;

        const cropperResizer = new CropperResizer(cropperFrameEl);
        cropperResizer.initialize(cropModel, rootEl, movingClassManager, changed, widget);
        elementDataStore.set(cropperFrameEl, 'cropperResizer', cropperResizer);

        const cropperDraggable = new CropperDraggable(imageCropContainerEl, { shiftWheel: options.shiftWheel });
        cropperDraggable.initialize(cropModel, rootEl, movingClassManager, changed);
        elementDataStore.set(imageCropContainerEl, 'cropperDraggable', cropperDraggable);

        if (sliderEl) {
            const cropperSlider = new CropperSlider(sliderEl);
            cropperSlider.initialize(cropModel, movingClassManager, changed);
            elementDataStore.set(sliderEl, 'cropperSliderInstance', cropperSlider);
        }
        
        componentsInitialized = true;
    }

    function enableEditing() {
        // Initialize components if they haven't been already
        initializeEditingComponents();
        // Show the editing UI
        rootEl.classList.remove('mosaico-cropper--view-mode');
    }

    function disableEditing() {
        // Hide the editing UI
        rootEl.classList.add('mosaico-cropper--view-mode');
    }

    function initialize() {
        // Use native classList instead of jQuery addClass
    	if (containerEl) containerEl.classList.add("cropper-cropping");

        if (options.autoClose !== false) {
            // Use native addEventListener instead of jQuery focusout
            rootEl.addEventListener('focusout', function(a) {
                // On ie11 we have to use the contains method to check for real "focusout" events.
                // Non chiudere se stiamo già salvando/chiudendo
                if ((a.relatedTarget == null || !rootEl.contains(a.relatedTarget)) && typeof a.delegatedTarget == 'undefined' && !disposing && !closing) {
                    if (options.editable === false) {
                        // In temporary edit mode, clicking out should save and return to view mode
                        disableEditing();
                    } else {
                        // In normal editable mode, clicking out disposes the cropper
                        updateAndDispose();
                    }
                }
            });
        }

        // Use native querySelector and addEventListener instead of jQuery
        const toolCrop = rootEl.querySelector('.tool-crop');
        if (toolCrop) {
            toolCrop.addEventListener("click", function() {
                if (options.editable === false) {
                    // If the cropper started in view-mode, this acts as a "save" for the temporary edit
                    disableEditing();
                } else {
                    // If it started in editable mode, this disposes the cropper as usual
                    updateAndDispose();
                }
            });
        }
        
        // Edit trigger for view mode
        const editTrigger = rootEl.querySelector('.mosaico-cropper-edit-trigger');
        if (editTrigger) {
            editTrigger.addEventListener("click", function() {
                enableEditing();
            });
        }

        const toolZoom = rootEl.querySelector('.tool-zoom');
        if (toolZoom) {
            toolZoom.addEventListener("click", function() {
                fit();
            });
        }

        // Use native focus instead of jQuery
        rootEl.focus();

        cropModel.initializeSizes();
        updateCropperMethod();
        
        if (options.editable) {
            initializeEditingComponents();
        } else {
            disableEditing(); // Adds the main view-mode class

            switch (options.editTrigger) {
                case 'none':
                    rootEl.classList.add('mosaico-cropper--no-trigger');
                    break;
                case 'click':
                    rootEl.classList.add('mosaico-cropper--trigger-click');
                    rootEl.classList.add('mosaico-cropper--no-trigger'); // Also hide button
                    break;
                case 'button':
                default:
                    // Default behavior, do nothing extra
                    break;
            }
        }

        // initialized - use native style manipulation instead of jQuery
        imgEl.style.display = "none";

        rootEl.style.display = origDisplay == 'inline' ? 'inline-block' : origDisplay;
        rootEl.classList.remove("cropper-hidden");

        rootEl.focus();

        // Trigger ready event - backward compatibility with widget pattern
        lastZoomState = getZoomState();
        zoomReady = true;
        if (widget && typeof widget._trigger === 'function') {
            widget._trigger('cropperready');
        }
    }

    let lastMethod;

    function updateCropperMethod() {
        const ccsMethod = cropModel.getCurrentComputedMethod();
        // console.log("CURRENT METHOD", ccs.method);
        if (lastMethod !== ccsMethod) {
            // Use native classList instead of jQuery removeClass/addClass
            if (lastMethod) rootEl.classList.remove("cropper-method-"+lastMethod);
            lastMethod = ccsMethod;
            if (ccsMethod) rootEl.classList.add("cropper-method-"+ccsMethod);
        }
    }

    function changed() { // n
        updateCropperMethod();
        // Use native classList instead of jQuery addClass
        rootEl.classList.add("cropper-has-changes");
    }

    // NOTA: _stringTemplate è stato spostato in url-adapters.js


    function getCurrentComputedSizes() {
        return cropModel.getCurrentComputedSizes();
    }

    function updateOriginalImageSrc(done, fail) { // n
        try {
            const res = getCurrentComputedSizes();
            const url = urlAdapterToSrc(options.urlAdapter, options, res);

            // Let hosts persist or otherwise consume the generated URL before
            // the asynchronous preload applies it to the original image.
            if (widget && typeof widget._trigger === 'function') {
                widget._trigger('crop', null, { url, crop: res });
            }
            if (disposing) return;

            // Use native classList instead of jQuery addClass/removeClass
            rootEl.classList.add("cropper-loading");

            ImagePreloader.preload(url, function(img, src) {
                if (disposing) return;
                // Use native setAttribute instead of jQuery attr
                imgEl.setAttribute('src', src);
                // not needed, as we're going to remove the whole element.
                rootEl.classList.remove("cropper-loading");
                done();
            }, function(src, err) {
                if (disposing) return;
                rootEl.classList.remove("cropper-loading");
                rootEl.classList.add("cropper-has-changes");
                fail();
            });

            rootEl.classList.remove("cropper-has-changes");

            if (options.imgLoadingClass) {
                imgEl.classList.remove(options.imgLoadingClass);
            }
        } catch (error) {
            console.error("Failed generating final URL", error);
            // if something gone wrong, call fail callback.
            fail();
        }
    }

    function updateAndDispose() {
        if (!closing && !disposing) {
            closing = true;
            
            updateOriginalImageSrc(function() {
                dispose();
            }, function() { 
                dispose();
                closing = false;
            });
        }
    }

    function dispose(noCallback) {
        if (disposing) return;
        else disposing = true;
        movingClassManager.destroy();

        // Use native classList instead of jQuery removeClass
        if (containerEl) containerEl.classList.remove("cropper-cropping");

        try {
            // CropperResizer cleanup - use native data storage
            const cropperResizer = elementDataStore.get(cropperFrameEl, 'cropperResizer');
            if (cropperResizer) {
                cropperResizer.destroy();
                elementDataStore.remove(cropperFrameEl, 'cropperResizer');
            }
            // CropperDraggable cleanup - use native data storage
            const cropperDraggable = elementDataStore.get(imageCropContainerEl, 'cropperDraggable');
            if (cropperDraggable) {
                cropperDraggable.destroy();
                elementDataStore.remove(imageCropContainerEl, 'cropperDraggable');
            }
            // CropperSlider cleanup - use native data storage
            const cropperSlider = elementDataStore.get(sliderEl, 'cropperSliderInstance');
            if (cropperSlider) {
                cropperSlider.destroy();
                elementDataStore.remove(sliderEl, 'cropperSliderInstance');
            }
        } catch (error) {
            
        }

        // Use native remove instead of jQuery
        if (rootEl.parentNode) {
            rootEl.parentNode.removeChild(rootEl);
        }

        if (options.imgLoadingClass) {
            imgEl.classList.remove(options.imgLoadingClass);
        }

        // Use native style instead of jQuery css()
        imgEl.style.display = origDisplay;

        // Trigger destroy event - backward compatibility with widget pattern
        if (!noCallback && widget && typeof widget.destroy === 'function') {
            widget.destroy();
        }
    }

    // preloadImage function removed - now using ImagePreloader class


    // Create root element using optimized template function
    const rootEl = createElementFromTemplate(CROPPER_TEMPLATE);
    if (options.toolbar === false) rootEl.querySelector('.toolbar')?.remove();
    
    // Inizializza il MovingClassManager
    const movingClassManager = new MovingClassManager(rootEl);

    // Insert cropper before image element using native DOM
    imgEl.parentNode.insertBefore(rootEl, imgEl);
    if (options.imgLoadingClass) {
        imgEl.classList.add(options.imgLoadingClass);
    }

    const urlData = urlAdapterFromSrc(options.urlAdapter, options, imgEl.src);

    // Use modern Object.assign instead of DomUtils.extend
    Object.assign(options, urlData);
    if (!options.width) {
        // TODO maybe I have to use the original size instead of the options
        options.width = imgEl.width;
        options.height = imgEl.height;
    }

    // TODO we only support 1:1 aspect ratios.
    const wr = options.width / imgEl.width;
    const hr = options.height ? options.height / imgEl.height : wr;
    if (Math.abs(wr / hr - 1) > 0.01) {
        console.error("Unexpected aspect ratio: ", options.width, options.height, imgEl.width, imgEl.height, wr, hr);
    }
    // image pixels per image "html" size (so to support 2x 3x retina crops)
    options.ppp = wr;


    const thisVar = this,
        // Use native querySelector instead of jQuery find
        clippedEl = rootEl.querySelector(".clipped"),
        cropperFrameEl = rootEl.querySelector(".cropper-frame"),
        imageCropContainerEl = rootEl.querySelector(".outer-image-container"),
        sliderEl = rootEl.querySelector('.cropper-zoom-slider'),
        // Use native getComputedStyle directly
        origDisplay = window.getComputedStyle(imgEl).display;

    // Add a click listener to the frame to handle the 'click' trigger mode
    cropperFrameEl.addEventListener('click', () => {
        const isViewMode = rootEl.classList.contains('mosaico-cropper--view-mode');
        if (isViewMode && options.editable === false && options.editTrigger === 'click') {
            enableEditing();
        }
    });
    
    let disposing = false;
    let closing = false;
    
    let originalImageSize;


    let containerEl = false;
    if (typeof options.containerSelector !== 'undefined') {
        // Use native querySelector instead of jQuery
        containerEl = document.querySelector(options.containerSelector);
    }

    // CropModel will be initialized later with complete data
    let cropModel;

    let fullOriginalImgUrl = options.urlOriginal || (options.urlPrefix || '')+(options.urlPostfix || '');

    // if the fullOriginalImgUrl doesn't have a scheme, prepend http:// (cloudimage likes this)
    if (!fullOriginalImgUrl.match(/[a-z]+:/)) fullOriginalImgUrl = 'http://'+fullOriginalImgUrl;

    ImagePreloader.preload(fullOriginalImgUrl, function(img, src) {
        if (disposing) return;
        // Use native querySelectorAll and forEach instead of jQuery find and attr
        const originalSrcElements = rootEl.querySelectorAll('.original-src');
        originalSrcElements.forEach(element => {
            element.setAttribute('src', src);
        });
        originalImageSize = {
            width: img.naturalWidth,
            height: img.naturalHeight
        };
        
        // Initialize the CropModel with complete data
        cropModel = new CropModel(options, originalImageSize);

        // Setup event handlers
        cropModel.on('scaleChanged', function(data) {
            scheduleZoomChange();
            // Use native style manipulation instead of jQuery css()
            const newWidth = data.scaledSize.width + "px";
            const newHeight = data.scaledSize.height + "px";
            
            clippedEl.style.width = newWidth;
            clippedEl.style.height = newHeight;
            imageCropContainerEl.style.width = newWidth;
            imageCropContainerEl.style.height = newHeight;
            
            // Use native data storage instead of jQuery data()
            const cropperSlider = elementDataStore.get(sliderEl, 'cropperSliderInstance');
            if (cropperSlider) {
                cropperSlider.updateFromScale(data.scale);
            }
            changed("scaleChanged");
        });
        cropModel.on('containerPositionChanged', function(data) {
            // Use native style manipulation instead of jQuery css()
            const newLeft = data.left + "px";
            const newTop = data.top + "px";
            
            imageCropContainerEl.style.left = newLeft;
            imageCropContainerEl.style.top = newTop;
            clippedEl.style.left = newLeft;
            clippedEl.style.top = newTop;
            changed("containerPositionChanged");
        });
        cropModel.on('cropSizeChanged', function(data) {
            // Use native style manipulation instead of jQuery css()
            cropperFrameEl.style.height = data.height + "px";
            cropperFrameEl.style.width = data.width + "px";
            
            if (data.width !== undefined) {
                rootEl.style.width = data.width + "px";
            }
            changed("cropSizeChanged");
        });
        cropModel.on('minScaleChanged', function(data) {
            scheduleZoomChange();
            // Use native data storage instead of jQuery data()
            const cropperSlider = elementDataStore.get(sliderEl, 'cropperSliderInstance');
            if (cropperSlider) {
                cropperSlider.updateMinScale(data.minScale);
            }
            changed("minScaleChanged");
        });
        cropModel.on('modelUpdated', function(data) {
            changed(data.reason);
        });
        
        // initialize.call(thisVar);
        initialize();
    }, function(src) {
        if (disposing) return;
        // TODO handle initialization error
        setTimeout(dispose);
    });

    return {
        fit: fit,
        getZoomState: getZoomState,
        getScale: function() { return getCropModel().getScale(); },
        updateScale: function(value, xp, yp) { return getCropModel().updateScale(value, xp, yp); },
        getCropHeight: function() { return getCropModel().getCropHeight(); },
        updateCropHeight: function(value) { return getCropModel().updateCropHeight(value); },
        dispose: dispose,
        finalizeCrop: function() { updateAndDispose(); },
        startEdit: function() {
            if (options.editable === false) {
                enableEditing();
            }
        },
    };

}
