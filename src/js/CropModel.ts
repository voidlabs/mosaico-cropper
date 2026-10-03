import type { CropperOptions, Size, Position, CropMethod, CropResult } from '../types.js';
interface ModelEvents { scaleChanged: { scale: number; scaledSize: Size }; minScaleChanged: { minScale: number }; cropSizeChanged: Size; containerPositionChanged: Position; modelUpdated: { reason: string } }
/**
 * CropModel - Gestisce lo stato del modello di cropping separato dalla UI
 */
export class CropModel {
    state: { container: Position; crop: Size; scale: number; minScale: number };
    originalImageSize: Size;
    options: CropperOptions;
    processedOptions: CropperOptions;
    listeners: { [K in keyof ModelEvents]?: Array<(data: ModelEvents[K]) => void> };
    constructor(options: CropperOptions = {}, originalImageSize: Size) {
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
        
        // Processed options - valori calcolati/modificati separati dalle options originali
        this.processedOptions = {
            width: options.width,
            height: options.height,
            resizeWidth: options.resizeWidth,
            resizeHeight: options.resizeHeight,
            offsetX: options.offsetX,
            offsetY: options.offsetY,
            cropX: options.cropX,
            cropY: options.cropY,
            cropWidth: options.cropWidth,
            cropHeight: options.cropHeight
        };
    }

    /** EVENT SYSTEM **/
    
    on<K extends keyof ModelEvents>(event: K, callback: (data: ModelEvents[K]) => void) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit<K extends keyof ModelEvents>(event: K, data: ModelEvents[K]) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /** GETTERS **/

    getCropHeight() {
        return this.state.crop.height;
    }

    getCropWidth() {
        return this.state.crop.width;
    }

    getScale() {
        return this.state.scale;
    }

    getMinScale() {
        return this.state.minScale;
    }

    getMaxScale() {
        if (typeof this.options.maxScale !== 'undefined') return this.options.maxScale;
        else return 2;
    }

    getContainerLeft() {
        return this.state.container.left;
    }

    getContainerTop() {
        return this.state.container.top;
    }

    getContainerPosition() {
        return {
            left: this.state.container.left,
            top: this.state.container.top
        };
    }

    getCropDimensions() {
        return {
            width: this.state.crop.width,
            height: this.state.crop.height
        };
    }

    getScaledImageSize(scale?: number) {
        return {
            width: Math.round(this.originalImageSize.width * (scale || this.state.scale)),
            height: Math.round(this.originalImageSize.height * (scale || this.state.scale))
        };
    }

    /** UTILITIES **/

    checkRange(value: number, min: number, max: number) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    /** PURE CALCULATIONS **/

    getCurrentComputedMethod() {
        return this.getCurrentComputedSizes().method;
    }

