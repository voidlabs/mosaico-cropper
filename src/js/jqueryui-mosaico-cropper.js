// Importa le nuove funzioni di gestione URL
import { urlAdapterFromSrc, urlAdapterToSrc } from './url-adapters.js';
// Importa il modello di cropping
import { CropModel } from './crop-model.js';

(function($) {

  $.widget("mosaico.mosaicoCropper", {

    options: {
        autoClose: true,
        shiftWheel: false,
    },

    _init: function() {
        if (this.options.instance !== undefined) {
            this.options.instance.dispose(true);
        }
        this.options.instance = mosaicoCropper(this.element.get(0), this.options, this);
    },

    scale: function(value) {
        if (value === undefined) {
            return this.options.instance.getScale();
        } else {
            this.options.instance.updateScale(value);
        }
    },

    cropHeight: function(value) {
        if (value === undefined) {
            return this.options.instance.getCropHeight();
        } else {
            this.options.instance.updateCropHeight(value);
        }
    },

    _destroy: function() {
        this.options.instance.dispose(true);
    },

  });

function mosaicoCropper(imgEl, options, widget) {

    var htmlTemplate = '<div class="mo-cropper cropper-hidden" tabindex="-1">'+
      '<div class="cropper-frame">'+
        '<div class="clipping-container">'+
          '<div class="toolbar">'+
            '<div class="tool tool-zoom"><i class="fa fa-compress" aria-hidden="true"></i></div>'+
            '<div class="copper-zoom-slider"></div>'+
            '<div class="tool tool-crop"><i class="fa fa-check" aria-hidden="true"></i></div>'+
          '</div>'+
          '<img draggable="false" class="clipped clipped-image original-src">'+
        '</div>'+
        // '<div class="clip-handle ui-resizable-s"></div>'+
      '</div>'+
      '<div class="outer-image-container">'+
        '<img class="outer-image original-src">'+
      '</div>'+
    '</div>';

    /** GETTERS **/

    function getScaledImageSize(scale) {
        return cropModel.getScaledImageSize(scale);
    }

    function getCropHeight() {
        return cropModel.getCropHeight();
    }

    function getScale() {
        return cropModel.getScale();
    }

    function getMaxScale() {
        return cropModel.getMaxScale();
    }


    /** UTILITIES **/

    var movingTimeout = false;
    var isMoving = false;

    function addMovingClass(className) {
        if (movingTimeout) clearTimeout(movingTimeout);
        if (!isMoving) {
            rootEl.addClass("cropper-moving");
            rootEl.addClass("cropper-moving-"+className);
            isMoving = className;
        }
    }
    function removeMovingClass() {
        if (movingTimeout) clearTimeout(movingTimeout);
        if (isMoving) {
            rootEl.removeClass("cropper-moving");
            rootEl.removeClass("cropper-moving-"+isMoving);
            isMoving = false;
        }
    }

    function toggleMovingClass(className) {
        if (isMoving) removeMovingClass();
        else addMovingClass(className);
    }



    function checkRange(value, min, max) {
        return cropModel.checkRange(value, min, max);
    }


    /** DOM UPDATE METHODS **/

    function updateScaledImageSize(newScale) {
        return cropModel.updateScaledImageSize(newScale);
    }

    function updateCropperFrameSize(newCropHeight, newCropWidth) {
        cropModel.updateCropperFrameSize(newCropHeight, newCropWidth);
    }

    function updateCropContainerPanZoom(newLeft, newTop, newScale, updateCropContainer, updateSlider) {
        var changed = cropModel.updateCropContainerPanZoom(newLeft, newTop, newScale);

        // Handle UI updates that were previously done here
        if (changed) {
            if (newScale && updateSlider !== false) {
                sliderEl.slider("value", _fromScaleToSliderValue(newScale));
            }
        }

        return changed;
    }

    function updatePanZoomToFitCropContainer() {
        return cropModel.updatePanZoomToFitCropContainer();
    }

    function updateScale(newScale, xp, yp, updateSlider) {
        var result = cropModel.updateScale(newScale, xp, yp);
        if (result && updateSlider !== false) {
            sliderEl.slider("value", _fromScaleToSliderValue(cropModel.getScale()));
        }
        return result;
    }

    function updateCropHeightInternal(method, newHeight, origHeight, originalOuterTop, maxHeight) {
        cropModel.updateCropHeightInternal(method, newHeight, origHeight, originalOuterTop, maxHeight);
    }

    function updateCropHeight(newHeight) {
        return cropModel.updateCropHeight(newHeight);
    }

    function updatePanZoomCropToFitWidthAndAspect() {
        return cropModel.updatePanZoomCropToFitWidthAndAspect();
    }

    function updateSmartAutoResize() {
        cropModel.updateSmartAutoResize();
        changed("autosize");
    }

    /** INITIALIZATION METHODS */

    // TODO make this method parametrizable so to take a direction (down vs right)
    function initializeResizer() { // g
        var originalOuterTop;
        var maxHeight;
        var originalMethod;

        cropperFrameEl.append('<div class="clip-handle ui-resizable-s"></div>');
        cropperFrameEl.resizable({
            minHeight: 40,
            handles: { s: '.clip-handle' },
            /* containment: outerEl, */ /* se voglio fare che il resize sposta sul centro non posso usare il containment */
            start: function(event, ui) {
                rootEl.focus();
                addMovingClass('handle');
                originalOuterTop = cropModel.state.container.top;
                originalMethod = getCurrentComputedMethod();
                maxHeight = getScaledImageSize().height;
            },
            stop: function(event, ui) {
                removeMovingClass();
                changed("resized");
            },
            resize: function(event, ui) {
                var topDiff = cropModel.state.container.top - originalOuterTop;
                updateCropHeightInternal(originalMethod, ui.size.height, ui.originalSize.height, originalOuterTop, maxHeight);
                changed("resizing");
                ui.size.height = cropModel.state.crop.height;
                if (typeof widget !== 'undefined') widget._trigger('cropheight', null, { value: cropModel.getCropHeight() });
            },
        });
        cropperFrameEl.find('.clip-handle').on("dblclick", function(event) {
            updateCropHeight(getScaledImageSize().height);
            changed("resized");
            return false;
        });
    }

    function initializeDraggable() { // h
        imageCropContainerEl.draggable({
            scroll: false, // TODO not sure it is better with false. Need some testing.
            start: function(event, ui) {
                rootEl.focus();
                addMovingClass('drag');
            },
            stop: function(event, ui) {
                changed("dragged");
                removeMovingClass();
            },
            drag: function(event, ui) {
                updateCropContainerPanZoom(Math.round(ui.position.left), Math.round(ui.position.top), undefined, false);
                ui.position.left = cropModel.state.container.left;
                ui.position.top = cropModel.state.container.top;
                changed("dragging");
            },
        }).on("wheel", function(event) {
            if (options.shiftWheel && !event.shiftKey) return true;

            var delta = -event.originalEvent.deltaY;
            rootEl.focus();

            if (delta !== 0) {
                addMovingClass('wheel');
                movingTimeout = setTimeout(removeMovingClass, 500);

                var scaledSize = getScaledImageSize();
                // console.log(event.originalEvent.layerX, event.originalEvent.offsetX, event.originalEvent.layerX | event.originalEvent.offsetX);
                var xp = event.originalEvent.offsetX / scaledSize.width;
                var yp = event.originalEvent.offsetY / scaledSize.height;

                var newScale = delta > 0 ? cropModel.getScale()*1.1 : (cropModel.getScale()/1.1);
                updateScale(newScale, xp, yp);
                changed("wheel");
            }

            return false;
        }).on("dblclick", function(event) {
            // TODO temporary added the functionality to doubleclick
            updateSmartAutoResize();
            return false;
        }).on("click", function(event) {
            rootEl.focus();
            toggleMovingClass('click');
        });
    }

    /* Make the slider zoom binding logaritmic so to have more precision on the left side of the slider */
    function _fromSliderValueToScale(value) {
        return Math.pow(1.03, value) / 100;
    }

    function _fromScaleToSliderValue(scale) {
        return Math.log(scale * 100) / Math.log(1.03);
    }

    function initializeSlider() {
        // SLIDER
        sliderEl.slider({
            min: Math.floor(_fromScaleToSliderValue(cropModel.state.minScale)),
            step: 1,
            value: Math.round(_fromScaleToSliderValue(cropModel.getScale())),
            max: Math.ceil(_fromScaleToSliderValue(getMaxScale())), // zoom 2 means the output image will be very low quality (4 pixels from 1 original pixel)
            slide: function(event, ui) {
                var newScale = _fromSliderValueToScale(ui.value);
                updateScale(newScale, undefined, undefined, false);
                changed("slide");
                ui.value = _fromScaleToSliderValue(cropModel.getScale());
            },
            start: function() {
                addMovingClass('slide');               
            },
            stop: function() {
                removeMovingClass('slide');               
            },
        });
    }

    function initializeSizes() {
        cropModel.initializeSizes();
        updateCropperMethod();
    }

    function initialize() {
    	if (containerEl) containerEl.addClass("cropper-cropping");


        if (options.autoClose !== false) {
            rootEl.focusout(function(a) {
                // On ie11 we have to use the contains method to check for real "focusout" events.
                if ((a.relatedTarget == null || !rootEl.get(0).contains(a.relatedTarget)) && typeof a.delegatedTarget == 'undefined' && !disposing) {
                    updateAndDispose();
                }
            });
        }

        rootEl.find('.tool-crop').on("click", function() {
            updateAndDispose();
            // rootEl.triggerHandler('focusout');
        });

        rootEl.find('.tool-zoom').on("click", function() {
            updateSmartAutoResize();
        });

        rootEl.focus();

        initializeSizes();
        // TODO parametrize vertical resizer presence (note that also the zoom button is currently allowed to change the cropHeight and should be changed according to the presence of the cropper)
        initializeResizer();
        initializeDraggable();
        initializeSlider();

        // initialized
        $(imgEl).css("display", "none");

        rootEl.css("display", origDisplay == 'inline' ? 'inline-block' : origDisplay);
        rootEl.removeClass("cropper-hidden");

        rootEl.focus();

        if (typeof widget !== 'undefined') widget._trigger('copperready');
    }

    var lastMethod;

    function updateCropperMethod() {
        var ccsMethod = getCurrentComputedMethod();
        // console.log("CURRENT METHOD", ccs.method);
        if (lastMethod !== ccsMethod) {
            rootEl.removeClass("cropper-method-"+lastMethod);
            lastMethod = ccsMethod;
            rootEl.addClass("cropper-method-"+lastMethod);
        }
    }

    function changed() { // n
        updateCropperMethod();
        rootEl.addClass("cropper-has-changes");
    }

    // NOTA: _stringTemplate è stato spostato in url-adapters.js

    function getCurrentComputedMethod() {
        return cropModel.getCurrentComputedMethod();
    }

    function getCurrentComputedSizes() {
        return cropModel.getCurrentComputedSizes();
    }

    function updateOriginalImageSrc(done, fail) { // n
        try {
            var res = getCurrentComputedSizes();
            var url = urlAdapterToSrc(options.urlAdapter, options, res);

            rootEl.addClass("cropper-loading");

            preloadImage(url, function(img, src) {
                $(imgEl).attr('src', src);
                // not needed, as we're going to remove the whole element.
                rootEl.removeClass("cropper-loading");
                done();
            }, function(err) {
                rootEl.removeClass("cropper-loading");
                rootEl.addClass("cropper-has-changes");
                fail();
            });

            rootEl.removeClass("cropper-has-changes");

            if (options.imgLoadingClass) $(imgEl).removeClass(options.imgLoadingClass);
        } catch (error) {
            console.error("Failed generating final URL", error);
            // if something gone wrong, call fail callback.
            fail();
        }
    }

    function updateAndDispose() {
        if (!closing) {
            closing = true;
            updateOriginalImageSrc(dispose, function() { 
                // TODO what should we do when saving fails?
                // TODO logging
                dispose();
                closing = false;
            });
        }
    }

    function dispose(noCallback) {
        if (disposing) return;
        else disposing = true;

        if (containerEl) containerEl.removeClass("cropper-cropping");

        try {
            cropperFrameEl.find('.clip-handle').remove();
            cropperFrameEl.resizable("destroy");
            imageCropContainerEl.draggable("destroy");
            sliderEl.slider("destroy");
        } catch (error) {
            
        }

        rootEl.remove();

        if (options.imgLoadingClass) $(imgEl).removeClass(options.imgLoadingClass);

        // rootEl.addClass("cropper-hidden");
        $(imgEl).css("display", origDisplay);

        if (!noCallback && typeof widget !== 'undefined') widget.destroy();
    }

    function preloadImage(src, done, error) {
        var img = new Image();
        img.onload = function() {
            done(img, src);
        };
        img.onerror = function(err) {
            // TODO error reporting.
            console.log("TODO img preload failed", err);
            if (error) error(src);
        };
        img.src = src;
    }


    var rootEl = $(htmlTemplate);

    $(imgEl).before(rootEl);
    if (options.imgLoadingClass) $(imgEl).addClass(options.imgLoadingClass);

    var urlData = urlAdapterFromSrc(options.urlAdapter, options, imgEl.src);

    $.extend(options, urlData);
    if (!options.width) {
        // TODO maybe I have to use the original size instead of the options
        options.width = imgEl.width;
        options.height = imgEl.height;
    }

    // TODO we only support 1:1 aspect ratios.
    var wr = options.width / imgEl.width;
    var hr = options.height ? options.height / imgEl.height : wr;
    if (Math.abs(wr / hr - 1) > 0.01) {
        console.error("Unexpected aspect ratio: ", options.width, options.height, imgEl.width, imgEl.height, wr, hr);
    }
    // image pixels per image "html" size (so to support 2x 3x retina crops)
    options.ppp = wr;


    var thisVar = this,
        clippedEl = rootEl.find(".clipped"),
        cropperFrameEl = rootEl.find(".cropper-frame"),
        imageCropContainerEl = rootEl.find(".outer-image-container"),  // (b.find(".hidden-image"),    // u
        sliderEl = rootEl.find('.copper-zoom-slider'),
        origDisplay = $(imgEl).css("display"),
        disposing = false,
        closing = false,
        originalImageSize;


    var containerEl = false;
    if (typeof options.containerSelector !== 'undefined') {
        containerEl = $(options.containerSelector);
    }

    // Initialize the CropModel
    var cropModel = new CropModel(options);

    /** MODEL EVENT LISTENERS **/
    function setupModelEventListeners() {
        // Handle scale changes
        cropModel.on('scaleChanged', function(data) {
            var newSizes = {
                width: data.scaledSize.width+"px",
                height: data.scaledSize.height+"px"
            };
            clippedEl.css(newSizes);
            imageCropContainerEl.css(newSizes);
        });

        // Handle container position changes
        cropModel.on('containerPositionChanged', function(data) {
            var newSizes = {
                left: data.left+"px",
                top: data.top+"px"
            };
            imageCropContainerEl.css(newSizes);
            clippedEl.css(newSizes);
        });

        // Handle crop size changes
        cropModel.on('cropSizeChanged', function(data) {
            cropperFrameEl.css({ 
                height: data.height+"px", 
                width: data.width+"px" 
            });
            if (data.width !== undefined) {
                rootEl.css({ width: data.width+"px" });
            }
        });

        // Handle min scale changes
        cropModel.on('minScaleChanged', function(data) {
            sliderEl.slider({ min: _fromScaleToSliderValue(data.minScale) });
        });
    }

    var fullOriginalImgUrl = options.urlOriginal || (options.urlPrefix || '')+(options.urlPostfix || '');

    // if the fullOriginalImgUrl doesn't have a scheme, prepend http:// (cloudimage likes this)
    if (!fullOriginalImgUrl.match(/[a-z]+:/)) fullOriginalImgUrl = 'http://'+fullOriginalImgUrl;

    preloadImage(fullOriginalImgUrl, function(img, src) {
        rootEl.find(".original-src").attr('src', src);
        originalImageSize = {
            width: img.naturalWidth,
            height: img.naturalHeight
        };
        
        // Set the original image size in the crop model
        cropModel.setOriginalImageSize(originalImageSize);
        
        // Set up event listeners for model changes
        setupModelEventListeners();
        
        // initialize.call(thisVar);
        initialize();
    }, function(src) {
        // TODO handle initialization error
        setTimeout(dispose);
    });

    return {
        getScale: getScale,
        updateScale: updateScale,
        getCropHeight: getCropHeight,
        updateCropHeight: updateCropHeight,
        dispose: dispose,
    };

}

}(jQuery));
