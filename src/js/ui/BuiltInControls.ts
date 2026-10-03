import type { CropperUIFactory, ZoomState } from '../../types.js';

/** Built-in controls consume exactly the commands/state available to hosts. */
export const createBuiltInControls: CropperUIFactory = (root, cropper, options) => {
    const host = root.querySelector<HTMLElement>('.clipping-container')!;
    const removers: Array<() => void> = [];
    const elements: HTMLElement[] = [];
    function button(parent: HTMLElement, className: string, label: string, icon: string, action: () => void) {
        const element = document.createElement('button');
        element.type = 'button';
        element.className = className;
        element.setAttribute('aria-label', label);
        element.innerHTML = `<i class="fa ${icon}" aria-hidden="true"></i>`;
        element.addEventListener('click', action);
        removers.push(() => element.removeEventListener('click', action));
        parent.append(element);
        return element;
    }

    if (options.toolbar !== false) {
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        button(toolbar, 'tool tool-zoom', 'Fit image', 'fa-compress', () => cropper.fit());
        const slot = document.createElement('div');
        slot.className = 'cropper-zoom-slider';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'vanilla-slider';
        slider.setAttribute('aria-label', 'Zoom level');
        // Logarithmic scale, independent of the model and gesture components.
        slider.step = 'any';
        function sync({ scale, minScale, maxScale }: ZoomState) {
            slider.min = String(Math.log(minScale));
            slider.max = String(Math.log(maxScale));
            slider.value = String(Math.log(scale));
            slider.setAttribute('aria-valuetext', `${Math.round(scale * 100)}%`);
        }
        const input = () => {
            cropper.scale(Math.exp(Number(slider.value)));
            sync(cropper.getZoomState());
        };
        slider.addEventListener('input', input);
        removers.push(() => slider.removeEventListener('input', input));
        removers.push(cropper.onZoomChange(sync));
        sync(cropper.getZoomState());
        slot.append(slider);
        toolbar.append(slot);
        button(toolbar, 'tool tool-crop', 'Apply crop', 'fa-check', () => {
            if (options.editable === false) cropper.finishEdit();
            else cropper.finalizeCrop();
        });
        host.prepend(toolbar);
        elements.push(toolbar);
    }
    const edit = button(host, 'mosaico-cropper-edit-trigger', 'Edit crop', 'fa-pencil', () => cropper.startEdit());
    elements.push(edit);

    return {
        destroy() {
            for (const remove of removers) remove();
            for (const element of elements) element.remove();
        }
    };
};
