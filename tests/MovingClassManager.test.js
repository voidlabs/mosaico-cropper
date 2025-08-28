import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MovingClassManager } from '../src/js/utils/MovingClassManager.js';
import { createMockElement } from './utils/testHelpers.js';

describe('MovingClassManager', () => {
    let mockElement;
    let manager;
    
    beforeEach(() => {
        mockElement = createMockElement();
        manager = new MovingClassManager(mockElement);
        
        // Mock setTimeout/clearTimeout
        vi.useFakeTimers();
    });
    
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });
    
    describe('Constructor', () => {
        it('should throw error for invalid element', () => {
            expect(() => new MovingClassManager()).toThrow('MovingClassManager requires a native HTMLElement');
            expect(() => new MovingClassManager({})).toThrow('MovingClassManager requires a native HTMLElement');
            expect(() => new MovingClassManager(null)).toThrow('MovingClassManager requires a native HTMLElement');
        });
        
        it('should initialize with correct default state', () => {
            expect(manager.state).toEqual({
                isMoving: false,
                currentClass: null,
                hasTimeout: false
            });
        });
    });
    
    describe('addMovingClass()', () => {
        it('should throw error for invalid className', () => {
            expect(() => manager.addMovingClass()).toThrow('addMovingClass requires a valid className string');
            expect(() => manager.addMovingClass('')).toThrow('addMovingClass requires a valid className string');
            expect(() => manager.addMovingClass(123)).toThrow('addMovingClass requires a valid className string');
        });
        
        it('should add moving classes when not already moving', () => {
            manager.addMovingClass('drag');
            
            expect(mockElement.classList.add).toHaveBeenCalledWith('cropper-moving');
            expect(mockElement.classList.add).toHaveBeenCalledWith('cropper-moving-drag');
            expect(manager.state).toEqual({
                isMoving: true,
                currentClass: 'drag',
                hasTimeout: false
            });
        });
        
        it('should not add classes if already moving', () => {
            // First call - should add classes
            manager.addMovingClass('drag');
            expect(mockElement.classList.add).toHaveBeenCalledTimes(2);
            
            // Reset mock
            mockElement.classList.add.mockClear();
            
            // Second call - should not add classes
            manager.addMovingClass('slide');
            expect(mockElement.classList.add).not.toHaveBeenCalled();
            expect(manager.state.currentClass).toBe('drag'); // Should remain unchanged
        });
        
        it('should clear existing timeout', () => {
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            
            // Set a timeout
            manager.setAutoRemoveTimeout(1000);
            expect(manager.state.hasTimeout).toBe(true);
            
            // Add moving class should clear timeout
            manager.addMovingClass('drag');
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });
    });
    
    describe('removeMovingClass()', () => {
        it('should remove classes when moving', () => {
            // First add classes
            manager.addMovingClass('drag');
            
            // Then remove
            manager.removeMovingClass();
            
            expect(mockElement.classList.remove).toHaveBeenCalledWith('cropper-moving');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('cropper-moving-drag');
            expect(manager.state).toEqual({
                isMoving: false,
                currentClass: null,
                hasTimeout: false
            });
        });
        
        it('should not remove classes when not moving', () => {
            manager.removeMovingClass();
            
            expect(mockElement.classList.remove).not.toHaveBeenCalled();
        });
        
        it('should clear timeout when removing classes', () => {
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            
            manager.addMovingClass('drag');
            manager.setAutoRemoveTimeout(1000);
            
            manager.removeMovingClass();
            
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });
    });
    
    describe('toggleMovingClass()', () => {
        it('should add class when not moving', () => {
            manager.toggleMovingClass('slide');
            
            expect(mockElement.classList.add).toHaveBeenCalledWith('cropper-moving');
            expect(mockElement.classList.add).toHaveBeenCalledWith('cropper-moving-slide');
            expect(manager.state.isMoving).toBe(true);
        });
        
        it('should remove classes when moving', () => {
            // First add
            manager.addMovingClass('drag');
            
            // Then toggle should remove
            manager.toggleMovingClass('slide');
            
            expect(mockElement.classList.remove).toHaveBeenCalledWith('cropper-moving');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('cropper-moving-drag');
            expect(manager.state.isMoving).toBe(false);
        });
    });
    
    describe('setAutoRemoveTimeout()', () => {
        it('should set timeout with default delay', () => {
            const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
            
            manager.addMovingClass('wheel');
            manager.setAutoRemoveTimeout();
            
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
            expect(manager.state.hasTimeout).toBe(true);
        });
        
        it('should set timeout with custom delay', () => {
            const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
            
            manager.addMovingClass('wheel');
            manager.setAutoRemoveTimeout(1000);
            
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
        });
        
        it('should automatically remove classes when timeout expires', () => {
            manager.addMovingClass('wheel');
            manager.setAutoRemoveTimeout(500);
            
            // Fast-forward time
            vi.advanceTimersByTime(500);
            
            expect(mockElement.classList.remove).toHaveBeenCalledWith('cropper-moving');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('cropper-moving-wheel');
            expect(manager.state.isMoving).toBe(false);
        });
        
        it('should clear existing timeout before setting new one', () => {
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            
            manager.setAutoRemoveTimeout(1000);
            manager.setAutoRemoveTimeout(2000);
            
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });
    });
    
    describe('clearTimeout()', () => {
        it('should clear active timeout', () => {
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            
            manager.setAutoRemoveTimeout(1000);
            expect(manager.state.hasTimeout).toBe(true);
            
            manager.clearTimeout();
            expect(clearTimeoutSpy).toHaveBeenCalled();
            expect(manager.state.hasTimeout).toBe(false);
        });
        
        it('should handle no active timeout gracefully', () => {
            expect(() => manager.clearTimeout()).not.toThrow();
        });
    });
    
    describe('destroy()', () => {
        it('should cleanup everything', () => {
            manager.addMovingClass('drag');
            manager.setAutoRemoveTimeout(1000);
            
            manager.destroy();
            
            expect(mockElement.classList.remove).toHaveBeenCalledWith('cropper-moving');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('cropper-moving-drag');
            expect(manager.element).toBe(null);
        });
        
        it('should handle destroy when not moving', () => {
            expect(() => manager.destroy()).not.toThrow();
            expect(manager.element).toBe(null);
        });
    });
    
    describe('state getter', () => {
        it('should return correct state information', () => {
            // Initial state
            expect(manager.state).toEqual({
                isMoving: false,
                currentClass: null,
                hasTimeout: false
            });
            
            // After adding class
            manager.addMovingClass('drag');
            expect(manager.state).toEqual({
                isMoving: true,
                currentClass: 'drag',
                hasTimeout: false
            });
            
            // After setting timeout
            manager.setAutoRemoveTimeout(1000);
            expect(manager.state).toEqual({
                isMoving: true,
                currentClass: 'drag',
                hasTimeout: true
            });
        });
    });
});