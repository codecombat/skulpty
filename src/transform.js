'use strict';

var isArray = Array.isArray;

function getOpName(op) {
	if (op.prototype._astname) {
		return op.prototype._astname;
	}
	throw new Error("Coudlnt decode operator name for: " + (op.name || op.toString()));
}

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
		var v = f[i];
		if ( isExpression(v) ) {
			f[i] = {type: "ExpressionStatement", expression: v};
		}
	}

	if ( isArray(s) ) return s;
	else return f[0];
}

function ident(n) {
	return {type: "Identifier", name: n.valueOf()};
}

function member(o, p) {
	return {
		type: "MemberExpression",
		object: o,
		property: p,
		computed: false
	};
}

function literal(v) {
	if ( typeof v === 'object' ) v = v.valueOf();

	if ( typeof v === 'number' && (1 / v !== 1 / Math.abs(v)) ) {
		return {type: "UnaryExpression", argument: literal(-v), operator: '-' };
	}

	return {type: "Literal", value: v, raw: JSON.stringify(v)};
}

function binOp(left, op, right) {
	return {
		type: "BinaryExpression",
		left: left,
		right: right,
		operator: op
	};
}

function logicOp(left, op, right) {
	return {
		type: "LogicalExpression",
		left: left,
		right: right,
		operator: op
	};
}

function ternary(cond, a, b) {
	return {
		type: "ConditionalExpression",
		test: cond,
		consequent: a,
		alternate: b
	};
}

function var_(name, init) {
	return {
		type: "VariableDeclaration",
		kind: 'var',
		declarations: [{
			type: "VariableDeclarator",
			id: name,
			init: init ? init : undefined
		}]
	};
}

function transform(node, ctx) {
	//console.log(node.lineno, node.col_offset);
	var result = dispatch(node, ctx);
	if ( node.range ) result.range = [node.range[0], node.range[1]];
	if ( node.loc ) result.loc = node.loc;
	result.str = node.str;
	return result;
}

