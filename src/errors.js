'use strict';

var Sk = require('../lib/skulpt.js');

function splat(e) {
	console.log("GOT ERROR!");
	console.log(e, e.extra);
	console.log(JSON.stringify(e.extra.node, function(k,  o) {
		if ( k == 'type' ) return Sk.nameForToken(o);
		else if ( k == 'children' ) return o;
		else if ( k ===  '' ) return o;
		else if ( !isNaN(parseInt(k)) ) return o;
		else return undefined;
	}, '  '));
}

function improveError(e, options, code) {
	var r;
	if ( e.context && e.context.length >0 ) {
		r = e.context[0];	
	}

	if ( e.extra && e.extra.node ) {
		if ( !r ) {
			r = [e.extra.node.loc.start.line,e.extra.node.loc.start.column];
		}
	}

	if ( r ) {
		setErrorPos(e, r[0], r[1]);
	}

	if ( options.friendlyErrors && e.extra ) {
		e.message = makeErrorFriendly(e, code);
	}
}

function setErrorPos(e, line, col) {
	e.loc = {line: line, column: col};
	e.line = line;
	e.column = col;
}

function friendlyString(s) {
	switch (s) {
	case 'if_stmt': return 'if statement';
	case 'while_stmt': return 'while statement';
	case 'funcdef': return 'function';
	default: return '?' + s + '?';
	} 
}

function nodeToType(n) {
	var type = Sk.nameForToken(n.type);
	if ( type === 'suite' ) return nodeToType(n.children[0]);
	return friendlyString(type);
}

function makeErrorFriendly(e, code) {
	//console.log("EX", e.message, e.extra);
	if ( e.extra.kind == "DAG_MISS" ) {
		if ( e.extra.expected.indexOf('T_COLON') !== -1 ) {
			//We might be missing a colon.
			var after = (e.context && e.context[2] ? e.context[2] : e.extra.found_val).replace(/\s+$/,'');
			var lc = e.extra.node.children[e.extra.node.children.length-1];
			if ( lc.value === 'else' ) after = 'else';

			if ( e.extra.found == 'T_SEMI' ) {
				return "Replace the `;` at the end of `" + after + "` with a `:`";
			} else if ( e.extra.found == 'T_NEWLINE' ) {
				return "Need a `:` on the end of the line following `" + after + "`.";
			} else if ( e.extra.found == 'T_NAME' ) {
				return "Need a `:` after `" + after + "`.";
			} else if ( e.extra.found == 'T_EQUAL' ) {
				return "Can't assign to a variable within the condition of an " + friendlyString(e.extra.inside) + ".  Did you mean to use `==` instead of `=`?";
			}
		}

		if ( e.extra.expected.indexOf('T_DEDENT') !== -1 ) {
			if ( e.extra.found_val.toLowerCase() === 'else' ) {
				return "`else` needs to line up with its `if`.";
			} else {
				return "Indentation error.";
			}
		}

		if ( e.extra.expected.indexOf('T_INDENT') !== -1 ) {
			var lc = e.extra.parent || e.extra.node;
			var name  = nodeToType(lc);
			if ( name === 'if statement' ) {
				//Scan for the most recent part of the ifstatement.
				for ( var i = 0; i < lc.children.length; ++i ) {
					if ( ["if", "elif", "else"].indexOf(lc.children[i].value) !== -1 ) {
						name = lc.children[i].value + ' statement';
					}
				}
			}
			if ( lc.value === 'else' ) name = 'else statement';
			return 'Empty ' + name + '. Put 4 spaces in front of statements inside the ' + name + '.';
		}

		if ( e.extra.found === 'T_NAME' ) {
			switch ( e.extra.found_val ) {
				case 'else':
				case 'elif':
					return '`' + e.extra.found_val + '` must be paired with an `if`';
				case 'elseif':
					return '`elseif` should be shortened to `elif`';
			} 
		}

		if ( e.extra.found === 'T_AMPER' && e.extra.inside == 'and_expr' ) {
			return 'Python uses the word `and` instead of `&&` for boolean AND expressions.';
		}


		if ( e.extra.inside === 'trailer' ) {
			//We are parsing either an arglist or a subscript.
			if ( e.extra.expected.indexOf('T_RPAR') === 0 ) {
				//Expected ), must be a arglsit;
				if ( e.line > e.extra.node.lineno ) {
					//Our arglist is incomplete, and we have made it to the next line,.
					//Likely they just forgot to close their ()'s
					setErrorPos(e, e.extra.node.lineno, e.extra.node.col_offset);
					var t = e.extra.node.loc;
					e.context = [
						[t.start.line,t.start.column],
						[t.end.line,t.end.column]
					];
					return 'Unclosed `(` in function arguments.' + e.extra.node.lineno;

				}
				return 'Function calls paramaters must be seperated by `,`s';
			}
		}

		if ( e.extra.found === 'T_INDENT' ) {
			if ( e.extra.expected.indexOf('stmt') !== -1 ) {
				return 'Too much indentation at the beginning of this line.';
			}
		}

		if ( e.extra.expected.indexOf('subscriptlist') === 0 ) {
			return "Malformed subscript";
		}

		if ( e.extra.expected.indexOf('T_NEWLINE') !== -1 ) {
			var n = e.extra.node;
			
			if ( e.extra.node.children[0] ) {
				var n = e.extra.node.children[0];
				var previousType = Sk.nameForToken(n.type);
			
				if ( previousType == 'small_stmt' ) {
					while ( n.children && n.children.length == 1 ) n = n.children[0];
					var what = code.substring(n.range[0], n.range[1]);
					return 'If you want to call `' + what +'` as function, you need `()`\'s';
				}
			}
		}

		return 'Unexpected token: ' + e.message;
	} else if ( e.extra.kind == "CLASSIFY" ) {
		if ( e.extra.value === '"' ) return 'Unterminated string. Add a matching `"` at the end of your string.';
		return 'Unterminated `' + e.extra.value + '`';
	} else if ( e.extra.kind == "STRING_EOF" ) {
		return 'Unterminated muti-line string. Add a matching `"""` at the end of your string.';
	} else if ( e.extra.kind == "STATEMENT_EOF" ) {
		if ( e.extra.parenlev > 0 ) {
			var top = e.extra.parenstack[e.extra.parenstack.length-1];
			var kind = top[0];
			var types = '([{';
			var pair = ')]}';
			var close = pair[types.indexOf(kind)];
			setErrorPos(e, top[1], top[2]-1);
			return 'Unmatched `' + kind + '`.  Every opening `' + kind + '` needs a closing `' + close + '` to match it.';
		}
		return e.message;
	}

	return e.message;
	
	
}

module.exports = improveError;
