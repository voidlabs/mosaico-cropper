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
          '<div class="copper-zoom-slider"></div>'+
          '<div class="tool-crop"><i class="fa fa-check" aria-hidden="true"></i></div>'+
          '</div>'+
          '<img draggable="false" class="clipped clipped-image original-src">'+
        '</div>'+
        '<div class="clip-handle ui-resizable-s"></div>'+
      '</div>'+
      '<div class="outer-image-container">'+
        '<img class="outer-image original-src">'+
      '</div>'+
    '</div>';

    /** GETTERS **/

    function getScaledImageSize(scale) {
        return {
            width: Math.round(originalImageSize.width * (scale || cropModel.scale)),
            height: Math.round(originalImageSize.height * (scale || cropModel.scale))
        };
    }

    function getCropHeight() {
        return cropModel.crop.Height;
    }

    function getScale() {
        return cropModel.scale;
    }

    function getMaxScale() {
        if (typeof options.maxScale !== 'undefined') return options.maxScale;
        else return 2;
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
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }


    /** DOM UPDATE METHODS **/

    function updateScaledImageSize(newScale) {
        if (cropModel.scale !== newScale) {
            cropModel.scale = newScale;
            var scaledSize = getScaledImageSize();
            var newSizes = {
                width: scaledSize.width+"px",
                height: scaledSize.height+"px"
            };
            clippedEl.css(newSizes);
            imageCropContainerEl.css(newSizes);
            return true;
        } else return false;
    }

    function updateCropperFrameSize(newCropHeight, newCropWidth) {
        cropModel.crop.height = newCropHeight;
        if (newCropWidth !== undefined) {
            cropModel.crop.width = newCropWidth;
            rootEl.css({ width: cropModel.crop.width+"px" });
        }
        cropperFrameEl.css({ height: cropModel.crop.height+"px", width: cropModel.crop.width+"px" });

        // Compute new minScale
        var widthRatio = options.width / originalImageSize.width,
            heightRatio = cropModel.crop.height / originalImageSize.height,
            minScale = Math.max(widthRatio, heightRatio);
        if (minScale !== cropModel.minScale) {
            cropModel.minScale = minScale;
            sliderEl.slider({ min: _fromScaleToSliderValue(minScale) });
        }
    }

    function updateCropContainerPanZoom(newLeft, newTop, newScale, updateCropContainer) {
        var changed = false;

        if (newScale !== undefined) {
            changed = updateScaledImageSize(newScale);
        }

        var scaledSize = getScaledImageSize();
        // Constraints
        if (newLeft !== undefined) {
            newLeft = checkRange(newLeft, cropModel.crop.width - scaledSize.width, 0);
            if (cropModel.container.left !== newLeft) {
                cropModel.container.left = newLeft;
                changed = true;
            }
        }

        if (newTop !== undefined) {
            newTop = checkRange(newTop, cropModel.crop.height - scaledSize.height, 0);
            if (cropModel.container.top !== newTop) {
                cropModel.container.top = newTop;
                changed = true;
            }
        }

        if (changed) {
            var newSizes = {
                left: cropModel.container.left+"px",
                top: cropModel.container.top+"px"
            };
            if (updateCropContainer === undefined || updateCropContainer) imageCropContainerEl.css(newSizes);
            // clippedEl.css("transform", "translateX("+cropModel.container.left+"px) translateY("+cropModel.container.top+"px)");
            clippedEl.css(newSizes);
        }

        return changed;
    }

    function updateScale(newScale, xp, yp, updateSlider) {
        var scaledSize = getScaledImageSize();
        if (xp == undefined) xp = (cropModel.crop.width / 2 - cropModel.container.left) / scaledSize.width;
        if (yp == undefined) yp = (cropModel.crop.height / 2 - cropModel.container.top) / scaledSize.height;

        newScale = checkRange(newScale, cropModel.minScale, getMaxScale());
        if (newScale !== cropModel.scale) {
            var newScaledSize = getScaledImageSize(newScale),
                xd = Math.round((newScaledSize.width - scaledSize.width) * xp),
                yd = Math.round((newScaledSize.height - scaledSize.height) * yp),
                newLeft = cropModel.container.left - xd,
                newTop = cropModel.container.top - yd;

            updateCropContainerPanZoom(newLeft, newTop, newScale);
            if (updateSlider !== false) sliderEl.slider("value", _fromScaleToSliderValue(newScale) );
        }
    }

    function updateCropHeightInternal(newHeight, origHeight, originalOuterTop, maxHeight) {
        // Containment. An alternative to "containment" would be auto-zooming when reaching the maxHeight (but de-zooming would be counter-intuitive)
        if (!options.autoZoom && newHeight > maxHeight) newHeight = maxHeight;

        // Crop using vertical centering
        var newOuterTop = Math.round((newHeight - origHeight) / 2) + originalOuterTop;
        if (newOuterTop > 0) newOuterTop = 0;

        updateCropperFrameSize(Math.round(newHeight));

        // Optional code to let the scale to be updated
        var newScale = getScale();
        if (newHeight > maxHeight) {
            newScale = newHeight / originalImageSize.height;
            updateScale(newScale);
        } else {
            updateCropContainerPanZoom(undefined, newOuterTop);
        }
    }

    function updateCropHeight(newHeight) {
        var origHeight = cropModel.crop.height;
        updateCropHeightInternal(newHeight, origHeight, cropModel.container.top, getScaledImageSize().height);
    }

    /** INITIALIZATION METHODS */

    function initializeResizer() { // g
        var originalOuterTop;
        var maxHeight;
        cropperFrameEl.resizable({
            minHeight: 40,
            handles: { s: '.clip-handle' },
            /* containment: outerEl, */ /* se voglio fare che il resize sposta sul centro non posso usare il containment */
            start: function(event, ui) {
                rootEl.focus();
                addMovingClass('handle');
                originalOuterTop = cropModel.container.top;
                maxHeight = getScaledImageSize().height;
            },
            stop: function(event, ui) {
                removeMovingClass();
                changed("resized");
            },
            resize: function(event, ui) {
                updateCropHeightInternal(ui.size.height, ui.originalSize.height, originalOuterTop, maxHeight);
                changed("resizing");
                ui.size.height = cropModel.crop.height;
                if (typeof widget !== 'undefined') widget._trigger('cropheight', null, { value: cropModel.crop.height });
            },
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
                ui.position.left = cropModel.container.left;
                ui.position.top = cropModel.container.top;
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

                var newScale = delta > 0 ? cropModel.scale*1.1 : (cropModel.scale/1.1);
                updateScale(newScale, xp, yp);
                changed("wheel");
            }

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
            min: Math.floor(_fromScaleToSliderValue(cropModel.minScale)),
            step: 1,
            value: Math.round(_fromScaleToSliderValue(cropModel.scale)),
            max: Math.ceil(_fromScaleToSliderValue(getMaxScale())), // zoom 2 means the output image will be very low quality (4 pixels from 1 original pixel)
            slide: function(event, ui) {
                var newScale = _fromSliderValueToScale(ui.value);
                updateScale(newScale, undefined, undefined, false);
                changed("slide");
                ui.value = _fromScaleToSliderValue(cropModel.scale);
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
        var newCropHeight, newLeft, newTop, newScale, newWidth;
        if (typeof options.resizeWidth !== 'undefined') {
            newScale = options.resizeWidth / originalImageSize.width;
            newCropHeight = options.height;
            newWidth = options.width;
            newLeft = -options.offsetX;
            newTop = -options.offsetY;
        } else if (typeof options.cropX2 !== 'undefined' || typeof options.cropWidth !== 'undefined') {
            // TODO error reporting for missing mandatory parameters.
            if (options.cropWidth == undefined) options.cropWidth = options.cropX2 - options.cropX;
            if (options.cropHeight == undefined) options.cropHeight = options.cropY2 - options.cropY;
            if (options.cropX == undefined) options.cropX = 0;
            if (options.cropY == undefined) options.cropY = 0;
            newScale = options.width / options.cropWidth;
            newCropHeight = options.height || options.cropHeight * newScale;
            newWidth = options.width;
            newLeft = Math.round(-options.cropX * newScale);
            newTop = Math.round(-options.cropY * newScale);
        } else {
            newScale = options.width / originalImageSize.width;
            newCropHeight = options.height || Math.round(originalImageSize.height * newScale);
            newWidth = options.width;
            var resizedSize = getScaledImageSize(newScale);
            newLeft = Math.round((newWidth - resizedSize.width) / 2);
            newTop = Math.round((newCropHeight - resizedSize.height) / 2);
        }

        updateCropperFrameSize(newCropHeight, newWidth);
        updateCropContainerPanZoom(newLeft, newTop, newScale);
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

        rootEl.focus();

        initializeSizes();
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

    function changed() { // n
        rootEl.addClass("cropper-has-changes");
    }

    function generateCurrentUrl() {
        var scaledSize = getScaledImageSize();
        var res = {
            resizeWidth: scaledSize.width,
            resizeHeight: scaledSize.height,
            offsetX: Math.max(-cropModel.container.left),
            offsetY: Math.max(-cropModel.container.top),
            cropX: Math.max(0, Math.round(-cropModel.container.left / cropModel.scale)),
            cropY: Math.max(0, Math.round(-cropModel.container.top / cropModel.scale)),
            cropWidth: Math.round(cropModel.crop.width / cropModel.scale),
            cropHeight: Math.round(cropModel.crop.height / cropModel.scale),            
            width: cropModel.crop.width,
            height: cropModel.crop.height,
            urlPrefix: options.urlPrefix,
            urlPostfix: options.urlPostfix,
            urlOriginal: options.urlOriginal,
            cropThenResize: options.cropX !== undefined,
        };
        res.cropX2 = res.cropX + res.cropWidth;
        res.cropY2 = res.cropY + res.cropHeight;
        var url = options.urlAdapter.toSrc(res);
        return url;
    }

    function updateOriginalImageSrc(done) { // n
        var url = generateCurrentUrl();

        rootEl.addClass("cropper-loading");

        preloadImage(url, function(img, src) {
            $(imgEl).attr('src', src);
            // not needed, as we're going to remove the whole element.
            rootEl.removeClass("cropper-loading");
            done();
        });

        rootEl.removeClass("cropper-has-changes");

        if (options.imgLoadingClass) $(imgEl).removeClass(options.imgLoadingClass);
    }

    function updateAndDispose() {
        if (!closing) {
            closing = true;
            updateOriginalImageSrc(dispose);
        }
    }

    function dispose(noCallback) {
        if (disposing) return;
        else disposing = true;

        if (containerEl) containerEl.removeClass("cropper-cropping");

        cropperFrameEl.resizable("destroy");
        imageCropContainerEl.draggable("destroy");
        sliderEl.slider("destroy");

        rootEl.remove();

        if (options.imgLoadingClass) $(imgEl).removeClass(options.imgLoadingClass);

        // rootEl.addClass("cropper-hidden");
        $(imgEl).css("display", origDisplay);

        if (!noCallback && typeof widget !== 'undefined') widget.destroy();
    }

    function preloadImage(src, done) {
        var img = new Image();
        img.onload = function() {
            done(img, src);
        };
        img.src = src;
    }


    var rootEl = $(htmlTemplate);

    $(imgEl).after(rootEl);
    if (options.imgLoadingClass) $(imgEl).addClass(options.imgLoadingClass);

    var urlAdapterResult = options.urlAdapter.fromSrc(imgEl.src);

    if (!urlAdapterResult) {
        if (options.urlAdapter.defaultPrefix !== undefined) {
            options.urlOriginal = imgEl.src;
            options.urlPrefix = options.urlAdapter.defaultPrefix;
            options.urlPostfix = imgEl.src;
        } else {
            // TODO handle bad parameters, log it and fails the initialization!
            console.error("FAILED PARSING", imgEl.src);
        }
    }

    $.extend(options, urlAdapterResult);
    if (!options.width) {
        options.width = imgEl.width;
        options.height = imgEl.height;
    }

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

    var cropModel = {
        container: {},
        crop: {},
      //minScale: 0,
    };

    var fullOriginalImgUrl = options.urlOriginal || (options.urlPrefix || '')+(options.urlPostfix || '');

    // if the fullOriginalImgUrl doesn't have a scheme, prepend http:// (cloudimage likes this)
    if (!fullOriginalImgUrl.match(/[a-z]+:/)) fullOriginalImgUrl = 'http://'+fullOriginalImgUrl;

    preloadImage(fullOriginalImgUrl, function(img, src) {
        rootEl.find(".original-src").attr('src', src);
        originalImageSize = {
            width: img.naturalWidth,
            height: img.naturalHeight
        };
        // initialize.call(thisVar);
        initialize();
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
