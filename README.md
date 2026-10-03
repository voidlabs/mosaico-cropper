## Usage

Mosaico Cropper now supports both **modern JavaScript** (no jQuery required) and **jQuery** (for backward compatibility).

### Modern JavaScript (Recommended)

**No jQuery required!** Use the modern API for better performance and smaller bundle size.

1.  **Include Files**: Add the CSS and JavaScript files to your HTML.

    ```html
    <!-- Mosaico Cropper (no dependencies required) -->
    <link rel="stylesheet" href="/path/to/dist/jqueryui-mosaico-cropper.min.css">
    <script src="/path/to/dist/jqueryui-mosaico-cropper.min.js"></script>
    ```

2.  **Initialize with Modern API**:

    ```javascript
    // ES6 Module
    import 'mosaico-cropper/dist/jqueryui-mosaico-cropper.min.css';
    import { createMosaicoCropper } from 'mosaico-cropper';

    // Create cropper instance
    const cropper = createMosaicoCropper('#my-image', {
      width: 400,
      height: 300,
      urlAdapter: 'cloudimage'
    });

    // Or using vanilla JavaScript (UMD)
    const cropper = MosaicoCropper.createMosaicoCropper('#my-image', {
      width: 400,
      height: 300,
      urlAdapter: 'cloudimage'
    });
    ```

3.  **Advanced Usage**:

    ```javascript
    import { MosaicoCropperPlugin, getMosaicoCropper } from 'mosaico-cropper';

    // Class-based approach
    const cropper = new MosaicoCropperPlugin('#my-image', options);

    // Method calls
    cropper.scale(1.5);
    cropper.cropHeight(300);

    // Get existing instance
    const existingCropper = getMosaicoCropper(document.getElementById('my-image'));

    // Event handling
    document.getElementById('my-image').addEventListener('mosaicocropperready', (e) => {
      console.log('Cropper is ready!');
    });

    // Cleanup
    cropper.destroy();
    ```

### jQuery (Legacy Support)

If you prefer to use jQuery, the plugin automatically registers itself when jQuery is available.

1.  **Include Files**: Add jQuery and the Mosaico Cropper files.

    ```html
    <!-- Optional: jQuery (only if you want to use jQuery API) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <!-- Mosaico Cropper -->
    <link rel="stylesheet" href="/path/to/dist/jqueryui-mosaico-cropper.min.css">
    <script src="/path/to/dist/jqueryui-mosaico-cropper.min.js"></script>
    ```

2.  **Initialize with jQuery**:

    ```javascript
    $(function() {
      $('#my-image').mosaicoCropper({
        width: 400,
        height: 300,
        urlAdapter: 'cloudimage'
      });

      // Method calls
      $('#my-image').mosaicoCropper('scale', 1.5);
      $('#my-image').mosaicoCropper('cropHeight', 300);

      // Get values
      const currentScale = $('#my-image').mosaicoCropper('scale');
    });
    ```

## Configuration Options

### TypeScript

The library and demo sources are written in strict TypeScript. ESM, CommonJS and
the UMD browser bundle remain available as JavaScript; the npm-compatible package
also includes generated declarations, so no separate `@types` package is needed.

```ts
import { createMosaicoCropper, type CropperOptions, type ZoomState } from 'mosaico-cropper';

const options: CropperOptions = {
  toolbar: false,
  autoClose: false,
  onZoomchange(event, state) {
    // Both state and event.detail.data are ZoomState.
    console.log(state.scale, state.minScale, state.maxScale);
  }
};
const cropper = createMosaicoCropper('#image', options);
// After onCropperready:
const zoom: ZoomState | null = cropper.getZoomState();
```

Public types include `CropperOptions`, `ZoomState`, `CropResult`, `UrlAdapter`,
`CropperEvent` and `CropperEventMap`. The core accepts URL adapter objects; use the
existing `urladapters.js` demo registry to resolve service names into objects.
For development, run `npm run typecheck`, `npm test -- --run`, and `npm run build`.

### Core Options

- **`toolbar`** (boolean, default: `true`): Set to `false` to omit the built-in Fit / zoom / Apply controls. Pan, wheel zoom, resize, edit triggers and programmatic controls remain available.
- **`autoClose`** (boolean, default: `true`): Whether the cropper should automatically close when losing focus
- **`shiftWheel`** (boolean, default: `false`): When true, wheel zoom only works when Shift key is pressed
- **`autoZoom`** (boolean, default: `undefined`): Controls automatic zooming behavior during resize operations
- **`maxScale`** (number, default: `2`): Maximum scale factor for zooming

