var parser = require('./src/index');
var code = require('fs').readFileSync('./hello.py', 'utf8');
var js = parser.parse(code);
var codegen = require('escodegen').generate;
console.log(codegen(js));