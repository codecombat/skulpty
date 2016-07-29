var isArray = Array.isArray;

function abort(why) {
	console.log(new Error("ABORT:" + why).stack);
	throw new Error(why);
}

function isExpression(n) {
	return /Expression$/.test(n.type);
}

var idx = 0;
function createTempName(hint) {
	return '__temp$' + hint + '$' + idx++;
}

function ensureStatement(s) {
	var f = s;
	if ( !isArray(s) ) f = [f];
	for ( var i = 0; i < f.length; ++i ) {
		var v = s[i];
		if ( isExpression(v) ) {
			s[i] = {type: "ExpressionStatement", expression: v};
		}
	}
	return s;
}

function transform(node, ctx) {
	ctx = ctx || {};
	if ( !node ) {
		console.log("WAT!", new Error().stack);
		throw new Error("What?");
	}
	if ( isArray(node) ) {
		var body = [];
		for ( var i = 0; i < node.length; ++i ) {
			body[i] = transform(node[i]);
		}
		return body;
	}
	switch (node._astname) {
		case 'Attribute': return transformAttribute(node, ctx);
		case 'Assign': return transformAssign(node, ctx);
		case 'AugAssign': return transformAugAssign(node, ctx);
		case 'BinOp': return transformBinOp(node, ctx);
		case 'BoolOp': return transformBoolOp(node, ctx);
		case 'Break': return transformBreak(node, ctx);
		case 'Call': return transformCall(node, ctx);
		case 'Continue': return tranformContinue(node, ctx);
		case 'Compare': return transformCompare(node, ctx);
		case 'Expr': return transformExpr(node, ctx);
		case 'For': return transformFor(node, ctx);
		case 'FunctionDef': return transformFunctionDef(node, ctx);
		case 'If': return transformIf(node, ctx);
		case 'Import': return NoOp();
		case 'List': return transformList(node, ctx);
		case 'ListComp': return transformListComp(node, ctx);
		case 'Module': return transformModule(node, ctx);
		case 'Name': return transformName(node, ctx);
		case 'Print': return transformPrint(node, ctx);
		case 'Return': return transformReturn(node, ctx);
		case 'Str': return transformStr(node, ctx);
		case 'Subscript': return transformSubscript(node, ctx);
		case 'Tuple': return transformTuple(node, ctx);
		case 'Num': return transformNum(node, ctx);
		case 'Pass': return transformPass(node, ctx);
		case 'UnaryOp': return transformUnaryOp(node, ctx);
		case 'While': return transformWhile(node, ctx);
		default:
			console.log("Dont know how to transform: " + node._astname);
			console.log(JSON.stringify(node, null, '  '));
			throw new Error("Up");
	}
}

function NoOp() { return {type: "EmptyStatement"}; }

function makeLiteral(v) {
	if ( typeof v === 'number' && v < 0 ) {
		return {type: "UnaryExpression", argument: makeLiteral(-v), operator: '-' };
	}
	return {type: "Literal", value: v, raw: JSON.stringify(v)};
}

function makeVariableName(name) {
	var parts = Array.isArray(name) ? name : name.split(/\./g);
	if ( parts.length === 1 ) return {type: "Identifier", name: name};
	var prop = parts.pop();
	return {
		type: "MemberExpression",
		object: makeVariableName(parts),
		property: {type: "Identifier", name: prop},
		computed: false
	};
}

function transformAttribute(node, ctx) {
	console.log(node, ctx);
	var n = node.attr;
	if ( n._astname ) n = transform(n);
	else n = {type: 'Identifier', name: n.v};

	return {
		type: "MemberExpression",
		computed: false, //TODO: maybe sometimes true?
		object: transform(node.value),
		property: n
	};
}

function transformAugAssign(node, ctx) {
	return {
		type: "AssignmentExpression",
		operator: '+=',
		left: transform(node.target),
		right: transform(node.value)
	};
}

function transformAssign(node, ctx) {
	return {
		type: "AssignmentExpression",
		operator: '=',
		left: transform(node.targets[0]),
		right: transform(node.value)
	};
}

