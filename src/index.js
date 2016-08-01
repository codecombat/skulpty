'use strict';

var Sk = require('../lib/skulpt.js');
var transform = require('./transform.js');

var defaultOptions = {
	locations: true,
	ranges: false,
	sippets: true,
	filename: 'file.py',
	useLet: false
};

function rangeToLoc(x, offsets) {
	var best = -1;
	for ( var i = 0; i < offsets.length; ++i ) {
		if ( offsets[i] > x ) break;
		best = i;
	}

	return {line: best+2, column: x - ( best > 0 ? offsets[best] : 0) };
}

function locToRange(line, col, offsets) {
	return (line < 2 ? 0 : offsets[line - 2]) + col;
}

function decorate(n, code, offsets, options) {
	var numrange = locToRange(n.lineno, n.col_offset, offsets);

	var range = [
		numrange === numrange ? numrange : Infinity,
		numrange === numrange ? numrange : -Infinity
	];
	
	if ( n.value ) range[1] += (n.value.length-1);

	if ( n.children )
	for ( var i = 0; i < n.children.length; ++i ) {
		var r = decorate(n.children[i], code, offsets, options);
		range[0] = Math.min(range[0], r[0]);
		range[1] = Math.max(range[1], r[1]);
	}

	
	if ( options.ranges ) n.range = range;
	if ( options.locations ) {
		n.loc = {
			start: rangeToLoc(range[0], offsets),
			end: rangeToLoc(range[1], offsets),
		};
	}
	if ( options.snippets ) n.str = code.substring(range[0], range[1]);

	return range;
}

function parser(code, options) {
	var lineOffsets = [];
	var idx = -1;
	var parse;
	options = options || {};
	for ( var opt in defaultOptions ) {
		if ( !(opt in options) ) options[opt] = defaultOptions[opt];
	}

	while ( true ) {
		idx = code.indexOf("\n", idx+1);
		if ( idx < 0 ) break;
		lineOffsets.push(idx);
	}

	try {
		parse = Sk.parse(options.filename, code);
	} catch ( e ) {
		/*
		console.log("OHH NOOOOWW!");
		console.log(e, e.extra);
		console.log(JSON.stringify(e.extra.node, function(k,  o) {
			if ( k == 'type' ) return Sk.nameForToken(o);
			else if ( k == 'children' ) return o;
			else if ( k ===  '' ) return o;
			else if ( !isNaN(parseInt(k)) ) return o;
			else return undefined;
		}, '  '));
		*/
		if ( e.context ) {
			var r = e.context[0];
			if ( e.extra && e.extra.node ) decorate(e.extra.node, code, lineOffsets, options);
			e.pos = locToRange(r[0], r[1], lineOffsets);
			e.loc = {line: r[0], column: r[1]};
			e.line = r[0];
			e.column = r[1];
		}
		throw e;
	}
	decorate(parse.cst, code, lineOffsets, options);
	var ast = Sk.astFromParse(parse.cst, options.filename, parse.flags);
	//console.log(JSON.stringify(ast, null, "  "));
	var ctx = {varType: (options.useLet ? 'let' : 'var')};
	var js = transform(ast, ctx);
	return js;
}

module.exports = {
	parse: parser,
	pythonRuntime: require('../lib/stdlib.js'),
	defaultOptions: {runtimeParamName: '__pythonRuntime'}
};