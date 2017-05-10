var path = require('path')
var fs = require('fs')
var mkdirp = require('mkdirp')
var assign = require('object-assign')
var includePathSearcher = require('include-path-searcher')
var CachingWriter = require('broccoli-caching-writer')
var postcss = require('postcss')

function PostcssCompiler (inputTrees, inputFile, outputFile, options, deprecatedMap) {
  if (!(this instanceof PostcssCompiler)) {
    return new PostcssCompiler(inputTrees, inputFile, outputFile, options, deprecatedMap)
  }

  if (!Array.isArray(inputTrees)) {
    throw new Error('Expected array for first argument - did you mean [tree] instead of tree?')
  }

  CachingWriter.call(this, Array.isArray(inputTrees) ? inputTrees : [inputTrees])

  this.inputFile = inputFile
  this.outputFile = outputFile
  this.warningStream = process.stderr

  if (Array.isArray(options)) {
    console.warn('The plugin argument has been deprecated, please set your plugins as a property on the options object.')
    this.plugins = options
  } else {
    this.plugins = options.plugins
  }

  if (deprecatedMap) {
    console.warn('The map argument has been deprecated, please set your map configuration as a property on the options object.')
    this.map = deprecatedMap
  } else {
    this.map = options.map
  }
  this.plugins = this.plugins || []
  this.map = this.map || {}
}

PostcssCompiler.prototype = Object.create(CachingWriter.prototype)
PostcssCompiler.prototype.constructor = PostcssCompiler

PostcssCompiler.prototype.build = function () {
  var toFilePath = this.outputPath + '/' + this.outputFile
  var fromFilePath = includePathSearcher.findFileSync(this.inputFile, this.inputPaths)

  if (!this.plugins || this.plugins.length < 1) {
    throw new Error('You must provide at least 1 plugin in the plugin array')
  }

  var processor = postcss()
  var css = fs.readFileSync(fromFilePath, 'utf8')
  var options = {
    from: fromFilePath,
    to: toFilePath,
    map: this.map
  }

  this.plugins.forEach(function (plugin) {
    var pluginOptions = assign(options, plugin.options || {})
    processor.use(plugin.module(pluginOptions))
  })

  var warningStream = this.warningStream

  return processor.process(css, options)
  .then(function (result) {
    result.warnings().forEach(function (warn) {
      warningStream.write(warn.toString())
    })

    mkdirp.sync(path.dirname(toFilePath))
    fs.writeFileSync(toFilePath, result.css, {
      encoding: 'utf8'
    })

    if (result.map) {
      fs.writeFileSync(toFilePath + '.map', result.map, {
        encoding: 'utf8'
      })
    }
  })
  .catch(function (error) {
    if (error.name === 'CssSyntaxError') {
      error.message += '\n' + error.showSourceCode()
    }

    throw error
  })
}

module.exports = PostcssCompiler