function transformBinOp(node, ctx) {
	var left = transform(node.left);
	var right = transform(node.right);

	var fxOps = {
		"Add": "add",
		"Mult": "multiply",
	};

	if ( node.op.name in fxOps  ) {
		var call = {
			type: "CallExpression",
			callee: makeVariableName("__pythonRuntime.ops." + fxOps[node.op.name]),
			arguments: [left, right]
		};
		return call;
	}

	var operators = {
		"Add": "+",
		"Sub": "-",
		"Mod": "%",
		"Div": "/",
		"BitAnd": "&",
		"BitOr": "|"

	};

	if ( !(node.op.name in operators) ) abort("Unknwon binary operator: " + node.op.name);

	return {
		type: "BinaryExpression",
		left: left,
		right: right,
		operator: operators[node.op.name]
	};
	
}

function transformBoolOp(node, ctx) {
	var left = transform(node.left);
	var right = transform(node.right);
	var call = {
		type: "BinaryExpression",
		left: left,
		right: right,
		operator: '&&'
	};
	console.log(call);
	return call;
}

function transformBreak(node, ctx) {
	return {type: "BreakStatement"};
}

function transformCall(node, ctx) {
	var builtins = ['len'];
	if ( node.func._astname == 'Name' ) {
		switch ( node.func.id.v ) {
			case 'len':
				return {
					type: "MemberExpression",
					object: transform(node.args[0]),
					property: {type: "Identifier", name: "length"}
				};
			case 'dict':
			case 'sum':
			case 'str':
			case 'ascii':
			case 'range':
			case 'int':
				return {
					type: 'CallExpression',
					callee: makeVariableName('__pythonRuntime.functions.' + node.func.id.v),
					arguments: transform(node.args)
				};
		}
	}

	return {
		type: "CallExpression",
		callee: transform(node.func),
		arguments: transform(node.args)
	};
}

function tranformContinue(node, ctx) {
	return {type: "ContinueStatement"};
}


function transformCompare(node, ctx) {
	var left = transform(node.left);
	if ( node.comparators.length !== 1 ) abort("Not implemented yet");
	var op = node.ops[0];
	var fxOps = {
		"In_": "in",
		"NotIn": "in"
	};

	if ( op.name in fxOps  ) {
		var call = {
			type: "CallExpression",
			callee: makeVariableName("__pythonRuntime.ops." + fxOps[op.name]),
			arguments: [left, transform(node.comparators[0])]
		};

		if ( op.name == "NotIn" ) {
			return {
				type: "UnaryExpression",
				argument: call,
				operator: "!"
			};
		} else {
			return call;	
		} 
	}

	
	var operators = {
		"Eq": "==",
		"LtE": "<=",
		"Lt": "<",
		"GtE": ">=",
		"Gt": ">"
	};
	
	if ( !(op.name in operators) ) abort("Unsuported Compare operator: " + op.name);

	var right = transform(node.comparators[0]);

	var call = {
		type: "BinaryExpression",
		left: left,
		right: right,
		operator: operators[op.name]
	};

	return call;
}

function transformExpr(node, ctx) {
	return {
		type: "ExpressionStatement",
		expression: transform(node.value)
	};
}

function transformFor(node, ctx) {
	console.log(node);
	var name = createTempName('idx');
	var ident = {type: "Identifier", name: name};
	var tname = createTempName('target');
	var tident = {type: "Identifier", name: tname};
	var iter = transform(node.iter,ctx);
	var body = ensureStatement(transform(node.body, ctx));

	body.unshift({type: "ExpressionStatement", expression: {
		type: "AssignmentExpression",
		operator: "=",
		left: transform(node.target),
		right: {type: "MemberExpression", object: tident, property: ident, computed: true}
	}});

	return {
		type: "ForStatement",
		test: {type: "Literal", value: false},
		init: {
			"type": "VariableDeclaration",
			"declarations": [
			{
			  "type": "VariableDeclarator",
			  "id": ident,
			  "init": makeLiteral(0)
			},
			{
			  "type": "VariableDeclarator",
			  "id": tident,
			  "init": iter
			}],
			"kind": "var"
		},
		test: {
			type: "BinaryExpression",
			operator: '<',
			left: ident,
			right: {type: "MemberExpression", object: tident, property: {type: "Identifier", name: "length"}}
		},
		update: {
			"type": "UpdateExpression",
			"operator": "++",
			"prefix": true,
			"argument": ident
		},
		body: {type: "BlockStatement", body: body}
	};	
}

