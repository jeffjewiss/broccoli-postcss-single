/* global it, beforeEach, afterEach */

var assert = require('assert')
var fs = require('fs')
var path = require('path')
var broccoli = require('broccoli')
var postcssCompiler = require('./')
var postcss = require('postcss')
var rimraf = require('rimraf')
var glob = require('glob')
var async = require('async')

var basicOptionSet = {
  plugins: [
    {
      module: require('postcss-color-rebeccapurple')
    }
  ]
}

var testWarnOptionsSet = {
  plugins: [
    {
      module: postcss.plugin('postcss-test-warn', function (opts) {
        return function (css, result) {
          result.warn('This is a warning.')
        }
      })
    }
  ]
}

var map = {
  inline: false,
  annotation: false
}

basicOptionSet.map = map
testWarnOptionsSet.map = map

var warnings = []
var warningStreamStub = {
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
  var builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  return builder.build().then(function () {
    var content = fs.readFileSync(path.join(builder.outputPath, 'output.css'), 'utf8')
    var sourceMap = JSON.parse(fs.readFileSync(path.join(builder.outputPath, 'output.css.map'), 'utf8'))

    assert.strictEqual(content.trim(), 'body {\n  color: rgb(102, 51, 153)\n}')
    assert.strictEqual(sourceMap.mappings, 'AAAA;EACE,wBAAoB;CACrB')
    assert.deepEqual(warnings, [])
  })
}

it('should process css', function () {
  var outputTree = postcssCompiler(['fixture/success'], 'fixture.css', 'output.css', basicOptionSet)
  return processCss(outputTree)
})

it('should process css using depricated options', function () {
  var outputTree = postcssCompiler(['fixture/success'], 'fixture.css', 'output.css', basicOptionSet.plugins, basicOptionSet.map)
  return processCss(outputTree)
})

it('should expose warnings', function () {
  var outputTree = postcssCompiler(['fixture/warning'], 'fixture.css', 'output.css', testWarnOptionsSet)
  var builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  return builder.build().then(function (dir) {
    var content = fs.readFileSync(path.join(builder.outputPath, 'output.css'), 'utf8')
    assert.strictEqual(content.trim(), 'a {}')
    assert.deepEqual(warnings, [ 'postcss-test-warn: This is a warning.' ])
  })
})

it('should expose syntax errors', function () {
  var outputTree = postcssCompiler(['fixture/syntax-error'], 'fixture.css', 'output.css', testWarnOptionsSet)
  var builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  var count = 0

  outputTree.warningStream = warningStreamStub

  return builder.build()
  .catch(function (error) {
    count++
    assert.strictEqual(error.broccoliPayload.originalError.name, 'CssSyntaxError')
    assert.strictEqual(error.broccoliPayload.originalError.message, `${error.broccoliPayload.originalError.input.file}:1:1: Unknown word\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 1 | \u001b[39ma \u001b[33m}\u001b[39m\n \u001b[90m   | \u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m 2 | \u001b[39m`)
  })
  .then(function () {
    assert.strictEqual(count, 1)
    assert.deepEqual(warnings, [])
  })
})

it('should expose non-syntax errors', function () {
  var outputTree = postcssCompiler(['fixture/missing-file'], 'fixture.css', 'output.css', testWarnOptionsSet)
  var count = 0

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