function dispatch(node, ctx) {
	if ( !ctx.locals ) ctx.locals = Object.create(null);

	if ( !node ) {
		console.log("WAT!", new Error().stack);
		throw new Error("What?");
	}
	if ( isArray(node) ) {
		var body = [];
		for ( var i = 0; i < node.length; ++i ) {
			var r = transform(node[i], ctx);
			if ( isArray(r) ) body.push.apply(body, r);
			else body.push(r);
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
		case 'ClassDef': return transformClassDef(node, ctx);
		case 'Continue': return tranformContinue(node, ctx);
		case 'Compare': return transformCompare(node, ctx);
		case 'Dict': return transformDict(node, ctx);
		case 'Delete': return transformDel(node, ctx);
		case 'Expr': return transformExpr(node, ctx);
		case 'For': return transformFor(node, ctx);
		case 'FunctionDef': return transformFunctionDef(node, ctx);
		case 'GeneratorExp': return transformListComp(node, ctx); //TODO: Make this seperate
		case 'Global': return transformGlobal(node, ctx);
		case 'If': return transformIf(node, ctx);
		case 'Import': return NoOp();
		case 'Lambda': return transformLambda(node, ctx);
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
			throw new Error("Dont know how to transform: " + node._astname);
	}
}

function NoOp() { return []; }



function makeVariableName(name) {
	var parts = Array.isArray(name) ? name : name.split(/\./g);
	if ( parts.length === 1 ) return ident(name);
	var prop = parts.pop();
	return member(makeVariableName(parts), ident(prop));
}

function transformAttribute(node, ctx) {
	var n = node.attr;
	if ( n._astname ) n = transform(n, ctx);
	else n = {type: 'Identifier', name: n.valueOf()};
	return member(transform(node.value, ctx), n);
}

function transformAugAssign(node, ctx) {
	//TODO: We need to not inject left into the code twice
	//as it could have side effects.
	var right = transform(node.value, ctx);
	var left = transform(node.target, ctx);
	var tn = createTempName("left");
	var opName = getOpName(node.op);
	return [
		var_(ident(tn), left),
		ensureStatement({
			type: "AssignmentExpression",
			operator: '=',
			left: left,
			right: createBinOp(left, opName, right)
		})
	];
}

function transformAssign(node, ctx) {

	var results = [];
	for ( var i = 0; i < node.targets.length; ++i ) {
		var left = node.targets[i];
		if ( ctx.writeTarget ) {
			left = member(ctx.writeTarget, transform(left,ctx));
		}
		results.push.apply(results,createTupleUnpackingAssign(left, transform(node.value, ctx), ctx));
	
	}
	if ( results.length == 1 ) return results[0];
	return {type: "BlockStatement", body: results}; 
}

function createBinOp(left, op, right) {

	if ( op === 'FloorDiv' ) {
		return {
			type: "CallExpression",
			callee: makeVariableName('Math.floor'),
			arguments: [{
				type: "BinaryExpression",
				left: left,
				right: right,
				operator: '/'
			}]
		};
	}

	var fxOps = {
		"Add": "__pythonRuntime.ops.add",
		"Mult": "__pythonRuntime.ops.multiply",
		"Pow": "Math.pow"
	};

	if ( op in fxOps  ) {
		var call = {
			type: "CallExpression",
			callee: makeVariableName(fxOps[op]),
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
		"BitOr": "|",
		'BitXor': '^',
		"LShift": "<<",
		"RShift": ">>"

	};

	if ( !(op in operators) ) abort("Unknown binary operator: " + op);

	return binOp(left, operators[op], right);
}

function transformBinOp(node, ctx) {
	var left = transform(node.left, ctx);
	var right = transform(node.right, ctx);
	return createBinOp(left, getOpName(node.op), right);
}

function transformBoolOp(node, ctx) {
	var fvals = new Array(node.values.length);
	for ( var i = 0; i < node.values.length; ++i ) {
		fvals[i] = transform(node.values[i], ctx);
	}
	var opName = getOpName(node.op);
	var operators = {
		'And': '&&',
		'Or': '||'
	};

	if ( !(opName in operators ) ) abort("Unknown bool opeartor: " + opName);
	var opstr = operators[opName];

	var result = fvals.pop();
	while ( fvals.length > 0 ) {
		result = logicOp(fvals.pop(), opstr, result);
	}


	//TODO: Support || as well?
	return result;
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
					object: transform(node.args[0], ctx),
					property: {type: "Identifier", name: "length"}
				};
			case 'all': case 'ord':
			case 'sum': case 'any':
			case 'str': case 'chr':
			case 'ascii': case 'divmod':
			case 'range': case 'enumerate':
			case 'round': case 'filter':
			case 'abs': case 'float':
			case 'int': case 'hex':
			case 'tuple': case  'map':
			case 'bool': case 'max':
			case 'sorted': case 'min':
			case 'list': case 'oct':
			case 'pow': case  'reversed':
			case 'repr':
				return {
					type: 'CallExpression',
					callee: makeVariableName('__pythonRuntime.functions.' + node.func.id.v),
					arguments: transform(node.args, ctx)
				};
			case 'dict':
				var args = [];
				for ( var i = 0; i < node.keywords.length; ++i ) {
					args.push({
						type: "ArrayExpression",
						elements: [
							literal(node.keywords[i].arg.v),
							transform(node.keywords[i].value, ctx)
						]
					});
				}
				return {
					type: "NewExpression",
					callee: makeVariableName('__pythonRuntime.objects.dict'),
					arguments: args
				};

		}
	}

	var args = transform(node.args, ctx);

	if ( node.keywords.length > 0 ) {
		var paramsDict = {
			type: "ObjectExpression",
			properties: [{
				type: "Property",
				key: ident("__kwp"),
				value: literal(true)
			}]
		};

		for ( var i = 0; i < node.keywords.length; ++i ) {
			var k = node.keywords[i];
			paramsDict.properties.push({
				type: "Property",
				key: ident(k.arg.v),
				value: transform(k.value, ctx)
			});
		}

		var extraArg = {
			type: "CallExpression",
			callee: makeVariableName('__pythonRuntime.utils.createParamsObj'),
			arguments: [paramsDict]
		};

		args.push(extraArg);
	}

	return {
		type: "CallExpression",
		callee: transform(node.func, ctx),
		arguments: args
	};
}

