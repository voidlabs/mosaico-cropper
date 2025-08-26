/**
 * CropModel - Gestisce lo stato del modello di cropping separato dalla UI
 */
export class CropModel {
    constructor(options = {}, originalImageSize) {
        if (!originalImageSize) {
            throw new Error('CropModel requires originalImageSize parameter');
        }
        
        this.state = {
            container: { left: 0, top: 0 },
            crop: { width: 0, height: 0 },
            scale: 1,
            minScale: 0
        };
        this.originalImageSize = originalImageSize;
        this.options = options;
        this.listeners = {};
    }

    /** EVENT SYSTEM **/
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /** GETTERS **/

    getCropHeight() {
        return this.state.crop.height;
    }

    getScale() {
        return this.state.scale;
    }

    getMaxScale() {
        if (typeof this.options.maxScale !== 'undefined') return this.options.maxScale;
        else return 2;
    }

    getScaledImageSize(scale) {
        return {
            width: Math.round(this.originalImageSize.width * (scale || this.state.scale)),
            height: Math.round(this.originalImageSize.height * (scale || this.state.scale))
        };
    }

    /** UTILITIES **/

    checkRange(value, min, max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    /** PURE CALCULATIONS **/

    getCurrentComputedMethod() {
        return this.getCurrentComputedSizes().method;
    }

    getCurrentComputedSizes() {
        var scaledSize = this.getScaledImageSize();

        var width = scaledSize.width,
            height = scaledSize.height,
            scale = this.state.scale;

        var l = -this.state.container.left,
            r = width - this.state.crop.width + this.state.container.left,
            t = -this.state.container.top,
            b = height - this.state.crop.height + this.state.container.top;

        // TODO should get this from an option, but maybe not the way 
        var ppp = 1;
        if (typeof this.options.ppp !== 'undefined') ppp = this.options.ppp;
        // TODO we should support non integer ppps too.
        if (ppp * scale > 1) ppp = Math.ceil(1 / scale);

        var res = {
            resizeWidth: Math.round(width * ppp),
            resizeHeight: Math.round(height * ppp),
            offsetX: Math.round(Math.max(0, -this.state.container.left) * ppp),
            offsetY: Math.round(Math.max(0, -this.state.container.top) * ppp),
            cropX: Math.max(0, Math.round(l / scale)),
            cropY: Math.max(0, Math.round(t / scale)),
            cropWidth: Math.round(this.state.crop.width / scale),
            cropHeight: Math.round(this.state.crop.height / scale),
            width: Math.round(this.state.crop.width * ppp),
            height: Math.round(this.state.crop.height * ppp),
            _scale: scale
        };

        res.cropX2 = res.cropX + res.cropWidth;
        res.cropY2 = res.cropY + res.cropHeight;

        var dx = Math.abs(l-r),
            dy = Math.abs(t-b);

        res.method = this.options.resizeWidth !== undefined ? 'resizecrop' : 'cropresize';
        if (dx <= 1 && dy <= 1 && (l === 0 || t === 0)) {
            if (l === 0 && t === 0) res.method = scale !== 1 ? 'resize' : 'original';
            else res.method = 'cover';
        }

        return res;
    }

    /** MODEL UPDATE METHODS **/

    updateScale(newScale, xp, yp) {
        var scaledSize = this.getScaledImageSize();
        if (xp == undefined) xp = (this.state.crop.width / 2 - this.state.container.left) / scaledSize.width;
        if (yp == undefined) yp = (this.state.crop.height / 2 - this.state.container.top) / scaledSize.height;

        newScale = this.checkRange(newScale, this.state.minScale, this.getMaxScale());
        if (newScale !== this.state.scale) {
            var newScaledSize = this.getScaledImageSize(newScale),
                xd = Math.round((newScaledSize.width - scaledSize.width) * xp),
                yd = Math.round((newScaledSize.height - scaledSize.height) * yp),
                newLeft = this.state.container.left - xd,
                newTop = this.state.container.top - yd;

            this.updateCropContainerPanZoom(newLeft, newTop, newScale);
            return true;
        } else return false;
    }

    updateScaledImageSize(newScale) {
        if (this.state.scale !== newScale) {
            this.state.scale = newScale;
            var scaledSize = this.getScaledImageSize();
            
            this.emit('scaleChanged', {
                scale: newScale,
                scaledSize: scaledSize
            });
            return true;
        } else return false;
    }

    updateCropperFrameSize(newCropHeight, newCropWidth) {
        var changed = false;
        
        if (newCropHeight !== undefined) {
            this.state.crop.height = parseInt(newCropHeight);
            changed = true;
        }
        if (newCropWidth !== undefined) {
            this.state.crop.width = parseInt(newCropWidth);
            changed = true;
        }

        if (changed) {
            // Compute new minScale
            if (this.originalImageSize && this.options.width) {
                var widthRatio = this.options.width / this.originalImageSize.width,
                    heightRatio = this.state.crop.height / this.originalImageSize.height,
                    minScale = Math.max(widthRatio, heightRatio);
                if (minScale !== this.state.minScale) {
                    this.state.minScale = minScale;
                    this.emit('minScaleChanged', { minScale: minScale });
                }
            }

            this.emit('cropSizeChanged', {
                width: this.state.crop.width,
                height: this.state.crop.height
            });
        }
    }

    updateCropContainerPanZoom(newLeft, newTop, newScale) {
        var changed = false;

        if (newScale !== undefined) {
            changed = this.updateScaledImageSize(newScale);
        }

        var scaledSize = this.getScaledImageSize();
        
        // Constraints
        if (newLeft !== undefined) {
            newLeft = this.checkRange(newLeft, this.state.crop.width - scaledSize.width, 0);
            if (this.state.container.left !== newLeft) {
                this.state.container.left = newLeft;
                changed = true;
            }
        }

        if (newTop !== undefined) {
            newTop = this.checkRange(newTop, this.state.crop.height - scaledSize.height, 0);
            if (this.state.container.top !== newTop) {
                this.state.container.top = newTop;
                changed = true;
            }
        }

        if (changed) {
            this.emit('containerPositionChanged', {
                left: this.state.container.left,
                top: this.state.container.top
            });
        }

        return changed;
    }

    updatePanZoomToFitCropContainer() {
        // TODO this code is similar to the initializeSizes, maybe we should merge them.
        var newScale, newLeft, newTop;
        newScale = this.state.minScale;
        var resizedSize = this.getScaledImageSize(newScale);
        newLeft = Math.round((this.state.crop.width - resizedSize.width) / 2);
        newTop = Math.round((this.state.crop.height - resizedSize.height) / 2);
        return this.updateCropContainerPanZoom(newLeft, newTop, newScale);
    }

    updateCropHeightInternal(method, newHeight, origHeight, originalOuterTop, maxHeight) {
        // Containment. An alternative to "containment" would be auto-zooming when reaching the maxHeight (but de-zooming would be counter-intuitive)
        if (!this.options.autoZoom && newHeight > maxHeight) newHeight = maxHeight;

        newHeight = Math.round(newHeight);

        this.updateCropperFrameSize(newHeight);

        // If we are in a "basic" manipulation we want to be sure we stay in "cover" mode instead of cropresize.
        if (method == 'original' || method == 'cover' || method == 'resize') {
            this.updatePanZoomToFitCropContainer();
        // This deal with autozoom.
        } else if (newHeight > maxHeight) {
            var newScale = newHeight / this.originalImageSize.height;
            this.updateScale(newScale);
        } else {
            // Crop using vertical centering
            var newOuterTop = Math.round((newHeight - origHeight) / 2) + originalOuterTop;
            if (newOuterTop > 0) newOuterTop = 0;
            this.updateCropContainerPanZoom(undefined, newOuterTop);
        }
    }

    updateCropHeight(newHeight) {
        var origHeight = this.state.crop.height;
        this.updateCropHeightInternal(this.getCurrentComputedMethod(), newHeight, origHeight, this.state.container.top, this.getScaledImageSize().height);
        return origHeight !== this.state.crop.height;
    }

    updatePanZoomCropToFitWidthAndAspect() {
        if (!this.options.width) return false;
        
        var newScale = this.options.width / this.originalImageSize.width;
        var newHeight = Math.round(this.originalImageSize.height * newScale);
        // TODO maybe we could merge the updateScale in the updateCropHeight call.
        var changed = this.updateCropHeight(newHeight);
        changed = this.updateScale(newScale) || changed;
        return changed;
    }

    updateSmartAutoResize() {
        var done = this.updatePanZoomToFitCropContainer();
        if (!done) {
            // TODO: This step should be available only when resizer is available.
            done = this.updatePanZoomCropToFitWidthAndAspect();
            if (!done) {
                this.updateScale(1);
            }
        }
        this.emit('modelUpdated', { reason: 'autosize' });
    }

    initializeSizes() {
        var newCropHeight, newLeft, newTop, newScale, newWidth;

        // resizeWith, resizeHeight, offsetX, offestY, width and height must be manipulated according to "ppp"
        // crop* instead must not be changed.
        if (typeof this.options.ppp !== 'undefined') {
            // console.log("ppp", this.options.ppp, this.options.width, Math.round(this.options.width / this.options.ppp));
            // TODO when ppp is used we should not overwrite input options but only work on internal variables
            // but some code still reads input options.
            this.options.width = Math.round(this.options.width / this.options.ppp);
            if (typeof this.options.height !== 'undefined') this.options.height = Math.round(this.options.height / this.options.ppp);
            if (typeof this.options.resizeWidth !== 'undefined') this.options.resizeWidth = Math.round(this.options.resizeWidth / this.options.ppp);
            if (typeof this.options.resizeHeight !== 'undefined') this.options.resizeHeight = Math.round(this.options.resizeHeight / this.options.ppp);
            if (typeof this.options.offsetX !== 'undefined') this.options.offsetX = Math.round(this.options.offsetX / this.options.ppp);
            if (typeof this.options.offsetY !== 'undefined') this.options.offsetY = Math.round(this.options.offsetY / this.options.ppp);
        }

        if (typeof this.options.resizeWidth !== 'undefined') {
            // resizecrop
            newScale = this.options.resizeWidth / this.originalImageSize.width;
            newCropHeight = this.options.height;
            newWidth = this.options.width;
            newLeft = -this.options.offsetX;
            newTop = -this.options.offsetY;
        } else if (typeof this.options.cropX2 !== 'undefined' || typeof this.options.cropWidth !== 'undefined') {
            // cropresize
            // TODO error reporting for missing mandatory parameters.
            if (this.options.cropWidth == undefined) this.options.cropWidth = this.options.cropX2 - this.options.cropX;
            if (this.options.cropHeight == undefined) this.options.cropHeight = this.options.cropY2 - this.options.cropY;
            if (this.options.cropX == undefined) this.options.cropX = 0;
            if (this.options.cropY == undefined) this.options.cropY = 0;
            newScale = this.options.width / this.options.cropWidth;
            newCropHeight = this.options.height || this.options.cropHeight * newScale;
            newWidth = this.options.width;
            newLeft = Math.round(-this.options.cropX * newScale);
            newTop = Math.round(-this.options.cropY * newScale);
        } else if (typeof this.options.height !== 'undefined') {
            // cover
            newScale = Math.max(this.options.width / this.originalImageSize.width, this.options.height / this.originalImageSize.height);
            newWidth = Math.min(this.options.width, Math.round(this.originalImageSize.width * newScale));
            newCropHeight = Math.min(this.options.height, Math.round(this.originalImageSize.height * newScale));
            var resizedSize = this.getScaledImageSize(newScale);
            newLeft = Math.round((newWidth - resizedSize.width) / 2);
            newTop = Math.round((newCropHeight - resizedSize.height) / 2);
        } else if (typeof this.options.width) {
            // resize
            newScale = this.options.width / this.originalImageSize.width;
            newCropHeight = Math.round(this.originalImageSize.height * newScale);
            newWidth = this.options.width;
            newLeft = 0;
            newTop = 0;
        } else {
            // TODO error reporting unexpected parameters
        }

        this.updateCropperFrameSize(newCropHeight, newWidth);
        this.updateCropContainerPanZoom(newLeft, newTop, newScale);
        // Note: updateCropperMethod() will be called by the main widget
    }
}