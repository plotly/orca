/*jslint node: true */
'use strict';

var ChildProcess = require('child_process');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var async = require('async');
var path = require('path');
var fs = require('fs');
var hat = require('hat');

function Batik (batikJar) {

    if (!batikJar) throw new Error('Must supply location of Batik Jar');

    EventEmitter.call(this);
    var self = this;

    this.bg = '255.255.255.255';
    this.dpi = '300';
    this.javabase = 'java -jar -XX:+UseParallelGC -server';
    this.batikJar = batikJar;

    // create tmp dir
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

    async.parallel([

        self.javaInstalled.bind(this),
        self.resolveBatikJarPath.bind(this)

    ], function (err) {
        if (err) return self.emit('error', err);

        self.cmdbase = self.javabase + ' ' + self.batikJar;

        return self.emit('ready');
    });
}

inherits(Batik, EventEmitter);
module.exports = Batik;

var proto = Batik.prototype;


proto.javaInstalled = function (next) {
    ChildProcess.exec('java -version',  function (err) {
        if (err) return next(err);
        return next(null);
    });
};


proto.resolveBatikJarPath = function (next) {
    this.batikJar = path.resolve([__dirname], this.batikJar);
    fs.exists(this.batikJar, function (exists) {
        if (!exists) return next({err: 'could not resolve path to Batik Jarfile'});
        else return next(null);
    });
};


proto.svgConverter = function () {
    var self = this;

    var converter = new EventEmitter();


    converter.convert = function (svg, outputFormat, scaledWidth, scaledHeight) {
        var id = hat(16, 16);

        var mimeType, imgOpts, cmd;
        converter.outPath = 'tmp/' + id + '-out';
        converter.svgPath = 'tmp/' + id + '-svg';
        converter.epsPath = 'tmp/' + id + '-eps';
        converter.cmdio   = '-d ' + converter.outPath + ' ' + converter.svgPath;

        switch (outputFormat) {
            case 'pdf':
            case 'eps':
                mimeType = ' -m application/pdf ';
                cmd = self.cmdbase + mimeType + converter.cmdio;
                break;
            default:
                imgOpts = ' -bg 255.255.255.255 -dpi 300 ';
                if (scaledWidth) imgOpts += '-w ' + scaledWidth + ' ';
                if (scaledHeight) imgOpts += '-h ' + scaledHeight + ' ';
                cmd = self.cmdbase + imgOpts + converter.cmdio;
                break;
        }

        svg = svg.replace(/(font-family: )('Courier New')/g, '$1\'Liberation mono\'')
        .replace(/(font-family: )('Times New Roman')/g, '$1\'Liberation Serif\'')
        .replace(/(font-family: )(Arial)/g, '$1\'Liberation Sans\'')
        .replace(/(font-family: )(Balto)/g, '$1\'Balto Book\'')
        .replace(/(font-family: )(Tahoma)/g, '$1\'Liberation Sans\'');

        // This next line is a shim so that strings from the DOM can be
        // saved properly in the JS context.
        // https://github.com/rogerwang/node-webkit/issues/1669
        fs.writeFileSync(converter.svgPath, '\ufeff'+svg, 'utf8');

        // Create temp file so that Batik has something to write to.
        fs.writeFileSync(converter.outPath, '');

        ChildProcess.exec(cmd,  function (err) {
            if (err) return converter.emit('error', err);

            switch (outputFormat) {
                case 'eps':
                    converter.toEps();
                    break;
                case 'pdf':
                    var pdfOut = fs.readFileSync(converter.outPath);
                    converter.emit('success', 'data:application/pdf;base64,' + pdfOut.toString('base64'));
                    converter.cleanUp();
                    break;
                case 'png':
                    var pngOut = fs.readFileSync(converter.outPath);
                    converter.emit('success','data:image/png;base64,' + pngOut.toString('base64'));
                    converter.cleanUp();
                    break;
                case 'jpeg':
                    var jpegOut = fs.readFileSync(converter.outPath);
                    converter.emit('success','data:image/jpeg;base64,' + jpegOut.toString('base64'));
                    converter.cleanUp();
            }

        });
    };


    converter.toEps = function () {
        // create temp eps file
        fs.writeFileSync(converter.epsPath, '');

        // convert temp-out pdf file to eps
        var cmd = 'pdftops -eps ' + converter.outPath + ' ' + converter.epsPath;
        ChildProcess.exec(cmd, function (err) {
            var epsOut = fs.readFileSync(converter.epsPath);
            if (err) converter.emit('error', err);
            else converter.emit('success', 'data:application/postscript;base64,' + epsOut.toString('base64'));
            fs.unlinkSync(converter.epsPath);
            converter.cleanUp();
        });
    };

    converter.cleanUp = function () {
        fs.unlinkSync(converter.outPath);
        fs.unlinkSync(converter.svgPath);
    };

    return converter;
};
