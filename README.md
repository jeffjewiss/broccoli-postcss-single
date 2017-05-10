# broccoli-postcss-single

[![Travis Build Status][travis-img]][travis-url]
[![npm version][npm-img]][npm-url]
[![Coverage Status][coveralls-img]][coveralls-url]
[![bitHound Overall Score][bithound-img]][bithound-url]

The broccoli-postcss-single plugin runs your `css` through postcss plugins of your choosing.

## Installation

```shell
npm install --save-dev broccoli-postcss-single
```

## Usage

```javascript
var compileCSS = require('broccoli-postcss-single');

var outputTree = compileCSS(inputTrees, inputFile, outputFile, options);
```

- **`inputTrees`**: An array of trees that specify the directories used by Broccoli. If you have a single tree, pass `[tree]`.
- **`inputFile`**: Relative path of the main CSS file to process.
- **`outputFile`**: Relative path of the output CSS file.
- **`options`**:
 - **`plugins`**: An array of plugin objects to be used by Postcss (a minimum of 1 plugin is required). The supported object format is `module`: the plugin module itself, and `options`: an object of supported options for the given plugin.
 - **`map`**: An object of options to describe how Postcss should [handle source maps](https://github.com/postcss/postcss/blob/master/docs/source-maps.md).

## Example

```javascript
/* Brocfile.js */
var compileCSS = require('broccoli-postcss-single');
var cssnext = require('cssnext');

var options = {
    plugins: [
        {
            module: cssnext,
            options: {
                browsers: ['last 2 version']
              }
        },
    ],
    map: {
        inline: true
    }
};

var outputTree = compileCSS(['styles'], 'app.css', 'app.css', options);
module.exports = outputTree;
```

[travis-img]: https://travis-ci.org/jeffjewiss/broccoli-postcss-single.svg?branch=master
[travis-url]: https://travis-ci.org/jeffjewiss/broccoli-postcss-single
[npm-img]: https://badge.fury.io/js/broccoli-postcss-single.svg
[npm-url]: http://badge.fury.io/js/broccoli-postcss-single
[coveralls-img]: https://coveralls.io/repos/github/jeffjewiss/broccoli-postcss-single/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/jeffjewiss/broccoli-postcss-single?branch=master
[bitHound-img]: https://www.bithound.io/github/jeffjewiss/broccoli-postcss-single/badges/score.svg
[bitHound-url]: https://www.bithound.io/github/jeffjewiss/broccoli-postcss-single
