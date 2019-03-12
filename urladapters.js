var urlAdapters = {

cloudinary: {

    // fromSrc: "{urlPrefix:.*/upload}(/x_{cropX},y_{cropY},w_{cropWidth},h_{cropHeight},c_crop/w_{width},h_{height},c_scale|/w_{resizeWidth},h_{resizeHeight},c_scale/x_{offsetX},y_{offsetY},w_{width},h_{height},c_crop|/w_{width}(,h_{height},c_fill)?)?{urlPostfix:/[^/]*}",
    fromSrc: {
        urlPrefix: ".*/upload",
        urlPostfix: "/[^/]*",
    },
    toSrc: {
        original: "{urlPrefix}{urlPostfix}",
        resize: "{urlPrefix}/w_{width}{urlPostfix}",
        cover: "{urlPrefix}/w_{width},h_{height},c_fill{urlPostfix}",
        cropresize: "{urlPrefix}/x_{cropX},y_{cropY},w_{cropWidth},h_{cropHeight},c_crop/w_{width},h_{height},c_scale{urlPostfix}",
        resizecrop: "{urlPrefix}/w_{resizeWidth},h_{resizeHeight},c_scale/x_{offsetX},y_{offsetY},w_{width},h_{height},c_crop{urlPostfix}",
    }
},

cloudinaryp: {
    // https://res.cloudinary.com/demo/image/fetch/c_thumb,f_png,g_face,h_80,r_20,w_80/http://upload.wikimedia.org/wikipedia/commons/4/46/Jennifer_Lawrence_at_the_83rd_Academy_Awards.jpg
    defaultPrefix: "https://res.cloudinary.com/demo/image/fetch",
    fromSrc: {
        urlPrefix: ".*/fetch",
        urlOriginal: "http.*",
    },
    toSrc: {
        original: "{urlPrefix}/{urlOriginal}",
        resize: "{urlPrefix}/w_{width}/{urlOriginal}",
        cover: "{urlPrefix}/w_{width},h_{height},c_fill/{urlOriginal}",
        cropresize: "{urlPrefix}/x_{cropX},y_{cropY},w_{cropWidth},h_{cropHeight},c_crop/w_{width},h_{height},c_scale/{urlOriginal}",
        resizecrop: "{urlPrefix}/w_{resizeWidth},h_{resizeHeight},c_scale/x_{offsetX},y_{offsetY},w_{width},h_{height},c_crop/{urlOriginal}",
    }
},

// direct upload to S3, via signed urls: https://blog.imagekit.io/imagekit-io-and-dropzone-js-client-side-drag-and-drop-image-upload-from-imagekit-io-user-fca3049c60fb
imagekit: {
    // the object version is not flexible like the other
    // fromSrc: "{urlPrefix:https?://[^/]*/[^/]*}/tr:(w-{resizeWidth},h-{resizeHeight}:w-{width},h-{height},cm-extract,x-{offsetX},y-{offsetY}(,fo-top_left)?|(w-{cropWidth},h-{cropHeight},cm-extract,x-{cropX},y-{cropY}(,fo-top_left)?:)?w-{width}(,h-{height})?){urlPostfix:/.*}",
    fromSrc: {
        urlPrefix: "https?://[^/]*/[^/]*",
        urlPostfix: "/.*",
    },
    toSrc: {
        // original: "{urlPrefix}{urlPostfix}",
        resize: "{urlPrefix}/tr:w-{width}{urlPostfix}",
        cover: "{urlPrefix}/tr:w-{width},h-{height}{urlPostfix}",
        cropresize: "{urlPrefix}/tr:w-{cropWidth},h-{cropHeight},cm-extract,x-{cropX},y-{cropY},fo-top_left:w-{width},h-{height}{urlPostfix}",
        resizecrop: "{urlPrefix}/tr:w-{resizeWidth},h-{resizeHeight}:w-{width},h-{height},cm-extract,x-{offsetX},y-{offsetY},fo-top_left{urlPostfix}",
    }
},

// proxy only via custom sources, or S3
gumlet: {
    defaultPrefix: 'https://moimagecropper-demo.gumlet.com/p/',
    // fromSrc: "{urlPrefix:[^\\?]*}{urlOriginal:http[^\\?]*}?\\?(width={width}|(extract={cropX},{cropY},{cropWidth},{cropHeight}&)?mode=crop&width={width}&height={height})",
    fromSrc: {
        urlPrefix: "[^\\?]*",
        urlOriginal: "http[^\\?]*",
    },
    toSrc: {
        resize: "{urlPrefix}{urlOriginal}?width={width}",
        cover: "{urlPrefix}{urlOriginal}?mode=crop&width={width}&height={height}",
        cropresize: "{urlPrefix}{urlOriginal}?extract={cropX},{cropY},{cropWidth},{cropHeight}&mode=crop&width={width}&height={height}",
    }
},

// File upload via S3 like presigned urls https://sirv.com/help/resources/presigned-urls/ 
sirv: {
    // fromSrc: "{urlPrefix:[^\\?]*}\\?(w={width}(&h={height}&scale.option=fill&cw={width}&ch={height}&cx=center&cy=center)?|w={resizeWidth}(&h={resizeHeight})?&cx={offsetX}&cy={offsetY}&cw={width}&ch={height})",
    fromSrc: {
        urlPrefix: "[^\\?]*",
    },
    toSrc: {
        resize: "{urlPrefix}?w={width}",
        cover: "{urlPrefix}?w={width}&h={height}&scale.option=fill&cw={width}&ch={height}&cx=center&cy=center",
        resizecrop: "{urlPrefix}?w={resizeWidth}&cx={offsetX}&cy={offsetY}&cw={width}&ch={height}",
    }
},

// File upload via https://github.com/uploadcare/uploadcare-upload-client
uploadcare: {
    // fromSrc: "{urlPrefix:((?!/-/).)*/}((-/crop/{cropWidth}x{cropHeight}/{cropX},{cropY}/)?-/resize/{width}x/|-/resize/{resizeWidth}x/-/crop/{width}x{height}/{offsetX},{offsetY}/|-/scale_crop/{width}x{height}/)",
    fromSrc: {
        urlPrefix: "((?!/-/).)*/",
    },
    toSrc: {
        resize: "{urlPrefix}-/resize/{width}x/",
        cover: "{urlPrefix}-/scale_crop/{width}x{height}/",
        cropresize: "{urlPrefix}-/crop/{cropWidth}x{cropHeight}/{cropX},{cropY}/-/resize/{width}x/",
        resizecrop: "{urlPrefix}-/resize/{resizeWidth}x/-/crop/{width}x{height}/{offsetX},{offsetY}/",
    }
},

// cloudimage supports also external images
cloudimage: {
    defaultPrefix: 'https://demo.cloudimg.io/',
    // https://demo.cloudimg.io/width/600/n/https://jolipage.airstore.io/img.jpg
    // https://demo.cloudimg.io/crop/600x337/n/https://jolipage.airstore.io/img.jpg
    // https://demo.cloudimg.io/crop_px/1500,400,2000,1300-200x300/n/sample.li/girls.jpg
    // fromSrc: "{urlPrefix:https?://[^/]*/}(crop_px/{cropX},{cropY},{cropX2},{cropY2}-{width}x{height}|crop/{width}x{height}|width/{width})/n/{urlOriginal:.*}",
    fromSrc: {
        urlPrefix: "https?://[^/]*/",
        urlOriginal: ".*",
    },
    toSrc: {
        resize: "{urlPrefix}width/{width}/n/{urlOriginal}",
        cover: "{urlPrefix}crop/{width}x{height}/n/{urlOriginal}",
        cropresize: "{urlPrefix}crop_px/{cropX},{cropY},{cropX2},{cropY2}-{width}x{height}/n/{urlOriginal}",
    }
},

// Proxy only
weservenl: {
    defaultPrefix: 'https://images.weserv.nl/',
    // https://images.weserv.nl/?w=300&h=100&t=square&url=ory.weserv.nl/lichtenstein.jpg
    // https://images.weserv.nl/?w=399&h=399&crop=300,300,43,63&url=https%3A%2F%2Fimages.weserv.nl%2F%3Fw%3D500%26h%3D615%26crop%3D300%2C300%2C100%2C100%26url%3Dory.weserv.nl%252Flichtenstein.jpg
    // https://images.weserv.nl/?w=500&h=615&t=fitup&crop=300,300,38,9&url=ory.weserv.nl%2Flichtenstein.jpg
    // https://images.weserv.nl/?w=300&h=100&t=square&url=ory.weserv.nl/lichtenstein.jpg
    // fromSrc: "{urlPrefix:https?://[^/]*/}\\?(w={width}(&h={height}&t=square)?&|w={resizeWidth}&h={resizeHeight}&t=fitup&crop={width},{height},{offsetX},{offsetY}&)?url={encodedUrlOriginal}",
    fromSrc: {
        urlPrefix: "https?://[^/]*/",
    },
    toSrc: {
        resize: "{urlPrefix}?w={width}&url={encodedUrlOriginal}",
        cover: "{urlPrefix}?w={width}&h={height}&t=square&url={encodedUrlOriginal}",
        resizecrop: "{urlPrefix}?w={resizeWidth}&h={resizeHeight}&t=fitup&crop={width},{height},{offsetX},{offsetY}&url={encodedUrlOriginal}",
    }
},


// Filestack can also resize URLs, but you need an API key and to sign requests
// Filestack direct upload: https://github.com/filestack/filestack-js
filestack: {
    // https://cdn.filestackcontent.com/resize=w:300/v8x4EUOKRS6OowxpkY8i
    // https://cdn.filestackcontent.com/resize=w:300,h:100,fit:crop/hOv6CUMRTErojO1feJUA
    // https://cdn.filestackcontent.com/crop=d:[600,200,300,300]/resize=w:200,h:200,fit:crop/hOv6CUMRTErojO1feJUA
    // https://cdn.filestackcontent.com/crop=d:[0,1270,3024,1482]/resize=w:300,h:147,fit:crop/v8x4EUOKRS6OowxpkY8i
    // fromSrc: "{urlPrefix:https?://[^/]*/}((crop=d:\\[{cropX},{cropY},{cropWidth},{cropHeight}\\]/)?resize=w:{width}(,h:{height},fit:crop)?/)?{urlPostfix:[^/]*}",
    fromSrc: {
        urlPrefix: "https?://[^/]*/",
        urlPostfix: "[^/]*",
    },
    toSrc: {
        resize: "{urlPrefix}resize=w:{width}/{urlPostfix}",
        cover: "{urlPrefix}resize=w:{width},h:{height},fit:crop/{urlPostfix}",
        cropresize: "{urlPrefix}crop=d:[{cropX},{cropY},{cropWidth},{cropHeight}]/resize=w:{width},h:{height},fit:crop/{urlPostfix}",
    }
},

// Proxy only
thumbor: {
    // use i2.wp.com as an https to http proxy, so this page works on HTTPS without alters
    defaultPrefix: 'https://i2.wp.com/thumbor.thumborize.me/unsafe/',
    // http://thumbor.thumborize.me/unsafe/300x/http://thumborize.me/static/img/beach.jpg
    // http://thumbor.thumborize.me/unsafe/300x100/http://thumborize.me/static/img/beach.jpg
    // http://thumbor.thumborize.me/unsafe/500x400:800x600/300x200/https://d19lgisewk9l6l.cloudfront.net/assetbank/Northern_Lights_at_Jokulsarlon_Glacier_Lagoon_Iceland_240127.jpg
    // fromSrc: "{urlPrefix:https?://.*?/unsafe/}({cropX}x{cropY}:{cropX2}x{cropY2}/)?({width}x({height})?/)?{urlOriginal:.*}",
    fromSrc: {
        urlPrefix: "https?://.*?/unsafe/",
        urlOriginal: ".*",
    },
    toSrc: {
        resize: "{urlPrefix}{width}x/{urlOriginal}",
        cover: "{urlPrefix}{width}x{height}/{urlOriginal}",
        cropresize: "{urlPrefix}{cropX}x{cropY}:{cropX2}x{cropY2}/{width}x{height}/{urlOriginal}",
    }
},

// Proxy only, opensource
wnimageproxy: {
    defaultPrefix: 'https://willnorris.com/api/imageproxy/',
    // https://willnorris.com/api/imageproxy/300x/https://willnorris.com/2015/05/material-animations.gif
    // https://willnorris.com/api/imageproxy/300x100/https://willnorris.com/2013/12/small-things.jpg
    // https://willnorris.com/api/imageproxy/cy300,cw500,ch400,300x/https://willnorris.com/2006/02/los-angeles-skyline.jpg
    // fromSrc: "{urlPrefix:https?://.*/imageproxy/}(((cx{cropX},)?(cy{cropY},)?cw{cropWidth},ch{cropHeight},)?{width}x({height})?/){urlOriginal:.*}",
    fromSrc: {
        urlPrefix: "https?://.*/imageproxy/",
        urlOriginal: ".*",
    },
    toSrc: {
        resize: "{urlPrefix}{width}x/{urlOriginal}",
        cover: "{urlPrefix}{width}x{height}/{urlOriginal}",
        cropresize: "{urlPrefix}cx{cropX},cy{cropY},cw{cropWidth},ch{cropHeight},{width}x{height}/{urlOriginal}",
    }
},

// Proxy only, opensource
imaginary: {
    defaultPrefix: 'https://static.pimmr.me/',
    // https://static.pimmr.me/resize?width=300&nocrop=true&url=https://s3.eu-central-1.amazonaws.com/sasapost/wp-content/uploads/33-1.jpeg
    // https://static.pimmr.me/resize?width=400&height=300&url=https://s3.eu-central-1.amazonaws.com/sasapost/wp-content/uploads/33-1.jpeg
    // https://static.pimmr.me/extract?width=400&height=400&top=100&left=50&areawidth=300&areaheight=200&url=https://s3.eu-central-1.amazonaws.com/sasapost/wp-content/uploads/33-1.jpeg
    // https://static.pimmr.me/extract?width=483&height=322&left=173&top=84&areawidth=300&areaheight=200&url=https%3A%2F%2Fs3.eu-central-1. amazonaws.com%2Fsasapost%2Fwp-content%2Fuploads%2FGettyImages-74439287.jpg
    // fromSrc: "{urlPrefix:https?://[^/]*/}(resize\\?width={width}&nocrop=true|resize\\?width={width}&height={height}|extract\\?width={resizeWidth}&height={resizeHeight}&left={offsetX}&top={offsetY}&areawidth={width}&areaheight={height})&url={encodedUrlOriginal}",
    fromSrc: {
        urlPrefix: "https?://[^/]*/",
    },
    toSrc: {
        resize: "{urlPrefix}resize?width={width}&nocrop=true&url={encodedUrlOriginal}",
        cover: "{urlPrefix}resize?width={width}&height={height}&url={encodedUrlOriginal}",
        resizecrop: "{urlPrefix}extract?width={resizeWidth}&height={resizeHeight}&left={offsetX}&top={offsetY}&areawidth={width}&areaheight={height}&url={encodedUrlOriginal}",
    }
},

// Bundled demo backend
mosaico: {
    defaultPrefix: '/img',
    // fromSrc: "{urlPrefix:https?://[^/]*/img}\\?method=(cropresize&params={cropWidth},{cropHeight},{cropX},{cropY},{width},{height}|cover&params={width},{height}|resize&params={width})&url={encodedUrlOriginal}",
    fromSrc: {
        urlPrefix: "https?://[^/]*/img",
    },
    toSrc: {
        resize: "{urlPrefix}?method=resize&params={width}&url={encodedUrlOriginal}",
        cover: "{urlPrefix}?method=cover&params={width},{height}&url={encodedUrlOriginal}",
        cropresize: "{urlPrefix}?method=cropresize&params={cropWidth},{cropHeight},{cropX},{cropY},{width},{height}&url={encodedUrlOriginal}",
    }
},

// ImageFlow/ImageResizing.net adapter
imageflow: {
    // https://z.zr.io/ri/zermatt.jpg;w=300
    // https://z.zr.io/ri/zermatt.jpg;w=300;h=100;mode=crop;scale=both
    // https://z.zr.io/ri/zermatt.jpg;crop=700,100,1300,700;w=300;h=300;mode=crop;scale=both
    // fromSrc: "{urlPrefix:https?://[^;]*};(w={width}|w={width};h={height};mode=crop;scale=both|crop={cropX},{cropY},{cropX2},{cropY2};w={width};h={height};mode=crop;scale=both)",
    fromSrc: {
        urlPrefix: "https?://[^;]*"
    },
    toSrc: {
        resize: "{urlPrefix};w={width}",
        cover: "{urlPrefix};w={width};h={height};mode=crop;scale=both",
        cropresize: "{urlPrefix};crop={cropX},{cropY},{cropX2},{cropY2};w={width};h={height};mode=crop;scale=both",
    }
},

//Cimage.se
cimage: {
    // when we declare defaultPrefix the patterns must include urlOriginal.
    // defaultPrefix: 'https://cimage.se/cimage/imgd.php',
    // in order to use the proxy mode starting from an originalUrl, we should probably declare a different adapter.

    // https://cimage.se/cimage/imgd.php?src=example/kodim13.png&w=300
    // https://cimage.se/cimage/imgd.php?src=example/kodim13.png&w=300&h=100&crop-to-fit
    // https://cimage.se/cimage/imgd.php?src=example/kodim04.png&crop=300,300,100,220&w=300
    // https://cimage.se/image/example/kodim04.png?w=300
    // https://cimage.se/image/example/kodim04.png?w=300&h=100&crop-to-fit
    // https://cimage.se/image/example/kodim04.png?crop=300,300,100,220&w=300
    // fromSrc: "{urlPrefix:https?://[^\\?]*\\?(src=[^&]*&)?}(w={width}|w={width}&h={height}&crop-to-fit|crop={cropWidth},{cropHeight},{cropX},{cropY}&w={width})",
    fromSrc: {
        urlPrefix: "https?://[^\\?]*\\?(src=[^&]*&)?"
    },
    toSrc: {
        resize: "{urlPrefix}w={width}",
        cover: "{urlPrefix}w={width}&h={height}&crop-to-fit",
        cropresize: "{urlPrefix}crop={cropWidth},{cropHeight},{cropX},{cropY}&w={width}",
    }
},

// Glide 
glide: {
    // https://glide.herokuapp.com/1.0/kayaks.jpg?w=300
    // https://glide.herokuapp.com/1.0/kayaks.jpg?w=300&h=100&fit=crop
    // https://glide.herokuapp.com/1.0/kayaks.jpg?crop=1200,800,500,500&w=200
    // https://glide.herokuapp.com/1.0/kayaks.jpg?crop=1200,800,500,500&w=200&h=300&fit=crop
    // fromSrc: "{urlPrefix:https?://[^\\?]*}\\?(crop={cropWidth},{cropHeight},{cropX},{cropY}&)?w={width}(&h={height}&fit=crop)?",
    fromSrc: {
        urlPrefix: "https?://[^\\?]*",
    },
    toSrc: {
        resize: "{urlPrefix}?w={width}",
        cover: "{urlPrefix}?w={width}&h={height}&fit=crop",
        cropresize: "{urlPrefix}?crop={cropWidth},{cropHeight},{cropX},{cropY}&w={width}&h={height}&fit=crop",
    }
},

};

