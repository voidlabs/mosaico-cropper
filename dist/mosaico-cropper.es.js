const _urlParserPatterns = {
  encodedUrlOriginal: "[^ &\\?]+",
  width: "[0-9]+",
  height: "[0-9]+",
  resizeWidth: "[0-9]+",
  resizeHeight: "[0-9]+",
  offsetX: "[0-9]+",
  offsetY: "[0-9]+",
  cropWidth: "[0-9]+",
  cropHeight: "[0-9]+",
  cropX: "[0-9]+",
  cropY: "[0-9]+",
  cropX2: "[0-9]+",
  cropY2: "[0-9]+"
};
const methods = ["original", "resize", "cover", "cropresize", "resizecrop"];
function _urlParser(pattern, customPatterns, url) {
  const matchNames = [];
  const regex = new RegExp("^" + pattern.replace(/\\.|(\((?!\?[!:=]))|\{([^:\}]+)(?::([^\}]+))?\}/g, function(match, braket, groupName, subPattern, offset, input_string) {
    if (braket) {
      matchNames.push("");
      return match;
    } else if (groupName) {
      matchNames.push(groupName);
      if (!subPattern) {
        if (_urlParserPatterns[groupName]) subPattern = _urlParserPatterns[groupName];
        else if (customPatterns !== void 0 && customPatterns[groupName]) subPattern = customPatterns[groupName];
      }
      if (subPattern) {
        subPattern.replace(/\\.|(\((?!\?[!:=]))/g, function(innerMatch, innerBraket) {
          if (innerBraket) matchNames.push("");
          return match;
        });
        return "(" + subPattern + ")";
      } else {
        console.error(pattern, url, customPatterns);
        throw "Uknown token " + groupName + ", please use {" + groupName + ":regex} or use a known pattern";
      }
    } else {
      return match;
    }
  }) + "$");
  const res = url.match(regex);
  let matches = null;
  if (res !== null) {
    if (res.length !== matchNames.length + 1) {
      console.log("ERROR parsing image url according to pattern!", pattern, matchNames, res);
    }
    matches = {};
    for (let i = 0; i < matchNames.length; i++) {
      if (matchNames[i] !== "" && res[i + 1] !== void 0) {
        matches[matchNames[i]] = res[i + 1];
      }
    }
  }
  return matches;
}
function _stringTemplate(string, obj) {
  return string.replace(/\{([^[\}:]+)(?::[^\}]+)?\}/g, function(match, contents, offset, input_string) {
    if (obj.hasOwnProperty(contents)) {
      return obj[contents] !== void 0 ? obj[contents] : "";
    } else {
      return match;
    }
  });
}
class UrlHandler {
  constructor(options) {
    if (!options || typeof options !== "object") {
      throw new Error("UrlHandler requires a valid options object");
    }
    this.options = options;
  }
  decodeSrc(urlData, src) {
    let fromSrc = this.options.fromSrc;
    if (typeof fromSrc == "object") {
      const toSrc = this.options.toSrc;
      const patterns = [];
      for (const p in toSrc) if (toSrc.hasOwnProperty(p)) {
        patterns.push(toSrc[p].replace(/[.*+?^$()|[\]\\]/g, "\\$&"));
      }
      const composedPattern = "(" + patterns.join("|") + ")";
      const origFromSrc = fromSrc;
      fromSrc = _urlParser.bind(void 0, composedPattern, origFromSrc);
    }
    if (typeof fromSrc == "string") {
      fromSrc = _urlParser.bind(void 0, fromSrc, void 0);
    }
    const urlAdapterResult = fromSrc(src);
    if (!urlAdapterResult) {
      if (this.options.defaultPrefix !== void 0) {
        urlData.urlOriginal = src;
        urlData.urlPrefix = this.options.defaultPrefix;
        urlData.urlPostfix = src;
      } else {
        console.error("FAILED PARSING", src);
      }
    } else {
      if (urlAdapterResult.encodedUrlOriginal) {
        urlAdapterResult.urlOriginal = decodeURIComponent(urlAdapterResult.encodedUrlOriginal);
      }
      if (urlAdapterResult.resizeWidth !== void 0) {
        urlAdapterResult.method = "resizecrop";
      } else if (urlAdapterResult.cropX !== void 0 || urlAdapterResult.cropX2 !== void 0) {
        urlAdapterResult.method = "cropresize";
      } else if (urlAdapterResult.height !== void 0) {
        urlAdapterResult.method = "cover";
      } else if (urlAdapterResult.width !== void 0) {
        urlAdapterResult.method = "resize";
      } else {
        urlAdapterResult.method = "original";
      }
    }
    return urlAdapterResult;
  }
  encodeSrc(urlData, res) {
    res.urlPrefix = urlData.urlPrefix;
    res.urlPostfix = urlData.urlPostfix;
    res.urlOriginal = urlData.urlOriginal;
    res.encodedUrlOriginal = encodeURIComponent(urlData.urlOriginal);
    let toSrc = this.options.toSrc;
    if (typeof toSrc == "object") {
      for (let i = methods.indexOf(res.method); i < methods.length; i++) {
        if (typeof toSrc[methods[i]] !== "undefined") {
          toSrc = toSrc[methods[i]];
          break;
        }
      }
    }
    if (typeof toSrc == "string") {
      toSrc = _stringTemplate.bind(void 0, toSrc);
    }
    return toSrc(res);
  }
}
function urlAdapterFromSrc(urlAdapter, urlData, src) {
  const handler = new UrlHandler(urlAdapter);
  return handler.decodeSrc(urlData, src);
}
function urlAdapterToSrc(urlAdapter, urlData, res) {
  const handler = new UrlHandler(urlAdapter);
  return handler.encodeSrc(urlData, res);
}
class CropModel {
  constructor(options = {}, originalImageSize) {
    if (!originalImageSize) {
      throw new Error("CropModel requires originalImageSize parameter");
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
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
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
    if (typeof this.options.maxScale !== "undefined") return this.options.maxScale;
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
    const scaledSize = this.getScaledImageSize();
    const width = scaledSize.width, height = scaledSize.height, scale = this.state.scale;
    const l = -this.state.container.left, r = width - this.state.crop.width + this.state.container.left, t = -this.state.container.top, b = height - this.state.crop.height + this.state.container.top;
    let ppp = 1;
    if (typeof this.options.ppp !== "undefined") ppp = this.options.ppp;
    if (ppp * scale > 1) ppp = Math.ceil(1 / scale);
    const res = {
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
    const dx = Math.abs(l - r), dy = Math.abs(t - b);
    res.method = this.processedOptions.resizeWidth !== void 0 ? "resizecrop" : "cropresize";
    if (dx <= 1 && dy <= 1 && (l === 0 || t === 0)) {
      if (l === 0 && t === 0) res.method = scale !== 1 ? "resize" : "original";
      else res.method = "cover";
    }
    return res;
  }
  /** MODEL UPDATE METHODS **/
  updateScale(newScale, xp, yp) {
    const scaledSize = this.getScaledImageSize();
    if (xp == void 0) xp = (this.state.crop.width / 2 - this.state.container.left) / scaledSize.width;
    if (yp == void 0) yp = (this.state.crop.height / 2 - this.state.container.top) / scaledSize.height;
    newScale = this.checkRange(newScale, this.state.minScale, this.getMaxScale());
    if (newScale !== this.state.scale) {
      const newScaledSize = this.getScaledImageSize(newScale), xd = Math.round((newScaledSize.width - scaledSize.width) * xp), yd = Math.round((newScaledSize.height - scaledSize.height) * yp), newLeft = this.state.container.left - xd, newTop = this.state.container.top - yd;
      this.updateCropContainerPanZoom(newLeft, newTop, newScale);
      return true;
    } else return false;
  }
  updateScaledImageSize(newScale) {
    if (this.state.scale !== newScale) {
      this.state.scale = newScale;
      const scaledSize = this.getScaledImageSize();
      this.emit("scaleChanged", {
        scale: newScale,
        scaledSize
      });
      return true;
    } else return false;
  }
  updateCropperFrameSize(newCropHeight, newCropWidth) {
    let changed = false;
    if (newCropHeight !== void 0) {
      this.state.crop.height = parseInt(newCropHeight);
      changed = true;
    }
    if (newCropWidth !== void 0) {
      this.state.crop.width = parseInt(newCropWidth);
      changed = true;
    }
    if (changed) {
      if (this.originalImageSize && this.processedOptions.width) {
        const widthRatio = this.processedOptions.width / this.originalImageSize.width, heightRatio = this.state.crop.height / this.originalImageSize.height, minScale = Math.max(widthRatio, heightRatio);
        if (minScale !== this.state.minScale) {
          this.state.minScale = minScale;
          this.emit("minScaleChanged", { minScale });
        }
      }
      this.emit("cropSizeChanged", {
        width: this.state.crop.width,
        height: this.state.crop.height
      });
    }
  }
  updateCropContainerPanZoom(newLeft, newTop, newScale) {
    let changed = false;
    if (newScale !== void 0) {
      changed = this.updateScaledImageSize(newScale);
    }
    const scaledSize = this.getScaledImageSize();
    if (newLeft !== void 0) {
      newLeft = this.checkRange(newLeft, this.state.crop.width - scaledSize.width, 0);
      if (this.state.container.left !== newLeft) {
        this.state.container.left = newLeft;
        changed = true;
      }
    }
    if (newTop !== void 0) {
      newTop = this.checkRange(newTop, this.state.crop.height - scaledSize.height, 0);
      if (this.state.container.top !== newTop) {
        this.state.container.top = newTop;
        changed = true;
      }
    }
    if (changed) {
      this.emit("containerPositionChanged", {
        left: this.state.container.left,
        top: this.state.container.top
      });
    }
    return changed;
  }
  updatePanZoomToFitCropContainer() {
    let newScale, newLeft, newTop;
    newScale = this.state.minScale;
    const resizedSize = this.getScaledImageSize(newScale);
    newLeft = Math.round((this.state.crop.width - resizedSize.width) / 2);
    newTop = Math.round((this.state.crop.height - resizedSize.height) / 2);
    return this.updateCropContainerPanZoom(newLeft, newTop, newScale);
  }
  updateCropHeightInternal(method, newHeight, origHeight, originalOuterTop, maxHeight) {
    if (!this.options.autoZoom && newHeight > maxHeight) newHeight = maxHeight;
    newHeight = Math.round(newHeight);
    this.updateCropperFrameSize(newHeight);
    if (method == "original" || method == "cover" || method == "resize") {
      this.updatePanZoomToFitCropContainer();
    } else if (newHeight > maxHeight) {
      const newScale = newHeight / this.originalImageSize.height;
      this.updateScale(newScale);
    } else {
      let newOuterTop = Math.round((newHeight - origHeight) / 2) + originalOuterTop;
      if (newOuterTop > 0) newOuterTop = 0;
      this.updateCropContainerPanZoom(void 0, newOuterTop);
    }
  }
  updateCropHeight(newHeight) {
    const origHeight = this.state.crop.height;
    this.updateCropHeightInternal(this.getCurrentComputedMethod(), newHeight, origHeight, this.state.container.top, this.getScaledImageSize().height);
    return origHeight !== this.state.crop.height;
  }
  updatePanZoomCropToFitWidthAndAspect() {
    if (!this.processedOptions.width) return false;
    const newScale = this.processedOptions.width / this.originalImageSize.width;
    const newHeight = Math.round(this.originalImageSize.height * newScale);
    let changed = this.updateCropHeight(newHeight);
    changed = this.updateScale(newScale) || changed;
    return changed;
  }
  updateSmartAutoResize() {
    let done = this.updatePanZoomToFitCropContainer();
    if (!done) {
      done = this.updatePanZoomCropToFitWidthAndAspect();
      if (!done) {
        this.updateScale(1);
      }
    }
    this.emit("modelUpdated", { reason: "autosize" });
  }
  initializeSizes() {
    let newCropHeight, newLeft, newTop, newScale, newWidth;
    if (typeof this.options.ppp !== "undefined") {
      if (typeof this.processedOptions.width !== "undefined") this.processedOptions.width = Math.round(this.processedOptions.width / this.options.ppp);
      if (typeof this.processedOptions.height !== "undefined") this.processedOptions.height = Math.round(this.processedOptions.height / this.options.ppp);
      if (typeof this.processedOptions.resizeWidth !== "undefined") this.processedOptions.resizeWidth = Math.round(this.processedOptions.resizeWidth / this.options.ppp);
      if (typeof this.processedOptions.resizeHeight !== "undefined") this.processedOptions.resizeHeight = Math.round(this.processedOptions.resizeHeight / this.options.ppp);
      if (typeof this.processedOptions.offsetX !== "undefined") this.processedOptions.offsetX = Math.round(this.processedOptions.offsetX / this.options.ppp);
      if (typeof this.processedOptions.offsetY !== "undefined") this.processedOptions.offsetY = Math.round(this.processedOptions.offsetY / this.options.ppp);
    }
    if (typeof this.processedOptions.resizeWidth !== "undefined") {
      newScale = this.processedOptions.resizeWidth / this.originalImageSize.width;
      newCropHeight = this.processedOptions.height;
      newWidth = this.processedOptions.width;
      newLeft = -this.processedOptions.offsetX;
      newTop = -this.processedOptions.offsetY;
    } else if (typeof this.options.cropX2 !== "undefined" || typeof this.options.cropWidth !== "undefined") {
      if (this.processedOptions.cropWidth == void 0) this.processedOptions.cropWidth = this.options.cropX2 - this.options.cropX;
      if (this.processedOptions.cropHeight == void 0) this.processedOptions.cropHeight = this.options.cropY2 - this.options.cropY;
      if (this.processedOptions.cropX == void 0) this.processedOptions.cropX = 0;
      if (this.processedOptions.cropY == void 0) this.processedOptions.cropY = 0;
      newScale = this.processedOptions.width / this.processedOptions.cropWidth;
      newCropHeight = this.processedOptions.height || this.processedOptions.cropHeight * newScale;
      newWidth = this.processedOptions.width;
      newLeft = Math.round(-this.processedOptions.cropX * newScale);
      newTop = Math.round(-this.processedOptions.cropY * newScale);
    } else if (typeof this.processedOptions.height !== "undefined") {
      newScale = Math.max(this.processedOptions.width / this.originalImageSize.width, this.processedOptions.height / this.originalImageSize.height);
      newWidth = Math.min(this.processedOptions.width, Math.round(this.originalImageSize.width * newScale));
      newCropHeight = Math.min(this.processedOptions.height, Math.round(this.originalImageSize.height * newScale));
      const resizedSize = this.getScaledImageSize(newScale);
      newLeft = Math.round((newWidth - resizedSize.width) / 2);
      newTop = Math.round((newCropHeight - resizedSize.height) / 2);
    } else if (typeof this.processedOptions.width) {
      newScale = this.processedOptions.width / this.originalImageSize.width;
      newCropHeight = Math.round(this.originalImageSize.height * newScale);
      newWidth = this.processedOptions.width;
      newLeft = 0;
      newTop = 0;
    } else ;
    this.updateCropperFrameSize(newCropHeight, newWidth);
    this.updateCropContainerPanZoom(newLeft, newTop, newScale);
  }
}
class ImagePreloader {
  /**
   * Preload di un'immagine con callback success/error
   * @param {string} src - URL dell'immagine
   * @param {function} onSuccess - Callback(img, src) al successo
   * @param {function} onError - Callback(src, error) all'errore
   * @returns {HTMLImageElement} - Elemento image per eventuali operazioni
   */
  static preload(src, onSuccess, onError) {
    if (typeof src !== "string" || !src) {
      throw new Error("ImagePreloader requires a valid src string");
    }
    const img = new Image();
    img.onload = function() {
      if (onSuccess) {
        onSuccess(img, src);
      }
    };
    img.onerror = function(error) {
      console.log("Image preload failed:", error);
      if (onError) {
        onError(src, error);
      }
    };
    img.src = src;
    return img;
  }
  /**
   * Preload multiplo con Promise (per uso moderno)
   * @param {string[]} sources - Array di URL immagini
   * @returns {Promise<HTMLImageElement[]>} - Promise con array di immagini caricate
   */
  static preloadMultiple(sources) {
    const promises = sources.map(
      (src) => new Promise((resolve, reject) => {
        ImagePreloader.preload(
          src,
          (img, src2) => resolve({ img, src: src2 }),
          (src2, error) => reject({ src: src2, error })
        );
      })
    );
    return Promise.all(promises);
  }
  /**
   * Check se un'immagine è già caricata
   * @param {string} src - URL dell'immagine
   * @returns {boolean} - True se caricata
   */
  static isImageLoaded(src) {
    const img = new Image();
    img.src = src;
    return img.complete && img.naturalWidth !== 0;
  }
}
class MovingClassManager {
  constructor(element) {
    if (element instanceof HTMLElement) {
      this.element = element;
    } else {
      throw new Error("MovingClassManager requires a native HTMLElement");
    }
    this.isMoving = false;
    this.currentMovingClass = null;
    this.movingTimeout = null;
  }
  /**
   * Aggiunge classe di movimento se non già in movimento
   * @param {string} className - Nome della classe (es. 'drag', 'slide', 'wheel')
   */
  addMovingClass(className) {
    if (typeof className !== "string" || !className) {
      throw new Error("addMovingClass requires a valid className string");
    }
    this.clearTimeout();
    if (!this.isMoving) {
      this.element.classList.add("cropper-moving");
      this.element.classList.add("cropper-moving-" + className);
      this.isMoving = true;
      this.currentMovingClass = className;
    }
  }
  /**
   * Rimuove tutte le classi di movimento
   */
  removeMovingClass() {
    this.clearTimeout();
    if (this.isMoving && this.currentMovingClass) {
      this.element.classList.remove("cropper-moving");
      this.element.classList.remove("cropper-moving-" + this.currentMovingClass);
      this.isMoving = false;
      this.currentMovingClass = null;
    }
  }
  /**
   * Toggle delle classi di movimento
   * @param {string} className - Nome della classe
   */
  toggleMovingClass(className) {
    if (this.isMoving) {
      this.removeMovingClass();
    } else {
      this.addMovingClass(className);
    }
  }
  /**
   * Imposta timeout per rimozione automatica delle classi
   * @param {number} delay - Delay in millisecondi (default 500)
   */
  setAutoRemoveTimeout(delay = 500) {
    this.clearTimeout();
    this.movingTimeout = setTimeout(() => {
      this.removeMovingClass();
    }, delay);
  }
  /**
   * Pulisce timeout attivi
   */
  clearTimeout() {
    if (this.movingTimeout) {
      clearTimeout(this.movingTimeout);
      this.movingTimeout = null;
    }
  }
  /**
   * Getter per stato corrente
   */
  get state() {
    return {
      isMoving: this.isMoving,
      currentClass: this.currentMovingClass,
      hasTimeout: !!this.movingTimeout
    };
  }
  /**
   * Cleanup per distruggere l'istanza
   */
  destroy() {
    this.clearTimeout();
    if (this.isMoving) {
      this.removeMovingClass();
    }
    this.element = null;
  }
}
class CropperComponent {
  constructor(element, componentName = "CropperComponent") {
    this.componentName = componentName;
    this.element = null;
    this._initializeElement(element);
    this.cropModel = null;
    this.movingClassManager = null;
    this.onChanged = null;
    this._eventHandlers = /* @__PURE__ */ new Map();
    this._documentHandlers = /* @__PURE__ */ new Map();
  }
  /**
   * Common element wrapper initialization logic
   * @private
   */
  _initializeElement(element) {
    if (element instanceof HTMLElement) {
      this.element = element;
    } else {
      throw new Error(`${this.componentName} requires a valid HTMLElement`);
    }
  }
  /**
   * Common initialize method setup
   * @param {Object} cropModel - The crop model instance
   * @param {Object} movingClassManager - The moving class manager instance
   * @param {Function} onChanged - Change callback function
   */
  initializeBase(cropModel, movingClassManager, onChanged) {
    this.cropModel = cropModel;
    this.movingClassManager = movingClassManager;
    this.onChanged = onChanged;
  }
  /**
   * Get event coordinates - extracted from EventCoords.js
   * @param {Event} event - DOM event
   * @returns {Object} Coordinates object with x, y properties
   */
  getEventCoords(event) {
    if (event.type?.indexOf("touch") === 0) {
      const touch = event.originalEvent?.touches?.[0] || event.touches?.[0];
      return touch ? { x: touch.clientX, y: touch.clientY } : { x: 0, y: 0 };
    }
    return {
      x: event.clientX || event.originalEvent?.clientX || 0,
      y: event.clientY || event.originalEvent?.clientY || 0
    };
  }
  /**
   * Add event listener and track it for cleanup
   * @param {HTMLElement} element - Element to add listener to
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   * @param {boolean} useDocument - Whether to add to document (for global events)
   */
  addEventHandler(element, eventType, handler, useDocument = false) {
    const targetElement = useDocument ? document : element;
    const handlerMap = useDocument ? this._documentHandlers : this._eventHandlers;
    targetElement.addEventListener(eventType, handler);
    handlerMap.set(`${eventType}_${element.tagName}_${Date.now()}`, { element: targetElement, eventType, handler });
  }
  /**
   * Common destroy method - cleanup all event listeners
   */
  destroy() {
    if (this.element && this._eventHandlers.size > 0) {
      for (const [eventType, handler] of this._eventHandlers) {
        if (this.sliderInput) {
          this.sliderInput.removeEventListener(eventType, handler);
        } else if (this.handleElement) {
          this.handleElement.removeEventListener(eventType, handler);
        } else {
          this.element.removeEventListener(eventType, handler);
        }
      }
      this._eventHandlers.clear();
    }
    if (this._documentHandlers.size > 0) {
      for (const [eventType, handler] of this._documentHandlers) {
        document.removeEventListener(eventType, handler);
      }
      this._documentHandlers.clear();
    }
    this.cropModel = null;
    this.movingClassManager = null;
    this.onChanged = null;
    this.element = null;
  }
  /**
   * Convert element wrapper to native HTMLElement if needed
   * @param {HTMLElement|Object} elementOrWrapper - Element or wrapper
   * @returns {HTMLElement} Native HTMLElement
   */
  toNativeElement(elementOrWrapper) {
    return elementOrWrapper;
  }
}
class CropperSlider extends CropperComponent {
  constructor(element) {
    super(element, "CropperSlider");
    this.sliderInput = null;
  }
  static _fromSliderValueToScale(value) {
    return Math.pow(1.03, value) / 100;
  }
  static _fromScaleToSliderValue(scale) {
    return Math.log(scale * 100) / Math.log(1.03);
  }
  initialize(cropModel, movingClassManager, onChanged) {
    super.initializeBase(cropModel, movingClassManager, onChanged);
    const minValue = Math.floor(CropperSlider._fromScaleToSliderValue(cropModel.getMinScale()));
    const maxValue = Math.ceil(CropperSlider._fromScaleToSliderValue(cropModel.getMaxScale()));
    const currentValue = Math.round(CropperSlider._fromScaleToSliderValue(cropModel.getScale()));
    this.element.innerHTML = `<input type="range" class="vanilla-slider" aria-label="Zoom level" min="${minValue}" max="${maxValue}" step="1" value="${currentValue}">`;
    this.sliderInput = this.element.querySelector(".vanilla-slider");
    let isSliding = false;
    const inputHandler = (e) => {
      if (isSliding && (e.type === "input" || e.type === "propertychange" && e.originalEvent?.propertyName === "value")) {
        const value = parseInt(e.target.value);
        const newScale = CropperSlider._fromSliderValueToScale(value);
        cropModel.updateScale(newScale);
        onChanged("slide");
        const adjustedValue = CropperSlider._fromScaleToSliderValue(cropModel.getScale());
        if (Math.abs(adjustedValue - value) > 0.5) {
          e.target.value = Math.round(adjustedValue);
        }
      }
    };
    const startHandler = () => {
      isSliding = true;
      movingClassManager.addMovingClass("slide");
    };
    const endHandler = () => {
      if (isSliding) {
        isSliding = false;
        movingClassManager.removeMovingClass();
      }
    };
    const keyHandler = (e) => {
      if (e.keyCode === 37 || e.keyCode === 39) {
        movingClassManager.addMovingClass("slide");
      }
    };
    this.sliderInput.addEventListener("input", inputHandler);
    this.sliderInput.addEventListener("propertychange", inputHandler);
    this.sliderInput.addEventListener("mousedown", startHandler);
    this.sliderInput.addEventListener("touchstart", startHandler);
    this.sliderInput.addEventListener("mouseup", endHandler);
    this.sliderInput.addEventListener("touchend", endHandler);
    this.sliderInput.addEventListener("keyup", endHandler);
    this.sliderInput.addEventListener("keydown", keyHandler);
    this._eventHandlers.set("input", inputHandler);
    this._eventHandlers.set("propertychange", inputHandler);
    this._eventHandlers.set("mousedown", startHandler);
    this._eventHandlers.set("touchstart", startHandler);
    this._eventHandlers.set("mouseup", endHandler);
    this._eventHandlers.set("touchend", endHandler);
    this._eventHandlers.set("keyup", endHandler);
    this._eventHandlers.set("keydown", keyHandler);
  }
  updateFromScale(scale) {
    if (this.sliderInput) {
      this.sliderInput.value = Math.round(CropperSlider._fromScaleToSliderValue(scale));
    }
  }
  updateMinScale(minScale) {
    if (this.sliderInput) {
      this.sliderInput.setAttribute("min", Math.floor(CropperSlider._fromScaleToSliderValue(minScale)));
    }
  }
  destroy() {
    if (this.element) {
      this.element.innerHTML = "";
    }
    this.sliderInput = null;
    super.destroy();
  }
}
class CropperDraggable extends CropperComponent {
  constructor(element, options = {}) {
    super(element, "CropperDraggable");
    this.shiftWheel = options.shiftWheel || false;
    this.rootEl = null;
    this.hasDragged = false;
  }
  initialize(cropModel, rootEl, movingClassManager, onChanged) {
    super.initializeBase(cropModel, movingClassManager, onChanged);
    this.rootEl = this.toNativeElement(rootEl);
    let isDragging = false;
    let startCoords, startLeft, startTop;
    const dragStartHandler = (event) => {
      event.preventDefault();
      isDragging = true;
      startCoords = this.getEventCoords(event);
      startLeft = cropModel.getContainerLeft();
      startTop = cropModel.getContainerTop();
      this.rootEl.focus();
      movingClassManager.addMovingClass("drag");
    };
    const dragMoveHandler = (moveEvent) => {
      if (!isDragging) return;
      const moveCoords = this.getEventCoords(moveEvent);
      const deltaX = moveCoords.x - startCoords.x;
      const deltaY = moveCoords.y - startCoords.y;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        this.hasDragged = true;
      }
      cropModel.updateCropContainerPanZoom(Math.round(startLeft + deltaX), Math.round(startTop + deltaY));
      onChanged("dragging");
      moveEvent.preventDefault();
    };
    const dragEndHandler = (upEvent) => {
      if (!isDragging) return;
      isDragging = false;
      document.removeEventListener("mousemove", dragMoveHandler);
      document.removeEventListener("touchmove", dragMoveHandler);
      document.removeEventListener("mouseup", dragEndHandler);
      document.removeEventListener("touchend", dragEndHandler);
      onChanged("dragged");
      movingClassManager.removeMovingClass();
      if (this.hasDragged) {
        setTimeout(() => {
          this.hasDragged = false;
        }, 100);
      }
      upEvent.preventDefault();
    };
    const startHandler = (event) => {
      dragStartHandler(event);
      document.addEventListener("mousemove", dragMoveHandler);
      document.addEventListener("touchmove", dragMoveHandler);
      document.addEventListener("mouseup", dragEndHandler);
      document.addEventListener("touchend", dragEndHandler);
    };
    this.element.addEventListener("mousedown", startHandler);
    this.element.addEventListener("touchstart", startHandler);
    this._eventHandlers.set("mousedown", startHandler);
    this._eventHandlers.set("touchstart", startHandler);
    this._documentHandlers.set("mousemove", dragMoveHandler);
    this._documentHandlers.set("touchmove", dragMoveHandler);
    this._documentHandlers.set("mouseup", dragEndHandler);
    this._documentHandlers.set("touchend", dragEndHandler);
    const wheelHandler = (event) => {
      if (this.shiftWheel && !event.shiftKey) return true;
      const delta = -event.deltaY || 0;
      this.rootEl.focus();
      if (delta !== 0) {
        movingClassManager.addMovingClass("wheel");
        movingClassManager.setAutoRemoveTimeout(500);
        const scaledSize = cropModel.getScaledImageSize();
        const xp = (event.offsetX || 0) / scaledSize.width;
        const yp = (event.offsetY || 0) / scaledSize.height;
        const newScale = delta > 0 ? cropModel.getScale() * 1.1 : cropModel.getScale() / 1.1;
        cropModel.updateScale(newScale, xp, yp);
        onChanged("wheel");
      }
      event.preventDefault();
      return false;
    };
    const dblClickHandler = () => {
      cropModel.updateSmartAutoResize();
      return false;
    };
    const clickHandler = () => {
      if (this.hasDragged) return;
      this.rootEl.focus();
      movingClassManager.toggleMovingClass("click");
    };
    this.element.addEventListener("wheel", wheelHandler);
    this.element.addEventListener("dblclick", dblClickHandler);
    this.element.addEventListener("click", clickHandler);
    this._eventHandlers.set("wheel", wheelHandler);
    this._eventHandlers.set("dblclick", dblClickHandler);
    this._eventHandlers.set("click", clickHandler);
  }
  destroy() {
    super.destroy();
    this.hasDragged = false;
    this.rootEl = null;
  }
}
class CropperResizer extends CropperComponent {
  constructor(cropperFrameEl) {
    super(cropperFrameEl, "CropperResizer");
    this.cropperFrameEl = this.element;
    this.handleElement = null;
    this.rootEl = null;
    this.widget = null;
  }
  initialize(cropModel, rootEl, movingClassManager, onChanged, widget = null) {
    super.initializeBase(cropModel, movingClassManager, onChanged);
    this.rootEl = this.toNativeElement(rootEl);
    this.widget = widget;
    this.handleElement = document.createElement("div");
    this.handleElement.className = "clip-handle vanilla-resizable-s";
    this.cropperFrameEl.appendChild(this.handleElement);
    let isResizing = false;
    let startY, startHeight, originalHeight, originalOuterTop, originalMethod, maxHeight;
    const resizeStartHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      isResizing = true;
      startY = this.getEventCoords(event).y;
      startHeight = this.cropperFrameEl.offsetHeight;
      originalHeight = startHeight;
      this.rootEl.focus();
      movingClassManager.addMovingClass("handle");
      originalOuterTop = cropModel.getContainerTop();
      originalMethod = cropModel.getCurrentComputedMethod();
      maxHeight = cropModel.getScaledImageSize().height;
    };
    const resizeMoveHandler = (moveEvent) => {
      if (!isResizing) return;
      const currentY = this.getEventCoords(moveEvent).y;
      const deltaY = currentY - startY;
      const newHeight = Math.max(40, startHeight + deltaY);
      cropModel.updateCropHeightInternal(originalMethod, newHeight, originalHeight, originalOuterTop, maxHeight);
      onChanged("resizing");
      this.cropperFrameEl.style.height = cropModel.getCropHeight() + "px";
      if (this.widget && typeof this.widget._trigger === "function") {
        this.widget._trigger("cropheight", null, { value: cropModel.getCropHeight() });
      }
      moveEvent.preventDefault();
    };
    const resizeEndHandler = (upEvent) => {
      if (!isResizing) return;
      isResizing = false;
      document.removeEventListener("mousemove", resizeMoveHandler);
      document.removeEventListener("touchmove", resizeMoveHandler);
      document.removeEventListener("mouseup", resizeEndHandler);
      document.removeEventListener("touchend", resizeEndHandler);
      movingClassManager.removeMovingClass();
      onChanged("resized");
      upEvent.preventDefault();
    };
    const startHandler = (event) => {
      resizeStartHandler(event);
      document.addEventListener("mousemove", resizeMoveHandler);
      document.addEventListener("touchmove", resizeMoveHandler);
      document.addEventListener("mouseup", resizeEndHandler);
      document.addEventListener("touchend", resizeEndHandler);
    };
    const dblClickHandler = () => {
      cropModel.updateCropHeight(cropModel.getScaledImageSize().height);
      onChanged("resized");
      return false;
    };
    this.handleElement.addEventListener("mousedown", startHandler);
    this.handleElement.addEventListener("touchstart", startHandler);
    this.handleElement.addEventListener("dblclick", dblClickHandler);
    this._eventHandlers.set("mousedown", startHandler);
    this._eventHandlers.set("touchstart", startHandler);
    this._eventHandlers.set("dblclick", dblClickHandler);
    this._documentHandlers.set("mousemove", resizeMoveHandler);
    this._documentHandlers.set("touchmove", resizeMoveHandler);
    this._documentHandlers.set("mouseup", resizeEndHandler);
    this._documentHandlers.set("touchend", resizeEndHandler);
  }
  destroy() {
    super.destroy();
    if (this.handleElement && this.handleElement.parentNode) {
      this.handleElement.parentNode.removeChild(this.handleElement);
    }
    this.handleElement = null;
    this.rootEl = null;
    this.widget = null;
  }
}
class ElementDataStore {
  constructor() {
    this.store = /* @__PURE__ */ new WeakMap();
  }
  /**
   * Set data for element
   * @param {HTMLElement} element - Target element
   * @param {string} key - Data key
   * @param {*} value - Data value
   */
  set(element, key, value) {
    if (!this.store.has(element)) {
      this.store.set(element, /* @__PURE__ */ new Map());
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
    if (!this.store.has(element)) return void 0;
    return this.store.get(element).get(key);
  }
  /**
   * Remove data from element
   * @param {HTMLElement} element - Target element
   * @param {string} [key] - Data key (if not provided, removes all)
   */
  remove(element, key) {
    if (!this.store.has(element)) return;
    if (key === void 0) {
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
    if (key === void 0) return true;
    return this.store.get(element).has(key);
  }
}
const elementDataStore = new ElementDataStore();
const CROPPER_TEMPLATE = `
  <div class="mo-cropper cropper-hidden" tabindex="-1">
    <div class="cropper-frame">
      <div class="clipping-container">
        <div class="toolbar">
          <button type="button" class="tool tool-zoom" aria-label="Fit image">
            <i class="fa fa-compress" aria-hidden="true"></i>
          </button>
          <div class="cropper-zoom-slider"></div>
          <button type="button" class="tool tool-crop" aria-label="Apply crop">
            <i class="fa fa-check" aria-hidden="true"></i>
          </button>
        </div>
        <img draggable="false" class="clipped clipped-image original-src">
        <button type="button" class="mosaico-cropper-edit-trigger" aria-label="Edit crop">
          <i class="fa fa-pencil" aria-hidden="true"></i>
        </button>
      </div>
    </div>
    <div class="outer-image-container">
      <img class="outer-image original-src">
    </div>
  </div>
`;
function createElementFromTemplate(template) {
  const templateElement = document.createElement("template");
  templateElement.innerHTML = template.trim();
  return templateElement.content.firstChild;
}
function mosaicoCropper(imgEl, options, widget = null) {
  if (!imgEl || !(imgEl instanceof HTMLElement)) {
    console.error("mosaicoCropper requires a valid HTMLElement as first parameter");
    return null;
  }
  const defaultMosaicoAdapter = {
    defaultPrefix: "/img",
    fromSrc: {
      urlPrefix: "(?:https?://[^/]*)?/img"
    },
    toSrc: {
      resize: "{urlPrefix}?method=resize&params={width}&url={encodedUrlOriginal}",
      cover: "{urlPrefix}?method=cover&params={width},{height}&url={encodedUrlOriginal}",
      cropresize: "{urlPrefix}?method=cropresize&params={cropWidth},{cropHeight},{cropX},{cropY},{width},{height}&url={encodedUrlOriginal}"
    }
  };
  options = {
    urlAdapter: defaultMosaicoAdapter,
    // Default adapter
    autoClose: true,
    shiftWheel: false,
    maxScale: 2,
    editable: true,
    // Default to editable mode
    editTrigger: "button",
    // 'button', 'click', 'none'
    ...options
  };
  function getCropModel() {
    if (!cropModel) {
      throw new Error("MosaicoCropper is not ready yet. The image is still loading.");
    }
    return cropModel;
  }
  let componentsInitialized = false;
  function initializeEditingComponents() {
    if (componentsInitialized) return;
    const cropperResizer = new CropperResizer(cropperFrameEl);
    cropperResizer.initialize(cropModel, rootEl, movingClassManager, changed, widget);
    elementDataStore.set(cropperFrameEl, "cropperResizer", cropperResizer);
    const cropperDraggable = new CropperDraggable(imageCropContainerEl, { shiftWheel: options.shiftWheel });
    cropperDraggable.initialize(cropModel, rootEl, movingClassManager, changed);
    elementDataStore.set(imageCropContainerEl, "cropperDraggable", cropperDraggable);
    const cropperSlider = new CropperSlider(sliderEl);
    cropperSlider.initialize(cropModel, movingClassManager, changed);
    elementDataStore.set(sliderEl, "cropperSliderInstance", cropperSlider);
    componentsInitialized = true;
  }
  function enableEditing() {
    initializeEditingComponents();
    rootEl.classList.remove("mosaico-cropper--view-mode");
  }
  function disableEditing() {
    rootEl.classList.add("mosaico-cropper--view-mode");
  }
  function initialize() {
    if (containerEl) containerEl.classList.add("cropper-cropping");
    if (options.autoClose !== false) {
      rootEl.addEventListener("focusout", function(a) {
        if ((a.relatedTarget == null || !rootEl.contains(a.relatedTarget)) && typeof a.delegatedTarget == "undefined" && !disposing && !closing) {
          if (options.editable === false) {
            disableEditing();
          } else {
            updateAndDispose();
          }
        }
      });
    }
    const toolCrop = rootEl.querySelector(".tool-crop");
    if (toolCrop) {
      toolCrop.addEventListener("click", function() {
        if (options.editable === false) {
          disableEditing();
        } else {
          updateAndDispose();
        }
      });
    }
    const editTrigger = rootEl.querySelector(".mosaico-cropper-edit-trigger");
    if (editTrigger) {
      editTrigger.addEventListener("click", function() {
        enableEditing();
      });
    }
    const toolZoom = rootEl.querySelector(".tool-zoom");
    if (toolZoom) {
      toolZoom.addEventListener("click", function() {
        cropModel.updateSmartAutoResize();
      });
    }
    rootEl.focus();
    cropModel.initializeSizes();
    updateCropperMethod();
    if (options.editable) {
      initializeEditingComponents();
    } else {
      disableEditing();
      switch (options.editTrigger) {
        case "none":
          rootEl.classList.add("mosaico-cropper--no-trigger");
          break;
        case "click":
          rootEl.classList.add("mosaico-cropper--trigger-click");
          rootEl.classList.add("mosaico-cropper--no-trigger");
          break;
      }
    }
    imgEl.style.display = "none";
    rootEl.style.display = origDisplay == "inline" ? "inline-block" : origDisplay;
    rootEl.classList.remove("cropper-hidden");
    rootEl.focus();
    if (widget && typeof widget._trigger === "function") {
      widget._trigger("cropperready");
    }
  }
  let lastMethod;
  function updateCropperMethod() {
    const ccsMethod = cropModel.getCurrentComputedMethod();
    if (lastMethod !== ccsMethod) {
      if (lastMethod) rootEl.classList.remove("cropper-method-" + lastMethod);
      lastMethod = ccsMethod;
      if (ccsMethod) rootEl.classList.add("cropper-method-" + ccsMethod);
    }
  }
  function changed() {
    updateCropperMethod();
    rootEl.classList.add("cropper-has-changes");
  }
  function getCurrentComputedSizes() {
    return cropModel.getCurrentComputedSizes();
  }
  function updateOriginalImageSrc(done, fail) {
    try {
      const res = getCurrentComputedSizes();
      const url = urlAdapterToSrc(options.urlAdapter, options, res);
      if (widget && typeof widget._trigger === "function") {
        widget._trigger("crop", null, { url, crop: res });
      }
      rootEl.classList.add("cropper-loading");
      ImagePreloader.preload(url, function(img, src) {
        imgEl.setAttribute("src", src);
        rootEl.classList.remove("cropper-loading");
        done();
      }, function(src, err) {
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
      fail();
    }
  }
  function updateAndDispose() {
    if (!closing) {
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
    if (containerEl) containerEl.classList.remove("cropper-cropping");
    try {
      const cropperResizer = elementDataStore.get(cropperFrameEl, "cropperResizer");
      if (cropperResizer) {
        cropperResizer.destroy();
        elementDataStore.remove(cropperFrameEl, "cropperResizer");
      }
      const cropperDraggable = elementDataStore.get(imageCropContainerEl, "cropperDraggable");
      if (cropperDraggable) {
        cropperDraggable.destroy();
        elementDataStore.remove(imageCropContainerEl, "cropperDraggable");
      }
      const cropperSlider = elementDataStore.get(sliderEl, "cropperSliderInstance");
      if (cropperSlider) {
        cropperSlider.destroy();
        elementDataStore.remove(sliderEl, "cropperSliderInstance");
      }
    } catch (error) {
    }
    if (rootEl.parentNode) {
      rootEl.parentNode.removeChild(rootEl);
    }
    if (options.imgLoadingClass) {
      imgEl.classList.remove(options.imgLoadingClass);
    }
    imgEl.style.display = origDisplay;
    if (!noCallback && widget && typeof widget.destroy === "function") {
      widget.destroy();
    }
  }
  const rootEl = createElementFromTemplate(CROPPER_TEMPLATE);
  const movingClassManager = new MovingClassManager(rootEl);
  imgEl.parentNode.insertBefore(rootEl, imgEl);
  if (options.imgLoadingClass) {
    imgEl.classList.add(options.imgLoadingClass);
  }
  const urlData = urlAdapterFromSrc(options.urlAdapter, options, imgEl.src);
  Object.assign(options, urlData);
  if (!options.width) {
    options.width = imgEl.width;
    options.height = imgEl.height;
  }
  const wr = options.width / imgEl.width;
  const hr = options.height ? options.height / imgEl.height : wr;
  if (Math.abs(wr / hr - 1) > 0.01) {
    console.error("Unexpected aspect ratio: ", options.width, options.height, imgEl.width, imgEl.height, wr, hr);
  }
  options.ppp = wr;
  const clippedEl = rootEl.querySelector(".clipped"), cropperFrameEl = rootEl.querySelector(".cropper-frame"), imageCropContainerEl = rootEl.querySelector(".outer-image-container"), sliderEl = rootEl.querySelector(".cropper-zoom-slider"), origDisplay = window.getComputedStyle(imgEl).display;
  cropperFrameEl.addEventListener("click", () => {
    const isViewMode = rootEl.classList.contains("mosaico-cropper--view-mode");
    if (isViewMode && options.editable === false && options.editTrigger === "click") {
      enableEditing();
    }
  });
  let disposing = false;
  let closing = false;
  let originalImageSize;
  let containerEl = false;
  if (typeof options.containerSelector !== "undefined") {
    containerEl = document.querySelector(options.containerSelector);
  }
  let cropModel;
  let fullOriginalImgUrl = options.urlOriginal || (options.urlPrefix || "") + (options.urlPostfix || "");
  if (!fullOriginalImgUrl.match(/[a-z]+:/)) fullOriginalImgUrl = "http://" + fullOriginalImgUrl;
  ImagePreloader.preload(fullOriginalImgUrl, function(img, src) {
    const originalSrcElements = rootEl.querySelectorAll(".original-src");
    originalSrcElements.forEach((element) => {
      element.setAttribute("src", src);
    });
    originalImageSize = {
      width: img.naturalWidth,
      height: img.naturalHeight
    };
    cropModel = new CropModel(options, originalImageSize);
    cropModel.on("scaleChanged", function(data) {
      const newWidth = data.scaledSize.width + "px";
      const newHeight = data.scaledSize.height + "px";
      clippedEl.style.width = newWidth;
      clippedEl.style.height = newHeight;
      imageCropContainerEl.style.width = newWidth;
      imageCropContainerEl.style.height = newHeight;
      const cropperSlider = elementDataStore.get(sliderEl, "cropperSliderInstance");
      if (cropperSlider) {
        cropperSlider.updateFromScale(data.scale);
      }
      changed();
    });
    cropModel.on("containerPositionChanged", function(data) {
      const newLeft = data.left + "px";
      const newTop = data.top + "px";
      imageCropContainerEl.style.left = newLeft;
      imageCropContainerEl.style.top = newTop;
      clippedEl.style.left = newLeft;
      clippedEl.style.top = newTop;
      changed();
    });
    cropModel.on("cropSizeChanged", function(data) {
      cropperFrameEl.style.height = data.height + "px";
      cropperFrameEl.style.width = data.width + "px";
      if (data.width !== void 0) {
        rootEl.style.width = data.width + "px";
      }
      changed();
    });
    cropModel.on("minScaleChanged", function(data) {
      const cropperSlider = elementDataStore.get(sliderEl, "cropperSliderInstance");
      if (cropperSlider) {
        cropperSlider.updateMinScale(data.minScale);
      }
      changed();
    });
    cropModel.on("modelUpdated", function(data) {
      changed(data.reason);
    });
    initialize();
  }, function(src) {
    setTimeout(dispose);
  });
  return {
    getScale: function() {
      return getCropModel().getScale();
    },
    updateScale: function(value, xp, yp) {
      return getCropModel().updateScale(value, xp, yp);
    },
    getCropHeight: function() {
      return getCropModel().getCropHeight();
    },
    updateCropHeight: function(value) {
      return getCropModel().updateCropHeight(value);
    },
    dispose,
    finalizeCrop: function() {
      updateAndDispose();
    },
    startEdit: function() {
      if (options.editable === false) {
        enableEditing();
      }
    }
  };
}
class MosaicoCropperPlugin {
  constructor(element, options = {}) {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }
    if (!(element instanceof HTMLElement)) {
      throw new Error("MosaicoCropperPlugin requires a valid HTMLElement");
    }
    this.element = element;
    this.options = Object.assign({
      autoClose: true,
      shiftWheel: false
    }, options);
    elementDataStore.set(this.element, "mosaicoCropperPlugin", this);
    this.instance = null;
    this.isInitialized = false;
    this._init();
  }
  /**
   * Initialize the cropper instance
   * @private
   */
  _init() {
    if (this.instance) {
      this.instance.dispose(true);
    }
    this.instance = mosaicoCropper(this.element, this.options, this);
    this.isInitialized = true;
  }
  /**
   * Get current scale value
   * @param {number} [value] - Scale value to set
   * @returns {number|MosaicoCropperPlugin} Current scale or this for chaining
   */
  scale(value) {
    if (!this.instance) return value === void 0 ? 1 : this;
    if (value === void 0) {
      return this.instance.getScale();
    } else {
      this.instance.updateScale(value);
      return this;
    }
  }
  /**
   * Get/set crop height
   * @param {number} [value] - Height value to set
   * @returns {number|MosaicoCropperPlugin} Current height or this for chaining
   */
  cropHeight(value) {
    if (!this.instance) return value === void 0 ? 0 : this;
    if (value === void 0) {
      return this.instance.getCropHeight();
    } else {
      this.instance.updateCropHeight(value);
      return this;
    }
  }
  /**
   * Get current options
   * @returns {Object} Current options object
   */
  getOptions() {
    return Object.assign({}, this.options);
  }
  /**
   * Update options and reinitialize if necessary
   * @param {Object} newOptions - New options to merge
   * @returns {MosaicoCropperPlugin} This for chaining
   */
  updateOptions(newOptions) {
    const hasChanged = Object.keys(newOptions).some(
      (key) => this.options[key] !== newOptions[key]
    );
    if (hasChanged) {
      Object.assign(this.options, newOptions);
      this._init();
    }
    return this;
  }
  /**
   * Finalize crop and dispose the cropper (for view mode)
   * @returns {MosaicoCropperPlugin} This for chaining
   */
  finalizeCrop() {
    if (this.instance && typeof this.instance.finalizeCrop === "function") {
      this.instance.finalizeCrop();
    }
    return this;
  }
  /**
   * Programmatically starts the editing mode for a non-editable cropper.
   * @returns {MosaicoCropperPlugin} This for chaining
   */
  startEdit() {
    if (this.instance && typeof this.instance.startEdit === "function") {
      this.instance.startEdit();
    }
    return this;
  }
  /**
   * Check if cropper is initialized
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this.isInitialized && this.instance !== null;
  }
  /**
   * Destroy the cropper instance
   * @returns {MosaicoCropperPlugin} This for chaining
   */
  destroy() {
    if (this.instance) {
      this.instance.dispose(true);
      this.instance = null;
    }
    elementDataStore.remove(this.element, "mosaicoCropperPlugin");
    this.isInitialized = false;
    this.element = null;
    this.options = null;
    return this;
  }
  /**
   * Emit custom events (replaces jQuery UI Widget's _trigger)
   * @param {string} eventType - Event type name
   * @param {Event} [originalEvent] - Original DOM event if any
   * @param {*} [data] - Event data
   * @returns {boolean} True if event was not cancelled
   */
  _trigger(eventType, originalEvent = null, data = null) {
    const eventName = "mosaicocropper" + eventType;
    let customEvent;
    try {
      customEvent = new CustomEvent(eventName, {
        detail: {
          data,
          originalEvent,
          widget: this
        },
        bubbles: true,
        cancelable: true
      });
    } catch (e) {
      customEvent = document.createEvent("CustomEvent");
      customEvent.initCustomEvent(eventName, true, true, {
        data,
        originalEvent,
        widget: this
      });
    }
    const result = this.element.dispatchEvent(customEvent);
    const callbackName = "on" + eventType.charAt(0).toUpperCase() + eventType.slice(1);
    if (typeof this.options[callbackName] === "function") {
      try {
        this.options[callbackName].call(this.element, customEvent, data);
      } catch (error) {
        console.error("Error in cropper callback:", error);
      }
    }
    return result;
  }
}
function createMosaicoCropper(element, options = {}) {
  return new MosaicoCropperPlugin(element, options);
}
function getMosaicoCropper(element) {
  return elementDataStore.get(element, "mosaicoCropperPlugin") || null;
}
function registerJQueryPlugin(jQueryInstance) {
  if (!jQueryInstance || typeof jQueryInstance.fn !== "object") {
    console.warn("Invalid jQuery instance provided to registerJQueryPlugin");
    return;
  }
  jQueryInstance.fn.mosaicoCropper = function(options) {
    const args = Array.prototype.slice.call(arguments, 1);
    let result = this;
    this.each(function() {
      const element = this;
      let instance = getMosaicoCropper(element);
      if (typeof options === "string") {
        if (!instance) {
          jQueryInstance.error(`Cannot call method '${options}' on mosaicoCropper prior to initialization`);
          return;
        }
        if (typeof instance[options] === "function") {
          const methodResult = instance[options].apply(instance, args);
          if (methodResult !== instance && methodResult !== void 0) {
            result = methodResult;
            return false;
          }
        } else {
          jQueryInstance.error(`Method '${options}' does not exist on mosaicoCropper`);
        }
      } else {
        if (instance) {
          instance.updateOptions(options);
        } else {
          new MosaicoCropperPlugin(element, options);
        }
      }
    });
    return result;
  };
  const originalData = jQueryInstance.fn.data;
  jQueryInstance.fn.data = function(key, value) {
    if (key === "mosaicoCropper" && value === void 0) {
      return getMosaicoCropper(this[0]);
    }
    return originalData.apply(this, arguments);
  };
}
if (typeof window !== "undefined" && window.jQuery) {
  registerJQueryPlugin(window.jQuery);
}
function autoRegisterJQuery() {
  const jQueryGlobals = ["jQuery", "$", "jquery"];
  for (const globalName of jQueryGlobals) {
    if (typeof window !== "undefined" && window[globalName] && window[globalName].fn) {
      try {
        registerJQueryPlugin(window[globalName]);
        console.log(`MosaicoCropper registered with ${globalName}`);
      } catch (error) {
        console.warn(`Failed to register MosaicoCropper with ${globalName}:`, error);
      }
    }
  }
}
if (typeof window !== "undefined" && window.jQuery) {
  registerJQueryPlugin(window.jQuery);
}
const _package = {
  mosaicoCropper,
  MosaicoCropperPlugin,
  createMosaicoCropper,
  getMosaicoCropper,
  registerJQueryPlugin,
  autoRegisterJQuery
};
export {
  MosaicoCropperPlugin,
  autoRegisterJQuery,
  createMosaicoCropper,
  _package as default,
  getMosaicoCropper,
  mosaicoCropper,
  registerJQueryPlugin
};
//# sourceMappingURL=mosaico-cropper.es.js.map
