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

function transform(node, ctx) {
	//console.log(node.lineno, node.col_offset);
	var result = dispatch(node, ctx);
	result.range = node.range;
	result.loc = node.loc;
	result.str = node.str;
	return result;
}

function dispatch(node, ctx) {
	ctx = ctx || {};
	if ( !node ) {
		console.log("WAT!", new Error().stack);
		throw new Error("What?");
	}
	if ( isArray(node) ) {
		var body = [];
		for ( var i = 0; i < node.length; ++i ) {
			body[i] = transform(node[i], ctx);
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



function makeVariableName(name) {
	var parts = Array.isArray(name) ? name : name.split(/\./g);
	if ( parts.length === 1 ) return ident(name);
	var prop = parts.pop();
	return member(makeVariableName(parts), ident(prop));
}

function transformAttribute(node, ctx) {
	var n = node.attr;
	if ( n._astname ) n = transform(n);
	else n = {type: 'Identifier', name: n.valueOf()};
	return member(transform(node.value), n);
}

function transformAugAssign(node, ctx) {
	//TODO: We need to not inject left into the code twice
	//as it could have side effects.
	var right = transform(node.value);
	var left = transform(node.target);
	var operators = {
		Add: "__pythonRuntime.ops.add",
		Mult: "__pythonRuntime.ops.multiply"
	};

	return {
		type: "AssignmentExpression",
		operator: '=',
		left: left,
		right: {
			type: "CallExpression",
			callee: makeVariableName(operators[node.op.name]),
			arguments: [left, right]
		}
	};
}

function transformAssign(node, ctx) {
	var left = node.targets[0];
	if ( ctx.writeTarget ) {
		left = {type: "MemberExpression", object: ctx.writeTarget, property: left, computed: false};
	}
	var a = createTupleUnpackingAssign(left, transform(node.value), ctx);
	if ( a.length == 1 ) return a[0];
	return {type: "BlockStatement", body: a}; 
}

function transformBinOp(node, ctx) {
	var left = transform(node.left);
	var right = transform(node.right);

	if ( node.op.name === 'FloorDiv' ) {
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

	if ( node.op.name in fxOps  ) {
		var call = {
			type: "CallExpression",
			callee: makeVariableName(fxOps[node.op.name]),
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

	if ( !(node.op.name in operators) ) abort("Unknwon binary operator: " + node.op.name);

	return binOp(left, operators[node.op.name], right);
	
}

function transformBoolOp(node, ctx) {
	var fvals = new Array(node.values.length);
	for ( var i = 0; i < node.values.length; ++i ) {
		fvals[i] = transform(node.values[i]);
	}
	var operators = {
		'And': '&&',
		'Or': '||'
	};

	if ( !(node.op.name in operators ) ) abort("Unknown bool opeartor: " + node.op.name);
	var opstr = operators[node.op.name];

	var result = fvals.pop();
	while ( fvals.length > 0 ) {
		result = binOp(fvals.pop(), opstr, result);
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
					object: transform(node.args[0]),
					property: {type: "Identifier", name: "length"}
				};
			case 'all':
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
					arguments: transform(node.args)
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

	var args = transform(node.args);

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
				value: transform(k.value)
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
		callee: transform(node.func),
		arguments: args
	};
}

function transformClassDef(node, ctx) {
	var body = [];
	var proto = member(ident(node.name), ident('prototype'));
	var nctx = {
		writeTarget: proto,
		inClass: true
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
		consequent: {
			type: "CallExpression",
			callee: member(member(proto, ident('__init__')), ident('apply')),
			arguments: [ident('that'), ident('arguments')]
		}
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
		"kind": "var"
	};
}


function tranformContinue(node, ctx) {
	return {type: "ContinueStatement"};
}


function transformCompare(node, ctx) {
	var left = transform(node.left);
	if ( node.comparators.length !== 1 ) abort("Multiple Comparators Not implemented yet");
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
		"Eq": "===",
		"NotEq": "!==",
		"LtE": "<=",
		"Lt": "<",
		"GtE": ">=",
		"Gt": ">",
		"Is": "===",
		"IsNot": "!=="
	};
	
	if ( !(op.name in operators) ) abort("Unsuported Compare operator: " + op.name);

	var right = transform(node.comparators[0]);

	return binOp(left, operators[op.name], right);
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
		expression: transform(node.value)
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

	return [{type: "ExpressionStatement", expression: {
		type: "AssignmentExpression",
		operator: "=",
		left: target._astname ? transform(target, ctx) : target,
		right: value
	}}];	
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
		test: {type: "Literal", value: false},
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
			"kind": "var"
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
	var iter = transform(node.iter,ctx);
	var body = ensureStatement(transform(node.body, ctx));

	return createForLoop(iident, tident, iter, node.target, body, ctx);
}

function transformFunctionDef(node, ctx) {
	var args = node.args.args.slice(0);
	if  ( ctx.inClass ) {
		//TODO: Make sure it's named self, maybe?
		args.shift();
	}
	var hasAnyArguments = args.length > 0 || node.args.vararg || node.args.kwarg;
	var body = ensureStatement(transform(node.body));
	var premble = [];
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

	body = premble.concat(body);

	var params = transform(args, ctx);

	if ( ctx.writeTarget ) {
		return ensureStatement({
			type: "AssignmentExpression",
			left: {type: "MemberExpression", object: ctx.writeTarget, property: ident(node.name)},
			right: {
				type: "FunctionExpression",
				name: ident(node.name),
				params: params,
				body: {type: "BlockStatement", body: body}
			},
			operator: '='
		});
	} else {
		return {
			type: "FunctionDeclaration",
			id: {type: "Identifier", name: node.name.v},
			params: params,
			body: {type: "BlockStatement", body: body}
		};
	}
}

function transformIf(node, ctx) {
	var body = ensureStatement(transform(node.body));
	return {
		type: "IfStatement",
		test: transform(node.test),
		consequent: {type: "BlockStatement", body: body},
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
	if ( node.generators.length !== 1 ) abort("Unsuported number of generators");
	var comp = node.generators[0];
	var gen = node.generators[0];

	var listName = createTempName('list');
	var iterName = createTempName('iter');
	var body = [];
	var aggrigator = createTempName('result');

	var idxName = createTempName('idx');

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

	for ( var i = 0; i < gen.ifs.length; ++i ) {
		insideBody.push({
			type: "IfStatement",
			test: {type: "UnaryExpression", argument: transform(gen.ifs[i]), operator: "!"},
			consequent: {type: "ContinueStatement"}
		});
	}

	insideBody.push(ensureStatement({
		type: "CallExpression",
		callee: {type: "MemberExpression", object: ident(aggrigator), property: ident('push'), computed: false},
		arguments: [transform(node.elt)]
	}));

	body.push(createForLoop(ident(idxName), ident(iterName), ident(listName), gen.target, insideBody, ctx));

	body.push({
		type: "ReturnStatement",
		argument: ident(aggrigator)
	});

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
	return literal(node.s.valueOf());
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
	//TODO: Do silly pythonic list offset logic
	var val = transform(node.value);
	if ( node.slice.value ) {
		var lu = transform(node.slice.value);
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
			node.slice.lower ? transform(node.slice.lower) : ident('undefined'),
			node.slice.upper ? transform(node.slice.upper) : ident('undefined'),
			node.slice.step ? transform(node.slice.step) : ident('undefined'),
		]
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
		"USub": "-",
		"Invert": "~"
	};

	if ( !(node.op.name in operators) ) abort("Unknown unary operator: " + node.op.name);

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