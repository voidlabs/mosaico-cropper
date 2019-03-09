"use strict";
/* global module: false, console: false, __dirname: false, process: false */

const express = require('express');
const fs = require('fs');
const app = express();
const gmagic = require('gm');
const gm = gmagic.subClass({ imageMagick: true });
const url = require('url');
const got = require('got');


app.use(require('connect-livereload')());
// app.use(require('morgan')('dev'));

// imgProcessorBackend + "?src=" + encodeURIComponent(src) + "&method=" + encodeURIComponent(method) + "&params=" + encodeURIComponent(width + "," + height);
app.get('/img/', async function(req, res) {
    var params = req.query.params.split(',');
    if (req.query.method == 'resize' || req.query.method == 'cover' || req.query.method == 'cropresize') {
        var src = req.query.url;
        var p = got.stream(src).on('response', function(r) {
            // console.error("response ", r.headers, r.status);
            // Set content type
            res.set('Content-Type', r.headers['content-type']);
        }).on('error', function(error, body, response) {
            console.error("error ", error.name, src);
            res.status(404);
            res.end();
        });

        var ir = gm(p);
        if (req.query.method == 'resize') {
            ir.autoOrient().resize(params[0] == 'null' ? null : params[0], params[1] == 'null' ? null : params[1]).stream().pipe(res);
        } else if (req.query.method == 'cropresize') {
            ir.autoOrient().crop(params[0], params[1], params[2], params[3]).resize(params[4] == 'null' ? null : params[4], params[5] == 'null' ? null : params[5]).stream().pipe(res);
        } else {
            ir.autoOrient().resize(params[0],params[1]+'^').gravity('Center').extent(params[0], params[1]+'>').stream().pipe(res);
        }
    } else {
        console.log("Unexpected method", req.query.method);
        res.status(500);
        res.end();
    }
});

// This is needed with grunt-express-server (while it was not needed with grunt-express)
var PORT = process.env.PORT || 9009;

app.use(express.static(__dirname + '/../'));

var server = app.listen( PORT, function() {
    var check = gm(100, 100, '#000000');
    check.format(function (err, format) {
        if (err) console.error("ImageMagick failed to run self-check image format detection. Error:", err);
    });
    console.log('Express server listening on port ' + PORT);
} );
