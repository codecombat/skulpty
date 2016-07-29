var goog = {
	global: global
};

var COMPILED = false;

goog.exportSymbol = function() {};
goog.require = function() {};

goog.inherits = function(childCtor, parentCtor) {
  if ( !parentCtor ) throw new Error("Cant inherit from undefined?");
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
};

goog.asserts = {
	assert: function() {}
};

var Sk = Sk || {};

Sk.builtin = Sk.builtin  ||  {};

Sk.builtin.bool = Boolean;
Sk.builtin.int_ = function Int(x) {
  this.v = x;
};

Sk.builtin.int_.prototype.threshold$ = Infinity;
Sk.builtin.int_.prototype.valueOf = function() { return this.v.valueOf(); };


Sk.builtin.float_ = Number;
Sk.builtin.long = Number;