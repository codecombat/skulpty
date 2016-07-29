var parser = require('./src/index');
var code = require('fs').readFileSync('./hello.py', 'utf8');
var js = parser.parse(code);
var codegen = require('escodegen').generate;
var js = codegen(js);
console.log(js);
global.__pythonRuntime = require('./src/index').pythonRuntime;
console.log(eval(js));