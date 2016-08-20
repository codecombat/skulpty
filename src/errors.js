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

function improveError(e, options) {
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
		e.loc = {line: r[0], column: r[1]};
		e.line = r[0];
		e.column = r[1];
	}

	if ( options.friendlyErrors && e.extra ) {
		e.message = makeErrorFriendly(e);
	}
}

function friendlyString(s) {
	switch (s) {
	case 'if_stmt': return 'if statement';
	case 'while_stmt': return 'while statement';
	default: return '?' + s + '?';
	} 
}

function nodeToType(n) {
	var type = Sk.nameForToken(n.type);
	if ( type === 'suite' ) return nodeToType(n.children[0]);
	return friendlyString(type);
}

function makeErrorFriendly(e) {
	//console.log("EX", e.message, e.extra);
	if ( e.extra.kind == "DAG_MISS" ) {
		if ( e.extra.expected.indexOf('T_COLON') !== -1 ) {
			//We might be missing a colon.
			if ( e.extra.found == 'T_NEWLINE' ) {
				var after = (e.context && e.context[2] ? e.context[2] : e.extra.found_val).replace(/\s+$/,'');
				return "Need a `:` on the end of the line following `" + after + "`.";
			}
			if ( e.extra.found == 'T_EQUAL' ) {
				return "Can't assign to a variable within the condition of an " + friendlyString(e.extra.inside);
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
			var name  = nodeToType(e.extra.parent || e.extra.node);
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

		if ( e.extra.inside === 'trailer' ) {
			//We are parsing either an arglist or a subscript.
			if ( e.extra.expected.indexOf('T_RPAR') === 0 ) {
				//Expected ), must be a arglsit;
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

		return 'Unexpected token: ' + e.message;
	}

	if ( e.extra.kind == "CLASSIFY" ) {
		return 'Unterminated `' + e.extra.value + '`';
	}

	return e.message;
	
	
}

module.exports = improveError;