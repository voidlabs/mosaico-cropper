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

### Core Options

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

$('#image').on('mosaicocropperheight', function(event) {
  console.log('Crop height changed:', event.detail.value);
});
```

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