    getCurrentComputedSizes() {
        const scaledSize = this.getScaledImageSize();

        const width = scaledSize.width,
            height = scaledSize.height,
            scale = this.state.scale;

        const l = -this.state.container.left,
            r = width - this.state.crop.width + this.state.container.left,
            t = -this.state.container.top,
            b = height - this.state.crop.height + this.state.container.top;

        // TODO should get this from an option, but maybe not the way 
        let ppp = 1;
        if (typeof this.options.ppp !== 'undefined') ppp = this.options.ppp;
        // TODO we should support non integer ppps too.
        if (ppp * scale > 1) ppp = Math.ceil(1 / scale);

        const res: CropResult = {
            method: 'cropresize', cropX2: 0, cropY2: 0,
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

        const dx = Math.abs(l-r),
            dy = Math.abs(t-b);

        res.method = this.processedOptions.resizeWidth !== undefined ? 'resizecrop' : 'cropresize';
        if (dx <= 1 && dy <= 1 && (l === 0 || t === 0)) {
            if (l === 0 && t === 0) res.method = scale !== 1 ? 'resize' : 'original';
            else res.method = 'cover';
        }

        return res;
    }

    /** MODEL UPDATE METHODS **/

    updateScale(newScale: number, xp?: number, yp?: number) {
        const scaledSize = this.getScaledImageSize();
        if (xp == undefined) xp = (this.state.crop.width / 2 - this.state.container.left) / scaledSize.width;
        if (yp == undefined) yp = (this.state.crop.height / 2 - this.state.container.top) / scaledSize.height;

        newScale = this.checkRange(newScale, this.state.minScale, this.getMaxScale());
        if (newScale !== this.state.scale) {
            const newScaledSize = this.getScaledImageSize(newScale),
                xd = Math.round((newScaledSize.width - scaledSize.width) * xp),
                yd = Math.round((newScaledSize.height - scaledSize.height) * yp),
                newLeft = this.state.container.left - xd,
                newTop = this.state.container.top - yd;

            this.updateCropContainerPanZoom(newLeft, newTop, newScale);
            return true;
        } else return false;
    }

    updateScaledImageSize(newScale: number) {
        if (this.state.scale !== newScale) {
            this.state.scale = newScale;
            const scaledSize = this.getScaledImageSize();
            
            this.emit('scaleChanged', {
                scale: newScale,
                scaledSize: scaledSize
            });
            return true;
        } else return false;
    }

    updateCropperFrameSize(newCropHeight?: number, newCropWidth?: number) {
        let changed = false;
        
        if (newCropHeight !== undefined) {
            this.state.crop.height = parseInt(String(newCropHeight));
            changed = true;
        }
        if (newCropWidth !== undefined) {
            this.state.crop.width = parseInt(String(newCropWidth));
            changed = true;
        }

        if (changed) {
            // Compute new minScale
            if (this.originalImageSize && this.processedOptions.width!) {
                const widthRatio = this.processedOptions.width! / this.originalImageSize.width,
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

    updateCropContainerPanZoom(newLeft?: number, newTop?: number, newScale?: number) {
        let changed = false;

        if (newScale !== undefined) {
            changed = this.updateScaledImageSize(newScale);
        }

        const scaledSize = this.getScaledImageSize();
        
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
        let newScale, newLeft, newTop;
        newScale = this.state.minScale;
        const resizedSize = this.getScaledImageSize(newScale);
        newLeft = Math.round((this.state.crop.width - resizedSize.width) / 2);
        newTop = Math.round((this.state.crop.height - resizedSize.height) / 2);
        return this.updateCropContainerPanZoom(newLeft, newTop, newScale);
    }

    updateCropHeightInternal(method: CropMethod, newHeight: number, origHeight: number, originalOuterTop: number, maxHeight: number) {
        // Containment. An alternative to "containment" would be auto-zooming when reaching the maxHeight (but de-zooming would be counter-intuitive)
        if (!this.options.autoZoom && newHeight > maxHeight) newHeight = maxHeight;

        newHeight = Math.round(newHeight);

        this.updateCropperFrameSize(newHeight);

        // If we are in a "basic" manipulation we want to be sure we stay in "cover" mode instead of cropresize.
        if (method == 'original' || method == 'cover' || method == 'resize') {
            this.updatePanZoomToFitCropContainer();
        // This deal with autozoom.
        } else if (newHeight > maxHeight) {
            const newScale = newHeight / this.originalImageSize.height;
            this.updateScale(newScale);
        } else {
            // Crop using vertical centering
            let newOuterTop = Math.round((newHeight - origHeight) / 2) + originalOuterTop;
            if (newOuterTop > 0) newOuterTop = 0;
            this.updateCropContainerPanZoom(undefined, newOuterTop);
        }
    }

    updateCropHeight(newHeight: number) {
        const origHeight = this.state.crop.height;
        this.updateCropHeightInternal(this.getCurrentComputedMethod(), newHeight, origHeight, this.state.container.top, this.getScaledImageSize().height);
        return origHeight !== this.state.crop.height;
    }

    updatePanZoomCropToFitWidthAndAspect() {
        if (!this.processedOptions.width!) return false;
        
        const newScale = this.processedOptions.width! / this.originalImageSize.width;
        const newHeight = Math.round(this.originalImageSize.height * newScale);
        // TODO maybe we could merge the updateScale in the updateCropHeight call.
        let changed = this.updateCropHeight(newHeight);
        changed = this.updateScale(newScale) || changed;
        return changed;
    }

    updateSmartAutoResize() {
        let done = this.updatePanZoomToFitCropContainer();
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
        let newCropHeight, newLeft, newTop, newScale, newWidth;

        // resizeWith, resizeHeight, offsetX, offestY, width and height must be manipulated according to "ppp"
        // crop* instead must not be changed.
        if (typeof this.options.ppp !== 'undefined') {
            // console.log("ppp", this.options.ppp, this.options.width, Math.round(this.options.width! / this.options.ppp));
            // Process values with ppp and store in processedOptions instead of modifying original options
            if (typeof this.processedOptions.width !== 'undefined') this.processedOptions.width = Math.round(this.processedOptions.width! / this.options.ppp);
            if (typeof this.processedOptions.height !== 'undefined') this.processedOptions.height = Math.round(this.processedOptions.height! / this.options.ppp);
            if (typeof this.processedOptions.resizeWidth !== 'undefined') this.processedOptions.resizeWidth = Math.round(this.processedOptions.resizeWidth / this.options.ppp);
            if (typeof this.processedOptions.resizeHeight !== 'undefined') this.processedOptions.resizeHeight = Math.round(this.processedOptions.resizeHeight / this.options.ppp);
            if (typeof this.processedOptions.offsetX !== 'undefined') this.processedOptions.offsetX = Math.round(this.processedOptions.offsetX! / this.options.ppp);
            if (typeof this.processedOptions.offsetY !== 'undefined') this.processedOptions.offsetY = Math.round(this.processedOptions.offsetY! / this.options.ppp);
        }

        if (typeof this.processedOptions.resizeWidth !== 'undefined') {
            // resizecrop
            newScale = this.processedOptions.resizeWidth / this.originalImageSize.width;
            newCropHeight = this.processedOptions.height;
            newWidth = this.processedOptions.width;
            newLeft = -this.processedOptions.offsetX!;
            newTop = -this.processedOptions.offsetY!;
        } else if (typeof this.options.cropX2 !== 'undefined' || typeof this.options.cropWidth !== 'undefined') {
            // cropresize
            // TODO error reporting for missing mandatory parameters.
            if (this.processedOptions.cropWidth == undefined) this.processedOptions.cropWidth = this.options.cropX2! - this.options.cropX!;
            if (this.processedOptions.cropHeight == undefined) this.processedOptions.cropHeight = this.options.cropY2! - this.options.cropY!;
            if (this.processedOptions.cropX == undefined) this.processedOptions.cropX = 0;
            if (this.processedOptions.cropY == undefined) this.processedOptions.cropY = 0;
            newScale = this.processedOptions.width! / this.processedOptions.cropWidth;
            newCropHeight = this.processedOptions.height || this.processedOptions.cropHeight! * newScale;
            newWidth = this.processedOptions.width;
            newLeft = Math.round(-this.processedOptions.cropX! * newScale);
            newTop = Math.round(-this.processedOptions.cropY! * newScale);
        } else if (typeof this.processedOptions.height !== 'undefined') {
            // cover
            newScale = Math.max(this.processedOptions.width! / this.originalImageSize.width, this.processedOptions.height! / this.originalImageSize.height);
            newWidth = Math.min(this.processedOptions.width!, Math.round(this.originalImageSize.width * newScale));
            newCropHeight = Math.min(this.processedOptions.height, Math.round(this.originalImageSize.height * newScale));
            const resizedSize = this.getScaledImageSize(newScale);
            newLeft = Math.round((newWidth - resizedSize.width) / 2);
            newTop = Math.round((newCropHeight - resizedSize.height) / 2);
        } else if (typeof this.processedOptions.width!) {
            // resize
            newScale = this.processedOptions.width! / this.originalImageSize.width;
            newCropHeight = Math.round(this.originalImageSize.height * newScale);
            newWidth = this.processedOptions.width;
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