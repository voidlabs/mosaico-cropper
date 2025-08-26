/**
 * Vite Plugin for Image Processing
 * Handles /img route during development using the standalone image processor
 */

import { processImage, getContentType, validateQuery } from './image-processor.js';

/**
 * Vite plugin to handle image processing requests
 */
export function imageProcessorPlugin() {
  return {
    name: 'image-processor',
    configureServer(server) {
      server.middlewares.use('/img', async (req, res, next) => {
        let query = {};
        try {
          // Parse URL and query parameters
          const url = new URL(req.url, `http://${req.headers.host}`);
          query = Object.fromEntries(url.searchParams);

          // Allow 'url' as an alias for 'src'
          if (query.url) query.src = query.url;
          
          // Log request for debugging
          console.log(`[img] ${query.method} - ${query.src || 'placeholder'}`);
          
          // Validate query parameters
          validateQuery(query);
          
          // Process image
          const buffer = await processImage(query);
          const contentType = getContentType(query);
          
          // Send response
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', buffer.length);
          res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour in dev
          res.statusCode = 200;
          res.end(buffer);
          
        } catch (error) {
          console.error('[img] Error processing image:', error.message);
          
          // Send error response
          res.statusCode = error.message.includes('not found') ? 404 : 500;
          res.setHeader('Content-Type', 'text/plain');
          
          if (query && query.src && (query.src.startsWith('http://') || query.src.startsWith('https://'))) {
            res.end(`Remote image not found or unreachable: ${error.message}`);
          } else {
            res.end(`Image processing error: ${error.message}`);
          }
        }
      });
    }
  };
}