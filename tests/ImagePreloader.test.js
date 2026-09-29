import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImagePreloader } from '../src/js/utils/ImagePreloader.js';
import { mockConsoleLog } from './utils/testHelpers.js';

describe('ImagePreloader', () => {
    
    beforeEach(() => {
        mockConsoleLog();
    });
    
    afterEach(() => {
        vi.restoreAllMocks();
    });
    
    describe('preload()', () => {
        it('should throw error for invalid src', () => {
            expect(() => ImagePreloader.preload()).toThrow('ImagePreloader requires a valid src string');
            expect(() => ImagePreloader.preload('')).toThrow('ImagePreloader requires a valid src string');
            expect(() => ImagePreloader.preload(123)).toThrow('ImagePreloader requires a valid src string');
        });
        
        it('should create Image element and set src', () => {
            const mockImg = {
                onload: null,
                onerror: null,
                src: ''
            };
            
            // Mock Image constructor
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImg; }));
            
            const result = ImagePreloader.preload('https://example.com/image.jpg');
            
            expect(Image).toHaveBeenCalled();
            expect(mockImg.src).toBe('https://example.com/image.jpg');
            expect(result).toBe(mockImg);
        });
        
        it('should call onSuccess when image loads', () => {
            const mockImg = {
                onload: null,
                onerror: null,
                src: ''
            };
            
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImg; }));
            
            const onSuccess = vi.fn();
            const onError = vi.fn();
            const src = 'https://example.com/image.jpg';
            
            ImagePreloader.preload(src, onSuccess, onError);
            
            // Simula il caricamento dell'immagine
            mockImg.onload();
            
            expect(onSuccess).toHaveBeenCalledWith(mockImg, src);
            expect(onError).not.toHaveBeenCalled();
        });
        
        it('should call onError when image fails to load', () => {
            const mockImg = {
                onload: null,
                onerror: null,
                src: ''
            };
            
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImg; }));
            
            const onSuccess = vi.fn();
            const onError = vi.fn();
            const src = 'https://example.com/invalid-image.jpg';
            const mockError = new Error('404 Not Found');
            
            ImagePreloader.preload(src, onSuccess, onError);
            
            // Simula errore di caricamento
            mockImg.onerror(mockError);
            
            expect(onError).toHaveBeenCalledWith(src, mockError);
            expect(onSuccess).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Image preload failed:', mockError);
        });
        
        it('should work without callbacks', () => {
            const mockImg = {
                onload: null,
                onerror: null,
                src: ''
            };
            
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImg; }));
            
            expect(() => {
                ImagePreloader.preload('https://example.com/image.jpg');
                mockImg.onload();
                mockImg.onerror(new Error('test'));
            }).not.toThrow();
        });
        
        it('should return the image element', () => {
            const mockImg = {
                onload: null,
                onerror: null,
                src: ''
            };
            
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImg; }));
            
            const result = ImagePreloader.preload('https://example.com/image.jpg');
            
            expect(result).toBe(mockImg);
        });
    });
    
    describe('preloadMultiple()', () => {
        it('should preload multiple images and resolve with all results', async () => {
            const sources = [
                'https://example.com/image1.jpg',
                'https://example.com/image2.jpg',
                'https://example.com/image3.jpg'
            ];
            
            const mockImages = sources.map(src => ({
                onload: null,
                onerror: null,
                src: ''
            }));
            
            let imageIndex = 0;
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImages[imageIndex++]; }));
            
            const promise = ImagePreloader.preloadMultiple(sources);
            
            // Simula il caricamento di tutte le immagini
            mockImages.forEach((img, index) => {
                setTimeout(() => img.onload(), 10);
            });
            
            const results = await promise;
            
            expect(results).toHaveLength(3);
            results.forEach((result, index) => {
                expect(result.img).toBe(mockImages[index]);
                expect(result.src).toBe(sources[index]);
            });
        });
        
        it('should reject if any image fails to load', async () => {
            const sources = ['https://example.com/good.jpg', 'https://example.com/bad.jpg'];
            
            const mockImages = [
                { onload: null, onerror: null, src: '' },
                { onload: null, onerror: null, src: '' }
            ];
            
            let imageIndex = 0;
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImages[imageIndex++]; }));
            
            const promise = ImagePreloader.preloadMultiple(sources);
            
            // Prima immagine carica, seconda fallisce
            setTimeout(() => mockImages[0].onload(), 10);
            setTimeout(() => mockImages[1].onerror(new Error('404')), 20);
            
            await expect(promise).rejects.toEqual({
                src: 'https://example.com/bad.jpg',
                error: new Error('404')
            });
        });
    });
    
    describe('isImageLoaded()', () => {
        it('should return true for loaded image', () => {
            const mockImg = {
                complete: true,
                naturalWidth: 100,
                src: ''
            };
            
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImg; }));
            
            const result = ImagePreloader.isImageLoaded('https://example.com/loaded-image.jpg');
            
            expect(result).toBe(true);
            expect(mockImg.src).toBe('https://example.com/loaded-image.jpg');
        });
        
        it('should return false for unloaded image', () => {
            const mockImg = {
                complete: false,
                naturalWidth: 0,
                src: ''
            };
            
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImg; }));
            
            const result = ImagePreloader.isImageLoaded('https://example.com/unloaded-image.jpg');
            
            expect(result).toBe(false);
        });
        
        it('should return false for broken image', () => {
            const mockImg = {
                complete: true,
                naturalWidth: 0, // Broken image has naturalWidth = 0
                src: ''
            };
            
            vi.stubGlobal('Image', vi.fn(function ImageMock() { return mockImg; }));
            
            const result = ImagePreloader.isImageLoaded('https://example.com/broken-image.jpg');
            
            expect(result).toBe(false);
        });
    });
});
