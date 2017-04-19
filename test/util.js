global.expect = require('chai').expect;

var filbert = require('../src/index.js');
var filbert_loose = require('../src/index.js');
var escodegen = require('escodegen');

function removeExtraSpaces(code) {
  code = code.replace(/\s*$/,'')
  var lines = code.split(/\r\n|[\n\r\u2028\u2029]/g);
  lines = lines.map((function(line) { return line.replace(/\t/g,'    ')}));
  while ( lines[0].length == 0 ) lines.shift();
  var toTrim = lines[0].match(/^[ ]*/)[0].length;
  lines = lines.map(function (line) { return line.substring(toTrim); });
  return lines.join("\n");
}

var parse = exports.parse = function(code, options) {
  // Swap returns for low tech testing of filbert_loose
  return filbert.parse(removeExtraSpaces(code), options)
  //return filbert_loose.parse_dammit(code, options)
}

exports.run = function (code) {
  try {
    code = removeExtraSpaces(code);
    var lines = code.split(/\r\n|[\n\r\u2028\u2029]/g);
    for (var i in lines) lines[i] = "  " + lines[i];
    var indentedCode = lines.join("\n");
    var wrappedCode = "def foo(" + filbert.defaultOptions.runtimeParamName + "):\n" + indentedCode + "\n";
    var ast = parse(wrappedCode);
    var js = escodegen.generate(ast);
    js = "(function(__global){__global['foo'] = " + js + "})(this);this.foo(filbert.pythonRuntime);";
    return eval(js);
  }
  catch (e) {
    //console.log(code + "\n" + e.toString());
    return e;
  }
}

exports.runInEnv = function (code, env) {
    var lines = code.split(/\r\n|[\n\r\u2028\u2029]/g);
    for (var i in lines) lines[i] = "  " + lines[i];
    var indentedCode = lines.join("\n");
    var fbody = parse(code)
    var code = escodegen.generate(fbody).split(/\n/)
    for ( var idx in env ) {
      code.unshift('var ' + idx + ' = ' + JSON.stringify(env[idx]) + ';' );
    }
    code[code.length - 1] = "return " + code[code.length - 1];
    var fxn = new Function(filbert.defaultOptions.runtimeParamName, code.join('\n'));
    return fxn.call(null, filbert.pythonRuntime);
}
