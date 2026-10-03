import type { CropModel } from '../CropModel.js';
import type { MovingClassManager } from '../utils/MovingClassManager.js';
import type { CropperWidget, CropMethod } from '../../types.js';
import { CropperComponent } from './CropperComponent.js';

/**
 * CropperSlider - Slider logaritmico compatto
 * Refactored per utilizzare JavaScript nativo invece di jQuery
 */
export class CropperSlider extends CropperComponent {
    constructor(element: HTMLElement) {
        super(element, 'CropperSlider');
        
        this.sliderInput = null;
    }
    
    static _fromSliderValueToScale(value: number) {
        return Math.pow(1.03, value) / 100;
    }
    
    static _fromScaleToSliderValue(scale: number) {
        return Math.log(scale * 100) / Math.log(1.03);
    }
    
    initialize(cropModel: CropModel, movingClassManager: MovingClassManager, onChanged: (reason?: string) => void) {
        super.initializeBase(cropModel, movingClassManager, onChanged);
        
        const minValue = Math.floor(CropperSlider._fromScaleToSliderValue(cropModel.getMinScale()));
        const maxValue = Math.ceil(CropperSlider._fromScaleToSliderValue(cropModel.getMaxScale()));
        const currentValue = Math.round(CropperSlider._fromScaleToSliderValue(cropModel.getScale()));
        
        // Use native innerHTML instead of jQuery .html()
        this.element!.innerHTML = `<input type="range" class="vanilla-slider" aria-label="Zoom level" min="${minValue}" max="${maxValue}" step="1" value="${currentValue}">`;
        
        // Use native querySelector instead of jQuery .find()
        this.sliderInput = this.element!.querySelector<HTMLInputElement>('.vanilla-slider')!;
        
        let isSliding = false;
        
        // Event handler for input changes
        const inputHandler: EventListener = event => {
            const e = event as Event & { originalEvent?: { propertyName?: string } };
            const target = e.target as HTMLInputElement;
            if (isSliding && (e.type === 'input' || (e.type === 'propertychange' && e.originalEvent?.propertyName === 'value'))) {
                const value = parseInt(target.value);
                const newScale = CropperSlider._fromSliderValueToScale(value);
                cropModel.updateScale(newScale);
                onChanged("slide");
                
                const adjustedValue = CropperSlider._fromScaleToSliderValue(cropModel.getScale());
                if (Math.abs(adjustedValue - value) > 0.5) {
                    target.value = String(Math.round(adjustedValue));
                }
            }
        };
        
        // Event handler for mouse/touch start
        const startHandler = () => {
            isSliding = true;
            movingClassManager.addMovingClass('slide');
        };
        
        // Event handler for mouse/touch end
        const endHandler = () => {
            if (isSliding) {
                isSliding = false;
                movingClassManager.removeMovingClass();
            }
        };
        
        // Event handler for keyboard navigation
        const keyHandler: EventListener = event => {
            const e = event as KeyboardEvent;
            if (e.keyCode === 37 || e.keyCode === 39) { // Left/Right arrow keys
                movingClassManager.addMovingClass('slide');
            }
        };
        
        // Use native addEventListener instead of jQuery .on()
        this.sliderInput!.addEventListener('input', inputHandler);
        this.sliderInput!.addEventListener('propertychange', inputHandler);
        this.sliderInput!.addEventListener('mousedown', startHandler);
        this.sliderInput!.addEventListener('touchstart', startHandler);
        this.sliderInput!.addEventListener('mouseup', endHandler);
        this.sliderInput!.addEventListener('touchend', endHandler);
        this.sliderInput!.addEventListener('keyup', endHandler);
        this.sliderInput!.addEventListener('keydown', keyHandler);
        
        // Store handlers for cleanup
        this._eventHandlers.set('input', inputHandler);
        this._eventHandlers.set('propertychange', inputHandler);
        this._eventHandlers.set('mousedown', startHandler);
        this._eventHandlers.set('touchstart', startHandler);
        this._eventHandlers.set('mouseup', endHandler);
        this._eventHandlers.set('touchend', endHandler);
        this._eventHandlers.set('keyup', endHandler);
        this._eventHandlers.set('keydown', keyHandler);
    }
    
    updateFromScale(scale: number) {
        if (this.sliderInput) {
            // Use native value property instead of jQuery .val()
            this.sliderInput!.value = String(Math.round(CropperSlider._fromScaleToSliderValue(scale)));
        }
    }
    
    updateMinScale(minScale: number) {
        if (this.sliderInput) {
            // Use native setAttribute instead of jQuery .attr()
            this.sliderInput!.setAttribute('min', String(Math.floor(CropperSlider._fromScaleToSliderValue(minScale))));
        }
    }
    
    destroy() {
        // Component-specific cleanup first
        if (this.element) {
            // Use native innerHTML instead of jQuery .empty()
            this.element!.innerHTML = '';
        }
        
        this.sliderInput = null;
        
        // Use base class cleanup for common event handler cleanup
        super.destroy();
    }
}
