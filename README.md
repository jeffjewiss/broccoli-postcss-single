# broccoli-postcss-single

[![Travis Build Status][travis-img]][travis-url]
[![npm version][npm-img]][npm-url]
[![Coverage Status][coveralls-img]][coveralls-url]

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

There are two supported methods for defining plugins:

1. Object form

    ```javascript
    plugins: [
      {
        module: require('some-plugin'),
        options: { /* options for `some-plugin` */ }
      }
    ]
    ```

2. Function form

    ```javascript
    plugins: [
      require('some-plugin')({ /* options for `some-plugin` */ }),
      require('another-plugin')({ /* options for `another-plugin` */ }),
    ]
    ```

 - **`map`**: An object of options to describe how Postcss should [handle source maps](https://github.com/postcss/postcss/blob/master/docs/source-maps.md).

 - **`browsers`**: An array of supported browsers following the [browserslist](https://github.com/ai/browserslist) format. These will be passed to the options of each postcss plugin. This can be overridden on a per plugin basis.

 - **`parser`**: A function that parses different CSS syntax (optional). Use this if you’d like to parse a different syntax, such as Sass or Sugarcss, by passing in a custom function or node module reference.

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
                browsers: [ // this will override `options.browsers`
                    '> 1%',
                    'last 2 versions'
                ]
            }
        },
    ],
    map: {
        inline: true
    },
    browsers: ['last 2 version']
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
