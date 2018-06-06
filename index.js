'use strict'

const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const assign = require('object-assign')
const includePathSearcher = require('include-path-searcher')
const CachingWriter = require('broccoli-caching-writer')
const postcss = require('postcss')

function PostcssCompiler (inputNodes, inputFile, outputFile, options) {
  if (!(this instanceof PostcssCompiler)) {
    return new PostcssCompiler(inputNodes, inputFile, outputFile, options)
  }

  if (!Array.isArray(inputNodes)) {
    throw new Error('Expected array for first argument - did you mean [tree] instead of tree?')
  }

  CachingWriter.call(this, Array.isArray(inputNodes) ? inputNodes : [inputNodes])

  this.inputFile = inputFile
  this.outputFile = outputFile
  this.warningStream = process.stderr

  this.plugins = options.plugins || []
  this.map = options.map
  this.browsers = options.browsers
  this.parser = options.parser
  this.errors = options.errors || { showSourceCode: true, terminalColors: true }
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
    parser: this.parser,
    browsers: this.browsers
  }
  let showSourceCode = this.errors.showSourceCode
  let terminalColors = this.errors.terminalColors

  this.plugins.forEach((plugin) => {
    let pluginInstance

    if (plugin.module) {
      let pluginOptions = assign(options, plugin.options || {})
      pluginInstance = plugin.module(pluginOptions)
    } else {
      pluginInstance = plugin
    }

    processor.use(pluginInstance)
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
    .catch((err) => {
      if (err.name === 'CssSyntaxError') {
        if (showSourceCode) {
          err.message += `\n${err.showSourceCode(terminalColors)}`
        }
      }

      throw err
    })
}

module.exports = PostcssCompiler
