// src/js/url-adapters.js

// Definizione delle dipendenze
const _urlParserPatterns = {
    encodedUrlOriginal: '[^ &\\?]+',
    width: '[0-9]+',
    height: '[0-9]+',
    resizeWidth: '[0-9]+',
    resizeHeight: '[0-9]+',
    offsetX: '[0-9]+',
    offsetY: '[0-9]+',
    cropWidth: '[0-9]+',
    cropHeight: '[0-9]+',
    cropX: '[0-9]+',
    cropY: '[0-9]+',
    cropX2: '[0-9]+',
    cropY2: '[0-9]+',
};

const methods = [ 'original', 'resize', 'cover', 'cropresize', 'resizecrop' ];

function _urlParser(pattern, customPatterns, url) {
    const matchNames = [];
    const regex = new RegExp('^'+pattern.replace(/\\.|(\((?!\?[!:=]))|\{([^:\}]+)(?::([^\}]+))?\}/g, function(match, braket, groupName, subPattern, offset, input_string) {
        // console.log("X", match, braket, groupName, subPattern, offset, input_string);
        if (braket) {
            // existing regex match
            matchNames.push('');
            return match;
        } else if (groupName) {
            // named group
            matchNames.push(groupName);
            if (!subPattern) {
                if (_urlParserPatterns[groupName]) subPattern = _urlParserPatterns[groupName];
                else if (customPatterns !== undefined && customPatterns[groupName]) subPattern = customPatterns[groupName];
            }
            if (subPattern) {
                // deal with sub patterns matching groups
                subPattern.replace(/\\.|(\((?!\?[!:=]))/g, function(innerMatch, innerBraket) {
                    if (innerBraket) matchNames.push('');
                    return match;
                });
                return '('+subPattern+')';
            // encodedUrlOriginal may not have "http://" prefix
            }
            // else if (_urlParserPatterns[groupName]) return '('+_urlParserPatterns[groupName]+')';
            // else if (customPatterns !== undefined && customPatterns[groupName]) return '('+customPatterns[groupName]+')';
            else {
                console.error(pattern, url, customPatterns);
                throw "Uknown token "+groupName+", please use {"+groupName+":regex} or use a known pattern";
            }
        } else {
            // escaped char
            return match;
        }
    })+'$');

    const res = url.match(regex);

    let matches = null;
    if (res !== null) {
        if (res.length !== matchNames.length + 1) {
            // TODO improve error reporting
            console.log("ERROR parsing image url according to pattern!", pattern, matchNames, res);
        }
        matches = {};
        for (let i = 0; i < matchNames.length; i++) {
            if (matchNames[i] !== '' && res[i+1] !== undefined) {
                matches[matchNames[i]] = res[i+1];
            }
        }
    }
    // console.log("p", matches, pattern, url, matchNames, regex);
    return matches;
}

function _stringTemplate(string, obj) {
    // if a token is in the {token:something} format, then ":something" is completely ignored
    return string.replace(/\{([^[\}:]+)(?::[^\}]+)?\}/g, function(match, contents, offset, input_string) {
        if (obj.hasOwnProperty(contents)) {
            return obj[contents] !== undefined ? obj[contents] : '';
        } else {
            return match;
        }
    });
}

export class UrlHandler {
    constructor(options) {
        if (!options || typeof options !== 'object') {
            throw new Error('UrlHandler requires a valid options object');
        }
        this.options = options;
    }

    decodeSrc(urlData, src) {
        let fromSrc = this.options.fromSrc;
        if (typeof fromSrc == 'object') {
            const toSrc = this.options.toSrc;
            const patterns = [];
            for (const p in toSrc) if (toSrc.hasOwnProperty(p)) {
                // escaping regexp special chars, excluding {} that we use for tokens.
                patterns.push(toSrc[p].replace(/[.*+?^$()|[\]\\]/g, '\\$&'));
            }
            const composedPattern = "("+patterns.join("|")+")";
            const origFromSrc = fromSrc;
            fromSrc = _urlParser.bind(undefined, composedPattern, origFromSrc);
        }
        if (typeof fromSrc == 'string') {
            fromSrc = _urlParser.bind(undefined, fromSrc, undefined);
        }
        const urlAdapterResult = fromSrc(src);

        if (!urlAdapterResult) {
            if (this.options.defaultPrefix !== undefined) {
                urlData.urlOriginal = src;
                urlData.urlPrefix = this.options.defaultPrefix;
                urlData.urlPostfix = src;
            } else {
                // TODO handle bad parameters, log it and fails the initialization!
                console.error("FAILED PARSING", src);
            }
        } else {
            if (urlAdapterResult.encodedUrlOriginal) {
                urlAdapterResult.urlOriginal = decodeURIComponent(urlAdapterResult.encodedUrlOriginal);
            }
            // Set the method based on parsed parameters
            if (urlAdapterResult.resizeWidth !== undefined) {
                urlAdapterResult.method = 'resizecrop';
            } else if (urlAdapterResult.cropX !== undefined || urlAdapterResult.cropX2 !== undefined) {
                urlAdapterResult.method = 'cropresize';
            } else if (urlAdapterResult.height !== undefined) {
                urlAdapterResult.method = 'cover';
            } else if (urlAdapterResult.width !== undefined) {
                urlAdapterResult.method = 'resize';
            } else {
                urlAdapterResult.method = 'original';
            }
        }

        return urlAdapterResult;
    }

    encodeSrc(urlData, res) {
        // TODO TEMP
        // console.log("computedSize", res.method, res._scale, res);

        res.urlPrefix = urlData.urlPrefix;
        res.urlPostfix = urlData.urlPostfix;
        res.urlOriginal = urlData.urlOriginal;
        res.encodedUrlOriginal = encodeURIComponent(urlData.urlOriginal);

        let toSrc = this.options.toSrc;
        if (typeof toSrc == 'object') {
            for (let i = methods.indexOf(res.method); i < methods.length; i++) {
                if (typeof toSrc[methods[i]] !== 'undefined') {
                    toSrc = toSrc[methods[i]];
                    // console.log("Using method "+methods[i]+" for original method "+res.method+":", toSrc);
                    break;
                }
            }
        }
        if (typeof toSrc == 'string') {
            toSrc = _stringTemplate.bind(undefined, toSrc);
            // console.log("Mapping method string to function", toSrc);
        }
        return toSrc(res);
    }
}

// Backward compatibility exports
export function urlAdapterFromSrc(urlAdapter, urlData, src) {
    const handler = new UrlHandler(urlAdapter);
    return handler.decodeSrc(urlData, src);
}

export function urlAdapterToSrc(urlAdapter, urlData, res) {
    const handler = new UrlHandler(urlAdapter);
    return handler.encodeSrc(urlData, res);
}