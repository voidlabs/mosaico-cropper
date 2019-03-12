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
        cropModel.crop.height = parseInt(newCropHeight);
        if (newCropWidth !== undefined) {
            cropModel.crop.width = parseInt(newCropWidth);
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

    function updateCropContainerPanZoom(newLeft, newTop, newScale, updateCropContainer, updateSlider) {
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

            if (newScale && updateSlider !== false) sliderEl.slider("value", _fromScaleToSliderValue(newScale) );
        }

        return changed;
    }

    function updatePanZoomToFitCropContainer() {
        // TODO this code is similar to the initializeSizes, maybe we should merge them.
        var newScale, newLeft, newTop;
        newScale = cropModel.minScale;
        var resizedSize = getScaledImageSize(newScale);
        newLeft = Math.round((cropModel.crop.width - resizedSize.width) / 2);
        newTop = Math.round((cropModel.crop.height - resizedSize.height) / 2);
        return updateCropContainerPanZoom(newLeft, newTop, newScale);
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

            updateCropContainerPanZoom(newLeft, newTop, newScale, undefined, updateSlider);
            return true;
        } else return false;
    }

    function updateCropHeightInternal(method, newHeight, origHeight, originalOuterTop, maxHeight) {
        // Containment. An alternative to "containment" would be auto-zooming when reaching the maxHeight (but de-zooming would be counter-intuitive)
        if (!options.autoZoom && newHeight > maxHeight) newHeight = maxHeight;

        newHeight = Math.round(newHeight);

        updateCropperFrameSize(newHeight);

        // If we are in a "basic" manipulation we want to be sure we stai in "cover" mode instead of cropresize.
        if (method == 'original' || method == 'cover' || method == 'resize') {
            updatePanZoomToFitCropContainer();
        // This deal with autozoom.
        } else if (newHeight > maxHeight) {
            var newScale = newHeight / originalImageSize.height;
            updateScale(newScale);
        } else {
            // Crop using vertical centering
            var newOuterTop = Math.round((newHeight - origHeight) / 2) + originalOuterTop;
            if (newOuterTop > 0) newOuterTop = 0;
            updateCropContainerPanZoom(undefined, newOuterTop);
        }
    }

    function updateCropHeight(newHeight) {
        var origHeight = cropModel.crop.height;
        updateCropHeightInternal(getCurrentComputedSizes().method, newHeight, origHeight, cropModel.container.top, getScaledImageSize().height);
        return origHeight !== cropModel.crop.height;
    }

    function updatePanZoomCropToFitWidthAndAspect() {
        var newScale = options.width / originalImageSize.width;
        var newHeight = Math.round(originalImageSize.height * newScale);
        // TODO maybe we could merge the updateScale in the updateCropHeight call.
        var changed = updateCropHeight(newHeight);
        changed = updateScale(newScale) || changed;
        return changed;
    }

    function updateSmartAutoResize() {
        var done = updatePanZoomToFitCropContainer();
        if (!done) {
            done = updatePanZoomCropToFitWidthAndAspect();
            if (!done) {
                updateScale(1);
            }
        }
        changed("autosize");
    }

    /** INITIALIZATION METHODS */

    function initializeResizer() { // g
        var originalOuterTop;
        var maxHeight;
        var originalMethod;
        cropperFrameEl.resizable({
            minHeight: 40,
            handles: { s: '.clip-handle' },
            /* containment: outerEl, */ /* se voglio fare che il resize sposta sul centro non posso usare il containment */
            start: function(event, ui) {
                rootEl.focus();
                addMovingClass('handle');
                originalOuterTop = cropModel.container.top;
                originalMethod = getCurrentComputedSizes().method;
                maxHeight = getScaledImageSize().height;
            },
            stop: function(event, ui) {
                removeMovingClass();
                changed("resized");
            },
            resize: function(event, ui) {
                updateCropHeightInternal(originalMethod, ui.size.height, ui.originalSize.height, originalOuterTop, maxHeight);
                changed("resizing");
                ui.size.height = cropModel.crop.height;
                if (typeof widget !== 'undefined') widget._trigger('cropheight', null, { value: cropModel.crop.height });
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
            // resizecrop
            newScale = options.resizeWidth / originalImageSize.width;
            newCropHeight = options.height;
            newWidth = options.width;
            newLeft = -options.offsetX;
            newTop = -options.offsetY;
        } else if (typeof options.cropX2 !== 'undefined' || typeof options.cropWidth !== 'undefined') {
            // cropresize
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
        } else if (typeof options.height !== 'undefined') {
            // cover
            newScale = Math.max(options.width / originalImageSize.width, options.height / originalImageSize.height);
            newWidth = Math.min(options.width, Math.round(originalImageSize.width * newScale));
            newCropHeight = Math.min(options.height, Math.round(originalImageSize.height * newScale));
            var resizedSize = getScaledImageSize(newScale);
            newLeft = Math.round((newWidth - resizedSize.width) / 2);
            newTop = Math.round((newCropHeight - resizedSize.height) / 2);
        } else if (typeof options.width) {
            // resize
            newScale = options.width / originalImageSize.width;
            newCropHeight = Math.round(originalImageSize.height * newScale);
            newWidth = options.width;
            newLeft = 0;
            newTop = 0;
        } else {
            // TODO error reporting unexpected parameters
        }

        updateCropperFrameSize(newCropHeight, newWidth);
        updateCropContainerPanZoom(newLeft, newTop, newScale);
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
        var ccs = getCurrentComputedSizes();
        // console.log("CURRENT METHOD", ccs.method);
        if (lastMethod !== ccs.method) {
            rootEl.removeClass("cropper-method-"+lastMethod);
            lastMethod = ccs.method;
            rootEl.addClass("cropper-method-"+lastMethod);
        }
    }

    function changed() { // n
        updateCropperMethod();
        rootEl.addClass("cropper-has-changes");
    }

    function _stringTemplate(string, obj) {
        // if a token is in the {token:something} format, then ":something" is completely ignored
        return string.replace(/\{([^[\}:]+)(?::[^\}]+)?\}/g, function(match, contents, offset, input_string) {
            if (obj.hasOwnProperty(contents)) {
                return obj[contents] !== undefined ? obj[contents] : '';
            } else {
                return match;
            }
        });
    }

    function getCurrentComputedSizes() {
        var scaledSize = getScaledImageSize();

        var l = -cropModel.container.left,
            r = scaledSize.width - cropModel.crop.width + cropModel.container.left,
            t = -cropModel.container.top,
            b = scaledSize.height - cropModel.crop.height + cropModel.container.top;

        var res = {
            resizeWidth: scaledSize.width,
            resizeHeight: scaledSize.height,
            offsetX: Math.max(0, -cropModel.container.left),
            offsetY: Math.max(0, -cropModel.container.top),
            cropX: Math.max(0, Math.round(l / cropModel.scale)),
            cropY: Math.max(0, Math.round(t / cropModel.scale)),
            cropWidth: Math.round(cropModel.crop.width / cropModel.scale),
            cropHeight: Math.round(cropModel.crop.height / cropModel.scale),            
            width: cropModel.crop.width,
            height: cropModel.crop.height
        };

        res.cropX2 = res.cropX + res.cropWidth;
        res.cropY2 = res.cropY + res.cropHeight;
        // TODO check X2 vs X2b
        // res.cropX2b = Math.round((l+cropModel.crop.width) / cropModel.scale); // Math.min(originalImageSize.width, );
        // res.cropY2b = Math.round((t+cropModel.crop.height) / cropModel.scale); // Math.min(originalImageSize.height, );
        // if (res.cropX2 !== res.cropX2b) console.debug("TODO check best X2 pos: ", res.cropX2, res.cropX2b);
        // if (res.cropY2 !== res.cropY2b) console.debug("TODO check best Y2 pos: ", res.cropY2, res.cropY2b);
        // TODO check out of bound indexes (we have protections on negative numbers, but not on the max width/height/right/bottom)

        var dx = Math.abs(l-r),
            dy = Math.abs(t-b);

        res.method = options.resizeWidth !== undefined ? 'resizecrop' : 'cropresize';
        if (dx <= 1 && dy <= 1 && (l === 0 || t === 0)) {
            if (l === 0 && t === 0) res.method = cropModel.scale !== 1 ? 'resize' : 'original';
            else res.method = 'cover';
        }

        return res;
    }


    var methods = [ 'original', 'resize', 'cover', 'cropresize', 'resizecrop' ];

    function generateCurrentUrl() {
        var res = getCurrentComputedSizes();
        res.urlPrefix = options.urlPrefix;
        res.urlPostfix = options.urlPostfix;
        res.urlOriginal = options.urlOriginal;
        res.encodedUrlOriginal = encodeURIComponent(options.urlOriginal);

        var toSrc = options.urlAdapter.toSrc;
        if (typeof toSrc == 'object') {
            for (var i = methods.indexOf(res.method); i < methods.length; i++) {
                if (typeof toSrc[methods[i]] !== 'undefined') {
                    toSrc = toSrc[methods[i]];
                    // console.log("Using method "+methods[i]+" for original method "+res.method+":", toSrc);
                    break;
                }
            }
        }
        if (typeof toSrc == 'string') {
            toSrc = _stringTemplate.bind(undefined, toSrc);
            // console.log("Mapping method string to function", toSrc);
        }
        return toSrc(res);
    }

    function updateOriginalImageSrc(done, fail) { // n
        try {
            var url = generateCurrentUrl();

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


    var _urlParserPatterns = {
        encodedUrlOriginal: '[^ &\\?]+',
        width: '[0-9]+',
        height: '[0-9]+',
        resizeWidth: '[0-9]+',
        resizeHeight: '[0-9]+',
        offsetX: '[0-9]+',
        offsetY: '[0-9]+',
        cropWidth: '[0-9]+',
        cropHeight: '[0-9]+',
        cropX: '[0-9]+',
        cropY: '[0-9]+',
        cropX2: '[0-9]+',
        cropY2: '[0-9]+',
    };

    // pattern is a pseudo regex where {tokens} are replaced with "[0-9]+" and  {tokens:regex} are replaced with "regex"
    // the matcher remember the tokens names and returns a matching object using named matches, like named capture groups 
    // (named capture groups have been implemented only by ES2018, so we can't use them)
    function _urlParser(pattern, customPatterns, url) {
        var matchNames = [];
        var regex = new RegExp('^'+pattern.replace(/\\.|(\((?!\?[!:=]))|\{([^:\}]+)(?::([^\}]+))?\}/g, function(match, braket, groupName, subPattern, offset, input_string) {
            // console.log("X", match, braket, groupName, subPattern, offset, input_string);
            if (braket) {
                // existing regex match
                matchNames.push('');
                return match;
            } else if (groupName) {
                // named group
                matchNames.push(groupName);
                if (!subPattern) {
                    if (_urlParserPatterns[groupName]) subPattern = _urlParserPatterns[groupName];
                    else if (customPatterns !== undefined && customPatterns[groupName]) subPattern = customPatterns[groupName];
                }
                if (subPattern) {
                    // deal with sub patterns matching groups
                    subPattern.replace(/\\.|(\((?!\?[!:=]))/g, function(innerMatch, innerBraket) {
                        if (innerBraket) matchNames.push('');
                        return match;
                    });
                    return '('+subPattern+')';
                // encodedUrlOriginal may not have "http://" prefix
                }
                // else if (_urlParserPatterns[groupName]) return '('+_urlParserPatterns[groupName]+')';
                // else if (customPatterns !== undefined && customPatterns[groupName]) return '('+customPatterns[groupName]+')';
                else {
                    console.error(pattern, url, customPatterns);
                    throw "Uknown token "+groupName+", please use {"+groupName+":regex} or use a known pattern";
                }
            } else {
                // escaped char
                return match;
            }
        })+'$');

        var res = url.match(regex);

        var matches = null;
        if (res !== null) {
            if (res.length !== matchNames.length + 1) {
                // TODO improve error reporting
                console.log("ERROR parsing pattern!", pattern, matchNames, res);
            }
            matches = {};
            for (var i = 0; i < matchNames.length; i++) {
                if (matchNames[i] !== '' && res[i+1] !== undefined) {
                    matches[matchNames[i]] = res[i+1];
                }
            }
        }
        // console.log("p", matches, pattern, url, matchNames, regex);
        return matches;
    }


    var rootEl = $(htmlTemplate);

    $(imgEl).after(rootEl);
    if (options.imgLoadingClass) $(imgEl).addClass(options.imgLoadingClass);

    var fromSrc = options.urlAdapter.fromSrc;
    if (typeof fromSrc == 'object') {
        var toSrc = options.urlAdapter.toSrc;
        var patterns = [];
        for (var p in toSrc) if (toSrc.hasOwnProperty(p)) {
            // escaping regexp special chars, excluding {} that we use for tokens.
            patterns.push(toSrc[p].replace(/[.*+?^$()|[\]\\]/g, '\\$&'));
        }
        var composedPattern = "("+patterns.join("|")+")";
        var origFromSrc = fromSrc;
        fromSrc = _urlParser.bind(undefined, composedPattern, origFromSrc);
    }
    if (typeof fromSrc == 'string') {
        fromSrc = _urlParser.bind(undefined, fromSrc, undefined);
    }
    var urlAdapterResult = fromSrc(imgEl.src);

    if (!urlAdapterResult) {
        if (options.urlAdapter.defaultPrefix !== undefined) {
            options.urlOriginal = imgEl.src;
            options.urlPrefix = options.urlAdapter.defaultPrefix;
            options.urlPostfix = imgEl.src;
        } else {
            // TODO handle bad parameters, log it and fails the initialization!
            console.error("FAILED PARSING", imgEl.src);
        }
    } else if (urlAdapterResult.encodedUrlOriginal) {
        urlAdapterResult.urlOriginal = decodeURIComponent(urlAdapterResult.encodedUrlOriginal);
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
