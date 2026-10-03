import type { CropModel } from '../CropModel.js';
import type { MovingClassManager } from '../utils/MovingClassManager.js';
import type { CropperWidget, CropMethod } from '../../types.js';
import { CropperComponent } from './CropperComponent.js';

/**
 * CropperResizer - Resize verticale compatto
 * Refactored per utilizzare JavaScript nativo invece di jQuery
 */
export class CropperResizer extends CropperComponent {
    cropperFrameEl: HTMLElement;
    rootEl: HTMLElement | null;
    widget: CropperWidget | null;
    constructor(cropperFrameEl: HTMLElement) {
        super(cropperFrameEl, 'CropperResizer');
        
        // Store the frame element reference (same as this.element but named for clarity)
        this.cropperFrameEl = this.element!;
        this.handleElement = null;
        this.rootEl = null;
        this.widget = null;
    }
    
    initialize(cropModel: CropModel, rootEl: HTMLElement, movingClassManager: MovingClassManager, onChanged: (reason?: string) => void, widget: CropperWidget | null = null) {
        super.initializeBase(cropModel, movingClassManager, onChanged);
        this.rootEl = this.toNativeElement(rootEl);
        this.widget = widget;
        
        // Create handle element using native DOM instead of jQuery
        this.handleElement = document.createElement('div');
        this.handleElement.className = 'clip-handle vanilla-resizable-s';
        this.cropperFrameEl.appendChild(this.handleElement);
        
        let isResizing = false;
        let startY: number, startHeight: number, originalHeight: number, originalOuterTop: number, originalMethod: CropMethod, maxHeight: number;
        
        // Event handler for resize start
        const resizeStartHandler = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            
            isResizing = true;
            startY = this.getEventCoords(event).y;
            startHeight = this.cropperFrameEl.offsetHeight;
            originalHeight = startHeight;
            
            this.rootEl!.focus();
            movingClassManager.addMovingClass('handle');
            originalOuterTop = cropModel.getContainerTop();
            originalMethod = cropModel.getCurrentComputedMethod();
            maxHeight = cropModel.getScaledImageSize().height;
        };
        
        // Event handler for resize move
        const resizeMoveHandler = (moveEvent: Event) => {
            if (!isResizing) return;
            
            const currentY = this.getEventCoords(moveEvent).y;
            const deltaY = currentY - startY;
            const newHeight = Math.max(40, startHeight + deltaY);
            
            cropModel.updateCropHeightInternal(originalMethod, newHeight, originalHeight, originalOuterTop, maxHeight);
            onChanged("resizing");
            
            // Use native style instead of jQuery .height()
            this.cropperFrameEl.style.height = cropModel.getCropHeight() + 'px';
            
            // Trigger cropheight event - backward compatibility with widget pattern
            if (this.widget && typeof this.widget._trigger === 'function') {
                this.widget._trigger('cropheight', null, { value: cropModel.getCropHeight() });
            }
            
            moveEvent.preventDefault();
        };
        
        // Event handler for resize end
        const resizeEndHandler = (upEvent: Event) => {
            if (!isResizing) return;
            isResizing = false;
            
            // Remove document event listeners
            document.removeEventListener('mousemove', resizeMoveHandler);
            document.removeEventListener('touchmove', resizeMoveHandler);
            document.removeEventListener('mouseup', resizeEndHandler);
            document.removeEventListener('touchend', resizeEndHandler);
            
            movingClassManager.removeMovingClass();
            onChanged("resized");
            upEvent.preventDefault();
        };
        
        // Combined start handler that sets up document listeners
        const startHandler = (event: Event) => {
            resizeStartHandler(event);
            
            // Add document event listeners for move and end
            document.addEventListener('mousemove', resizeMoveHandler);
            document.addEventListener('touchmove', resizeMoveHandler);
            document.addEventListener('mouseup', resizeEndHandler);
            document.addEventListener('touchend', resizeEndHandler);
        };
        
        // Event handler for double-click auto-resize
        const dblClickHandler = () => {
            cropModel.updateCropHeight(cropModel.getScaledImageSize().height);
            onChanged("resized");
            return false;
        };
        
        // Use native addEventListener instead of jQuery .on()
        this.handleElement.addEventListener('mousedown', startHandler);
        this.handleElement.addEventListener('touchstart', startHandler);
        this.handleElement.addEventListener('dblclick', dblClickHandler);
        
        // Store handlers for cleanup
        this._eventHandlers.set('mousedown', startHandler);
        this._eventHandlers.set('touchstart', startHandler);
        this._eventHandlers.set('dblclick', dblClickHandler);
        this._documentHandlers.set('mousemove', resizeMoveHandler);
        this._documentHandlers.set('touchmove', resizeMoveHandler);
        this._documentHandlers.set('mouseup', resizeEndHandler);
        this._documentHandlers.set('touchend', resizeEndHandler);
    }
    
    destroy() {
        // Use base class cleanup for common event handler cleanup
        super.destroy();
        
        // Component-specific cleanup
        // Remove handle element using native DOM
        if (this.handleElement && this.handleElement.parentNode) {
            this.handleElement.parentNode.removeChild(this.handleElement);
        }
        
        this.handleElement = null;
        this.rootEl = null;
        this.widget = null;
    }
}