function automaticURLAdapter(el) {
    var urlAdapter = urlAdapters.mosaico;
    if (el.classList.contains("sirv")) urlAdapter = urlAdapters.sirv;
    if (el.classList.contains("imagekit")) urlAdapter = urlAdapters.imagekit;
    if (el.classList.contains("cloudinary")) urlAdapter = urlAdapters.cloudinary;
    if (el.classList.contains("cloudinaryp")) urlAdapter = urlAdapters.cloudinaryp;
    if (el.classList.contains("cloudimage")) urlAdapter = urlAdapters.cloudimage;
    if (el.classList.contains("gumlet")) urlAdapter = urlAdapters.gumlet;
    if (el.classList.contains("uploadcare")) urlAdapter = urlAdapters.uploadcare;
    if (el.classList.contains("thumbor")) urlAdapter = urlAdapters.thumbor;
    if (el.classList.contains("filestack")) urlAdapter = urlAdapters.filestack;
    if (el.classList.contains("weservenl")) urlAdapter = urlAdapters.weservenl;
    if (el.classList.contains("wnimageproxy")) urlAdapter = urlAdapters.wnimageproxy;
    if (el.classList.contains("imaginary")) urlAdapter = urlAdapters.imaginary;
    if (el.classList.contains("imageflow")) urlAdapter = urlAdapters.imageflow;
    if (el.classList.contains("cimage")) urlAdapter = urlAdapters.cimage;
    if (el.classList.contains("glide")) urlAdapter = urlAdapters.glide;
    return urlAdapter;
}
