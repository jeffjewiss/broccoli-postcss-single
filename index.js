'use strict'

const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const assign = require('object-assign')
const includePathSearcher = require('include-path-searcher')
const CachingWriter = require('broccoli-caching-writer')
const postcss = require('postcss')

module.exports = class PostcssCompiler extends CachingWriter {
  constructor (inputNodes, inputFile, outputFile, _options) {
    const defaultOptions = {
      cacheExclude: [],
      cacheInclude: [/.*\.(css|scss|sass|less)$/],
      plugins: []
    }
    const options = Object.assign(defaultOptions, _options)

    super(Array.isArray(inputNodes) ? inputNodes : [inputNodes], options)

    this.inputFile = inputFile
    this.outputFile = outputFile
    this.warningStream = process.stderr

    this.plugins = options.plugins
    this.map = options.map
    this.browsers = options.browsers
    this.parser = options.parser
    this.errors = options.errors || { showSourceCode: true, terminalColors: true }
  }

  build () {
    const toFilePath = `${this.outputPath}/${this.outputFile}`
    const fromFilePath = includePathSearcher.findFileSync(this.inputFile, this.inputPaths)

    if (!this.plugins || this.plugins.length < 1) {
      throw new Error('You must provide at least 1 plugin in the plugin array')
    }

    const processor = postcss()
    const css = fs.readFileSync(fromFilePath, 'utf8')
    const options = {
      from: fromFilePath,
      to: toFilePath,
      map: this.map,
      parser: this.parser,
      browsers: this.browsers
    }
    const showSourceCode = this.errors.showSourceCode
    const terminalColors = this.errors.terminalColors

    this.plugins.forEach((plugin) => {
      let pluginInstance

      if (plugin.module) {
        const pluginOptions = assign(options, plugin.options || {})
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
          fs.writeFileSync(`${toFilePath}.map`, JSON.stringify(result.map), {
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
}