### Cropping and Sizing Options

- **`width`** (number): Target width for the cropped image
- **`height`** (number): Target height for the cropped image
- **`cropX`** (number): Starting X coordinate for crop area
- **`cropY`** (number): Starting Y coordinate for crop area
- **`cropWidth`** (number): Width of the crop area
- **`cropHeight`** (number): Height of the crop area
- **`cropX2`** (number): End X coordinate for crop area (alternative to cropWidth)
- **`cropY2`** (number): End Y coordinate for crop area (alternative to cropHeight)
- **`offsetX`** (number): X offset for image positioning
- **`offsetY`** (number): Y offset for image positioning
- **`resizeWidth`** (number): Target width for resize operations
- **`resizeHeight`** (number): Target height for resize operations
- **`ppp`** (number): Pixels per point ratio for high-DPI displays (automatically calculated)

### URL Adapter Options

- **`urlAdapter`** (string or object): Specifies which image service adapter to use. Built-in adapters include:
  - `'cloudinary'` - Cloudinary image service
  - `'cloudimage'` - Cloudimage service
  - `'imagekit'` - ImageKit service
  - `'sirv'` - Sirv service
  - `'gumlet'` - Gumlet service
  - `'uploadcare'` - Uploadcare service
  - `'thumbor'` - Thumbor service
  - `'filestack'` - Filestack service
  - `'mosaico'` - Default Mosaico adapter
  - Custom object with `fromSrc`, `toSrc`, and optional `defaultPrefix` properties

- **`urlPrefix`** (string): URL prefix for image transformations
- **`urlPostfix`** (string): URL postfix/suffix for image transformations
- **`urlOriginal`** (string): Original image URL before transformations

### UI Options

- **`containerSelector`** (string): CSS selector for the container element that should receive the `cropper-cropping` class
- **`imgLoadingClass`** (string): CSS class to add to the image element during loading operations

### Custom URL Adapter Configuration

For custom URL adapters, you can provide an object with the following properties:

```javascript
$('#my-image').mosaicoCropper({
  urlAdapter: {
    // Pattern for parsing existing URLs (string or object with method-specific patterns)
    fromSrc: "{urlPrefix}/crop/{width}x{height}/{urlOriginal}",
    
    // Template for generating new URLs (string or object with method-specific templates)
    toSrc: "{urlPrefix}/crop/{width}x{height}/{urlOriginal}",
    
    // Default prefix for URLs that don't match the fromSrc pattern
    defaultPrefix: "https://your-image-service.com/"
  }
});
```

### Example Configurations

**Basic Usage:**
```javascript
$('#image').mosaicoCropper({
  width: 400,
  height: 300,
  urlAdapter: 'cloudimage'
});
```

**Advanced Configuration:**
```javascript
$('#image').mosaicoCropper({
  width: 800,
  height: 600,
  maxScale: 3,
  autoClose: false,
  shiftWheel: true,
  containerSelector: '.image-container',
  imgLoadingClass: 'loading',
  urlAdapter: {
    fromSrc: "{urlPrefix}/transform/{width}x{height}/{urlOriginal}",
    toSrc: "{urlPrefix}/transform/{width}x{height}/{urlOriginal}",
    defaultPrefix: "https://cdn.example.com/"
  }
});
```

**Predefined Crop Area:**
```javascript
$('#image').mosaicoCropper({
  width: 400,
  height: 300,
  cropX: 100,
  cropY: 50,
  cropWidth: 200,
  cropHeight: 150,
  urlAdapter: 'cloudinary'
});
```

## Methods

After initialization, you can call methods on the cropper instance:

```javascript
// Get current scale
var scale = $('#image').mosaicoCropper('scale');

// Set scale
$('#image').mosaicoCropper('scale', 1.5);

// Get crop height
var height = $('#image').mosaicoCropper('cropHeight');

// Set crop height  
$('#image').mosaicoCropper('cropHeight', 400);

// Destroy the cropper
$('#image').mosaicoCropper('destroy');
```

## Events

The cropper triggers custom events during operation:

```javascript
$('#image').on('mosaicocropperready', function(event) {
  console.log('Cropper is ready');
});

$('#image').on('mosaicocroppercrop', function(event) {
  const { url, crop } = event.detail.data;
  console.log('Generated crop URL:', url, crop);
});

$('#image').on('mosaicocropperheight', function(event) {
  console.log('Crop height changed:', event.detail.data.value);
});
```

