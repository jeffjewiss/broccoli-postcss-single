# broccoli-postcss-single

[![Build Status](https://travis-ci.org/jeffjewiss/broccoli-postcss-single.svg?branch=master)](https://travis-ci.org/jeffjewiss/broccoli-postcss-single)
[![npm version](https://badge.fury.io/js/broccoli-postcss-single.svg)](http://badge.fury.io/js/broccoli-postcss-single)
[![Coverage Status](https://coveralls.io/repos/github/jeffjewiss/broccoli-postcss-single/badge.svg?branch=master)](https://coveralls.io/github/jeffjewiss/broccoli-postcss-single?branch=master)

The broccoli-postcss-single plugin runs your `css` through postcss plugins of your choosing.

## Installation

```shell
npm install --save-dev broccoli-postcss-single
```

## Usage

```javascript
var compileCSS = require('broccoli-postcss');

var outputTree = compileCSS(inputTrees, inputFile, outputFile, plugins, map);
```

- **`inputTrees`**: An array of trees that specify the directories used by Broccoli. If you have a single tree, pass `[tree]`.
- **`inputFile`**: Relative path of the main CSS file to process.
- **`outputFile`** Relative path of the output CSS file.
- **`plugins`** An array of plugin objects to be used by Postcss (a minimum of 1 plugin is required). The supported object format is `module`: the plugin module itself, and `options`: an object of supported options for the given plugin.
- **`map`** An object of options to describe how Postcss should [handle source maps](https://github.com/postcss/postcss#source-map).

## Example

```javascript
/* Brocfile.js */
var compileCSS = require('broccoli-postcss');
var cssnext = require('cssnext');

var plugins = [
    {
        module: cssnext,
        options: {
            browsers: ['last 2 version']
        }
    },
];

var outputTree = compileCSS(['styles'], 'app.css', 'app.css', plugins, map);
module.exports = outputTree;
