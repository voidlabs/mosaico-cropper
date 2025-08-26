/**
 * Image Processing Module
 * Handles image manipulation operations (resize, crop, placeholder generation)
 * Independent of server/framework implementation
 */

import { Jimp, loadFont, JimpMime, HorizontalAlign, VerticalAlign } from 'jimp';
import * as JimpFonts from "jimp/fonts";
import url from 'url';

let font;
let font2x;

async function loadFonts() {
    font = await loadFont(JimpFonts.SANS_32_BLACK);
    font2x = await loadFont(JimpFonts.SANS_64_BLACK);
}

// Initialize fonts
loadFonts();

/**
 * Process image based on method and parameters
 * @param {Object} query - Query parameters (method, params, src, text)
 * @returns {Promise<Buffer>} - Processed image buffer
 */
export async function processImage(query) {
    const params = query.params.split(',');
    
    if (query.method === 'placeholder' || query.method === 'placeholder2') {
        return await generatePlaceholder(query, params);
    } else if (['resize', 'resizex', 'cover', 'coverx', 'aspect', 'cropresize', 'cropresizex'].includes(query.method)) {
        return await manipulateImage(query, params);
    } else {
        throw new Error(`Unexpected method: ${query.method}`);
    }
}

/**
 * Generate placeholder image
 */
async function generatePlaceholder(query, params) {
    const size = query.method === 'placeholder2' ? 80 : 40;
    const w = parseInt(params[0]);
    const h = parseInt(params[1]);
    const text = query.text ? query.text : `${w} x ${h}`;
    const workScale = 1;

    const image = new Jimp({ width: w * workScale, height: h * workScale, color: '#808080'});
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        if ((((Math.ceil(image.bitmap.height / (size * workScale * 2))+1)*(size * workScale * 2) + x - y) % (size * workScale * 2)) < size * workScale) {
            image.setPixelColor(0x707070FF, x, y);
        }
    });

    const tempImg = new Jimp({width: w * workScale, height: h * workScale, color: 0x0})
        .print({
            font: query.method === 'placeholder2' ? font2x : font, 
            x: 0, 
            y: 0,
            text: {
                text: text,
                alignmentX: HorizontalAlign.CENTER,
                alignmentY: VerticalAlign.MIDDLE,
            },
            maxWidth: w * workScale,
            maxHeight: h * workScale
        })
        .color([{ apply: 'xor', params: [{ r: 176, g: 176, b: 176 }] }]);
    
    image.blit(tempImg, 0, 0);
    return await image.getBuffer(JimpMime.png);
}

/**
 * Manipulate existing image (resize, crop, etc.)
 */
async function manipulateImage(query, params) {
    // Handle both remote URLs and local paths
    let src;
    if (query.src.startsWith('http://') || query.src.startsWith('https://')) {
        // Remote URL - use directly with JIMP
        src = query.src;
    } else {
        // Local path - parse as before
        const urlparsed = url.parse(query.src);
        src = "./" + decodeURI(urlparsed.pathname);
    }

    const image = await Jimp.read(src);

    // "aspect" method is currently unused, but we're evaluating it.
    if (query.method === 'aspect') {
        const oldparams = [params[0], params[1]];
        if (params[0] / params[1] > image.bitmap.width / image.bitmap.height) {
            params[1] = Math.round(image.bitmap.width / (params[0] / params[1]));
            params[0] = image.bitmap.width;
        } else {
            params[0] = Math.round(image.bitmap.height * (params[0] / params[1]));
            params[1] = image.bitmap.height;
        }
    }

    if (query.method === 'resize' || query.method === 'resizex') {
        return await handleResize(image, query, params);
    } else if (query.method === 'cover' || query.method === 'coverx') {
        return await handleCover(image, query, params);
    } else if (query.method === 'cropresize' || query.method === 'cropresizex') {
        return await handleCropResize(image, query, params);
    }
    
    return await image.getBuffer(JimpMime.png);
}

/**
 * Handle resize operations
 */
async function handleResize(image, query, params) {
    if (params[0] === 'null') {
        if (query.method === 'resize' || image.bitmap.height > parseInt(params[1])) {
            image.resize({ h: parseInt(params[1])});
        }
    } else if (params[1] === 'null') {
        if (query.method === 'resize' || image.bitmap.width > parseInt(params[0])) {
            image.resize({ w: parseInt(params[0])});
        }
    } else {
        if (query.method === 'resize' || image.bitmap.width > parseInt(params[0]) || image.bitmap.height > parseInt(params[1])) {
            image.contain({ w: parseInt(params[0]), h: parseInt(params[1])});
        }
    }
    
    return await image.getBuffer(JimpMime.png);
}

/**
 * Handle cover operations
 */
async function handleCover(image, query, params) {
    // Compute crop coordinates for cover algorithm
    const w = parseInt(params[0]);
    const h = parseInt(params[1]);
    const ar = w/h;
    const origAr = image.bitmap.width/image.bitmap.height;
    
    if (ar > origAr) {
        const newH = Math.round(image.bitmap.width / ar);
        const newY = Math.round((image.bitmap.height - newH) / 2);
        image.crop({x: 0, y: newY, w: image.bitmap.width, h: newH});
        // coverx does not enlarge cropped images
        if (query.method === 'cover' || newH > h) {
            image.resize({w: w, h: h});
        }
    } else {
        const newW = Math.round(image.bitmap.height * ar);
        const newX = Math.round((image.bitmap.width - newW) / 2);
        image.crop({x: newX, y: 0, w: newW, h: image.bitmap.height});
        // coverx does not enlarge cropped images
        if (query.method === 'cover' || newW > w) {
            image.resize({w: w, h: h});
        }
    }
    
    return await image.getBuffer(JimpMime.png);
}

/**
 * Handle crop + resize operations
 */
async function handleCropResize(image, query, params) {
    // params = [cropX, cropY, cropWidth, cropHeight, resizeWidth, resizeHeight]
    const cropWidth = parseInt(params[0]);
    const cropHeight = parseInt(params[1]); 
    const cropX = parseInt(params[2]);
    const cropY = parseInt(params[3]);
    const resizeWidth = params[4] === 'null' ? null : parseInt(params[4]);
    const resizeHeight = params[5] === 'null' ? null : parseInt(params[5]);
    
    // Crop sempre
    image.crop({x: cropX, y: cropY, w: cropWidth, h: cropHeight});
    
    // Resize logica: cropresize sempre, cropresizex solo se riduce le dimensioni
    if (resizeWidth || resizeHeight) {
        if (query.method === 'cropresize' || 
           (resizeWidth && cropWidth > resizeWidth) || 
           (resizeHeight && cropHeight > resizeHeight)) {
            image.resize({w: resizeWidth, h: resizeHeight});
        }
    }
    
    return await image.getBuffer(JimpMime.png);
}

/**
 * Get appropriate content type for response
 */
export function getContentType(query) {
    // Always return PNG for now
    return 'image/png';
}

/**
 * Validate query parameters
 */
export function validateQuery(query) {
    if (!query.method) {
        throw new Error('Missing required parameter: method');
    }
    
    if (!query.params) {
        throw new Error('Missing required parameter: params');
    }
    
    if (!['placeholder', 'placeholder2'].includes(query.method) && !query.src) {
        throw new Error('Missing required parameter: src');
    }
    
    return true;
}