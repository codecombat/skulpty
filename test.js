var parser = require('./src/index');
var code = require('fs').readFileSync('./hello.py', 'utf8');
var ast = parser.parse(code);
var codegen = require('escodegen').generate;
//console.log(JSON.stringify(ast, null, '  '));
var js = codegen(ast);
console.log(js);
global.__pythonRuntime = require('./src/index').pythonRuntime;
console.log(eval(js));