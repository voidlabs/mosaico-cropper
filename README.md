## Usage

To use the Mosaico Cropper in your project, include the generated CSS and JavaScript files, along with the required dependencies (jQuery, jQuery UI, and jQuery UI Touch Punch).

1.  **Include Files**: Add the following tags to your HTML file, making sure the paths are correct. It's recommended to load jQuery and its plugins first.

    ```html
    <!-- Dependencies -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"></script>

    <!-- Mosaico Cropper -->
    <link rel="stylesheet" href="/path/to/dist/jqueryui-mosaico-cropper.min.css">
    <script src="/path/to/dist/jqueryui-mosaico-cropper.min.js"></script>
    ```

2.  **Initialize the Cropper**: Call the widget on your image element.

    ```javascript
    $(function() {
      $('#my-image').mosaicoCropper({
        // Options go here
        // e.g., urlAdapter: 'cloudimage'
      });
    });
    ```

### Demo

See the [demo](https://cropper.mosaico.io/demo.html)

### Internal links

[edit on GitHub](https://github.com/voidlabs/mosaico-cropper/edit/master/README.md)
