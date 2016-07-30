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


Sk.builtin.str.prototype.valueOf = function() { return this.v; };

module.exports = Sk;