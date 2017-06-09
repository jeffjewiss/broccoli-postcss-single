'use strict'

const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const assign = require('object-assign')
const includePathSearcher = require('include-path-searcher')
const CachingWriter = require('broccoli-caching-writer')
const postcss = require('postcss')

function PostcssCompiler (inputNodes, inputFile, outputFile, options, deprecatedMap) {
  if (!(this instanceof PostcssCompiler)) {
    return new PostcssCompiler(inputNodes, inputFile, outputFile, options, deprecatedMap)
  }

  if (!Array.isArray(inputNodes)) {
    throw new Error('Expected array for first argument - did you mean [tree] instead of tree?')
  }

  CachingWriter.call(this, Array.isArray(inputNodes) ? inputNodes : [inputNodes])

  this.inputFile = inputFile
  this.outputFile = outputFile
  this.warningStream = process.stderr

  if (Array.isArray(options)) {
    this.plugins = options
    this.warningStream.write('The plugin argument has been deprecated, please set your plugins as a property on the options object.\n')
  } else {
    this.plugins = options.plugins
  }

  if (deprecatedMap) {
    this.map = deprecatedMap
    this.warningStream.write('The map argument has been deprecated, please set your map configuration as a property on the options object.\n')
  } else {
    this.map = options.map
  }

  this.plugins = this.plugins || []
  this.map = this.map || {}
  this.browsers = options.browsers
}

PostcssCompiler.prototype = Object.create(CachingWriter.prototype)
PostcssCompiler.prototype.constructor = PostcssCompiler

PostcssCompiler.prototype.build = function () {
  let toFilePath = `${this.outputPath}/${this.outputFile}`
  let fromFilePath = includePathSearcher.findFileSync(this.inputFile, this.inputPaths)

  if (!this.plugins || this.plugins.length < 1) {
    throw new Error('You must provide at least 1 plugin in the plugin array')
  }

  let processor = postcss()
  let css = fs.readFileSync(fromFilePath, 'utf8')
  let options = {
    from: fromFilePath,
    to: toFilePath,
    map: this.map,
    browsers: this.browsers
  }

  this.plugins.forEach((plugin) => {
    let pluginOptions = assign(options, plugin.options || {})
    processor.use(plugin.module(pluginOptions))
  })

  return processor.process(css, options)
  .then((result) => {
    result.warnings().forEach(warn => this.warningStream.write(warn.toString()))

    mkdirp.sync(path.dirname(toFilePath))
    fs.writeFileSync(toFilePath, result.css, {
      encoding: 'utf8'
    })

    if (result.map) {
      fs.writeFileSync(`${toFilePath}.map`, result.map, {
        encoding: 'utf8'
      })
    }
  })
  .catch((error) => {
    if (error.name === 'CssSyntaxError') {
      error.message += `\n${error.showSourceCode()}`
    }

    throw error
  })
}

module.exports = PostcssCompiler
