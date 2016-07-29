'use strict';

var Sk = require('../lib/skulpt.js');
var transform = require('./transform.js');

function display(node, depth) {
	depth = depth || 0;
	var indent = new Array(1+depth).join('| ');

	console.log(indent, "T:" + node._astname);
	for ( var k in node ) {
		var n = node[k];
		if ( !n ) { }
		else if ( Array.isArray(n) ) {
			for ( var i = 0; i < n.length; ++i ) {
				if ( n[i]._astname ) display(n[i], depth+1);
			}
		} else if ( n._astname ) {
			display(n, depth+1);
		}
	}

}

function parser(code) {
	try {
		var parse = Sk.parse('file.py', code);
	} catch ( e ) {
		console.log("OHH NOOOOWW!");
		throw new SyntaxError(e.toString());
		//console.log(Object.keys(e.constructor.prototype));
		//console.log(e.toString());
		//console.log(e.args.v);
		//return;
	}
	var ast = Sk.astFromParse(parse.cst, 'file.py', parse.flags);
	//console.log(JSON.stringify(ast, null, "  "));
	var js = transform(ast);
	return js;
};

module.exports = {
	parse: parser,
	pythonRuntime: require('../lib/stdlib.js'),
	defaultOptions: {runtimeParamName: '__pythonRuntime'}
};