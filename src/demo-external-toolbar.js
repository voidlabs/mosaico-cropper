import { createMosaicoCropper } from './index.js';

const photo = document.getElementById('photo');
const controls = document.getElementById('controls');
const zoom = document.getElementById('zoom');
const value = document.getElementById('value');
const status = document.getElementById('status');
const start = document.getElementById('start');

// A local sample keeps this demo independent of external image services.
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
const context = canvas.getContext('2d');
context.fillStyle = '#173c57'; context.fillRect(0, 0, 800, 600);
context.fillStyle = '#ffbb55'; context.fillRect(80, 70, 320, 330);
context.fillStyle = '#4ab7a6'; context.beginPath(); context.arc(550, 320, 190, 0, Math.PI * 2); context.fill();
context.fillStyle = '#fff'; context.font = '48px sans-serif'; context.fillText('Explore the frame', 80, 530);
const original = new Image();
original.src = canvas.toDataURL();
start.disabled = true;
original.decode().then(() => {
    photo.src = original.src;
    start.disabled = false;
});

// Demo-only client-side URL adapter. Hosts can use their normal image service.
const urlAdapter = {
    fromSrc: '{urlOriginal:.*}',
    toSrc(crop) {
        const result = document.createElement('canvas');
        result.width = crop.width;
        result.height = crop.height;
        result.getContext('2d').drawImage(original, crop.cropX, crop.cropY,
            crop.cropWidth, crop.cropHeight, 0, 0, crop.width, crop.height);
        return result.toDataURL();
    }
};

let cropper;
function sync(state) {
    zoom.min = state.minScale;
    zoom.max = state.maxScale;
    zoom.value = state.scale;
    value.value = `${Math.round(state.scale * 100)}%`;
}
start.addEventListener('click', () => {
    cropper?.destroy();
    photo.src = original.src;
    photo.width = 400; photo.height = 300;
    start.disabled = true;
    status.textContent = 'Loading…';
    cropper = createMosaicoCropper(photo, {
        width: 400, height: 300, toolbar: false, autoClose: false, urlAdapter,
        onCropperready(event) {
            sync(event.detail.widget.getZoomState());
            controls.disabled = false;
            status.textContent = 'Editing. Wheel and slider stay synchronized.';
        },
        onZoomchange(event, state) { sync(state); },
        onCrop(event, data) {
            photo.height = data.crop.height;
            controls.disabled = true;
            status.textContent = `Applied ${data.crop.width} × ${data.crop.height} crop.`;
            photo.addEventListener('load', () => { start.disabled = false; start.focus(); }, { once: true });
        }
    });
});
document.getElementById('fit').addEventListener('click', () => cropper.fit());
zoom.addEventListener('input', () => cropper.scale(Number(zoom.value)));
document.getElementById('apply').addEventListener('click', () => cropper.finalizeCrop());
window.addEventListener('pagehide', () => cropper?.destroy());
