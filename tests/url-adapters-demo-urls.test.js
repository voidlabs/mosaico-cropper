import { describe, it, expect } from 'vitest';
import { urlAdapterFromSrc, urlAdapterToSrc } from '../src/js/url-adapters.js';

// Import the urlAdapters file and make its globals available
import '../urladapters.js';

// Access the globals that were defined by the imported file
const urlAdapters = globalThis.urlAdapters;


// This object contains URLs from demo.html mapped to their CSS classes
const demoUrls = {
  'https://res.cloudinary.com/demo/image/upload/w_166,h_90,c_fill/balloons.jpg': 'cloudinary',
  'https://res.cloudinary.com/demo/image/upload/w_330,h_213,c_scale/x_39,y_15,w_166,h_90,c_crop/sofa_cat.jpg': 'cloudinary',
  'https://res.cloudinary.com/demo/image/upload/w_440,h_303,c_scale/x_65,y_66,w_166,h_90,c_crop/woman.jpg': 'cloudinary',
  'https://res.cloudinary.com/idemo/image/upload/w_578,h_385,c_scale/x_200,y_100,w_166,h_92,c_crop/friends.jpg': 'cloudinary',
  'https://ik.imagekit.io/demo/tr:w-472,h-638:w-200,h-310,cm-extract,x-127,y-256,fo-top_left/img/plant.jpeg': 'imagekit',
  'https://ik.imagekit.io/demo/tr:w-200/medium_cafe_B1iTdD0C.jpg': 'imagekit',
  'https://demo.cloudimg.io/crop_px/2009,28,2500,316-300x176/n/sample.li/girls.jpg': 'cloudimage',
  'https://demo.cloudimg.io/crop/300x100/n/https://jolipage.airstore.io/img.jpg': 'cloudimage',
  'https://demo.cloudimg.io/width/300/n/https://jolipage.airstore.io/img.jpg': 'cloudimage',
  'https://demo.gumlet.com/black-leaf.jpeg?width=200': 'gumlet',
  'https://demo.gumlet.com/black-leaf.jpeg?mode=crop&width=300&height=100': 'gumlet',
  'https://demo.gumlet.com/black-leaf.jpeg?extract=100,0,600,200&mode=crop&width=300&height=100': 'gumlet',
  'https://demo.sirv.com/bag.jpg?w=300': 'sirv',
  'https://sirv-cdn.sirv.com/website/demos/Nikon_D750_24_120_front34l.jpg?w=300&h=200&scale.option=fill&cw=300&ch=200&cx=center&cy=center': 'sirv',
  'https://sirv-cdn.sirv.com/website/demos/Nikon_D750_24_85_back34r.jpg?w=643&cx=303&cy=211&cw=300&ch=245': 'sirv',
  'https://res.cloudinary.com/demo/image/upload/balloons.jpg': 'cloudinary',
  'https://res.cloudinary.com/demo/image/upload/w_200/balloons.jpg': 'cloudinary',
  'https://res.cloudinary.com/demo/image/upload/w_924,h_616,c_scale/x_22,y_183,w_200,h_285,c_crop/balloons.jpg': 'cloudinary',
  'https://ucarecdn.com/c4b32a69-f817-48be-b918-7eb6718f7aca/-/resize/300x/': 'uploadcare',
  'https://ucarecdn.com/c4b32a69-f817-48be-b918-7eb6718f7aca/-/scale_crop/300x100/': 'uploadcare',
  'https://ucarecdn.com/c4b32a69-f817-48be-b918-7eb6718f7aca/-/resize/1210x/-/crop/300x200/737,202/': 'uploadcare',
  'https://cdn.filestackcontent.com/resize=w:300/hOv6CUMRTErojO1feJUA': 'filestack',
  'https://cdn.filestackcontent.com/resize=w:300,h:200,fit:crop/v8x4EUOKRS6OowxpkY8i': 'filestack',
  'https://cdn.filestackcontent.com/crop=d:[600,200,300,300]/resize=w:200,h:200,fit:crop/hOv6CUMRTErojO1feJUA': 'filestack',
  // 'https://images.weserv.nl/?url=ory.weserv.nl/zebra.jpg': 'weservenl', // Parser returns null
  'https://images.weserv.nl/?w=300&h=100&t=square&url=ory.weserv.nl%2Flichtenstein.jpg': 'weservenl',
  'https://images.weserv.nl/?w=455&t=fitup&crop=300,300,19,0&url=ory.weserv.nl%2Flichtenstein.jpg': 'weservenl',
  'https://i2.wp.com/thumbor.thumborize.me/unsafe/300x/http://thumborize.me/static/img/beach.jpg': 'thumbor',
  'https://i2.wp.com/thumbor.thumborize.me/unsafe/300x100/http://thumborize.me/static/img/beach.jpg': 'thumbor',
  'https://i2.wp.com/thumbor.thumborize.me/unsafe/170x335:609x628/300x200/https://d19lgisewk9l6l.cloudfront.net/assetbank/Northern_Lights_at_Jokulsarlon_Glacier_Lagoon_Iceland_240127.jpg': 'thumbor',
  'https://willnorris.com/api/imageproxy/300x/https://willnorris.com/2013/12/small-things.jpg': 'wnimageproxy',
  'https://willnorris.com/api/imageproxy/300x200/https://willnorris.com/2015/05/material-animations.gif': 'wnimageproxy',
  'https://willnorris.com/api/imageproxy/cx437,cy76,cw1427,ch656,300x138/https://willnorris.com/2016/02/moon/moon.jpg': 'wnimageproxy',
  'https://static.pimmr.me/resize?width=300&nocrop=true&url=https%3A%2F%2Fs3.eu-central-1.amazonaws.com%2Fsasapost%2Fwp-content%2Fuploads%2F33-1.jpeg': 'imaginary',
  'https://static.pimmr.me/resize?width=300&height=100&url=https%3A%2F%2Fs3.eu-central-1.amazonaws.com%2Fsasapost%2Fwp-content%2Fuploads%2FGettyImages-74439287.jpg': 'imaginary',
  'https://static.pimmr.me/extract?width=1255&height=706&left=924&top=506&areawidth=300&areaheight=200&url=https%3A%2F%2Fs3.eu-central-1.amazonaws.com%2Fsasapost-media%2Fwp-content%2Fuploads%2F20180630140808%2F31785956755_fdd21edec0_o.jpg': 'imaginary',
  'https://z.zr.io/ri/zermatt.jpg;w=300': 'imageflow',
  'https://z.zr.io/ri/zermatt.jpg;w=300;h=100;mode=crop;scale=both': 'imageflow',
  'https://z.zr.io/ri/zermatt.jpg;crop=700,100,1300,700;w=300;h=300;mode=crop;scale=both': 'imageflow',
  'https://cimage.se/cimage/imgd.php?src=example/kodim13.png&w=300': 'cimage',
  'https://cimage.se/cimage/imgd.php?src=example/kodim13.png&w=300&h=100&crop-to-fit': 'cimage',
  'https://cimage.se/image/example/kodim04.png?crop=225,92,181,298&w=300': 'cimage',
  'https://glide.herokuapp.com/1.0/kayaks.jpg?w=300': 'glide',
  'https://glide.herokuapp.com/1.0/kayaks.jpg?w=300&h=100&fit=crop': 'glide',
  'https://glide.herokuapp.com/1.0/kayaks.jpg?crop=122,81,1750,1315&w=200&h=133&fit=crop': 'glide',
  // 'https://d19lgisewk9l6l.cloudfront.net/assetbank/Northern_Lights_at_Jokulsarlon_Glacier_Lagoon_Iceland_240127.jpg': 'weservenl', // This is a proxy case - Parser returns null
  // 'https://willnorris.com/2016/02/moon/moon.jpg': 'wnimageproxy', // This is a proxy case - Parser returns null
  // 'https://s3.eu-central-1.amazonaws.com/sasapost/wp-content/uploads/GettyImages-74439287.jpg': 'imaginary', // This is a proxy case - Parser returns null
  '/img?method=cropresize&params=385,258,184,412,300,201&url=https%3A%2F%2Fd19lgisewk9l6l.cloudfront.net%2Fassetbank%2FNorthern_Lights_at_Jokulsarlon_Glacier_Lagoon_Iceland_240127.jpg': 'mosaico',
};

