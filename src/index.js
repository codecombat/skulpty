'use strict';

var Sk = require('../lib/skulpt.js');
var transform = require('./transform.js');

function display(node, depth) {
	depth = depth || 0;
	var indent = new Array(1+depth).join('| ');

	//console.log(indent, "T:" + node._astname);
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

function rangeToLoc(x, offsets) {
	var best = -1;
	for ( var i = 0; i < offsets.length; ++i ) {
		if ( offsets[i] > x ) break;
		best = i;
	}

	return {line: best+2, column: x - ( best > 0 ? offsets[best] : 0) };
}

function decorate(n, code, offsets) {
	var numrange = (n.lineno < 2 ? 0 : offsets[n.lineno - 2]) + n.col_offset;

	var range = [
		numrange === numrange ? numrange : Infinity,
		numrange === numrange ? numrange : -Infinity
	];
	
	if ( n.value ) range[1] += (n.value.length-1);
	


	if ( n.children )
	for ( var i = 0; i < n.children.length; ++i ) {
		var r = decorate(n.children[i], code, offsets);
		range[0] = Math.min(range[0], r[0]);
		range[1] = Math.max(range[1], r[1]);
	}

	
	n.range = range;
	n.loc = {
		start: rangeToLoc(range[0], offsets),
		end: rangeToLoc(range[1], offsets),
	};
	n.str = code.substring(range[0], range[1]);

	return range;
}

function parser(code) {
	var lineOffsets = [];
	var idx = -1;

	while ( true ) {
		idx = code.indexOf("\n", idx+1);
		if ( idx < 0 ) break;
		lineOffsets.push(idx);
	}

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
	decorate(parse.cst, code, lineOffsets);
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