The `mosaicocroppercrop` event fires after the final URL has been generated and before it is preloaded and applied to the original image. It is also available as an `onCrop(event, data)` option callback.

## Accessibility

### External toolbar

To exclude the built-in UI from your dependency graph entirely, import the core:

```ts
import { createMosaicoCropper } from 'mosaico-cropper/core';
import 'mosaico-cropper/core.css';

const cropper = createMosaicoCropper('#image', { autoClose: false });
const unsubscribe = cropper.onZoomChange(({ scale, minScale, maxScale }) => {
  // Update your own controls. Wait for onCropperready for the initial state.
});
// When removing your controls:
unsubscribe();
cropper.destroy();
```

The core retains image rendering, crop geometry, pan, wheel and the resize handle.
It contains no toolbar, zoom slider, edit button, or jQuery registration, even if
`toolbar: true` is supplied. `core.css` includes only the crop surface, gesture and
view-mode styles. Use `startEdit()` with your own edit button (or `editTrigger: 'click'`).
`finishEdit()` returns an `editable: false` cropper to view mode without finalizing;
it is a no-op in the default editable mode. `finalizeCrop()` still saves and disposes.

The main `mosaico-cropper` import preserves the complete UI and jQuery compatibility.
`toolbar: false` on that import omits the toolbar at runtime while retaining the edit
trigger. For bundle exclusion, choose `/core`. Both ESM and CommonJS core entries and
their TypeScript declarations are provided. Neither JavaScript entry imports CSS.

The built-in UI is itself a consumer of `fit()`, `scale()`, `getZoomState()`,
`onZoomChange()`, `startEdit()`, `finishEdit()` and `finalizeCrop()`. It has no access
to `CropModel`. `onZoomChange(listener)` returns an unsubscribe function and delivers
the same settled snapshots as the DOM event/callback below; each subscriber receives
its own copy. Subscriptions are cleared on destruction or `updateOptions()` reinitialization,
so register again for the new instance. A subscription after destruction is a no-op.

Use `toolbar: false` and `autoClose: false` to place controls anywhere in your application.
`autoClose: true` keeps its historical behavior: moving focus outside the cropper finalizes it
(or returns to view mode with `editable: false`). Disabling the toolbar does not change
`editable`, `editTrigger`, `shiftWheel`, or other interaction options.

- `fit()` runs the same smart fit cycle as the built-in Fit image button, including
  recentering and possible crop-height changes. Repeated calls can select different fits.
  It returns the plugin for chaining.
- `getZoomState()` returns a fresh `{ scale, minScale, maxScale }` snapshot from the model.
  Like `scale()`, it throws while the original image is loading. After `destroy()` it
  returns `null`; `fit()` becomes a chainable no-op.
- The existing ready event is **`mosaicocroppercropperready`**, with callback
  **`onCropperready(event)`**. Read the initial zoom snapshot there. No initial zoom-change
  notification is emitted. Wait for this event rather than polling `isReady()`, which
  historically indicates instance creation, not completion of image loading.
- **`mosaicocropperzoomchange`**, with callback **`onZoomchange(event, state)`**, reports
  `{ scale, minScale, maxScale }`. DOM listeners read `event.detail.data`.
  Notifications cover wheel, internal slider, `scale(value)`, `fit()`, and resize or
  `cropHeight(value)` changes to scale or limits. Values reflect the applied constraints.
  The callback spelling is `onZoomchange`, following the existing dispatcher convention.
- Updates are delivered in a microtask after the synchronous operation, before the next
  browser paint: wheel and external slider stay synchronized in real time, without
  debounce. Multiple changes in one synchronous batch produce one final snapshot.
  Unchanged state and writing back the accepted scale produce no extra notifications.
  `getZoomState()` can also be read immediately after a setter. No queued zoom events
  or late image-load callbacks are applied after destruction.

Complete integration example (the default adapter expects a Mosaico-compatible `/img`
endpoint; supply your own URL adapter for other services):

```html
<img id="image" src="https://example.com/photo.jpg" width="400" height="300" alt="Photo">
<fieldset id="image-controls" disabled>
  <legend>Image controls</legend>
  <button id="fit" type="button">Fit image</button>
  <label for="zoom">Zoom</label>
  <input id="zoom" type="range" step="any">
  <button id="apply" type="button">Apply crop</button>
</fieldset>
```