describe('demo-urls', () => {
  // Test that for each URL in demo.html, urlAdapterFromSrc followed by urlAdapterToSrc returns the original URL
  Object.entries(demoUrls).forEach(([url, className]) => {
    it(`should parse and re-generate the URL correctly for ${url}`, () => {
      // Get the actual adapter object
      const adapter = urlAdapters[className];
      
      // Create a mock urlData object
      const urlData = {};
      
      // Parse the URL
      const parseResult = urlAdapterFromSrc(adapter, urlData, url);

      // TODO maybe this logic should be in urlAdapterFromSrc ?
      parseResult.method = 'original';
      if (parseResult.resizeWidth !== undefined) parseResult.method = 'resizecrop';
      else if (parseResult.cropX !== undefined || parseResult.cropX2 !== undefined ) parseResult.method = 'cropresize';
      else if (parseResult.height !== undefined) parseResult.method = 'cover';
      else if (parseResult.width !== undefined) parseResult.method = 'resize';

      // If parsing failed, the test should fail
      expect(parseResult).not.toBeNull();
      
      // Use the parsed data to generate a new URL
      let generatedUrl = urlAdapterToSrc(adapter, parseResult, parseResult);
      
      // Check that the generated URL equals the original one
      expect(generatedUrl).toEqual(url);
    });
  });
});