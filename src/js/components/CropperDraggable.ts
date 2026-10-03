import type { CropModel } from '../CropModel.js';
import type { MovingClassManager } from '../utils/MovingClassManager.js';
import type { CropperWidget, CropMethod } from '../../types.js';
import { CropperComponent } from './CropperComponent.js';

/**
 * CropperDraggable - Drag/pan/zoom compatto
 * Refactored per utilizzare JavaScript nativo invece di jQuery
 */
export class CropperDraggable extends CropperComponent {
    shiftWheel: boolean;
    rootEl: HTMLElement | null;
    hasDragged: boolean;
    constructor(element: HTMLElement, options: { shiftWheel?: boolean } = {}) {
        super(element, 'CropperDraggable');
        
        this.shiftWheel = options.shiftWheel || false;
        this.rootEl = null;
        this.hasDragged = false;
    }
    
    initialize(cropModel: CropModel, rootEl: HTMLElement, movingClassManager: MovingClassManager, onChanged: (reason?: string) => void) {
        super.initializeBase(cropModel, movingClassManager, onChanged);
        this.rootEl = this.toNativeElement(rootEl);
        
        let isDragging = false;
        let startCoords: { x: number; y: number }, startLeft: number, startTop: number;
        
        // Event handler for drag start
        const dragStartHandler = (event: Event) => {
            event.preventDefault();
            isDragging = true;
            
            startCoords = this.getEventCoords(event);
            startLeft = cropModel.getContainerLeft();
            startTop = cropModel.getContainerTop();
            
            this.rootEl!.focus();
            movingClassManager.addMovingClass('drag');
        };
        
        // Event handler for drag move
        const dragMoveHandler = (moveEvent: Event) => {
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
        
        // Event handler for drag end
        const dragEndHandler = (upEvent: Event) => {
            if (!isDragging) return;
            isDragging = false;
            
            // Remove document event listeners
            document.removeEventListener('mousemove', dragMoveHandler);
            document.removeEventListener('touchmove', dragMoveHandler);
            document.removeEventListener('mouseup', dragEndHandler);
            document.removeEventListener('touchend', dragEndHandler);
            
            onChanged("dragged");
            movingClassManager.removeMovingClass();
            
            if (this.hasDragged) {
                setTimeout(() => { this.hasDragged = false; }, 100);
            }
            upEvent.preventDefault();
        };
        
        // Combined start handler that sets up document listeners
        const startHandler = (event: Event) => {
            dragStartHandler(event);
            
            // Add document event listeners for move and end
            document.addEventListener('mousemove', dragMoveHandler);
            document.addEventListener('touchmove', dragMoveHandler);
            document.addEventListener('mouseup', dragEndHandler);
            document.addEventListener('touchend', dragEndHandler);
        };
        
        // Use native addEventListener instead of jQuery .on()
        this.element!.addEventListener('mousedown', startHandler);
        this.element!.addEventListener('touchstart', startHandler);
        
        // Store handlers for cleanup
        this._eventHandlers.set('mousedown', startHandler);
        this._eventHandlers.set('touchstart', startHandler);
        this._documentHandlers.set('mousemove', dragMoveHandler);
        this._documentHandlers.set('touchmove', dragMoveHandler);
        this._documentHandlers.set('mouseup', dragEndHandler);
        this._documentHandlers.set('touchend', dragEndHandler);
        
        // Event handler for wheel zoom
        const wheelHandler: EventListener = input => {
            const event = input as WheelEvent;
            if (this.shiftWheel && !event.shiftKey) return true;
            
            const delta = -event.deltaY || 0;
            this.rootEl!.focus();
            
            if (delta !== 0) {
                movingClassManager.addMovingClass('wheel');
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
        
        // Event handler for double-click auto-resize
        const dblClickHandler = () => {
            cropModel.updateSmartAutoResize();
            return false;
        };
        
        // Event handler for click toggle
        const clickHandler = () => {
            if (this.hasDragged) return;
            this.rootEl!.focus();
            movingClassManager.toggleMovingClass('click');
        };
        
        // Add remaining event listeners
        this.element!.addEventListener('wheel', wheelHandler);
        this.element!.addEventListener('dblclick', dblClickHandler);
        this.element!.addEventListener('click', clickHandler);
        
        // Store additional handlers for cleanup
        this._eventHandlers.set('wheel', wheelHandler);
        this._eventHandlers.set('dblclick', dblClickHandler);
        this._eventHandlers.set('click', clickHandler);
    }
    
    destroy() {
        // Use base class cleanup for common event handler cleanup
        super.destroy();
        
        // Component-specific cleanup
        this.hasDragged = false;
        this.rootEl = null;
    }
}