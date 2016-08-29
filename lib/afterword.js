function wrapAstThing(fx, argpos, debug) {
	argpos = argpos || 2;
	return function(x) {
		var n = arguments[argpos-1];
		var result = fx.apply(undefined, arguments);
		result.range = n.range;
		result.str = n.str;
		result.loc = n.loc;
		if ( debug ) {
			console.log(n);
			console.log(result);
		}
		return result;
	};
}

astForAtom = wrapAstThing(astForAtom);
astForCompOp = wrapAstThing(astForCompOp);
astForSuite = wrapAstThing(astForSuite);
astForExceptClause = wrapAstThing(astForExceptClause);
astForDottedName = wrapAstThing(astForDottedName);
astForDecorator = wrapAstThing(astForDecorator);
astForDecorators = wrapAstThing(astForDecorators);
astForDecorated = wrapAstThing(astForDecorated);
astForWithVar = wrapAstThing(astForWithVar);
astForWithStmt = wrapAstThing(astForWithStmt);
astForExecStmt = wrapAstThing(astForExecStmt);
astForIfStmt = wrapAstThing(astForIfStmt);
astForExprlist = wrapAstThing(astForExprlist);
astForDelStmt = wrapAstThing(astForDelStmt);
astForGlobalStmt = wrapAstThing(astForGlobalStmt);
astForAssertStmt = wrapAstThing(astForAssertStmt);
astForImportStmt = wrapAstThing(astForImportStmt);
astForTestlistComp = wrapAstThing(astForTestlistComp);
astForListcomp = wrapAstThing(astForListcomp);
astForFactor = wrapAstThing(astForFactor);
astForForStmt = wrapAstThing(astForForStmt);
astForTrailer = wrapAstThing(astForTrailer);
astForFlowStmt = wrapAstThing(astForFlowStmt);
astForArguments = wrapAstThing(astForArguments);
astForFuncdef = wrapAstThing(astForFuncdef);
astForClassBases = wrapAstThing(astForClassBases);
astForClassdef = wrapAstThing(astForClassdef);
astForLambdef = wrapAstThing(astForLambdef);
astForComprehension = wrapAstThing(astForComprehension);
astForIterComp = wrapAstThing(astForIterComp);
astForDictComp = wrapAstThing(astForDictComp);
astForGenExpr = wrapAstThing(astForGenExpr);
astForSetComp = wrapAstThing(astForSetComp);
astForWhileStmt = wrapAstThing(astForWhileStmt);
astForAugassign = wrapAstThing(astForAugassign);
astForBinop = wrapAstThing(astForBinop);
astForTestlist = wrapAstThing(astForTestlist);
astForExprStmt = wrapAstThing(astForExprStmt);
astForIfexpr = wrapAstThing(astForIfexpr);
astForExpr = wrapAstThing(astForExpr);
Sk.astFromParse = wrapAstThing(Sk.astFromParse, 1);

Sk.nameForToken = function(v) {
	if ( typeof v === "string" ) return v;
	for ( var name in Sk.Tokenizer.Tokens ) {
		if ( Sk.Tokenizer.Tokens[name] == v ) return name;
	}
	if ( v in Sk.ParseTables.number2symbol ) {
		return Sk.ParseTables.number2symbol[v];
	}

	return '???:' + v;
};

//Sk.python3 = true;
Sk.Parser = Parser;
Sk.builtin.str.prototype.valueOf = function() { return this.v; };
Sk.builtin.str.prototype.toString = function() { return this.v; };

Sk.builtin.SyntaxError = function(str, file, line, ctx, extra) {
	var err = new SyntaxError(str, file, line);
	err.context = ctx;
	err.extra = extra;
	err.line = line;
	return err;
};

Sk.builtin.IndentationError = function(str, file, line, row, extra) {
	var err = new SyntaxError('Indentation Error: ' + str, file, line);
	err.context = [[line, row], [line, row]];
	err.extra = {
	};
	err.line = line;
	return err;
};


module.exports = Sk;