function transformClassDef(node, ctx) {
	var body = [];
	var proto = member(ident(node.name), ident('prototype'));
	var nctx = {
		writeTarget: proto,
		inClass: true,
		locals: Object.create(null)
	};

	if ( node.bases.length > 1 ) alert("Multiple base classes not supported.");

	var base = (node.bases.length > 0) ? transform(node.bases[0], ctx) : undefined;

	var ctorBody = [];
	ctorBody.push({
		type: "VariableDeclaration",
		kind: 'var',
		declarations: [{
			type: "VariableDeclarator",
			id: ident('that'),
			init: {type: "ThisExpression"}
		}]
	});

	ctorBody.push({
		type: "IfStatement",
		test: {
			type:"UnaryExpression",
			argument: binOp(ident('that'), "instanceof", ident(node.name)),
			operator: "!"
		},
		consequent: ensureStatement({
			type: "AssignmentExpression",
			left: ident('that'),
			right: {
				type:  "CallExpression",
				callee: makeVariableName('Object.create'),
				arguments: [ proto ]
			},
			operator: '='
		})
	});

	ctorBody.push({
		type: "IfStatement",
		test: {
			type: "CallExpression",
			callee: member(proto, ident('hasOwnProperty')),
			arguments: [literal('__init__')]
		},
		consequent: ensureStatement({
			type: "CallExpression",
			callee: member(member(proto, ident('__init__')), ident('apply')),
			arguments: [ident('that'), ident('arguments')]
		})
	});

	if ( base ) {
		ctorBody.push(ensureStatement({
			type: "CallExpression",
			callee: {
				type: "MemberExpression",
				object: base,
				property: ident('apply'),
				computed: false
			},
			arguments: [ident('that'), ident('arguments')]
		}));
	}

	ctorBody.push({
		type: "ReturnStatement",
		argument: ident('that')
	});


	body.push({
		type: "FunctionDeclaration",
		id: ident(node.name),
		params: [],
		body: {type: "BlockStatement", body:ctorBody}
	});

	if ( base ) {
		body.push({
			type: "AssignmentExpression",
			left: proto,
			right: {
				type:  "CallExpression",
				callee: makeVariableName('Object.create'),
				arguments: [ member(base, ident('prototype')) ]
			},
			operator: "="
		});
	}

	body = body.concat(transform(node.body, nctx));

	body.push({
		type: "ReturnStatement",
		argument: ident(node.name)
	});

	return {
		"type": "VariableDeclaration",
		"declarations": [
		{
		  "type": "VariableDeclarator",
		  "id": ident(node.name),
		  "init": {
		  	type: "CallExpression",
		  	callee: {
		  		type: "FunctionExpression",
		  		params: [],
		  		body: {type: "BlockStatement", body: ensureStatement(body)}
		  	},
		  	arguments: []
		  }
		}],
		"kind": ctx.varType || 'var'
	};
}


function tranformContinue(node, ctx) {
	return {type: "ContinueStatement"};
}