function transformFunctionDef(node, ctx) {
	return {
		type: "FunctionDeclaration",
		id: {type: "Identifier", name: node.name.v},
		params: transform(node.args.args),
		body: {type: "BlockStatement", body: ensureStatement(transform(node.body))}
	};
}

function transformIf(node, ctx) {
	return {
		type: "IfStatement",
		test: transform(node.test),
		consequent: {type: "BlockStatement", body: ensureStatement(transform(node.body))},
		alternate: (node.orelse && node.orelse.length > 0) ? {type: "BlockStatement", body: transform(node.orelse)} : undefined 
	};
}

function transformList(node, ctx) {
	var call = {
		type: "CallExpression",
		callee: makeVariableName("__pythonRuntime.objects.list"),
		arguments: transform(node.elts)
	};
	return call;
}

function transformListComp(node, ctx) {
	if ( node.generators.length !== 1 ) alert("Unsuported number of generators");
	var comp = node.generators[0];
	var gen = node.generators[0];
	console.log(gen);
	var listName = createTempName('list');
	var body = [];
	var expr = {
		type: "FunctionExpression",
		params: [{type: 'Identifier', name: listName}],
		body: {type: "BlockStatement", body: body}
	};

	return {
		type: "CallExpression",
		callee: expr,
		arguments: [transform(gen.iter)]
	};
}

function transformModule(node, ctx) {
	return {
		type: "Program",
		body: ensureStatement(transform(node.body))
	};
}

function transformName(node, ctx) {
	if ( node.id.v === 'True' ) return {type: "Literal", value: true, raw: "true"};
	if ( node.id.v === 'False' ) return {type: "Literal", value: false, raw: "false"};
	return {type: "Identifier", name: node.id.v};
}

function transformNum(node, ctx) {
	return makeLiteral(node.n.v);
}

function transformPrint(node, ctx) {
	return {
		type: "CallExpression",
		callee: makeVariableName("console.log"),
		arguments: transform(node.values)
	};
}

function transformReturn(node, ctx) {
	return {
		type: "ReturnStatement",
		argument: node.value ? transform(node.value) : undefined
	};
}

function transformStr(node, ctx) {
	return makeLiteral(node.s.v);
}

function transformTuple(node, ctx) {
	var call = {
		type: "CallExpression",
		callee: makeVariableName("__pythonRuntime.objects.tuple"),
		arguments: transform(node.elts)
	};
	return call;
}

function transformSubscript(node, ctx) {
	console.log(node, ctx);
	//TODO: Do silly pythonic list offset logic
	return {
		type: "MemberExpression",
		computed: true,
		object: transform(node.value),
		property: transform(node.slice.value)
	};
}

function transformPass(node, ctx) {
	return {type: "EmptyStatement"};
}

function transformUnaryOp(node, ctx) {
	var argument = transform(node.operand);

	var fxOps = {
		"Add": "add",
		"Mult": "multiply",
	};

	if ( node.op.name in fxOps  ) {
		var call = {
			type: "CallExpression",
			callee: makeVariableName("__pythonRuntime.ops." + fxOps[node.op.name]),
			arguments: [argument]
		};
		return call;
	}

	var operators = {
		"Not": "!",
	};

	if ( !(node.op.name in operators) ) abort("Unknwon unary operator: " + node.op.name);

	return {
		type: "UnaryExpression",
		argument: argument,
		operator: operators[node.op.name]
	};
	
}

function transformWhile(node, ctx) {
	return {
		type: "WhileStatement",
		test: transform(node.test),
		body: {type: "BlockStatement", body: ensureStatement(transform(node.body))}
	};	
}

module.exports = transform;