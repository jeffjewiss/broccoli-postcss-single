/* global it, beforeEach, afterEach */
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const broccoli = require('broccoli')
const postcssCompiler = require('./')
const postcss = require('postcss')
const rimraf = require('rimraf')
const glob = require('glob')
const async = require('async')

const basicOptionSet = {
  plugins: [
    {
      module: require('postcss-color-rebeccapurple')
    }
  ]
}

const testWarnOptionsSet = {
  plugins: [
    {
      module: postcss.plugin('postcss-test-warn', function (opts) {
        return function (root, result) {
          result.warn('This is a warning.')
        }
      })
    }
  ]
}

const browsersOptionSet = {
  plugins: [
    {
      module: postcss.plugin('return-options', (options) => {
        return (root, result) => {
          result.warn(options.browsers.join(', '))
        }
      })
    }
  ],
  browsers: ['last 2 versions', 'ie > 9', 'ios >= 8', '> 5%']
}

const statsOptionSet = {
  stats: {
    enabled: true
  },
  plugins: [
    {
      module: require('postcss-color-rebeccapurple')
    }
  ]
}

const map = {
  inline: false,
  annotation: false
}

basicOptionSet.map = map
testWarnOptionsSet.map = map

let warnings = []
let warningStreamStub = {
  write: function (warning) {
    warnings.push(warning)
  }
}

beforeEach(function () {
  warnings = []
})

afterEach(function () {
  glob('tmp/*', function (err, files) {
    if (err) {
      console.error(err)
    } else {
      async.forEach(files, rimraf)
    }
  })
})

function processCss (outputTree) {
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  return builder.build().then(function () {
    let content = fs.readFileSync(path.join(builder.outputPath, 'output.css'), 'utf8')
    let sourceMap = JSON.parse(fs.readFileSync(path.join(builder.outputPath, 'output.css.map'), 'utf8'))

    assert.strictEqual(content.trim(), 'body {\n  color: #639\n}')
    assert.strictEqual(sourceMap.mappings, 'AAAA;EACE,WAAoB;CACrB')
    assert.deepEqual(warnings, [])
  })
}

it('should process css', function () {
  let outputTree = postcssCompiler(['fixture/success'], 'fixture.css', 'output.css', basicOptionSet)
  return processCss(outputTree)
})

it('should process css using deprecated options', function () {
  let outputTree = postcssCompiler(['fixture/success'], 'fixture.css', 'output.css', basicOptionSet.plugins, basicOptionSet.map)
  return processCss(outputTree)
})

it('should throw an error if the inputTrees is not an array', function () {
  assert.throws(function () {
    postcssCompiler('fixture', 'syntax-error.css', 'output.css', testWarnOptionsSet, map)
  }, /Expected array for first argument/, 'Did not throw an error for an incorrect inputTree.')
})

// it('should throw an error if no plugins are provided', function () {
  // assert.throws(function () {
    // postcssCompiler(['fixture'], 'syntax-error.css', 'output.css', [], map)
  // }, /You must provide at least 1 plugin in the plugin array/, 'Did not throw an error for having no plugins.')
// })

it('should create stats json', function () {
  let outputTree = postcssCompiler(['fixture/success'], 'fixture.css', 'output.css', statsOptionSet)
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  return builder.build().then((dir) => {
    let statsObject = JSON.parse(fs.readFileSync(path.join(builder.outputPath, 'output.css.stats.json'), 'utf8'))

    assert.strictEqual(statsObject.rules.total, 1)
    assert.deepEqual(warnings, [])
  })
})

it('should expose warnings', function () {
  let outputTree = postcssCompiler(['fixture/warning'], 'fixture.css', 'output.css', testWarnOptionsSet)
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  return builder.build().then((dir) => {
    let content = fs.readFileSync(path.join(builder.outputPath, 'output.css'), 'utf8')
    assert.strictEqual(content.trim(), 'a {}')
    assert.deepEqual(warnings, [ 'postcss-test-warn: This is a warning.' ])
  })
})

it('should expose syntax errors', function () {
  let outputTree = postcssCompiler(['fixture/syntax-error'], 'fixture.css', 'output.css', testWarnOptionsSet)
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  let count = 0

  outputTree.warningStream = warningStreamStub

  return builder.build()
  .catch((error) => {
    count++
    assert.strictEqual(error.broccoliPayload.originalError.name, 'CssSyntaxError')
    assert.strictEqual(error.broccoliPayload.originalError.message, `${error.broccoliPayload.originalError.input.file}:1:1: Unknown word\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 1 | \u001b[39ma \u001b[33m}\u001b[39m\n \u001b[90m   | \u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m 2 | \u001b[39m`)
  })
  .then(() => {
    assert.strictEqual(count, 1)
    assert.deepEqual(warnings, [])
  })
})

it('should expose non-syntax errors', function () {
  let outputTree = postcssCompiler(['fixture/missing-file'], 'fixture.css', 'output.css', testWarnOptionsSet)
  let count = 0

  outputTree.warningStream = warningStreamStub

  try {
    new broccoli.Builder(outputTree) // eslint-disable-line no-new
  } catch (err) {
    count++
    assert.strictEqual(err.name, 'BuilderError')
  }

  assert.strictEqual(count, 1)
  assert.deepEqual(warnings, [])
})

it('should use browser options', function () {
  let outputTree = postcssCompiler(['fixture/success'], 'fixture.css', 'output.css', browsersOptionSet)
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  assert.strictEqual(outputTree.browsers.join(', '), 'last 2 versions, ie > 9, ios >= 8, > 5%')

  return builder.build().then((dir) => {
    assert.deepEqual(warnings, [ 'return-options: last 2 versions, ie > 9, ios >= 8, > 5%' ])
  })
})