```js
import 'mosaico-cropper/dist/jqueryui-mosaico-cropper.min.css';
import { createMosaicoCropper } from 'mosaico-cropper';

const controls = document.getElementById('image-controls');
const zoom = document.getElementById('zoom');
function syncZoom({ scale, minScale, maxScale }) {
  zoom.min = minScale;
  zoom.max = maxScale;
  zoom.value = scale; // Setting value does not dispatch input, so no feedback loop.
}
const cropper = createMosaicoCropper('#image', {
  width: 400, height: 300,
  toolbar: false,
  autoClose: false,
  onCropperready(event) {
    syncZoom(event.detail.widget.getZoomState());
    controls.disabled = false;
  },
  onZoomchange(event, state) { syncZoom(state); },
  onCrop(event, { url }) {
    controls.disabled = true;
    console.log('Generated crop URL:', url);
  }
});
const fit = () => cropper.fit();
const scale = () => cropper.scale(Number(zoom.value));
const apply = () => cropper.finalizeCrop();
document.getElementById('fit').addEventListener('click', fit);
zoom.addEventListener('input', scale); // Includes native range keyboard interactions.
document.getElementById('apply').addEventListener('click', apply);

// Call when your component unmounts:
function cleanup() {
  cropper.destroy();
  document.getElementById('fit').removeEventListener('click', fit);
  zoom.removeEventListener('input', scale);
  document.getElementById('apply').removeEventListener('click', apply);
  controls.remove();
}
```

The same commands work through jQuery: `$('#image').mosaicoCropper('fit')`,
`$('#image').mosaicoCropper('getZoomState')`, and `$('#image').mosaicoCropper('scale', value)`.
A logarithmic external slider can map values with `Math.log` / `Math.exp`; it does not
need the internal slider component. `finalizeCrop()` generates the crop URL and disposes
the cropper after preloading it, including when started with `editable: false`.

Run `npm run dev` and open [the external toolbar demo](demo-external-toolbar.html) to try
wheel synchronization, focus, keyboard controls, fit and confirmation without an image service.

### Built-in controls

Toolbar actions and the view-mode edit trigger are native buttons with accessible names. The zoom control is a labelled range input and supports its standard keyboard controls. The edit trigger remains keyboard-focusable when hidden and is revealed on focus; it is also visible on devices without hover support.

## Performance Benefits

### Bundle Size Comparison

| Version | Bundle Size | Dependencies | Reduction |
|---------|------------|--------------|-----------|
| **Modern (No jQuery)** | ~35KB | None | **Baseline** |
| **Legacy (With jQuery)** | ~85KB | jQuery required | +58% larger |

### Runtime Performance

- **🚀 Faster DOM Operations**: Native DOM APIs are optimized by browsers
- **💾 Lower Memory Usage**: No jQuery overhead or event delegation layers  
- **⚡ Better Tree Shaking**: Modern bundlers can eliminate unused code
- **📦 Smaller Parse Time**: Less JavaScript to parse and compile

### Migration Path

You can migrate gradually:

1. **Phase 1**: Keep using jQuery API while upgrading to the new version
2. **Phase 2**: Start using modern API for new features  
3. **Phase 3**: Replace existing jQuery calls with modern API
4. **Phase 4**: Remove jQuery dependency entirely

```javascript
// Before (jQuery only)
$('#image').mosaicoCropper(options);

// After (Modern API) 
const cropper = createMosaicoCropper('#image', options);
```

### Framework Integration

The modern API works seamlessly with popular frameworks:

```javascript
// React
import { createMosaicoCropper } from 'mosaico-cropper';

function ImageCropper({ imageRef, options }) {
  useEffect(() => {
    const cropper = createMosaicoCropper(imageRef.current, options);
    return () => cropper.destroy();
  }, []);
}

// Vue
import { createMosaicoCropper } from 'mosaico-cropper';

export default {
  mounted() {
    this.cropper = createMosaicoCropper(this.$refs.image, this.options);
  },
  beforeDestroy() {
    this.cropper?.destroy();
  }
}

// Angular
import { createMosaicoCropper } from 'mosaico-cropper';

@Component({...})
export class ImageCropperComponent {
  ngAfterViewInit() {
    this.cropper = createMosaicoCropper(this.imageEl.nativeElement, this.options);
  }
  
  ngOnDestroy() {
    this.cropper?.destroy();
  }
}
```

### Demo

See the [demo](https://cropper.mosaico.io/demo.html)

### Internal links

[edit on GitHub](https://github.com/voidlabs/mosaico-cropper/edit/master/README.md)
