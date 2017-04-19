'use strict';

var Sk = require('../lib/skulpt.js');
var transform = require('./transform.js');
var improveError = require('./errors.js');

var defaultOptions = {
	locations: true,
	ranges: true,
	sippets: true,
	filename: 'file.py',
	useLet: false,
	friendlyErrors: true
};

function rangeToLoc(x, offsets) {
	var best = -1;
	for ( var i = 0; i < offsets.length; ++i ) {
		if ( offsets[i] > x ) break;
		best = i;
	}
	var off = best >= 0 ? offsets[best] : 0;
	return {line: best+2, column: x - off, pos: x };
}

function locToRange(line, col, offsets) {
	var loff = 0;
	if ( line >= 2 && (line-2) < offsets.length ) loff = offsets[line-2];
	return loff + col;
}

function decorate(n, code, offsets, options) {
	var numrange = locToRange(n.lineno, n.col_offset, offsets);

	var range = [
		numrange === numrange ? numrange : Infinity,
		numrange === numrange ? numrange : -Infinity
	];
	
	if ( n.value ) range[1] += (n.value.length);

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
	var parse, ast;
	options = options || {};
	for ( var opt in defaultOptions ) {
		if ( !(opt in options) ) options[opt] = defaultOptions[opt];
	}

	while ( true ) {
		idx = code.indexOf("\n", idx+1);
		if ( idx < 0 ) break;
		lineOffsets.push(idx+1);
	}

	try {
		parse = Sk.parse(options.filename, code);
		decorate(parse.cst, code, lineOffsets, options);
		parse.flags = parse.flags | Sk.Parser.CO_FUTURE_UNICODE_LITERALS; //Enable future unicode literals
		ast = Sk.astFromParse(parse.cst, options.filename, parse.flags);
	} catch ( e ) {
		if ( e.extra && e.extra.node ) decorate(e.extra.node, code, lineOffsets, options);
		improveError(e, options, code);
		if ( e.loc ) {
			e.pos = locToRange(e.loc.line, e.loc.column, lineOffsets);
		}
		throw e;
	}

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