function makeCop(left, op, right) {

	var fxOps = {
		"In_": "in",
		"In": "in",
		"NotIn": "in"
	};
	var opName = getOpName(op);
	if ( opName in fxOps  ) {
		var call = {
			type: "CallExpression",
			callee: makeVariableName("__pythonRuntime.ops." + fxOps[opName]),
			arguments: [left, right]
		};

		if ( opName == "NotIn" ) {
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
		"Eq": "===",
		"NotEq": "!==",
		"LtE": "<=",
		"Lt": "<",
		"GtE": ">=",
		"Gt": ">",
		"Is": "===",
		"IsNot": "!=="
	};
	
	if ( !(opName in operators) ) abort("Unsuported Compare operator: " + opName);
	return binOp(left, operators[opName], right);
}

function transformCompare(node, ctx) {
	var left = transform(node.left, ctx);
	var result;

	for ( var i = 0; i < node.comparators.length; ++i ) {
		var right = transform(node.comparators[i], ctx);
		var cop = makeCop(left, node.ops[i], right);
		if ( result ) {
			result = logicOp(result, '&&', cop);
		} else {
			result = cop;
		}
		left = right;
	}

	

	return result;
	
}

function transformDel(node, ctx) {
	var result = [];
	for ( var i = 0; i < node.targets.length; ++i ) {
		var st = node.targets[i];
		var partial = transform(st, ctx);
		result.push({
			type: "AssignmentExpression",
			operator: "=",
			left: partial,
			right: {
				type: "UnaryExpression",
				argument: literal(0),
				operator: 'void',
				prefix: true
			}
		});
	}
	return ensureStatement({
		type: "SequenceExpression",
		expressions: result
	});
}

function transformDict(node, ctx) {
	var args = [];
	for ( var i = 0; i < node.keys.length; ++i ) {
		args.push({
			type: "ArrayExpression",
			elements: [
				transform(node.keys[i], ctx),
				transform(node.values[i], ctx)
			]
		});
	}
	return {
		type: "NewExpression",
		callee: makeVariableName("__pythonRuntime.objects.dict"),
		arguments: args
	};
}

function transformExpr(node, ctx) {
	return {
		type: "ExpressionStatement",
		expression: transform(node.value, ctx)
	};
}

function assignPossiblyWithDeclaration(target, value, ctx) {
	var left = target._astname ? transform(target, ctx) : target;
	var varible;

	if ( left.type === "Identifier" ) varible = left.name;

	if ( !varible || !ctx || !ctx.locals || ctx.locals[varible] ) {
		return {type: "ExpressionStatement", expression: {
			type: "AssignmentExpression",
			operator: "=",
			left: left,
			right: value
		}};
	}

	ctx.locals[varible] = true;

	return {
		type: "VariableDeclaration",
		declarations: [{
			type: "VariableDeclarator",
			id: left,
			init: value
		}],
		kind: ctx.varType || 'var'
	};
}

function createTupleUnpackingAssign(target, value, ctx) {

	if ( target._astname === 'Tuple' ) {
		var result = [];
		var tn = createTempName("right");
		result.push({
			type: "VariableDeclaration",
			kind: "var",
			declarations: [{
				type: "VariableDeclarator",
				id: ident(tn),
				init: value
			}]
		});
		for ( var i = 0; i < target.elts.length; ++i ) {
			result.push.apply(result,createTupleUnpackingAssign(
				target.elts[i],
				{type: "MemberExpression", object: ident(tn), property: literal(i),  computed: true}
			,ctx));
		}
		return result;
	}

	return [assignPossiblyWithDeclaration(target, value, ctx)];
}

function createForLoop(iident, tident, iter, target, body, ctx) {

	body = createTupleUnpackingAssign(
		target, 
		{type: "MemberExpression", object: tident, property: iident, computed: true},
		ctx
	).concat(body);

	var riter = ternary(
		{type: "CallExpression", callee: makeVariableName("Array.isArray"), arguments:[iter]},
		iter,
		{type: "CallExpression", callee: makeVariableName("Object.keys"), arguments:[iter]}
	);

	return {
		type: "ForStatement",
		init: {
			"type": "VariableDeclaration",
			"declarations": [
			{
			  "type": "VariableDeclarator",
			  "id": iident,
			  "init": literal(0)
			},
			{
			  "type": "VariableDeclarator",
			  "id": tident,
			  "init": riter
			}],
			"kind": ctx.varType
		},
		test: binOp(iident, '<', {
			type: "MemberExpression", object: tident, property: {type: "Identifier", name: "length"}
		}),
		update: {
			"type": "UpdateExpression",
			"operator": "++",
			"prefix": true,
			"argument": iident
		},
		body: {type: "BlockStatement", body: body}
	};
}

function transformFor(node, ctx) {
	var name = createTempName('idx');
	var iident = ident(name);
	var tname = createTempName('target');
	var tident = {type: "Identifier", name: tname};
	var iter = transform(node.iter, ctx);
	var body = ensureStatement(transform(node.body, ctx));

	if ( node.orelse && node.orelse.length > 0 ) abort("else: for-else statement unsupported.");
	return createForLoop(iident, tident, iter, node.target, body, ctx);
}

function prepareFunctionBody(node, ctx) {
	var args = node.args.args.slice(0);
	if  ( ctx.inClass ) {
		//TODO: Make sure it's named self, maybe?
		args.shift();
	}
	var hasAnyArguments = args.length > 0 || node.args.vararg || node.args.kwarg;
	var nctx = {
		locals: Object.create(null),
		varType: ctx.varType
	};
	var body = ensureStatement(transform(node.body, nctx));
	var premble = [];

	if ( ctx.inClass ) {
		premble.push({
			"type": "VariableDeclaration",
			"declarations": [{
				"type": "VariableDeclarator",
				"id": ident('self'),
				"init": {type: "ThisExpression"}
			}],
			"kind": "var"
		});
	}

	if ( hasAnyArguments ) {
		
		var hasParams = createTempName('hasParams');
		var param0 = createTempName('param0');
		var realArgCount = createTempName('realArgCount');
		var argLen = makeVariableName('arguments.length');
		var argN = {type: "MemberExpression", object: ident('arguments'), property: binOp(argLen, '-', literal(1)), computed: true};
		var argNKeywords = {type: "MemberExpression", object: argN, property: ident('keywords'), computed: false};

		premble.push({
			"type": "VariableDeclaration",
			"declarations": [
			{
			  "type": "VariableDeclarator",
			  "id": ident(hasParams),
			  "init": logicOp(binOp(argLen, '>', literal(0)), '&&', logicOp(argN, '&&', argNKeywords))
			}],
			"kind":  "var"
		});

		var main = [];
		main.push({
			"type": "VariableDeclaration",
			"declarations": [{
				"type": "VariableDeclarator",
				"id": ident(param0),
				"init": ternary(ident(hasParams), argNKeywords, {type: "ObjectExpression", properties: []})
			},{
				"type": "VariableDeclarator",
				"id": ident(realArgCount),
				"init": binOp(argLen, '-', ternary(ident(hasParams), literal(1), literal(0)))
			}],
			"kind": "var"
		});

		for ( var i = 0; i < args.length; ++i ) {
			var a = node.args.args[i];
			var didx = i - (node.args.args.length - node.args.defaults.length);
			var def = didx >= 0 ? transform(node.args.defaults[didx], ctx) : ident('undefined');

			main.push({
				type: "IfStatement",
				test: binOp(ident(realArgCount), '<', literal(i+1)),
				consequent: ensureStatement({
					type: "AssignmentExpression",
					operator: "=",
					left: ident(a.id),
					right: ternary(
						binOp(literal(a.id), 'in', ident(param0)),
						{type: "MemberExpression", object: ident(param0), property: ident(a.id), computed: false},
						def
					)
				})
			});
		}

		if ( node.args.vararg ) {
			main.push({
				"type": "VariableDeclaration",
				"declarations": [{
					"type": "VariableDeclarator",
					"id": ident(node.args.vararg),
					"init": {
						type: "CallExpression",
						callee: makeVariableName("Array.prototype.slice.call"),
						arguments: [ident('arguments'), literal(node.args.args.length), hasAnyArguments ? ident(realArgCount) : undefined]
					}
				}],
				"kind": "var"
			});
		}

		if ( node.args.kwarg ) {
			for ( var i = 0; i < node.args.args.length; ++i ) {
				main.push(ensureStatement({
					type: "UnaryExpression",
					operator: "delete",
					argument: {
						type: "MemberExpression",
						object: ident(param0),
						property: ident(node.args.args[i].id),
						computed: false
					}
				}));
			}
			main.push({
				"type": "VariableDeclaration",
				"declarations": [{
					"type": "VariableDeclarator",
					"id": ident(node.args.kwarg),
					"init": ident(param0)
				}],
				"kind": "var"
			});
		}

		premble = premble.concat(main); //TODO: If we dont have defauts, we can guard this with __hasParams	
	}


	body = premble.concat(body);
	var params = transform(args, ctx);
	return {
		premble: premble,
		body: body,
		params: params
	};

}

function transformFunctionDef(node, ctx) {
	var data = prepareFunctionBody(node, ctx);



	if ( ctx.writeTarget ) {
		return ensureStatement({
			type: "AssignmentExpression",
			left: {type: "MemberExpression", object: ctx.writeTarget, property: ident(node.name)},
			right: {
				type: "FunctionExpression",
				name: ident(node.name),
				params: data.params,
				body: {type: "BlockStatement", body: data.body}
			},
			operator: '='
		});
	} else {
		return {
			type: "FunctionDeclaration",
			id: {type: "Identifier", name: node.name.v},
			params: data.params,
			body: {type: "BlockStatement", body: data.body}
		};
	}
}

function transformGlobal(node, ctx) {
	for ( var i = 0; i < node.names.length; ++i ) {
		ctx.locals[node.names[i].v] = true;
	}
	return [];
}

function transformIf(node, ctx) {
	var body = ensureStatement(transform(node.body, ctx));
	return {
		type: "IfStatement",
		test: transform(node.test, ctx),
		consequent: {type: "BlockStatement", body: body},
		alternate: (node.orelse && node.orelse.length > 0) ? {type: "BlockStatement", body: ensureStatement(transform(node.orelse, ctx))} : undefined
	};
}

function transformLambda(node, ctx) {
	var data = prepareFunctionBody(node, ctx);
	
	//TODO: This is pretty sketchy.
	var last = data.body[data.body.length - 1];
	data.body[data.body.length - 1] = {type: "ReturnStatement", argument: last.expression};

	return {
		type: "FunctionExpression",
		params: data.params,
		body: {type: "BlockStatement", body: data.body}
	};
}

function transformList(node, ctx) {
	var call = {
		type: "CallExpression",
		callee: makeVariableName("__pythonRuntime.objects.list"),
		arguments: transform(node.elts, ctx)
	};
	return call;
}

function transformListComp(node, ctx) {	
	var body = [];
	var aggrigator = createTempName('result');

	body.push({
		"type": "VariableDeclaration",
		"declarations": [{
			"type": "VariableDeclarator",
			"id": ident(aggrigator),
			"init": {
				type: "NewExpression",
				callee: makeVariableName('__pythonRuntime.objects.list'),
				arguments: []
			}
		}],
		"kind": "var"
	});

	var insideBody = [];

	insideBody.push(ensureStatement({
		type: "CallExpression",
		callee: {type: "MemberExpression", object: ident(aggrigator), property: ident('push'), computed: false},
		arguments: [transform(node.elt, ctx)]
	}));

	//if ( node.generators.length !== 1 ) abort("Unsuported number of generators");
	var gen = node.generators[0];

	for ( var g = node.generators.length - 1; g >= 0; --g ) {
		var idxName = createTempName('idx');
		var listName = createTempName("list" + g);
		var iterName = createTempName('iter');
		var gen = node.generators[g];
		for ( var i = 0; i < gen.ifs.length; ++i ) {
			insideBody.unshift({
				type: "IfStatement",
				test: {type: "UnaryExpression", argument: transform(gen.ifs[i], ctx), operator: "!"},
				consequent: {type: "ContinueStatement"}
			});
		}

		insideBody = [
			{
				type: "VariableDeclaration",
				kind: "var",
				declarations: [{
					type: "VariableDeclarator",
					id: ident(listName),
					init: transform(gen.iter, ctx)
				}]
			},
			createForLoop(ident(idxName), ident(iterName), ident(listName), gen.target, insideBody, ctx)
		];
	}

	body.push.apply(body, insideBody);
	body.push({
		type: "ReturnStatement",
		argument: ident(aggrigator)
	});

	var expr = {
		type: "FunctionExpression",
		params: [],
		body: {type: "BlockStatement", body: body}
	};

	return {
		type: "CallExpression",
		callee: expr,
		arguments: []
	};
}

function transformModule(node, ctx) {
	return {
		type: "Program",
		body: ensureStatement(transform(node.body, ctx))
	};
}

function transformName(node, ctx) {
	if ( node.id.v === 'True' ) return {type: "Literal", value: true, raw: "true"};
	if ( node.id.v === 'False' ) return {type: "Literal", value: false, raw: "false"};
	if ( node.id.v === 'None' ) return {type: "Literal", value: null, raw: "null"};

	if ( node.id.v === 'random' ) return makeVariableName('__pythonRuntime.imports.random');
	return ident(node.id);
}

function transformNum(node, ctx) {
	return literal(node.n);
}

function transformPrint(node, ctx) {
	return {
		type: "CallExpression",
		callee: makeVariableName("console.log"),
		arguments: transform(node.values, ctx)
	};
}

function transformReturn(node, ctx) {
	return {
		type: "ReturnStatement",
		argument: node.value ? transform(node.value, ctx) : undefined
	};
}

function transformStr(node, ctx) {
	return literal(node.s.valueOf());
}

function transformTuple(node, ctx) {
	var call = {
		type: "CallExpression",
		callee: makeVariableName("__pythonRuntime.objects.tuple"),
		arguments: transform(node.elts, ctx)
	};
	return call;
}

function transformSubscript(node, ctx) {
	//TODO: Do silly pythonic list offset logic
	var val = transform(node.value, ctx);
	if ( node.slice.value ) {
		var lu = transform(node.slice.value, ctx);
		lu = {
			type: "CallExpression",
			callee: makeVariableName("__pythonRuntime.ops.subscriptIndex"),
			arguments: [val, lu]
		};
		return {
			type: "MemberExpression",
			computed: true,
			object: val,
			property: lu
		};
	}

	return {
		type: "CallExpression",
		callee: makeVariableName('__pythonRuntime.internal.slice'),
		arguments:[
			val,
			node.slice.lower ? transform(node.slice.lower, ctx) : ident('undefined'),
			node.slice.upper ? transform(node.slice.upper, ctx) : ident('undefined'),
			node.slice.step ? transform(node.slice.step, ctx) : ident('undefined'),
		]
	};
}

function transformPass(node, ctx) {
	return {type: "EmptyStatement"};
}

function transformUnaryOp(node, ctx) {
	var argument = transform(node.operand, ctx);

	var fxOps = {
		"Add": "add",
		"Mult": "multiply",
	};
	var opName = getOpName(node.op);

	if ( opName in fxOps  ) {
		var call = {
			type: "CallExpression",
			callee: makeVariableName("__pythonRuntime.ops." + fxOps[opName]),
			arguments: [argument]
		};
		return call;
	}

	var operators = {
		"Not": "!",
		"USub": "-",
		"Invert": "~"
	};

	if ( !(opName in operators) ) abort("Unknown unary operator: " + opName);

	return {
		type: "UnaryExpression",
		argument: argument,
		operator: operators[opName]
	};
	
}

function transformWhile(node, ctx) {
	if ( node.orelse && node.orelse.length > 0 ) abort("else: statement for while unsupported.");
	return {
		type: "WhileStatement",
		test: transform(node.test, ctx),
		body: {type: "BlockStatement", body: ensureStatement(transform(node.body, ctx))}
	};	
}

module.exports = transform;
