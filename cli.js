var parser = require('./src/index');
var code = require('fs').readFileSync('./hello.py', 'utf8').replace(/\t/g,'    ');
try {
	var ast = parser.parse(code);

} catch ( e ) {
	console.log(e);
	var lines = code.split(/\n/g);
	var line = lines[e.line - 1];
	console.log(line);
	console.log(new Array(e.column+1).join(' ') + '^- ' + e.toString());
	process.exit(1);
}
var codegen = require('escodegen').generate;
//console.log(JSON.stringify(ast, null, '  '));
var js = codegen(ast);
console.log(js);
global.__pythonRuntime = require('./src/index').pythonRuntime;
console.log(eval(js));