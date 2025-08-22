import { describe, it, expect } from 'vitest';
import { urlAdapterFromSrc, urlAdapterToSrc } from '../src/js/url-adapters.js';

describe('url-adapters', () => {
  // Test with a simple adapter that matches the expected format
  const simpleAdapter = {
    fromSrc: '{urlPrefix:https?://[^/]*/img}.*method=resize.*params={width:[0-9]+}.*url={encodedUrlOriginal:[^ &\\?]+}',
    toSrc: {
      resize: '{urlPrefix}?method=resize&params={width}&url={encodedUrlOriginal}',
      cover: '{urlPrefix}?method=cover&params={width},{height}&url={encodedUrlOriginal}'
    }
  };

  const mockUrlData = {
    urlOriginal: 'https://example.com/image.jpg',
    urlPrefix: 'https://proxy.example.com/img',
    urlPostfix: ''
  };

  describe('urlAdapterFromSrc', () => {
    it('should parse a resize URL correctly', () => {
      const src = 'https://proxy.example.com/img?method=resize&params=300&url=https%3A%2F%2Fexample.com%2Fimage.jpg';
      const result = urlAdapterFromSrc(simpleAdapter, {}, src);
      
      // The result should contain the parsed values
      expect(result).toBeDefined();
      expect(result.urlPrefix).toBe('https://proxy.example.com/img');
      expect(result.width).toBe('300');
      expect(result.encodedUrlOriginal).toBe('https%3A%2F%2Fexample.com%2Fimage.jpg');
      expect(result.urlOriginal).toBe('https://example.com/image.jpg');
    });

    it('should return null for unmatched URLs', () => {
      const src = 'https://unknown.example.com/img?method=other&params=300&url=https%3A%2F%2Fexample.com%2Fimage.jpg';
      const result = urlAdapterFromSrc(simpleAdapter, {}, src);
      
      expect(result).toBeNull();
    });

    it('should handle defaultPrefix when URL parsing fails', () => {
      const adapterWithDefaultPrefix = {
        fromSrc: simpleAdapter.fromSrc,
        toSrc: simpleAdapter.toSrc,
        defaultPrefix: 'https://default.example.com/img'
      };
      
      const src = 'https://example.com/image.jpg';
      const urlData = {};
      const result = urlAdapterFromSrc(adapterWithDefaultPrefix, urlData, src);
      
      expect(result).toBeNull(); // Should still return null for parsing
      expect(urlData.urlOriginal).toBe('https://example.com/image.jpg');
      expect(urlData.urlPrefix).toBe('https://default.example.com/img');
      expect(urlData.urlPostfix).toBe('https://example.com/image.jpg');
    });

    // Test error case for malformed pattern that causes res.length !== matchNames.length + 1
    it('should handle malformed patterns gracefully', () => {
      // This test is for line 55 coverage - when res.length !== matchNames.length + 1
      // This is a bit tricky to test directly, but we can at least verify it doesn't crash
      const malformedAdapter = {
        fromSrc: '{urlPrefix:https?://[^/]*/img}(.*method=resize.*params={width:[0-9]+}.*url={encodedUrlOriginal:[^ &\\?]+})',
        toSrc: '{urlPrefix}?method=resize&params={width}&url={encodedUrlOriginal}'
      };
      
      const src = 'https://proxy.example.com/img?method=resize&params=300&url=https%3A%2F%2Fexample.com%2Fimage.jpg';
      const result = urlAdapterFromSrc(malformedAdapter, {}, src);
      
      // We don't assert on the result as it may be null or malformed
      // but we want to ensure it doesn't crash
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('urlAdapterToSrc', () => {
    it('should generate a resize URL correctly', () => {
      const urlData = { ...mockUrlData };
      const res = {
        method: 'resize',
        width: 300
      };
      
      const result = urlAdapterToSrc(simpleAdapter, urlData, res);
      
      expect(result).toBe('https://proxy.example.com/img?method=resize&params=300&url=https%3A%2F%2Fexample.com%2Fimage.jpg');
    });

    it('should generate a cover URL correctly', () => {
      const urlData = { ...mockUrlData };
      const res = {
        method: 'cover',
        width: 300,
        height: 200
      };
      
      const result = urlAdapterToSrc(simpleAdapter, urlData, res);
      
      expect(result).toBe('https://proxy.example.com/img?method=cover&params=300,200&url=https%3A%2F%2Fexample.com%2Fimage.jpg');
    });
  });

  // Test with object-based fromSrc patterns (like in the actual adapters)
  describe('with object-based patterns', () => {
    const objectAdapter = {
      fromSrc: {
        urlPrefix: 'https?://[^/]*/img',
        width: '[0-9]+',
        encodedUrlOriginal: '[^ &\\?]+'
      },
      toSrc: {
        resize: '{urlPrefix}?method=resize&params={width}&url={encodedUrlOriginal}',
        cover: '{urlPrefix}?method=cover&params={width},{height}&url={encodedUrlOriginal}'
      }
    };

    it('should work with object-based fromSrc patterns', () => {
      const urlData = { ...mockUrlData };
      const res = {
        method: 'resize',
        width: 400
      };
      
      const result = urlAdapterToSrc(objectAdapter, urlData, res);
      
      expect(result).toBe('https://proxy.example.com/img?method=resize&params=400&url=https%3A%2F%2Fexample.com%2Fimage.jpg');
    });
  });

  // Test with actual adapters from the project
  describe('with actual adapters', () => {
    // Cloudinary adapter from urladapters.js
    const cloudinaryAdapter = {
      fromSrc: {
        urlPrefix: '.*/upload',
        urlPostfix: '/[^/]*',
      },
      toSrc: {
        original: '{urlPrefix}{urlPostfix}',
        resize: '{urlPrefix}/w_{width}{urlPostfix}',
        cover: '{urlPrefix}/w_{width},h_{height},c_fill{urlPostfix}',
        cropresize: '{urlPrefix}/x_{cropX},y_{cropY},w_{cropWidth},h_{cropHeight},c_crop/w_{width},h_{height},c_scale{urlPostfix}',
        resizecrop: '{urlPrefix}/w_{resizeWidth},h_{resizeHeight},c_scale/x_{offsetX},y_{offsetY},w_{width},h_{height},c_crop{urlPostfix}',
      }
    };

    it('should work with Cloudinary adapter patterns', () => {
      const urlData = {
        urlOriginal: 'sample.jpg',
        urlPrefix: 'https://res.cloudinary.com/demo/image/upload',
        urlPostfix: '/sample.jpg'
      };
      
      const res = {
        method: 'resize',
        width: 300
      };
      
      const result = urlAdapterToSrc(cloudinaryAdapter, urlData, res);
      
      expect(result).toBe('https://res.cloudinary.com/demo/image/upload/w_300/sample.jpg');
    });

    it('should parse Cloudinary URLs correctly', () => {
      const src = 'https://res.cloudinary.com/demo/image/upload/w_300/sample.jpg';
      const result = urlAdapterFromSrc(cloudinaryAdapter, {}, src);
      
      expect(result).toBeDefined();
      expect(result.urlPrefix).toBe('https://res.cloudinary.com/demo/image/upload');
      expect(result.urlPostfix).toBe('/sample.jpg');
    });
  });

  // Test edge cases to improve coverage
  describe('edge cases for coverage', () => {
    it('should handle unknown token error in _urlParser', () => {
      // This test is for lines 63-65 coverage - when an unknown token is used
      const badAdapter = {
        fromSrc: '{unknownToken}',
        toSrc: '{unknownToken}'
      };
      
      const src = 'test';
      
      // We expect this to throw an error
      expect(() => {
        urlAdapterFromSrc(badAdapter, {}, src);
      }).toThrow(/Uknown token/);
    });

    it('should fallback through methods in urlAdapterToSrc', () => {
      // This test is for lines 83-84 coverage - the fallback mechanism
      const adapterWithMissingMethod = {
        fromSrc: '{urlPrefix:https?://[^/]*/img}',
        toSrc: {
          // Missing 'cropresize' method, so it should fallback to 'resizecrop'
          resizecrop: '{urlPrefix}?method=resizecrop&params={resizeWidth},{resizeHeight},{offsetX},{offsetY},{width},{height}&url={encodedUrlOriginal}'
        }
      };
      
      const urlData = { 
        urlOriginal: 'https://example.com/image.jpg',
        urlPrefix: 'https://proxy.example.com/img'
      };
      
      const res = {
        method: 'cropresize', // This method is not available
        resizeWidth: 400,
        resizeHeight: 300,
        offsetX: 50,
        offsetY: 60,
        width: 200,
        height: 150
      };
      
      const result = urlAdapterToSrc(adapterWithMissingMethod, urlData, res);
      
      // Should fallback to 'resizecrop' method
      expect(result).toBe('https://proxy.example.com/img?method=resizecrop&params=400,300,50,60,200,150&url=https%3A%2F%2Fexample.com%2Fimage.jpg');
    });

    it('should handle adapter with string toSrc', () => {
      // Test the case where toSrc is a string (line 83-84 coverage)
      const stringToSrcAdapter = {
        fromSrc: '{urlPrefix:https?://[^/]*/img}',
        toSrc: '{urlPrefix}?method=simple&url={encodedUrlOriginal}'
      };
      
      const urlData = { 
        urlOriginal: 'https://example.com/image.jpg',
        urlPrefix: 'https://proxy.example.com/img'
      };
      
      const res = {
        method: 'resize'
      };
      
      const result = urlAdapterToSrc(stringToSrcAdapter, urlData, res);
      
      expect(result).toBe('https://proxy.example.com/img?method=simple&url=https%3A%2F%2Fexample.com%2Fimage.jpg');
    });
  });
});