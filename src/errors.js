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
	} 
}

function makeErrorFriendly(e) {
	//console.log("EX", e.message, e.extra);
	if ( e.extra.kind == "DAG_MISS" ) {
		if ( e.extra.expected.indexOf('T_COLON') !== -1 ) {
			//We might be missing a colon.
			if ( e.extra.found == 'T_NEWLINE' ) {
				return "Need a `:` on the end of the line following `" + e.extra.found_val + "`.";
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
			return 'Expected an indented code block.  Use an indented `pass` above this line to keep the block empty';
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
		return 'Unexpected token: ' + e.message;
	}

	if ( e.extra.kind == "CLASSIFY" ) {
		return 'Unterminated `' + e.extra.value + '`';
	}

	return e.message;
	
	
}

module.exports = improveError;