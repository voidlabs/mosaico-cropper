import { createMosaicoCropper, type CropperOptions, type ZoomState, type UrlAdapter } from '../../src/package.js';

const adapter: UrlAdapter = { fromSrc: '{urlOriginal:.*}', toSrc: crop => `${crop.width}/${crop.height}` };
const options: CropperOptions = {
    toolbar: false, autoClose: false, urlAdapter: adapter,
    onZoomchange(event, state) {
        const zoom: number = state.scale;
        const same: ZoomState = event.detail.data;
        event.detail.widget.scale(zoom).fit();
        void same;
    },
    onCrop(event, { url, crop }) { const size: number = crop.width; void size; void url; },
    onCropperready(event) { event.detail.widget.getZoomState(); }
};
const cropper = createMosaicoCropper('#image', options);
const scale: number = cropper.scale();
cropper.scale(scale).cropHeight(300).fit().finalizeCrop();
const state: ZoomState | null = cropper.getZoomState();
void state;
// @ts-expect-error Scale accepts numbers only.
cropper.scale('1.5');
// @ts-expect-error Only supported edit trigger values are accepted.
createMosaicoCropper('#image', { editTrigger: 'hover' });
// @ts-expect-error Zoom payload does not contain a URL.
createMosaicoCropper('#image', { onZoomchange(event, value) { value.url; } });
document.createElement('img').addEventListener('mosaicocropperzoomchange', event => {
    const zoom: number = event.detail.data.scale;
    void zoom;
});
