
/* ---- /Users/rob/skulpty/lib/preamble.js ---- */ 

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


/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/env.js ---- */ 

/**
 * Base namespace for Skulpt. This is the only symbol that Skulpt adds to the
 * global namespace. Other user accessible symbols are noted and described
 * below.
 */

var Sk = Sk || {}; //jshint ignore:line

/**
 *
 * Set various customizable parts of Skulpt.
 *
 * output: Replacable output redirection (called from print, etc.).
 * read: Replacable function to load modules with (called via import, etc.)
 * sysargv: Setable to emulate arguments to the script. Should be an array of JS
 * strings.
 * syspath: Setable to emulate PYTHONPATH environment variable (for finding
 * modules). Should be an array of JS strings.
 *
 * Any variables that aren't set will be left alone.
 */
Sk.configure = function (options) {
    "use strict";
    Sk.output = options["output"] || Sk.output;
    goog.asserts.assert(typeof Sk.output === "function");

    Sk.debugout = options["debugout"] || Sk.debugout;
    goog.asserts.assert(typeof Sk.debugout === "function");

    Sk.uncaughtException = options["uncaughtException"] || Sk.uncaughtException;
    goog.asserts.assert(typeof Sk.uncaughtException === "function");

    Sk.read = options["read"] || Sk.read;
    goog.asserts.assert(typeof Sk.read === "function");

    Sk.timeoutMsg = options["timeoutMsg"] || Sk.timeoutMsg;
    goog.asserts.assert(typeof Sk.timeoutMsg === "function");
    goog.exportSymbol("Sk.timeoutMsg", Sk.timeoutMsg);

    Sk.sysargv = options["sysargv"] || Sk.sysargv;
    goog.asserts.assert(goog.isArrayLike(Sk.sysargv));

    Sk.python3 = options["python3"] || Sk.python3;
    goog.asserts.assert(typeof Sk.python3 === "boolean");

    Sk.imageProxy = options["imageProxy"] || "http://localhost:8080/320x";
    goog.asserts.assert(typeof Sk.imageProxy === "string");

    Sk.inputfun = options["inputfun"] || Sk.inputfun;
    goog.asserts.assert(typeof Sk.inputfun === "function");
    
    Sk.retainGlobals = options["retainglobals"] || false;
    goog.asserts.assert(typeof Sk.retainGlobals === "boolean");

    Sk.debugging = options["debugging"] || false;
    goog.asserts.assert(typeof Sk.debugging === "boolean");

    Sk.breakpoints = options["breakpoints"] || function() { return true; };
    goog.asserts.assert(typeof Sk.breakpoints === "function");

    Sk.setTimeout = options["setTimeout"];
    if (Sk.setTimeout === undefined) {
        if (typeof setTimeout === "function") {
            Sk.setTimeout = function(func, delay) { setTimeout(func, delay); };
        } else {
            Sk.setTimeout = function(func, delay) { func(); };
        }
    }
    goog.asserts.assert(typeof Sk.setTimeout === "function");

    if ("execLimit" in options) {
        Sk.execLimit = options["execLimit"];
    }

    if ("yieldLimit" in options) {
        Sk.yieldLimit = options["yieldLimit"];
    }

    if (options["syspath"]) {
        Sk.syspath = options["syspath"];
        goog.asserts.assert(goog.isArrayLike(Sk.syspath));
        // assume that if we're changing syspath we want to force reimports.
        // not sure how valid this is, perhaps a separate api for that.
        Sk.realsyspath = undefined;
        Sk.sysmodules = new Sk.builtin.dict([]);
    }

    Sk.misceval.softspace_ = false;
};
goog.exportSymbol("Sk.configure", Sk.configure);

/*
 * Replaceable handler for uncaught exceptions
 */
Sk.uncaughtException = function(err) {
    throw err;
};
goog.exportSymbol("Sk.uncaughtException", Sk.uncaughtException);

/*
 *	Replaceable message for message timeouts
 */
Sk.timeoutMsg = function () {
    return "Program exceeded run time limit.";
};
goog.exportSymbol("Sk.timeoutMsg", Sk.timeoutMsg);

/*
 *  Hard execution timeout, throws an error. Set to null to disable
 */
Sk.execLimit = Number.POSITIVE_INFINITY;

/*
 *  Soft execution timeout, returns a Suspension. Set to null to disable
 */
Sk.yieldLimit = Number.POSITIVE_INFINITY;

/*
 * Replacable output redirection (called from print, etc).
 */
Sk.output = function (x) {
};

/*
 * Replacable function to load modules with (called via import, etc.)
 * todo; this should be an async api
 */
Sk.read = function (x) {
    throw "Sk.read has not been implemented";
};

/*
 * Setable to emulate arguments to the script. Should be array of JS strings.
 */
Sk.sysargv = [];

// lame function for sys module
Sk.getSysArgv = function () {
    return Sk.sysargv;
};
goog.exportSymbol("Sk.getSysArgv", Sk.getSysArgv);


/**
 * Setable to emulate PYTHONPATH environment variable (for finding modules).
 * Should be an array of JS strings.
 */
Sk.syspath = [];

Sk.inBrowser = goog.global["document"] !== undefined;

/**
 * Internal function used for debug output.
 * @param {...} args
 */
Sk.debugout = function (args) {
};

(function () {
    // set up some sane defaults based on availability
    if (goog.global["write"] !== undefined) {
        Sk.output = goog.global["write"];
    } else if (goog.global["console"] !== undefined && goog.global["console"]["log"] !== undefined) {
        Sk.output = function (x) {
            goog.global["console"]["log"](x);
        };
    } else if (goog.global["print"] !== undefined) {
        Sk.output = goog.global["print"];
    }
    if (goog.global["print"] !== undefined) {
        Sk.debugout = goog.global["print"];
    }
}());

// override for closure to load stuff from the command line.
if (!Sk.inBrowser) {
    goog.global.CLOSURE_IMPORT_SCRIPT = function (src) {
        goog.global["eval"](goog.global["read"]("support/closure-library/closure/goog/" + src));
        return true;
    };
}

Sk.python3 = false;
Sk.inputfun = function (args) {
    return window.prompt(args);
};

goog.exportSymbol("Sk.python3", Sk.python3);
goog.exportSymbol("Sk.inputfun", Sk.inputfun);
goog.require("goog.asserts");



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/type.js ---- */ 

if(Sk.builtin === undefined) {
    Sk.builtin = {};
}

/**
 * Maps Python dunder names to the Skulpt Javascript function names that
 * implement them.
 *
 * Note: __add__, __mul__, and __rmul__ can be used for either numeric or
 * sequence types. Here, they default to the numeric versions (i.e. nb$add,
 * nb$multiply, and nb$reflected_multiply). This works because Sk.abstr.binary_op_
 * checks for the numeric shortcuts and not the sequence shortcuts when computing
 * a binary operation.
 *
 * Because many of these functions are used in contexts in which Skulpt does not
 * [yet] handle suspensions, the assumption is that they must not suspend. However,
 * some of these built-in functions are acquiring 'canSuspend' arguments to signal
 * where this is not the case. These need to be spliced out of the argument list before
 * it is passed to python. Array values in this map contain [dunderName, argumentIdx],
 * where argumentIdx specifies the index of the 'canSuspend' boolean argument.
 *
 * @type {Object}
 */
Sk.dunderToSkulpt = {
    "__eq__": "ob$eq",
    "__ne__": "ob$ne",
    "__lt__": "ob$lt",
    "__le__": "ob$le",
    "__gt__": "ob$gt",
    "__ge__": "ob$ge",
    "__hash__": "tp$hash",
    "__abs__": "nb$abs",
    "__neg__": "nb$negative",
    "__pos__": "nb$positive",
    "__int__": "nb$int_",
    "__long__": "nb$lng",
    "__float__": "nb$float_",
    "__add__": "nb$add",
    "__radd__": "nb$reflected_add",
    "__sub__": "nb$subtract",
    "__rsub__": "nb$reflected_subtract",
    "__mul__": "nb$multiply",
    "__rmul__": "nb$reflected_multiply",
    "__div__": "nb$divide",
    "__rdiv__": "nb$reflected_divide",
    "__floordiv__": "nb$floor_divide",
    "__rfloordiv__": "nb$reflected_floor_divide",
    "__mod__": "nb$remainder",
    "__rmod__": "nb$reflected_remainder",
    "__divmod__": "nb$divmod",
    "__rdivmod__": "nb$reflected_divmod",
    "__pow__": "nb$power",
    "__rpow__": "nb$reflected_power",
    "__contains__": "sq$contains",
    "__len__": ["sq$length", 0]
};

/**
 *
 * @constructor
 *
 * @param {*} name name or object to get type of, if only one arg
 *
 * @param {Sk.builtin.tuple=} bases
 *
 * @param {Object=} dict
 *
 *
 * This type represents the type of `type'. *Calling* an instance of
 * this builtin type named "type" creates class objects. The resulting
 * class objects will have various tp$xyz attributes on them that allow
 * for the various operations on that object.
 *
 * calling the type or calling an instance of the type? or both?
 */
Sk.builtin.type = function (name, bases, dict) {
    var mro;
    var obj;
    var klass;
    var v;
    if (bases === undefined && dict === undefined) {
        // 1 arg version of type()
        // the argument is an object, not a name and returns a type object
        obj = name;
        return obj.ob$type;
    } else {

        // argument dict must be of type dict
        if(dict.tp$name !== "dict") {
            throw new Sk.builtin.TypeError("type() argument 3 must be dict, not " + Sk.abstr.typeName(dict));
        }

        // checks if name must be string
        if(!Sk.builtin.checkString(name)) {
            throw new Sk.builtin.TypeError("type() argument 1 must be str, not " + Sk.abstr.typeName(name));
        }

        // argument bases must be of type tuple
        if(bases.tp$name !== "tuple") {
            throw new Sk.builtin.TypeError("type() argument 2 must be tuple, not " + Sk.abstr.typeName(bases));
        }

        // type building version of type

        // dict is the result of running the classes code object
        // (basically the dict of functions). those become the prototype
        // object of the class).
        /**
        * @constructor
        */
        klass = function (kwdict, varargseq, kws, args, canSuspend) {
            var init;
            var self = this;
            var s;
            var args_copy;
            if (!(this instanceof klass)) {
                return new klass(kwdict, varargseq, kws, args, canSuspend);
            }

            args = args || [];
            self["$d"] = new Sk.builtin.dict([]);

            if (klass.prototype.tp$base !== undefined) {
                if (klass.prototype.tp$base.sk$klass) {
                    klass.prototype.tp$base.call(this, kwdict, varargseq, kws, args.slice(), canSuspend);
                } else {
                    // Call super constructor if subclass of a builtin
                    args_copy = args.slice();
                    args_copy.unshift(klass, this);
                    Sk.abstr.superConstructor.apply(undefined, args_copy);
                }
            }

            init = Sk.builtin.type.typeLookup(self.ob$type, "__init__");
            if (init !== undefined) {
                // return should be None or throw a TypeError otherwise
                args.unshift(self);
                s = Sk.misceval.applyOrSuspend(init, kwdict, varargseq, kws, args);

                return (function doSusp(s) {
                    if (s instanceof Sk.misceval.Suspension) {
                        // TODO I (Meredydd) don't know whether we are ever called
                        // from anywhere except Sk.misceval.applyOrSuspend().
                        // If we're not, we don't need a canSuspend parameter at all.
                        if (canSuspend) {
                            return new Sk.misceval.Suspension(doSusp, s);
                        } else {
                            return Sk.misceval.retryOptionalSuspensionOrThrow(s);
                        }
                    } else {
                        return self;
                    }
                })(s);
            }

            return self;
        };

        var _name = Sk.ffi.remapToJs(name); // unwrap name string to js for latter use

        var inheritsFromObject = false, inheritsBuiltin = false;

        if (bases.v.length === 0 && Sk.python3) {
            // new style class, inherits from object by default
            inheritsFromObject = true;
            Sk.abstr.setUpInheritance(_name, klass, Sk.builtin.object);
        }

        var parent, it, firstAncestor, builtin_bases = [];
        // Set up inheritance from any builtins
        for (it = bases.tp$iter(), parent = it.tp$iternext(); parent !== undefined; parent = it.tp$iternext()) {
            if (firstAncestor === undefined) {
                firstAncestor = parent;
            }
            if (parent.prototype instanceof Sk.builtin.object || parent === Sk.builtin.object) {

                while (parent.sk$klass && parent.prototype.tp$base) {
                    parent = parent.prototype.tp$base;
                }

                if (!parent.sk$klass && builtin_bases.indexOf(parent) < 0) {
                    builtin_bases.push(parent);
                }

                // This class inherits from Sk.builtin.object at some level
                inheritsFromObject = true;
            }
        }

        if (builtin_bases.length > 1) {
            throw new Sk.builtin.TypeError("Multiple inheritance with more than one builtin type is unsupported");
        }

        // Javascript does not support multiple inheritance, so only the first
        // base (if any) will directly inherit in Javascript
        if (firstAncestor !== undefined) {
            goog.inherits(klass, firstAncestor);

            if (firstAncestor.prototype instanceof Sk.builtin.object || firstAncestor === Sk.builtin.object) {
                klass.prototype.tp$base = firstAncestor;
            }
        }

        klass.prototype.tp$name = _name;
        klass.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(_name, klass);

        if (!inheritsFromObject) {
            // old style class, does not inherit from object
            klass.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
            klass.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
        }

        // set __module__ if not present (required by direct type(name, bases, dict) calls)
        var module_lk = new Sk.builtin.str("__module__");
        if(dict.mp$lookup(module_lk) === undefined) {
            dict.mp$ass_subscript(module_lk, Sk.globals["__name__"]);
        }

        // copy properties into our klass object
        // uses python iter methods
        var k;
        for (it = dict.tp$iter(), k = it.tp$iternext(); k !== undefined; k = it.tp$iternext()) {
            v = dict.mp$subscript(k);
            if (v === undefined) {
                v = null;
            }
            klass.prototype[k.v] = v;
            klass[k.v] = v;
        }

        klass["__class__"] = klass;
        klass["__name__"] = name;
        klass.sk$klass = true;
        klass.prototype.tp$descr_get = function () {
            goog.asserts.fail("in type tp$descr_get");
        };
        klass.prototype["$r"] = function () {
            var cname;
            var mod;
            // TODO use Sk.abstr.gattr() here so __repr__ can be dynamically provided (eg by __getattr__())
            var reprf = this.tp$getattr("__repr__");
            if (reprf !== undefined && reprf.im_func !== Sk.builtin.object.prototype["__repr__"]) {
                return Sk.misceval.apply(reprf, undefined, undefined, undefined, []);
            }

            if ((klass.prototype.tp$base !== undefined) &&
                (klass.prototype.tp$base !== Sk.builtin.object) &&
                (klass.prototype.tp$base.prototype["$r"] !== undefined)) {
                // If subclass of a builtin which is not object, use that class' repr
                return klass.prototype.tp$base.prototype["$r"].call(this);
            } else {
                // Else, use default repr for a user-defined class instance
                mod = dict.mp$subscript(module_lk); // lookup __module__
                cname = "";
                if (mod) {
                    cname = mod.v + ".";
                }
                return new Sk.builtin.str("<" + cname + _name + " object>");
            }
        };
        klass.prototype.tp$str = function () {
            // TODO use Sk.abstr.gattr() here so __str__ can be dynamically provided (eg by __getattr__())
            var strf = this.tp$getattr("__str__");
            if (strf !== undefined && strf.im_func !== Sk.builtin.object.prototype["__str__"]) {
                return Sk.misceval.apply(strf, undefined, undefined, undefined, []);
            }
            if ((klass.prototype.tp$base !== undefined) &&
                (klass.prototype.tp$base !== Sk.builtin.object) &&
                (klass.prototype.tp$base.prototype.tp$str !== undefined)) {
                // If subclass of a builtin which is not object, use that class' repr
                return klass.prototype.tp$base.prototype.tp$str.call(this);
            }
            return this["$r"]();
        };
        klass.prototype.tp$length = function (canSuspend) {
            var r = Sk.misceval.chain(Sk.abstr.gattr(this, "__len__", canSuspend), function(lenf) {
                return Sk.misceval.applyOrSuspend(lenf, undefined, undefined, undefined, []);
            });
            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        };
        klass.prototype.tp$call = function (args, kw) {
            return Sk.misceval.chain(Sk.abstr.gattr(this, "__call__", true), function(callf) {
                return Sk.misceval.applyOrSuspend(callf, undefined, undefined, kw, args);
            });
        };
        klass.prototype.tp$iter = function () {
            var iterf = Sk.abstr.gattr(this, "__iter__", false);
            return Sk.misceval.callsim(iterf);
        };
        klass.prototype.tp$iternext = function (canSuspend) {
            var self = this;
            var r = Sk.misceval.chain(
                Sk.misceval.tryCatch(function() {
                    return Sk.abstr.gattr(self, "next", canSuspend);
                }, function(e) {
                    if (e instanceof Sk.builtin.AttributeError) {
                        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(self) + "' object is not iterable");
                    } else {
                        throw e;
                    }
                }),
            function(/** {Object} */ iternextf) {
                return Sk.misceval.tryCatch(function() {
                    return Sk.misceval.callsimOrSuspend(iternextf);
                }, function(e) {
                    if (e instanceof Sk.builtin.StopIteration) {
                        return undefined;
                    } else {
                        throw e;
                    }
                });
            });

            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        };

        klass.prototype.tp$getitem = function (key, canSuspend) {
            var getf = Sk.abstr.gattr(this, "__getitem__", canSuspend), r;
            if (getf !== undefined) {
                r = Sk.misceval.applyOrSuspend(getf, undefined, undefined, undefined, [key]);
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            }
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object does not support indexing");
        };
        klass.prototype.tp$setitem = function (key, value, canSuspend) {
            var setf = Sk.abstr.gattr(this, "__setitem__", canSuspend), r;
            if (setf !== undefined) {
                r = Sk.misceval.applyOrSuspend(setf, undefined, undefined, undefined, [key, value]);
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            }
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object does not support item assignment");
        };

        if (bases) {
            //print("building mro for", name);
            //for (var i = 0; i < bases.length; ++i)
            //print("base[" + i + "]=" + bases[i].tp$name);
            klass["$d"] = new Sk.builtin.dict([]);
            klass["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, bases);
            mro = Sk.builtin.type.buildMRO(klass);
            klass["$d"].mp$ass_subscript(Sk.builtin.type.mroStr_, mro);
            klass.tp$mro = mro;
            //print("mro result", Sk.builtin.repr(mro).v);
        }

        // fix for class attributes
        klass.tp$setattr = Sk.builtin.type.prototype.tp$setattr;

        var shortcutDunder = function (skulpt_name, magic_name, magic_func, canSuspendIdx) {
            klass.prototype[skulpt_name] = function () {
                var args = Array.prototype.slice.call(arguments), canSuspend;
                args.unshift(magic_func, this);

                if (canSuspendIdx) {
                    canSuspend = args[canSuspendIdx+1];
                    args.splice(canSuspendIdx+1, 1);
                    if (canSuspend) {
                        return Sk.misceval.callsimOrSuspend.apply(undefined, args);
                    }
                }
                return Sk.misceval.callsim.apply(undefined, args);
            };
        };

        // Register skulpt shortcuts to magic methods defined by this class.
        // TODO: This is somewhat problematic, as it means that dynamically defined
        // methods (eg those returned by __getattr__()) cannot be used by these magic
        // functions.
        var dunder, skulpt_name, canSuspendIdx;
        for (dunder in Sk.dunderToSkulpt) {
            skulpt_name = Sk.dunderToSkulpt[dunder];
            if (typeof(skulpt_name) === "string") {
                canSuspendIdx = null;
            } else {
                canSuspendIdx = skulpt_name[1];
                skulpt_name = skulpt_name[0];
            }

            if (klass[dunder]) {
                // scope workaround
                shortcutDunder(skulpt_name, dunder, klass[dunder], canSuspendIdx);
            }
        }

        return klass;
    }

};

/**
 *
 */
Sk.builtin.type.makeTypeObj = function (name, newedInstanceOfType) {
    Sk.builtin.type.makeIntoTypeObj(name, newedInstanceOfType);
    return newedInstanceOfType;
};

Sk.builtin.type.makeIntoTypeObj = function (name, t) {
    goog.asserts.assert(name !== undefined);
    goog.asserts.assert(t !== undefined);
    t.ob$type = Sk.builtin.type;
    t.tp$name = name;
    t["$r"] = function () {
        var ctype;
        var mod = t.__module__;
        var cname = "";
        if (mod) {
            cname = mod.v + ".";
        }
        ctype = "class";
        if (!mod && !t.sk$klass && !Sk.python3) {
            ctype = "type";
        }
        return new Sk.builtin.str("<" + ctype + " '" + cname + t.tp$name + "'>");
    };
    t.tp$str = undefined;
    t.tp$getattr = Sk.builtin.type.prototype.tp$getattr;
    t.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
    t.tp$richcompare = Sk.builtin.type.prototype.tp$richcompare;
    t.sk$type = true;

    return t;
};

Sk.builtin.type.ob$type = Sk.builtin.type;
Sk.builtin.type.tp$name = "type";
Sk.builtin.type["$r"] = function () {
    if(Sk.python3) {
        return new Sk.builtin.str("<class 'type'>");
    } else {
        return new Sk.builtin.str("<type 'type'>");
    }
};

//Sk.builtin.type.prototype.tp$descr_get = function() { print("in type descr_get"); };

//Sk.builtin.type.prototype.tp$name = "type";

// basically the same as GenericGetAttr except looks in the proto instead
Sk.builtin.type.prototype.tp$getattr = function (name) {
    var res;
    var tp = this;
    var descr;
    var f;

    if (this["$d"]) {
        res = this["$d"].mp$lookup(new Sk.builtin.str(name));
        if (res !== undefined) {
            return res;
        }
    }

    descr = Sk.builtin.type.typeLookup(tp, name);

    //print("type.tpgetattr descr", descr, descr.tp$name, descr.func_code, name);
    if (descr !== undefined && descr !== null && descr.ob$type !== undefined) {
        f = descr.ob$type.tp$descr_get;
        // todo;if (f && descr.tp$descr_set) // is a data descriptor if it has a set
        // return f.call(descr, this, this.ob$type);
    }

    if (f) {
        // non-data descriptor
        return f.call(descr, null, tp);
    }

    if (descr !== undefined) {
        return descr;
    }

    return undefined;
};

Sk.builtin.type.prototype.tp$setattr = function (name, value) {
    // class attributes are direct properties of the object
    this[name] = value;
};

Sk.builtin.type.typeLookup = function (type, name) {
    var mro = type.tp$mro;
    var pyname = new Sk.builtin.str(name);
    var base;
    var res;
    var i;

    // todo; probably should fix this, used for builtin types to get stuff
    // from prototype
    if (!mro) {
        if (type.prototype) {
            return type.prototype[name];
        }
        return undefined;
    }

    for (i = 0; i < mro.v.length; ++i) {
        base = mro.v[i];
        if (base.hasOwnProperty(name)) {
            return base[name];
        }
        res = base["$d"].mp$lookup(pyname);
        if (res !== undefined) {
            return res;
        }
        if (base.prototype && base.prototype[name] !== undefined) {
            return base.prototype[name];
        }
    }

    return undefined;
};

Sk.builtin.type.mroMerge_ = function (seqs) {
    /*
     var tmp = [];
     for (var i = 0; i < seqs.length; ++i)
     {
     tmp.push(new Sk.builtin.list(seqs[i]));
     }
     print(Sk.builtin.repr(new Sk.builtin.list(tmp)).v);
     */
    var seq;
    var i;
    var next;
    var k;
    var sseq;
    var j;
    var cand;
    var cands;
    var res = [];
    for (; ;) {
        for (i = 0; i < seqs.length; ++i) {
            seq = seqs[i];
            if (seq.length !== 0) {
                break;
            }
        }
        if (i === seqs.length) { // all empty
            return res;
        }
        cands = [];
        for (i = 0; i < seqs.length; ++i) {
            seq = seqs[i];
            //print("XXX", Sk.builtin.repr(new Sk.builtin.list(seq)).v);
            if (seq.length !== 0) {
                cand = seq[0];
                //print("CAND", Sk.builtin.repr(cand).v);
                OUTER:
                    for (j = 0; j < seqs.length; ++j) {
                        sseq = seqs[j];
                        for (k = 1; k < sseq.length; ++k) {
                            if (sseq[k] === cand) {
                                break OUTER;
                            }
                        }
                    }

                // cand is not in any sequences' tail -> constraint-free
                if (j === seqs.length) {
                    cands.push(cand);
                }
            }
        }

        if (cands.length === 0) {
            throw new Sk.builtin.TypeError("Inconsistent precedences in type hierarchy");
        }

        next = cands[0];
        // append next to result and remove from sequences
        res.push(next);
        for (i = 0; i < seqs.length; ++i) {
            seq = seqs[i];
            if (seq.length > 0 && seq[0] === next) {
                seq.splice(0, 1);
            }
        }
    }
};

Sk.builtin.type.buildMRO_ = function (klass) {
    // MERGE(klass + mro(bases) + bases)
    var i;
    var bases;
    var all = [
        [klass]
    ];

    //Sk.debugout("buildMRO for", klass.tp$name);

    var kbases = klass["$d"].mp$subscript(Sk.builtin.type.basesStr_);
    for (i = 0; i < kbases.v.length; ++i) {
        all.push(Sk.builtin.type.buildMRO_(kbases.v[i]));
    }

    bases = [];
    for (i = 0; i < kbases.v.length; ++i) {
        bases.push(kbases.v[i]);
    }
    all.push(bases);

    return Sk.builtin.type.mroMerge_(all);
};

/*
 * C3 MRO (aka CPL) linearization. Figures out which order to search through
 * base classes to determine what should override what. C3 does the "right
 * thing", and it's what Python has used since 2.3.
 *
 * Kind of complicated to explain, but not really that complicated in
 * implementation. Explanations:
 *
 * http://people.csail.mit.edu/jrb/goo/manual.43/goomanual_55.html
 * http://www.python.org/download/releases/2.3/mro/
 * http://192.220.96.201/dylan/linearization-oopsla96.html
 *
 * This implementation is based on a post by Samuele Pedroni on python-dev
 * (http://mail.python.org/pipermail/python-dev/2002-October/029176.html) when
 * discussing its addition to Python.
 */
Sk.builtin.type.buildMRO = function (klass) {
    return new Sk.builtin.tuple(Sk.builtin.type.buildMRO_(klass));
};

Sk.builtin.type.prototype.tp$richcompare = function (other, op) {
    var r2;
    var r1;
    if (other.ob$type != Sk.builtin.type) {
        return undefined;
    }

    if (!this["$r"] || !other["$r"]) {
        return undefined;
    }

    r1 = this["$r"]();
    r2 = other["$r"]();

    return r1.tp$richcompare(r2, op);
};



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/abstract.js ---- */ 

/**
 * @namespace Sk.abstr
 *
 */
Sk.abstr = {};

//
// Number
//

Sk.abstr.typeName = function (v) {
    var vtypename;
    if (v.tp$name !== undefined) {
        vtypename = v.tp$name;
    } else {
        vtypename = "<invalid type>";
    }
    return vtypename;
};

Sk.abstr.binop_type_error = function (v, w, name) {
    var vtypename = Sk.abstr.typeName(v),
        wtypename = Sk.abstr.typeName(w);

    throw new Sk.builtin.TypeError("unsupported operand type(s) for " + name + ": '" + vtypename + "' and '" + wtypename + "'");
};

Sk.abstr.unop_type_error = function (v, name) {
    var vtypename = Sk.abstr.typeName(v),
        uop = {
            "UAdd"  : "+",
            "USub"  : "-",
            "Invert": "~"
        }[name];

    throw new Sk.builtin.TypeError("bad operand type for unary " + uop + ": '" + vtypename + "'");
};

/**
 * lookup and return the LHS object slot function method.  This coudl be either a builtin slot function or a dunder method defined by the user.
 * @param obj
 * @param name
 * @returns {Object|null|undefined}
 * @private
 */
Sk.abstr.boNameToSlotFuncLhs_ = function (obj, name) {
    if (obj === null) {
        return undefined;
    }

    switch (name) {
    case "Add":
        return obj.nb$add ? obj.nb$add : obj["__add__"];
    case "Sub":
        return obj.nb$subtract ? obj.nb$subtract : obj["__sub__"];
    case "Mult":
        return obj.nb$multiply ? obj.nb$multiply : obj["__mul__"];
    case "Div":
        return obj.nb$divide ? obj.nb$divide : obj["__div__"];
    case "FloorDiv":
        return obj.nb$floor_divide ? obj.nb$floor_divide : obj["__floordiv__"];
    case "Mod":
        return obj.nb$remainder ? obj.nb$remainder : obj["__mod__"];
    case "DivMod":
        return obj.nb$divmod ? obj.nb$divmod : obj["__divmod__"];
    case "Pow":
        return obj.nb$power ? obj.nb$power : obj["__pow__"];
    case "LShift":
        return obj.nb$lshift ? obj.nb$lshift : obj["__lshift__"];
    case "RShift":
        return obj.nb$rshift ? obj.nb$rshift : obj["__rshift__"];
    case "BitAnd":
        return obj.nb$and ? obj.nb$and : obj["__and__"];
    case "BitXor":
        return obj.nb$xor ? obj.nb$xor : obj["__xor__"];
    case "BitOr":
        return obj.nb$or ? obj.nb$or : obj["__or__"];
    }
};

Sk.abstr.boNameToSlotFuncRhs_ = function (obj, name) {
    if (obj === null) {
        return undefined;
    }

    switch (name) {
    case "Add":
        return obj.nb$reflected_add ? obj.nb$reflected_add : obj["__radd__"];
    case "Sub":
        return obj.nb$reflected_subtract ? obj.nb$reflected_subtract : obj["__rsub__"];
    case "Mult":
        return obj.nb$reflected_multiply ? obj.nb$reflected_multiply : obj["__rmul__"];
    case "Div":
        return obj.nb$reflected_divide ? obj.nb$reflected_divide : obj["__rdiv__"];
    case "FloorDiv":
        return obj.nb$reflected_floor_divide ? obj.nb$reflected_floor_divide : obj["__rfloordiv__"];
    case "Mod":
        return obj.nb$reflected_remainder ? obj.nb$reflected_remainder : obj["__rmod__"];
    case "DivMod":
        return obj.nb$reflected_divmod ? obj.nb$reflected_divmod : obj["__rdivmod__"];
    case "Pow":
        return obj.nb$reflected_power ? obj.nb$reflected_power : obj["__rpow__"];
    case "LShift":
        return obj.nb$reflected_lshift ? obj.nb$reflected_lshift : obj["__rlshift__"];
    case "RShift":
        return obj.nb$reflected_rshift ? obj.nb$reflected_rshift : obj["__rrshift__"];
    case "BitAnd":
        return obj.nb$reflected_and ? obj.nb$reflected_and : obj["__rand__"];
    case "BitXor":
        return obj.nb$reflected_xor ? obj.nb$reflected_xor : obj["__rxor__"];
    case "BitOr":
        return obj.nb$reflected_or ? obj.nb$reflected_or : obj["__ror__"];
    }
};

Sk.abstr.iboNameToSlotFunc_ = function (obj, name) {
    switch (name) {
    case "Add":
        return obj.nb$inplace_add ? obj.nb$inplace_add : obj["__iadd__"];
    case "Sub":
        return obj.nb$inplace_subtract ? obj.nb$inplace_subtract : obj["__isub__"];
    case "Mult":
        return obj.nb$inplace_multiply ? obj.nb$inplace_multiply : obj["__imul__"];
    case "Div":
        return obj.nb$inplace_divide ? obj.nb$inplace_divide : obj["__idiv__"];
    case "FloorDiv":
        return obj.nb$inplace_floor_divide ? obj.nb$inplace_floor_divide : obj["__ifloordiv__"];
    case "Mod":
        return obj.nb$inplace_remainder;
    case "Pow":
        return obj.nb$inplace_power;
    case "LShift":
        return obj.nb$inplace_lshift ? obj.nb$inplace_lshift : obj["__ilshift__"];
    case "RShift":
        return obj.nb$inplace_rshift ? obj.nb$inplace_rshift : obj["__irshift__"];
    case "BitAnd":
        return obj.nb$inplace_and;
    case "BitOr":
        return obj.nb$inplace_or;
    case "BitXor":
        return obj.nb$inplace_xor ? obj.nb$inplace_xor : obj["__ixor__"];
    }
};
Sk.abstr.uoNameToSlotFunc_ = function (obj, name) {
    if (obj === null) {
        return undefined;
    }
    switch (name) {
    case "USub":
        return obj.nb$negative ? obj.nb$negative : obj["__neg__"];
    case "UAdd":
        return obj.nb$positive ? obj.nb$positive : obj["__pos__"];
    case "Invert":
        return obj.nb$invert ? obj.nb$invert : obj["__invert__"];
    }
};

Sk.abstr.binary_op_ = function (v, w, opname) {
    var wop;
    var ret;
    var vop;

    // All Python inheritance is now enforced with Javascript inheritance
    // (see Sk.abstr.setUpInheritance). This checks if w's type is a strict
    // subclass of v's type
    var w_is_subclass = w.constructor.prototype instanceof v.constructor;

    // From the Python 2.7 docs:
    //
    // "If the right operand’s type is a subclass of the left operand’s type and
    // that subclass provides the reflected method for the operation, this
    // method will be called before the left operand’s non-reflected method.
    // This behavior allows subclasses to override their ancestors’ operations."
    //
    // -- https://docs.python.org/2/reference/datamodel.html#index-92

    if (w_is_subclass) {
        wop = Sk.abstr.boNameToSlotFuncRhs_(w, opname);
        if (wop !== undefined) {
            if (wop.call) {
                ret = wop.call(w, v);
            } else {
                ret = Sk.misceval.callsim(wop, w, v);
            }
            if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }

    vop = Sk.abstr.boNameToSlotFuncLhs_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v, w);
        } else {
            ret = Sk.misceval.callsim(vop, v, w);
        }
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    // Don't retry RHS if failed above
    if (!w_is_subclass) {
        wop = Sk.abstr.boNameToSlotFuncRhs_(w, opname);
        if (wop !== undefined) {
            if (wop.call) {
                ret = wop.call(w, v);
            } else {
                ret = Sk.misceval.callsim(wop, w, v);
            }
            if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }
    Sk.abstr.binop_type_error(v, w, opname);
};

Sk.abstr.binary_iop_ = function (v, w, opname) {
    var wop;
    var ret;
    var vop = Sk.abstr.iboNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v, w);
        } else {  // assume that vop is an __xxx__ type method
            ret = Sk.misceval.callsim(vop, v, w); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    wop = Sk.abstr.iboNameToSlotFunc_(w, opname);
    if (wop !== undefined) {
        if (wop.call) {
            ret = wop.call(w, v);
        } else { // assume that wop is an __xxx__ type method
            ret = Sk.misceval.callsim(wop, w, v); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    Sk.abstr.binop_type_error(v, w, opname);
};
Sk.abstr.unary_op_ = function (v, opname) {
    var ret;
    var vop = Sk.abstr.uoNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v);
        } else {  // assume that vop is an __xxx__ type method
            ret = Sk.misceval.callsim(vop, v); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined) {
            return ret;
        }
    }
    Sk.abstr.unop_type_error(v, opname);
};

//
// handle upconverting a/b from number to long if op causes too big/small a
// result, or if either of the ops are already longs
Sk.abstr.numOpAndPromote = function (a, b, opfn) {
    var tmp;
    var ans;
    if (a === null || b === null) {
        return undefined;
    }

    if (typeof a === "number" && typeof b === "number") {
        ans = opfn(a, b);
        // todo; handle float   Removed RNL (bugs in lng, and it should be a question of precision, not magnitude -- this was just wrong)
        if ((ans > Sk.builtin.int_.threshold$ || ans < -Sk.builtin.int_.threshold$) && Math.floor(ans) === ans) {
            return [Sk.builtin.lng.fromInt$(a), Sk.builtin.lng.fromInt$(b)];
        } else {
            return ans;
        }
    } else if (a === undefined || b === undefined) {
        throw new Sk.builtin.NameError("Undefined variable in expression");
    }

    if (a.constructor === Sk.builtin.lng) {
        return [a, b];
    } else if ((a.constructor === Sk.builtin.int_ ||
                a.constructor === Sk.builtin.float_) &&
                b.constructor === Sk.builtin.complex) {
        // special case of upconverting nmber and complex
        // can we use here the Sk.builtin.checkComplex() method?
        tmp = new Sk.builtin.complex(a);
        return [tmp, b];
    } else if (a.constructor === Sk.builtin.int_ ||
               a.constructor === Sk.builtin.float_) {
        return [a, b];
    } else if (typeof a === "number") {
        tmp = Sk.builtin.assk$(a);
        return [tmp, b];
    } else {
        return undefined;
    }
};

Sk.abstr.boNumPromote_ = {
    "Add"     : function (a, b) {
        return a + b;
    },
    "Sub"     : function (a, b) {
        return a - b;
    },
    "Mult"    : function (a, b) {
        return a * b;
    },
    "Mod"     : function (a, b) {
        var m;
        if (b === 0) {
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        }
        m = a % b;
        return ((m * b) < 0 ? (m + b) : m);
    },
    "Div"     : function (a, b) {
        if (b === 0) {
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        } else {
            return a / b;
        }
    },
    "FloorDiv": function (a, b) {
        if (b === 0) {
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        } else {
            return Math.floor(a / b);
        } // todo; wrong? neg?
    },
    "Pow"     : Math.pow,
    "BitAnd"  : function (a, b) {
        var m = a & b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "BitOr"   : function (a, b) {
        var m = a | b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "BitXor"  : function (a, b) {
        var m = a ^ b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "LShift"  : function (a, b) {
        var m;
        if (b < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        m = a << b;
        if (m > a) {
            return m;
        } else {
            // Fail, this will get recomputed with longs
            return a * Math.pow(2, b);
        }
    },
    "RShift"  : function (a, b) {
        var m;
        if (b < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        m = a >> b;
        if ((a > 0) && (m < 0)) {
            // fix incorrect sign extension
            m = m & (Math.pow(2, 32 - b) - 1);
        }
        return m;
    }
};

Sk.abstr.numberBinOp = function (v, w, op) {
    var tmp;
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined) {
        tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number") {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.int_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.float_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.lng) {
            return tmp;
        } else if (tmp !== undefined) {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return Sk.abstr.binary_op_(v, w, op);
};
goog.exportSymbol("Sk.abstr.numberBinOp", Sk.abstr.numberBinOp);

Sk.abstr.numberInplaceBinOp = function (v, w, op) {
    var tmp;
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined) {
        tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number") {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.int_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.float_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.lng) {
            return tmp;
        } else if (tmp !== undefined) {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return Sk.abstr.binary_iop_(v, w, op);
};
goog.exportSymbol("Sk.abstr.numberInplaceBinOp", Sk.abstr.numberInplaceBinOp);

Sk.abstr.numberUnaryOp = function (v, op) {
    var value;
    if (op === "Not") {
        return Sk.misceval.isTrue(v) ? Sk.builtin.bool.false$ : Sk.builtin.bool.true$;
    } else if (v instanceof Sk.builtin.bool) {
        value = Sk.builtin.asnum$(v);
        if (op === "USub") {
            return new Sk.builtin.int_(-value);
        }
        if (op === "UAdd") {
            return new Sk.builtin.int_(value);
        }
        if (op === "Invert") {
            return new Sk.builtin.int_(~value);
        }
    } else {
        if (op === "USub" && v.nb$negative) {
            return v.nb$negative();
        }
        if (op === "UAdd" && v.nb$positive) {
            return v.nb$positive();
        }
        if (op === "Invert" && v.nb$invert) {
            return v.nb$invert();
        }
    }

    return Sk.abstr.unary_op_(v, op);
};
goog.exportSymbol("Sk.abstr.numberUnaryOp", Sk.abstr.numberUnaryOp);

//
// Sequence
//

Sk.abstr.fixSeqIndex_ = function (seq, i) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 && seq.sq$length) {
        i += seq.sq$length();
    }
    return i;
};

/**
 * @param {*} seq
 * @param {*} ob
 * @param {boolean=} canSuspend
 */
Sk.abstr.sequenceContains = function (seq, ob, canSuspend) {
    var seqtypename;
    var special;
    var r;

    if (seq.sq$contains) {
        return seq.sq$contains(ob);
    }

    /**
     *  Look for special method and call it, we have to distinguish between built-ins and
     *  python objects
     */
    special = Sk.abstr.lookupSpecial(seq, "__contains__");
    if (special != null) {
        // method on builtin, provide this arg
        return Sk.misceval.isTrue(Sk.misceval.callsim(special, seq, ob));
    }

    if (!Sk.builtin.checkIterable(seq)) {
        seqtypename = Sk.abstr.typeName(seq);
        throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
    }

    r = Sk.misceval.iterFor(Sk.abstr.iter(seq), function(i) {
        if (Sk.misceval.richCompareBool(i, ob, "Eq")) {
            return new Sk.misceval.Break(true);
        } else {
            return false;
        }
    }, false);

    return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
};

Sk.abstr.sequenceConcat = function (seq1, seq2) {
    var seq1typename;
    if (seq1.sq$concat) {
        return seq1.sq$concat(seq2);
    }
    seq1typename = Sk.abstr.typeName(seq1);
    throw new Sk.builtin.TypeError("'" + seq1typename + "' object can't be concatenated");
};

Sk.abstr.sequenceGetIndexOf = function (seq, ob) {
    var seqtypename;
    var i, it;
    var index;
    if (seq.index) {
        return Sk.misceval.callsim(seq.index, seq, ob);
    }
    if (Sk.builtin.checkIterable(seq)) {
        index = 0;
        for (it = Sk.abstr.iter(seq), i = it.tp$iternext();
             i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
                return new Sk.builtin.int_(index);
            }
            index += 1;
        }
        throw new Sk.builtin.ValueError("sequence.index(x): x not in sequence");
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
};

Sk.abstr.sequenceGetCountOf = function (seq, ob) {
    var seqtypename;
    var i, it;
    var count;
    if (seq.count) {
        return Sk.misceval.callsim(seq.count, seq, ob);
    }
    if (Sk.builtin.checkIterable(seq)) {
        count = 0;
        for (it = Sk.abstr.iter(seq), i = it.tp$iternext();
             i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
                count += 1;
            }
        }
        return new Sk.builtin.int_(count);
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
};

Sk.abstr.sequenceGetItem = function (seq, i, canSuspend) {
    var seqtypename;
    if (seq.mp$subscript) {
        return seq.mp$subscript(i);
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object is unsubscriptable");
};

Sk.abstr.sequenceSetItem = function (seq, i, x, canSuspend) {
    var seqtypename;
    if (seq.mp$ass_subscript) {
        return seq.mp$ass_subscript(i, x);
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object does not support item assignment");
};

Sk.abstr.sequenceDelItem = function (seq, i) {
    var seqtypename;
    if (seq.sq$del_item) {
        i = Sk.abstr.fixSeqIndex_(seq, i);
        seq.sq$del_item(i);
        return;
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object does not support item deletion");
};

Sk.abstr.sequenceRepeat = function (f, seq, n) {
    var ntypename;
    var count;
    n = Sk.builtin.asnum$(n);
    count = Sk.misceval.asIndex(n);
    if (count === undefined) {
        ntypename = Sk.abstr.typeName(n);
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + ntypename + "'");
    }
    return f.call(seq, n);
};

Sk.abstr.sequenceGetSlice = function (seq, i1, i2) {
    var seqtypename;
    if (seq.sq$slice) {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        return seq.sq$slice(i1, i2);
    } else if (seq.mp$subscript) {
        return seq.mp$subscript(new Sk.builtin.slice(i1, i2));
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object is unsliceable");
};

Sk.abstr.sequenceDelSlice = function (seq, i1, i2) {
    var seqtypename;
    if (seq.sq$del_slice) {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        seq.sq$del_slice(i1, i2);
        return;
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' doesn't support slice deletion");
};

Sk.abstr.sequenceSetSlice = function (seq, i1, i2, x) {
    var seqtypename;
    if (seq.sq$ass_slice) {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        seq.sq$ass_slice(i1, i2, x);
    } else if (seq.mp$ass_subscript) {
        seq.mp$ass_subscript(new Sk.builtin.slice(i1, i2), x);
    } else {
        seqtypename = Sk.abstr.typeName(seq);
        throw new Sk.builtin.TypeError("'" + seqtypename + "' object doesn't support slice assignment");
    }
};

// seq - Python object to unpack
// n   - JavaScript number of items to unpack
Sk.abstr.sequenceUnpack = function (seq, n) {
    var res = [];
    var it, i;

    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    for (it = Sk.abstr.iter(seq), i = it.tp$iternext();
         (i !== undefined) && (res.length < n);
         i = it.tp$iternext()) {
        res.push(i);
    }

    if (res.length < n) {
        throw new Sk.builtin.ValueError("need more than " + res.length + " values to unpack");
    }
    if (i !== undefined) {
        throw new Sk.builtin.ValueError("too many values to unpack");
    }

    // Return Javascript array of items
    return res;
};

//
// Object
//

Sk.abstr.objectFormat = function (obj, format_spec) {
    var meth; // PyObject
    var result; // PyObject

    // If no format_spec is provided, use an empty string
    if(format_spec == null) {
        format_spec = "";
    }

    // Find the (unbound!) __format__ method (a borrowed reference)
    meth = Sk.abstr.lookupSpecial(obj, "__format__");
    if (meth == null) {
        throw new Sk.builtin.TypeError("Type " + Sk.abstr.typeName(obj) + "doesn't define __format__");
    }

    // And call it
    result = Sk.misceval.callsim(meth, obj, format_spec);
    if (!Sk.builtin.checkString(result)) {
        throw new Sk.builtin.TypeError("__format__ must return a str, not " + Sk.abstr.typeName(result));
    }

    return result;
};

Sk.abstr.objectAdd = function (a, b) {
    var btypename;
    var atypename;
    if (a.nb$add) {
        return a.nb$add(b);
    }

    atypename = Sk.abstr.typeName(a);
    btypename = Sk.abstr.typeName(b);
    throw new Sk.builtin.TypeError("unsupported operand type(s) for +: '" + atypename + "' and '" + btypename + "'");
};

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
Sk.abstr.objectNegative = function (obj) {
    var objtypename;
    var obj_asnum = Sk.builtin.asnum$(obj); // this will also convert bool type to int

    if (obj instanceof Sk.builtin.bool) {
        obj = new Sk.builtin.int_(obj_asnum);
    }

    if (obj.nb$negative) {
        return obj.nb$negative();
    }

    objtypename = Sk.abstr.typeName(obj);
    throw new Sk.builtin.TypeError("bad operand type for unary -: '" + objtypename + "'");
};

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
Sk.abstr.objectPositive = function (obj) {
    var objtypename = Sk.abstr.typeName(obj);
    var obj_asnum = Sk.builtin.asnum$(obj); // this will also convert bool type to int

    if (obj instanceof Sk.builtin.bool) {
        obj = new Sk.builtin.int_(obj_asnum);
    }

    if (obj.nb$negative) {
        return obj.nb$positive();
    }

    throw new Sk.builtin.TypeError("bad operand type for unary +: '" + objtypename + "'");
};

Sk.abstr.objectDelItem = function (o, key) {
    var otypename;
    var keytypename;
    var keyValue;
    if (o !== null) {
        if (o.mp$del_subscript) {
            o.mp$del_subscript(key);
            return;
        }
        if (o.sq$ass_item) {
            keyValue = Sk.misceval.asIndex(key);
            if (keyValue === undefined) {
                keytypename = Sk.abstr.typeName(key);
                throw new Sk.builtin.TypeError("sequence index must be integer, not '" + keytypename + "'");
            }
            Sk.abstr.sequenceDelItem(o, keyValue);
            return;
        }
        // if o is a slice do something else...
    }

    otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' object does not support item deletion");
};
goog.exportSymbol("Sk.abstr.objectDelItem", Sk.abstr.objectDelItem);

Sk.abstr.objectGetItem = function (o, key, canSuspend) {
    var otypename;
    if (o !== null) {
        if (o.tp$getitem) {
            return o.tp$getitem(key, canSuspend);
        } else if (o.mp$subscript) {
            return o.mp$subscript(key, canSuspend);
        } else if (Sk.misceval.isIndex(key) && o.sq$item) {
            return Sk.abstr.sequenceGetItem(o, Sk.misceval.asIndex(key), canSuspend);
        }
    }

    otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support indexing");
};
goog.exportSymbol("Sk.abstr.objectGetItem", Sk.abstr.objectGetItem);

Sk.abstr.objectSetItem = function (o, key, v, canSuspend) {
    var otypename;
    if (o !== null) {
        if (o.tp$setitem) {
            return o.tp$setitem(key, v, canSuspend);
        } else if (o.mp$ass_subscript) {
            return o.mp$ass_subscript(key, v, canSuspend);
        } else if (Sk.misceval.isIndex(key) && o.sq$ass_item) {
            return Sk.abstr.sequenceSetItem(o, Sk.misceval.asIndex(key), v, canSuspend);
        }
    }

    otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support item assignment");
};
goog.exportSymbol("Sk.abstr.objectSetItem", Sk.abstr.objectSetItem);


Sk.abstr.gattr = function (obj, nameJS, canSuspend) {
    var ret, f;
    var objname = Sk.abstr.typeName(obj);

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }


    if (obj.tp$getattr !== undefined) {
        f = obj.tp$getattr("__getattribute__");
    }

    if (f !== undefined) {
        ret = Sk.misceval.callsimOrSuspend(f, new Sk.builtin.str(nameJS));
    }

    ret = Sk.misceval.chain(ret, function(ret) {
        var f;

        if (ret === undefined && obj.tp$getattr !== undefined) {
            ret = obj.tp$getattr(nameJS);

            if (ret === undefined) {
                f = obj.tp$getattr("__getattr__");

                if (f !== undefined) {
                    ret = Sk.misceval.callsimOrSuspend(f, new Sk.builtin.str(nameJS));
                }
            }
        }
        return ret;
    }, function(r) {
        if (r === undefined) {
            throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
        }
        return r;
    });

    return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
};
goog.exportSymbol("Sk.abstr.gattr", Sk.abstr.gattr);

Sk.abstr.sattr = function (obj, nameJS, data, canSuspend) {
    var objname = Sk.abstr.typeName(obj), r, setf;

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }

    if (obj.tp$getattr !== undefined) {
        setf = obj.tp$getattr("__setattr__");
        if (setf !== undefined) {
            r = Sk.misceval.callsimOrSuspend(setf, new Sk.builtin.str(nameJS), data);
            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        }
    }

    if (obj.tp$setattr !== undefined) {
        obj.tp$setattr(nameJS, data);
    } else {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }
};
goog.exportSymbol("Sk.abstr.sattr", Sk.abstr.sattr);


Sk.abstr.iternext = function (it, canSuspend) {
    return it.tp$iternext(canSuspend);
};
goog.exportSymbol("Sk.abstr.iternext", Sk.abstr.iternext);


/**
 * Get the iterator for a Python object  This iterator could be one of the following.
 * This is the preferred mechanism for consistently getting the correct iterator.  You should
 * not just use tp$iter because that could lead to incorrect behavior of a user created class.
 *
 * - tp$iter
 * - A user defined `__iter__` method
 * - A user defined `__getitem__` method
 *
 * @param obj
 *
 * @throws {Sk.builtin.TypeError}
 * @returns {Object}
 */

Sk.abstr.iter = function(obj) {
    var iter;
    var getit;
    var ret;

    /**
     * Builds an iterator around classes that have a __getitem__ method.
     *
     * @constructor
     */
    var seqIter = function (obj) {
        this.idx = 0;
        this.myobj = obj;
        this.getitem = Sk.abstr.lookupSpecial(obj, "__getitem__");
        this.tp$iternext = function () {
            var ret;
            try {
                ret = Sk.misceval.callsim(this.getitem, this.myobj, Sk.ffi.remapToPy(this.idx));
            } catch (e) {
                if (e instanceof Sk.builtin.IndexError || e instanceof Sk.builtin.StopIteration) {
                    return undefined;
                } else {
                    throw e;
                }
            }
            this.idx++;
            return ret;
        };
    };

    if (obj.tp$getattr) {
        iter =  Sk.abstr.lookupSpecial(obj,"__iter__");
        if (iter) {
            ret = Sk.misceval.callsim(iter, obj);
            if (ret.tp$iternext) {
                return ret;
            }
        }
    }
    if (obj.tp$iter) {
        try {  // catch and ignore not iterable error here.
            ret = obj.tp$iter();
            if (ret.tp$iternext) {
                return ret;
            }
        } catch (e) { }
    }
    getit = Sk.abstr.lookupSpecial(obj, "__getitem__");
    if (getit) {
        // create internal iterobject if __getitem__
        return new seqIter(obj);
    }
    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) + "' object is not iterable");
};
goog.exportSymbol("Sk.abstr.iter", Sk.abstr.iter);

/**
 * Special method look up. First try getting the method via
 * internal dict and getattr. If getattr is not present (builtins)
 * try if method is defined on the object itself
 *
 * @returns {null|Object} Return null if not found or the function
 */
Sk.abstr.lookupSpecial = function(op, str) {
    var res;
    var obtp;
    if (op.ob$type) {
        obtp = op.ob$type;
    } else {
        return null;
    }

    return Sk.builtin.type.typeLookup(obtp, str);
};
goog.exportSymbol("Sk.abstr.lookupSpecial", Sk.abstr.lookupSpecial);

/**
 * Mark a class as unhashable and prevent its `__hash__` function from being called.
 * @param  {function(...[?])} thisClass The class to mark as unhashable.
 * @return {undefined}
 */
Sk.abstr.markUnhashable = function (thisClass) {
    var proto = thisClass.prototype;
    proto.__hash__ = Sk.builtin.none.none$;
    proto.tp$hash = Sk.builtin.none.none$;
};

/**
 * Set up inheritance between two Python classes. This allows only for single
 * inheritance -- multiple inheritance is not supported by Javascript.
 *
 * Javascript's inheritance is prototypal. This means that properties must
 * be defined on the superclass' prototype in order for subclasses to inherit
 * them.
 *
 * ```
 * Sk.superclass.myProperty                 # will NOT be inherited
 * Sk.superclass.prototype.myProperty       # will be inherited
 * ```
 *
 * In order for a class to be subclassable, it must (directly or indirectly)
 * inherit from Sk.builtin.object so that it will be properly initialized in
 * {@link Sk.doOneTimeInitialization} (in src/import.js). Further, all Python
 * builtins should inherit from Sk.builtin.object.
 *
 * @param {string} childName The Python name of the child (subclass).
 * @param {function(...[?])} child     The subclass.
 * @param {function(...[?])} parent    The superclass.
 * @return {undefined}
 */
Sk.abstr.setUpInheritance = function (childName, child, parent) {
    goog.inherits(child, parent);
    child.prototype.tp$base = parent;
    child.prototype.tp$name = childName;
    child.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(childName, child);
};

/**
 * Call the super constructor of the provided class, with the object `self` as
 * the `this` value of that constructor. Any arguments passed to this function
 * after `self` will be passed as-is to the constructor.
 *
 * @param  {function(...[?])} thisClass The subclass.
 * @param  {Object} self      The instance of the subclas.
 * @param  {...?} args Arguments to pass to the constructor.
 * @return {undefined}
 */
Sk.abstr.superConstructor = function (thisClass, self, args) {
    var argumentsForConstructor = Array.prototype.slice.call(arguments, 2);
    thisClass.prototype.tp$base.apply(self, argumentsForConstructor);
};



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/object.js ---- */ 

/**
 * @constructor
 * Sk.builtin.object
 *
 * @description
 * Constructor for Python object. All Python classes (builtin and user-defined)
 * should inherit from this class.
 *
 * @return {Sk.builtin.object} Python object
 */
Sk.builtin.object = function () {
    if (!(this instanceof Sk.builtin.object)) {
        return new Sk.builtin.object();
    }


    return this;
};



var _tryGetSubscript = function(dict, pyName) {
    try {
        return dict.mp$subscript(pyName);
    } catch (x) {
        return undefined;
    }
};

/**
 * @return {undefined}
 */
Sk.builtin.object.prototype.GenericGetAttr = function (name) {
    var res;
    var f;
    var descr;
    var tp;
    var dict;
    var pyName = new Sk.builtin.str(name);
    goog.asserts.assert(typeof name === "string");

    tp = this.ob$type;
    goog.asserts.assert(tp !== undefined, "object has no ob$type!");

    dict = this["$d"] || this.constructor["$d"];

    // todo; assert? force?
    if (dict) {
        if (dict.mp$lookup) {
            res = dict.mp$lookup(pyName);
        } else if (dict.mp$subscript) {
            res = _tryGetSubscript(dict, pyName);
        } else if (typeof dict === "object") {
            // todo; definitely the wrong place for this. other custom tp$getattr won't work on object -- bnm -- implemented custom __getattr__ in abstract.js
            res = dict[name];
        }
        if (res !== undefined) {
            return res;
        }
    }

    descr = Sk.builtin.type.typeLookup(tp, name);

    // otherwise, look in the type for a descr
    if (descr !== undefined && descr !== null && descr.ob$type !== undefined) {
        f = descr.ob$type.tp$descr_get;
        // todo;
        //if (f && descr.tp$descr_set) // is a data descriptor if it has a set
        //return f.call(descr, this, this.ob$type);
    }

    if (f) {
        // non-data descriptor
        return f.call(descr, this, this.ob$type);
    }

    if (descr !== undefined) {
        return descr;
    }

    return undefined;
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericGetAttr", Sk.builtin.object.prototype.GenericGetAttr);

Sk.builtin.object.prototype.GenericPythonGetAttr = function(self, name) {
    return Sk.builtin.object.prototype.GenericGetAttr.call(self, name.v);
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericPythonGetAttr", Sk.builtin.object.prototype.GenericPythonGetAttr);

Sk.builtin.object.prototype.GenericSetAttr = function (name, value) {
    var objname = Sk.abstr.typeName(this);
    var pyname;
    var dict;
    goog.asserts.assert(typeof name === "string");
    // todo; lots o' stuff

    dict = this["$d"] || this.constructor["$d"];

    if (dict.mp$ass_subscript) {
        pyname = new Sk.builtin.str(name);

        if (this instanceof Sk.builtin.object && !(this.ob$type.sk$klass) &&
            dict.mp$lookup(pyname) === undefined) {
            // Cannot add new attributes to a builtin object
            throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + name + "'");
        }
        dict.mp$ass_subscript(new Sk.builtin.str(name), value);
    } else if (typeof dict === "object") {
        dict[name] = value;
    }
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericSetAttr", Sk.builtin.object.prototype.GenericSetAttr);

Sk.builtin.object.prototype.GenericPythonSetAttr = function(self, name, value) {
    return Sk.builtin.object.prototype.GenericSetAttr.call(self, name.v, value);
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericPythonSetAttr", Sk.builtin.object.prototype.GenericPythonSetAttr);

Sk.builtin.object.prototype.HashNotImplemented = function () {
    throw new Sk.builtin.TypeError("unhashable type: '" + Sk.abstr.typeName(this) + "'");
};

Sk.builtin.object.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;

// Although actual attribute-getting happens in pure Javascript via tp$getattr, classes
// overriding __getattr__ etc need to be able to call object.__getattr__ etc from Python
Sk.builtin.object.prototype["__getattr__"] = Sk.builtin.object.prototype.GenericPythonGetAttr;
Sk.builtin.object.prototype["__setattr__"] = Sk.builtin.object.prototype.GenericPythonSetAttr;

/**
 * The name of this class.
 * @type {string}
 */
Sk.builtin.object.prototype.tp$name = "object";

/**
 * The type object of this class.
 * @type {Sk.builtin.type}
 */
Sk.builtin.object.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("object", Sk.builtin.object);
Sk.builtin.object.prototype.ob$type.sk$klass = undefined;   // Nonsense for closure compiler

/** Default implementations of dunder methods found in all Python objects */

/**
 * Python wrapper for `__repr__` method.
 * @name  __repr__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__repr__"] = function (self) {
    Sk.builtin.pyCheckArgs("__repr__", arguments, 0, 0, false, true);

    return self["$r"]();
};

/**
 * Python wrapper for `__str__` method.
 * @name  __str__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__str__"] = function (self) {
    Sk.builtin.pyCheckArgs("__str__", arguments, 0, 0, false, true);

    return self["$r"]();
};

/**
 * Python wrapper for `__hash__` method.
 * @name  __hash__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__hash__"] = function (self) {
    Sk.builtin.pyCheckArgs("__hash__", arguments, 0, 0, false, true);

    return self.tp$hash();
};

/**
 * Python wrapper for `__eq__` method.
 * @name  __eq__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__eq__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__eq__", arguments, 1, 1, false, true);

    return self.ob$eq(other);
};

/**
 * Python wrapper for `__ne__` method.
 * @name  __ne__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__ne__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__ne__", arguments, 1, 1, false, true);

    return self.ob$ne(other);
};

/**
 * Python wrapper for `__lt__` method.
 * @name  __lt__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__lt__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__lt__", arguments, 1, 1, false, true);

    return self.ob$lt(other);
};

/**
 * Python wrapper for `__le__` method.
 * @name  __le__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__le__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__le__", arguments, 1, 1, false, true);

    return self.ob$le(other);
};

/**
 * Python wrapper for `__gt__` method.
 * @name  __gt__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__gt__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__gt__", arguments, 1, 1, false, true);

    return self.ob$gt(other);
};

/**
 * Python wrapper for `__ge__` method.
 * @name  __ge__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__ge__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__ge__", arguments, 1, 1, false, true);

    return self.ob$ge(other);
};

/** Default implementations of Javascript functions used in dunder methods */

/**
 * Return the string representation of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @name  $r
 * @memberOf Sk.builtin.object.prototype
 * @return {Sk.builtin.str} The Python string representation of this instance.
 */
Sk.builtin.object.prototype["$r"] = function () {
    return new Sk.builtin.str("<object>");
};

Sk.builtin.hashCount = 1;

/**
 * Return the hash value of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.int_} The hash value
 */
Sk.builtin.object.prototype.tp$hash = function () {
    if (!this.$savedHash_) {
        this.$savedHash_ = new Sk.builtin.int_(Sk.builtin.hashCount++);
    }

    return this.$savedHash_;
};

/**
 * Perform equality check between this instance and a Python object (i.e. this == other).
 *
 * Implements `__eq__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to check for equality.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if equal, false otherwise
 */
Sk.builtin.object.prototype.ob$eq = function (other) {
    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Perform non-equality check between this instance and a Python object (i.e. this != other).
 *
 * Implements `__ne__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to check for non-equality.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if not equal, false otherwise
 */
Sk.builtin.object.prototype.ob$ne = function (other) {
    if (this === other) {
        return Sk.builtin.bool.false$;
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is less than a Python object (i.e. this < other).
 *
 * Implements `__lt__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if this < other, false otherwise
 */
Sk.builtin.object.prototype.ob$lt = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is less than or equal to a Python object (i.e. this <= other).
 *
 * Implements `__le__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if this <= other, false otherwise
 */
Sk.builtin.object.prototype.ob$le = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is greater than a Python object (i.e. this > other).
 *
 * Implements `__gt__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if this > other, false otherwise
 */
Sk.builtin.object.prototype.ob$gt = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is greater than or equal to a Python object (i.e. this >= other).
 *
 * Implements `__ge__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if this >= other, false otherwise
 */
Sk.builtin.object.prototype.ob$ge = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

// Wrap the following functions in Sk.builtin.func once that class is initialized
/**
 * Array of all the Python functions which are methods of this class.
 * @type {Array}
 */
Sk.builtin.object.pythonFunctions = ["__repr__", "__str__", "__hash__",
"__eq__", "__ne__", "__lt__", "__le__", "__gt__", "__ge__", "__getattr__", "__setattr__"];

/**
 * @constructor
 * Sk.builtin.none
 *
 * @extends {Sk.builtin.object}
 */
Sk.builtin.none = function () {
    this.v = null;
};
Sk.abstr.setUpInheritance("NoneType", Sk.builtin.none, Sk.builtin.object);

/** @override */
Sk.builtin.none.prototype["$r"] = function () { return new Sk.builtin.str("None"); };

/** @override */
Sk.builtin.none.prototype.tp$hash = function () {
    return new Sk.builtin.int_(0);
};

/**
 * Python None constant.
 * @type {Sk.builtin.none}
 */
Sk.builtin.none.none$ = new Sk.builtin.none();

/**
 * @constructor
 * Sk.builtin.NotImplemented
 *
 * @extends {Sk.builtin.object}
 */
Sk.builtin.NotImplemented = function() { };
Sk.abstr.setUpInheritance("NotImplementedType", Sk.builtin.NotImplemented, Sk.builtin.object);

/** @override */
Sk.builtin.NotImplemented.prototype["$r"] = function () { return new Sk.builtin.str("NotImplemented"); };

/**
 * Python NotImplemented constant.
 * @type {Sk.builtin.NotImplemented}
 */
Sk.builtin.NotImplemented.NotImplemented$ = new Sk.builtin.NotImplemented();

goog.exportSymbol("Sk.builtin.none", Sk.builtin.none);
goog.exportSymbol("Sk.builtin.NotImplemented", Sk.builtin.NotImplemented);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/function.js ---- */ 

/**
 * @namespace Sk.builtin
 */


/**
 * Check arguments to Python functions to ensure the correct number of
 * arguments are passed.
 *
 * @param {string} name the name of the function
 * @param {Object} args the args passed to the function
 * @param {number} minargs the minimum number of allowable arguments
 * @param {number=} maxargs optional maximum number of allowable
 * arguments (default: Infinity)
 * @param {boolean=} kwargs optional true if kwargs, false otherwise
 * (default: false)
 * @param {boolean=} free optional true if free vars, false otherwise
 * (default: false)
 */
Sk.builtin.pyCheckArgs = function (name, args, minargs, maxargs, kwargs, free) {
    var nargs = args.length;
    var msg = "";

    if (maxargs === undefined) {
        maxargs = Infinity;
    }
    if (kwargs) {
        nargs -= 1;
    }
    if (free) {
        nargs -= 1;
    }
    if ((nargs < minargs) || (nargs > maxargs)) {
        if (minargs === maxargs) {
            msg = name + "() takes exactly " + minargs + " arguments";
        } else if (nargs < minargs) {
            msg = name + "() takes at least " + minargs + " arguments";
        } else {
            msg = name + "() takes at most " + maxargs + " arguments";
        }
        msg += " (" + nargs + " given)";
        throw new Sk.builtin.TypeError(msg);
    }
};
goog.exportSymbol("Sk.builtin.pyCheckArgs", Sk.builtin.pyCheckArgs);

/**
 * Check type of argument to Python functions.
 *
 * @param {string} name the name of the argument
 * @param {string} exptype string of the expected type name
 * @param {boolean} check truthy if type check passes, falsy otherwise
 */
Sk.builtin.pyCheckType = function (name, exptype, check) {
    if (!check) {
        throw new Sk.builtin.TypeError(name + " must be a " + exptype);
    }
};
goog.exportSymbol("Sk.builtin.pyCheckType", Sk.builtin.pyCheckType);

Sk.builtin.checkSequence = function (arg) {
    return (arg !== null && arg.mp$subscript !== undefined);
};
goog.exportSymbol("Sk.builtin.checkSequence", Sk.builtin.checkSequence);

/**
 * Use this to test whether or not a Python object is iterable.  You should **not** rely
 * on the presence of tp$iter on the object as a good test, as it could be a user defined
 * class with `__iter__` defined or ``__getitem__``  This tests for all of those cases
 *
 * @param arg {Object}   A Python object
 * @returns {boolean} true if the object is iterable
 */
Sk.builtin.checkIterable = function (arg) {
    var ret = false;
    if (arg !== null ) {
        try {
            ret = Sk.abstr.iter(arg);
            if (ret) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            if (e instanceof Sk.builtin.TypeError) {
                return false;
            } else {
                throw e;
            }
        }
    }
    return ret;
};
goog.exportSymbol("Sk.builtin.checkIterable", Sk.builtin.checkIterable);

Sk.builtin.checkCallable = function (obj) {
    // takes care of builtin functions and methods, builtins
    if (typeof obj === "function") {
        return true;
    }
    // takes care of python function, methods and lambdas
    if (obj instanceof Sk.builtin.func) {
        return true;
    }
    // takes care of instances of methods
    if (obj instanceof Sk.builtin.method) {
        return true;
    }
    // go up the prototype chain to see if the class has a __call__ method
    if (Sk.abstr.lookupSpecial(obj, "__call__") !== undefined) {
        return true;
    } 
    return false;
};

Sk.builtin.checkNumber = function (arg) {
    return (arg !== null && (typeof arg === "number" ||
        arg instanceof Sk.builtin.int_ ||
        arg instanceof Sk.builtin.float_ ||
        arg instanceof Sk.builtin.lng));
};
goog.exportSymbol("Sk.builtin.checkNumber", Sk.builtin.checkNumber);

/**
 * Checks for complex type, delegates to internal method
 * Most skulpt users would search here!
 */
Sk.builtin.checkComplex = function (arg) {
    return Sk.builtin.complex._complex_check(arg);
};
goog.exportSymbol("Sk.builtin.checkComplex", Sk.builtin.checkComplex);

Sk.builtin.checkInt = function (arg) {
    return (arg !== null) && ((typeof arg === "number" && arg === (arg | 0)) ||
        arg instanceof Sk.builtin.int_ ||
        arg instanceof Sk.builtin.lng);
};
goog.exportSymbol("Sk.builtin.checkInt", Sk.builtin.checkInt);

Sk.builtin.checkFloat = function (arg) {
    return (arg !== null) && (arg instanceof Sk.builtin.float_);
};
goog.exportSymbol("Sk.builtin.checkFloat", Sk.builtin.checkFloat);

Sk.builtin.checkString = function (arg) {
    return (arg !== null && arg.__class__ == Sk.builtin.str);
};
goog.exportSymbol("Sk.builtin.checkString", Sk.builtin.checkString);

Sk.builtin.checkClass = function (arg) {
    return (arg !== null && arg.sk$type);
};
goog.exportSymbol("Sk.builtin.checkClass", Sk.builtin.checkClass);

Sk.builtin.checkBool = function (arg) {
    return (arg instanceof Sk.builtin.bool);
};
goog.exportSymbol("Sk.builtin.checkBool", Sk.builtin.checkBool);

Sk.builtin.checkNone = function (arg) {
    return (arg instanceof Sk.builtin.none);
};
goog.exportSymbol("Sk.builtin.checkNone", Sk.builtin.checkNone);

Sk.builtin.checkFunction = function (arg) {
    return (arg !== null && arg.tp$call !== undefined);
};
goog.exportSymbol("Sk.builtin.checkFunction", Sk.builtin.checkFunction);

/**
 * @constructor
 * Sk.builtin.func
 *
 * @description
 * This function converts a Javascript function into a Python object that is callable.  Or just
 * think of it as a Python function rather than a Javascript function now.  This is an important
 * distinction in skulpt because once you have Python function you cannot just call it.
 * You must now use Sk.misceval.callsim to call the Python function.
 *
 * @param {Function} code the javascript implementation of this function
 * @param {Object=} globals the globals where this function was defined.
 * Can be undefined (which will be stored as null) for builtins. (is
 * that ok?)
 * @param {Object=} closure dict of free variables
 * @param {Object=} closure2 another dict of free variables that will be
 * merged into 'closure'. there's 2 to simplify generated code (one is $free,
 * the other is $cell)
 *
 * closure is the cell variables from the parent scope that we need to close
 * over. closure2 is the free variables in the parent scope that we also might
 * need to access.
 *
 * NOTE: co_varnames and co_name are defined by compiled code only, so we have
 * to access them via dict-style lookup for closure.
 *
 */
Sk.builtin.func = function (code, globals, closure, closure2) {
    var k;
    this.func_code = code;
    this.func_globals = globals || null;
    if (closure2 !== undefined) {
        // todo; confirm that modification here can't cause problems
        for (k in closure2) {
            closure[k] = closure2[k];
        }
    }
    this.func_closure = closure;
    return this;
};
goog.exportSymbol("Sk.builtin.func", Sk.builtin.func);


Sk.builtin.func.prototype.tp$name = "function";
Sk.builtin.func.prototype.tp$descr_get = function (obj, objtype) {
    goog.asserts.assert(obj !== undefined && objtype !== undefined);
    if (obj == null) {
        return this;
    }
    return new Sk.builtin.method(this, obj);
};
Sk.builtin.func.prototype.tp$call = function (args, kw) {
    var j;
    var i;
    var numvarnames;
    var varnames;
    var kwlen;
    var kwargsarr;
    var expectskw;
    var name;
    var numargs;

    // note: functions expect 'this' to be globals to avoid having to
    // slice/unshift onto the main args
    if (this.func_closure) {
        // todo; OK to modify?
        if (this.func_code["$defaults"] && this.func_code["co_varnames"]) {
            // Make sure all default arguments are in args before adding closure
            numargs = args.length;
            numvarnames = this.func_code["co_varnames"].length;
            for (i = numargs; i < numvarnames; i++) {
                args.push(undefined);
            }
        }
        args.push(this.func_closure);
    }

    expectskw = this.func_code["co_kwargs"];
    kwargsarr = [];

    if (this.func_code["no_kw"] && kw) {
        name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || "<native JS>";
        throw new Sk.builtin.TypeError(name + "() takes no keyword arguments");
    }

    if (kw) {
        // bind the kw args
        kwlen = kw.length;
        varnames = this.func_code["co_varnames"];
        numvarnames = varnames && varnames.length;
        for (i = 0; i < kwlen; i += 2) {
            // todo; make this a dict mapping name to offset
            for (j = 0; j < numvarnames; ++j) {
                if (kw[i] === varnames[j]) {
                    break;
                }
            }
            if (varnames && j !== numvarnames) {
                if (j in args) {
                    name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || "<native JS>";
                    throw new Sk.builtin.TypeError(name + "() got multiple values for keyword argument '" + kw[i] + "'");
                }
                args[j] = kw[i + 1];
            } else if (expectskw) {
                // build kwargs dict
                kwargsarr.push(new Sk.builtin.str(kw[i]));
                kwargsarr.push(kw[i + 1]);
            } else {
                name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || "<native JS>";
                throw new Sk.builtin.TypeError(name + "() got an unexpected keyword argument '" + kw[i] + "'");
            }
        }
    }
    if (expectskw) {
        args.unshift(kwargsarr);
    }

    //print(JSON.stringify(args, null, 2));

    return this.func_code.apply(this.func_globals, args);
};

Sk.builtin.func.prototype.tp$getattr = function (key) {
    return this[key];
};
Sk.builtin.func.prototype.tp$setattr = function (key, value) {
    this[key] = value;
};

//todo; investigate why the other doesn't work
//Sk.builtin.type.makeIntoTypeObj('function', Sk.builtin.func);
Sk.builtin.func.prototype.ob$type = Sk.builtin.type.makeTypeObj("function", new Sk.builtin.func(null, null));

Sk.builtin.func.prototype["$r"] = function () {
    var name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || "<native JS>";
    return new Sk.builtin.str("<function " + name + ">");
};



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/builtin.js ---- */ 

/**
 * builtins are supposed to come from the __builtin__ module, but we don't do
 * that yet.
 * todo; these should all be func objects too, otherwise str() of them won't
 * work, etc.
 */

Sk.builtin.range = function range (start, stop, step) {
    var ret = [];
    var i;

    Sk.builtin.pyCheckArgs("range", arguments, 1, 3);
    Sk.builtin.pyCheckType("start", "integer", Sk.builtin.checkInt(start));
    if (stop !== undefined) {
        Sk.builtin.pyCheckType("stop", "integer", Sk.builtin.checkInt(stop));
    }
    if (step !== undefined) {
        Sk.builtin.pyCheckType("step", "integer", Sk.builtin.checkInt(step));
    }

    start = Sk.builtin.asnum$(start);
    stop = Sk.builtin.asnum$(stop);
    step = Sk.builtin.asnum$(step);

    if ((stop === undefined) && (step === undefined)) {
        stop = start;
        start = 0;
        step = 1;
    } else if (step === undefined) {
        step = 1;
    }

    if (step === 0) {
        throw new Sk.builtin.ValueError("range() step argument must not be zero");
    }

    if (step > 0) {
        for (i = start; i < stop; i += step) {
            ret.push(new Sk.builtin.int_(i));
        }
    } else {
        for (i = start; i > stop; i += step) {
            ret.push(new Sk.builtin.int_(i));
        }
    }

    return new Sk.builtin.list(ret);
};

Sk.builtin.asnum$ = function (a) {
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (a instanceof Sk.builtin.none) {
        return null;
    }
    if (a instanceof Sk.builtin.bool) {
        if (a.v) {
            return 1;
        }
        return 0;
    }
    if (typeof a === "number") {
        return a;
    }
    if (typeof a === "string") {
        return a;
    }
    if (a instanceof Sk.builtin.int_) {
        return a.v;
    }
    if (a instanceof Sk.builtin.float_) {
        return a.v;
    }
    if (a instanceof Sk.builtin.lng) {
        if (a.cantBeInt()) {
            return a.str$(10, true);
        }
        return a.toInt$();
    }
    if (a.constructor === Sk.builtin.biginteger) {
        if ((a.trueCompare(new Sk.builtin.biginteger(Sk.builtin.int_.threshold$)) > 0) ||
            (a.trueCompare(new Sk.builtin.biginteger(-Sk.builtin.int_.threshold$)) < 0)) {
            return a.toString();
        }
        return a.intValue();
    }

    return a;
};

goog.exportSymbol("Sk.builtin.asnum$", Sk.builtin.asnum$);

/**
 * Return a Python number (either float or int) from a Javascript number.
 *
 * Javacsript function, returns Python object.
 *
 * @param  {number} a Javascript number to transform into Python number.
 * @return {(Sk.builtin.int_|Sk.builtin.float_)} A Python number.
 */
Sk.builtin.assk$ = function (a) {
    if (a % 1 === 0) {
        return new Sk.builtin.int_(a);
    } else {
        return new Sk.builtin.float_(a);
    }
};
goog.exportSymbol("Sk.builtin.assk$", Sk.builtin.assk$);

Sk.builtin.asnum$nofloat = function (a) {
    var decimal;
    var mantissa;
    var expon;
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (a.constructor === Sk.builtin.none) {
        return null;
    }
    if (a.constructor === Sk.builtin.bool) {
        if (a.v) {
            return 1;
        }
        return 0;
    }
    if (typeof a === "number") {
        a = a.toString();
    }
    if (a.constructor === Sk.builtin.int_) {
        a = a.v.toString();
    }
    if (a.constructor === Sk.builtin.float_) {
        a = a.v.toString();
    }
    if (a.constructor === Sk.builtin.lng) {
        a = a.str$(10, true);
    }
    if (a.constructor === Sk.builtin.biginteger) {
        a = a.toString();
    }

    //	Sk.debugout("INITIAL: " + a);

    //	If not a float, great, just return this
    if (a.indexOf(".") < 0 && a.indexOf("e") < 0 && a.indexOf("E") < 0) {
        return a;
    }

    expon = 0;

    if (a.indexOf("e") >= 0) {
        mantissa = a.substr(0, a.indexOf("e"));
        expon = a.substr(a.indexOf("e") + 1);
    } else if (a.indexOf("E") >= 0) {
        mantissa = a.substr(0, a.indexOf("e"));
        expon = a.substr(a.indexOf("E") + 1);
    } else {
        mantissa = a;
    }

    expon = parseInt(expon, 10);

    decimal = mantissa.indexOf(".");

    //	Simplest case, no decimal
    if (decimal < 0) {
        if (expon >= 0) {
            // Just add more zeroes and we're done
            while (expon-- > 0) {
                mantissa += "0";
            }
            return mantissa;
        } else {
            if (mantissa.length > -expon) {
                return mantissa.substr(0, mantissa.length + expon);
            } else {
                return 0;
            }
        }
    }

    //	Negative exponent OR decimal (neg or pos exp)
    if (decimal === 0) {
        mantissa = mantissa.substr(1);
    } else if (decimal < mantissa.length) {
        mantissa = mantissa.substr(0, decimal) + mantissa.substr(decimal + 1);
    } else {
        mantissa = mantissa.substr(0, decimal);
    }

    decimal = decimal + expon;
    while (decimal > mantissa.length) {
        mantissa += "0";
    }

    if (decimal <= 0) {
        mantissa = 0;
    } else {
        mantissa = mantissa.substr(0, decimal);
    }

    return mantissa;
};
goog.exportSymbol("Sk.builtin.asnum$nofloat", Sk.builtin.asnum$nofloat);

Sk.builtin.round = function round (number, ndigits) {
    var result, multiplier, special;
    Sk.builtin.pyCheckArgs("round", arguments, 1, 2);

    if (!Sk.builtin.checkNumber(number)) {
        throw new Sk.builtin.TypeError("a float is required");
    }

    if ((ndigits !== undefined) && !Sk.misceval.isIndex(ndigits)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(ndigits) + "' object cannot be interpreted as an index");
    }

    if (ndigits === undefined) {
        ndigits = 0;
    }

    // for built-in types round is delegated to number.__round__
    if(number.__round__) {
        return number.__round__(number, ndigits);
    }

    // try calling internal magic method
    special = Sk.abstr.lookupSpecial(number, "__round__");
    if (special != null) {
        // method on builtin, provide this arg
        return Sk.misceval.callsim(special, number, ndigits);
    }
};

Sk.builtin.len = function len (item) {
    Sk.builtin.pyCheckArgs("len", arguments, 1, 1);

    var int_ = function(i) { return new Sk.builtin.int_(i); };

    if (item.sq$length) {
        return Sk.misceval.chain(item.sq$length(), int_);
    }

    if (item.mp$length) {
        return Sk.misceval.chain(item.mp$length(), int_);
    }

    if (item.tp$length) {
        return Sk.misceval.chain(item.tp$length(true), int_);
    }

    throw new Sk.builtin.TypeError("object of type '" + Sk.abstr.typeName(item) + "' has no len()");
};

Sk.builtin.min = function min () {
    var i;
    var lowest;
    var args;
    Sk.builtin.pyCheckArgs("min", arguments, 1);

    args = Sk.misceval.arrayFromArguments(arguments);
    lowest = args[0];

    if (lowest === undefined) {
        throw new Sk.builtin.ValueError("min() arg is an empty sequence");
    }

    for (i = 1; i < args.length; ++i) {
        if (Sk.misceval.richCompareBool(args[i], lowest, "Lt")) {
            lowest = args[i];
        }
    }
    return lowest;
};

Sk.builtin.max = function max () {
    var i;
    var highest;
    var args;
    Sk.builtin.pyCheckArgs("max", arguments, 1);

    args = Sk.misceval.arrayFromArguments(arguments);
    highest = args[0];

    if (highest === undefined) {
        throw new Sk.builtin.ValueError("max() arg is an empty sequence");
    }

    for (i = 1; i < args.length; ++i) {
        if (Sk.misceval.richCompareBool(args[i], highest, "Gt")) {
            highest = args[i];
        }
    }
    return highest;
};

Sk.builtin.any = function any (iter) {
    var it, i;

    Sk.builtin.pyCheckArgs("any", arguments, 1, 1);
    if (!Sk.builtin.checkIterable(iter)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) +
            "' object is not iterable");
    }

    it = Sk.abstr.iter(iter);
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.misceval.isTrue(i)) {
            return Sk.builtin.bool.true$;
        }
    }

    return Sk.builtin.bool.false$;
};

Sk.builtin.all = function all (iter) {
    var it, i;

    Sk.builtin.pyCheckArgs("all", arguments, 1, 1);
    if (!Sk.builtin.checkIterable(iter)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) +
            "' object is not iterable");
    }

    it = Sk.abstr.iter(iter);
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (!Sk.misceval.isTrue(i)) {
            return Sk.builtin.bool.false$;
        }
    }

    return Sk.builtin.bool.true$;
};

Sk.builtin.sum = function sum (iter, start) {
    var tot;
    var intermed;
    var it, i;
    var has_float;

    Sk.builtin.pyCheckArgs("sum", arguments, 1, 2);
    Sk.builtin.pyCheckType("iter", "iterable", Sk.builtin.checkIterable(iter));
    if (start !== undefined && Sk.builtin.checkString(start)) {
        throw new Sk.builtin.TypeError("sum() can't sum strings [use ''.join(seq) instead]");
    }
    if (start === undefined) {
        tot = new Sk.builtin.int_(0);
    } else {
        tot = start;
    }

    it = Sk.abstr.iter(iter);
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (i instanceof Sk.builtin.float_) {
            has_float = true;
            if (!(tot instanceof Sk.builtin.float_)) {
                tot = new Sk.builtin.float_(Sk.builtin.asnum$(tot));
            }
        } else if (i instanceof Sk.builtin.lng) {
            if (!has_float) {
                if (!(tot instanceof Sk.builtin.lng)) {
                    tot = new Sk.builtin.lng(tot);
                }
            }
        }

        if (tot.nb$add !== undefined) {
            intermed = tot.nb$add(i);
            if ((intermed !== undefined) && (intermed !== Sk.builtin.NotImplemented.NotImplemented$)) {
                tot = tot.nb$add(i);
                continue;
            }
        }

        throw new Sk.builtin.TypeError("unsupported operand type(s) for +: '" +
                    Sk.abstr.typeName(tot) + "' and '" +
                    Sk.abstr.typeName(i) + "'");
    }

    return tot;
};

Sk.builtin.zip = function zip () {
    var el;
    var tup;
    var done;
    var res;
    var i;
    var iters;
    if (arguments.length === 0) {
        return new Sk.builtin.list([]);
    }

    iters = [];
    for (i = 0; i < arguments.length; i++) {
        if (Sk.builtin.checkIterable(arguments[i])) {
            iters.push(Sk.abstr.iter(arguments[i]));
        } else {
            throw new Sk.builtin.TypeError("argument " + i + " must support iteration");
        }
    }
    res = [];
    done = false;
    while (!done) {
        tup = [];
        for (i = 0; i < arguments.length; i++) {
            el = iters[i].tp$iternext();
            if (el === undefined) {
                done = true;
                break;
            }
            tup.push(el);
        }
        if (!done) {
            res.push(new Sk.builtin.tuple(tup));
        }
    }
    return new Sk.builtin.list(res);
};

Sk.builtin.abs = function abs (x) {
    Sk.builtin.pyCheckArgs("abs", arguments, 1, 1);

    if (x instanceof Sk.builtin.int_) {
        return new Sk.builtin.int_(Math.abs(x.v));
    }
    if (x instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(Math.abs(x.v));
    }
    if (Sk.builtin.checkNumber(x)) {
        return Sk.builtin.assk$(Math.abs(Sk.builtin.asnum$(x)));
    } else if (Sk.builtin.checkComplex(x)) {
        return Sk.misceval.callsim(x.__abs__, x);
    }

    // call custom __abs__ methods
    if (x.tp$getattr) {
        var f = x.tp$getattr("__abs__");
        return Sk.misceval.callsim(f);
    }

    throw new TypeError("bad operand type for abs(): '" + Sk.abstr.typeName(x) + "'");
};

Sk.builtin.ord = function ord (x) {
    Sk.builtin.pyCheckArgs("ord", arguments, 1, 1);

    if (!Sk.builtin.checkString(x)) {
        throw new Sk.builtin.TypeError("ord() expected a string of length 1, but " + Sk.abstr.typeName(x) + " found");
    } else if (x.v.length !== 1) {
        throw new Sk.builtin.TypeError("ord() expected a character, but string of length " + x.v.length + " found");
    }
    return new Sk.builtin.int_((x.v).charCodeAt(0));
};

Sk.builtin.chr = function chr (x) {
    Sk.builtin.pyCheckArgs("chr", arguments, 1, 1);
    if (!Sk.builtin.checkInt(x)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }
    x = Sk.builtin.asnum$(x);


    if ((x < 0) || (x > 255)) {
        throw new Sk.builtin.ValueError("chr() arg not in range(256)");
    }

    return new Sk.builtin.str(String.fromCharCode(x));
};

Sk.builtin.unichr = function unichr (x) {
    Sk.builtin.pyCheckArgs("chr", arguments, 1, 1);
    if (!Sk.builtin.checkInt(x)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }
    x = Sk.builtin.asnum$(x);

    try {
        return new Sk.builtin.str(String.fromCodePoint(x));
    }
    catch (err) {
        if (err instanceof RangeError) {
            throw new Sk.builtin.ValueError(err.message);
        }
        throw err;
    }
};

Sk.builtin.int2str_ = function helper_ (x, radix, prefix) {
    var suffix;
    var str = "";
    if (x instanceof Sk.builtin.lng) {
        suffix = "";
        if (radix !== 2) {
            suffix = "L";
        }

        str = x.str$(radix, false);
        if (x.nb$isnegative()) {
            return new Sk.builtin.str("-" + prefix + str + suffix);
        }
        return new Sk.builtin.str(prefix + str + suffix);
    } else {
        x = Sk.misceval.asIndex(x);
        str = x.toString(radix);
        if (x < 0) {
            return new Sk.builtin.str("-" + prefix + str.slice(1));
        }
        return new Sk.builtin.str(prefix + str);
    }
};

Sk.builtin.hex = function hex (x) {
    Sk.builtin.pyCheckArgs("hex", arguments, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("hex() argument can't be converted to hex");
    }
    return Sk.builtin.int2str_(x, 16, "0x");
};

Sk.builtin.oct = function oct (x) {
    Sk.builtin.pyCheckArgs("oct", arguments, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("oct() argument can't be converted to hex");
    }
    return Sk.builtin.int2str_(x, 8, "0");
};

Sk.builtin.bin = function bin (x) {
    Sk.builtin.pyCheckArgs("bin", arguments, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(x) + "' object can't be interpreted as an index");
    }
    return Sk.builtin.int2str_(x, 2, "0b");
};

Sk.builtin.dir = function dir (x) {
    var last;
    var it;
    var prop;
    var base;
    var mro;
    var i;
    var s;
    var k;
    var names;
    var getName;
    Sk.builtin.pyCheckArgs("dir", arguments, 1, 1);

    getName = function (k) {
        var s = null;
        var internal = [
            "__bases__", "__mro__", "__class__", "__name__", "GenericGetAttr",
            "GenericSetAttr", "GenericPythonGetAttr", "GenericPythonSetAttr",
            "pythonFunctions", "HashNotImplemented", "constructor"];
        if (internal.indexOf(k) !== -1) {
            return null;
        }
        if (k.indexOf("$") !== -1) {
            s = Sk.builtin.dir.slotNameToRichName(k);
        } else if (k.charAt(k.length - 1) !== "_") {
            s = k;
        } else if (k.charAt(0) === "_") {
            s = k;
        }
        return s;
    };

    names = [];

    var _seq;

    // try calling magic method
    var special = Sk.abstr.lookupSpecial(x, "__dir__");
    if(special != null) {
        // method on builtin, provide this arg
        _seq = Sk.misceval.callsim(special, x);

        if (!Sk.builtin.checkSequence(_seq)) {
            throw new Sk.builtin.TypeError("__dir__ must return sequence.");
        }

        // proper unwrapping
        _seq = Sk.ffi.remapToJs(_seq);

        for (i = 0; i < _seq.length; ++i) {
            names.push(new Sk.builtin.str(_seq[i]));
        }
    } else {
        // Add all object properties
        for (k in x.constructor.prototype) {
            s = getName(k);
            if (s) {
                names.push(new Sk.builtin.str(s));
            }
        }

        // Add all attributes
        if (x["$d"]) {
            if (x["$d"].tp$iter) {
                // Dictionary
                it = x["$d"].tp$iter();
                for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    s = new Sk.builtin.str(i);
                    s = getName(s.v);
                    if (s) {
                        names.push(new Sk.builtin.str(s));
                    }
                }
            } else {
                // Object
                for (s in x["$d"]) {
                    names.push(new Sk.builtin.str(s));
                }
            }
        }

        // Add all class attributes
        mro = x.tp$mro;
        if(!mro && x.ob$type) {
            mro = x.ob$type.tp$mro;
        }
        if (mro) {
            for (i = 0; i < mro.v.length; ++i) {
                base = mro.v[i];
                for (prop in base) {
                    if (base.hasOwnProperty(prop)) {
                        s = getName(prop);
                        if (s) {
                            names.push(new Sk.builtin.str(s));
                        }
                    }
                }
            }
        }
    }

    // Sort results
    names.sort(function (a, b) {
        return (a.v > b.v) - (a.v < b.v);
    });

    // Get rid of duplicates before returning, as duplicates should
    //  only occur when they are shadowed
    last = function (value, index, self) {
        // Returns true iff the value is not the same as the next value
        return value !== self[index + 1];
    };
    return new Sk.builtin.list(names.filter(last));
};

Sk.builtin.dir.slotNameToRichName = function (k) {
    // todo; map tp$xyz to __xyz__ properly
    return undefined;
};

Sk.builtin.repr = function repr (x) {
    Sk.builtin.pyCheckArgs("repr", arguments, 1, 1);

    return Sk.misceval.objectRepr(x);
};

Sk.builtin.open = function open (filename, mode, bufsize) {
    Sk.builtin.pyCheckArgs("open", arguments, 1, 3);
    if (mode === undefined) {
        mode = new Sk.builtin.str("r");
    }

    return new Sk.builtin.file(filename, mode, bufsize);
};

Sk.builtin.isinstance = function isinstance (obj, type) {
    var issubclass;
    var i;
    Sk.builtin.pyCheckArgs("isinstance", arguments, 2, 2);
    if (!Sk.builtin.checkClass(type) && !(type instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("isinstance() arg 2 must be a class, type, or tuple of classes and types");
    }

    if (type === Sk.builtin.none.prototype.ob$type) {
        if (obj instanceof Sk.builtin.none) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    }

    // Normal case
    if (obj.ob$type === type) {
        return Sk.builtin.bool.true$;
    }

    // Handle tuple type argument
    if (type instanceof Sk.builtin.tuple) {
        for (i = 0; i < type.v.length; ++i) {
            if (Sk.misceval.isTrue(Sk.builtin.isinstance(obj, type.v[i]))) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    }

    // Check for Javascript inheritance
    if (obj instanceof type) {
        return Sk.builtin.bool.true$;
    }


    issubclass = function (klass, base) {
        var i;
        var bases;
        if (klass === base) {
            return Sk.builtin.bool.true$;
        }
        if (klass["$d"] === undefined) {
            return Sk.builtin.bool.false$;
        }
        bases = klass["$d"].mp$subscript(Sk.builtin.type.basesStr_);
        for (i = 0; i < bases.v.length; ++i) {
            if (Sk.misceval.isTrue(issubclass(bases.v[i], base))) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    };

    return issubclass(obj.ob$type, type);
};

Sk.builtin.hash = function hash (value) {
    var junk;
    Sk.builtin.pyCheckArgs("hash", arguments, 1, 1);

    // Useless object to get compiler to allow check for __hash__ property
    junk = {__hash__: function () {
        return 0;
    }};

    if (value instanceof Object) {
        if (Sk.builtin.checkNone(value.tp$hash)) {
            // python sets the hash function to None , so we have to catch this case here
            throw new Sk.builtin.TypeError(new Sk.builtin.str("unhashable type: '" + Sk.abstr.typeName(value) + "'"));
        } else if (value.tp$hash !== undefined) {
            if (value.$savedHash_) {
                return value.$savedHash_;
            }
            value.$savedHash_ = value.tp$hash();
            return value.$savedHash_;
        } else {
            if (value.__id === undefined) {
                Sk.builtin.hashCount += 1;
                value.__id = Sk.builtin.hashCount;
            }
            return new Sk.builtin.int_(value.__id);
        }
    } else if (typeof value === "number" || value === null ||
        value === true || value === false) {
        throw new Sk.builtin.TypeError("unsupported Javascript type");
    }

    return new Sk.builtin.str((typeof value) + " " + String(value));
    // todo; throw properly for unhashable types
};

Sk.builtin.getattr = function getattr (obj, name, default_) {
    var ret;
    Sk.builtin.pyCheckArgs("getattr", arguments, 2, 3);
    if (!Sk.builtin.checkString(name)) {
        throw new Sk.builtin.TypeError("attribute name must be string");
    }

    ret = obj.tp$getattr(name.v);
    if (ret === undefined) {
        if (default_ !== undefined) {
            return default_;
        } else {
            throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(obj) + "' object has no attribute '" + name.v + "'");
        }
    }
    return ret;
};

Sk.builtin.setattr = function setattr (obj, name, value) {

    Sk.builtin.pyCheckArgs("setattr", arguments, 3, 3);
    if (!Sk.builtin.checkString(name)) {
        throw new Sk.builtin.TypeError("attribute name must be string");
    }
    if (obj.tp$setattr) {
        obj.tp$setattr(Sk.ffi.remapToJs(name), value);
    } else {
        throw new Sk.builtin.AttributeError("object has no attribute " + Sk.ffi.remapToJs(name));
    }

    return Sk.builtin.none.none$;
};

Sk.builtin.raw_input = function (prompt) {
    var sys = Sk.importModule("sys");
    if (prompt) {
        Sk.misceval.callsimOrSuspend(sys["$d"]["stdout"]["write"], sys["$d"]["stdout"], new Sk.builtin.str(prompt));
    }
    return Sk.misceval.callsimOrSuspend(sys["$d"]["stdin"]["readline"], sys["$d"]["stdin"]);
};

Sk.builtin.input = Sk.builtin.raw_input;

Sk.builtin.jseval = function jseval (evalcode) {
    goog.global["eval"](evalcode);
};

Sk.builtin.jsmillis = function jsmillis () {
    var now = new Date();
    return now.valueOf();
};

Sk.builtin.superbi = function superbi () {
    throw new Sk.builtin.NotImplementedError("super is not yet implemented, please report your use case as a github issue.");
};

Sk.builtin.eval_ = function eval_ () {
    throw new Sk.builtin.NotImplementedError("eval is not yet implemented");
};

Sk.builtin.map = function map (fun, seq) {
    var iter, item;
    var retval;
    var next;
    var nones;
    var args;
    var argnum;
    var i;
    var iterables;
    var combined;
    Sk.builtin.pyCheckArgs("map", arguments, 2);

    if (arguments.length > 2) {
        // Pack sequences into one list of Javascript Arrays

        combined = [];
        iterables = Array.prototype.slice.apply(arguments).slice(1);
        for (i in iterables) {
            if (!Sk.builtin.checkIterable(iterables[i])) {
                argnum = parseInt(i, 10) + 2;
                throw new Sk.builtin.TypeError("argument " + argnum + " to map() must support iteration");
            }
            iterables[i] = Sk.abstr.iter(iterables[i]);
        }

        while (true) {
            args = [];
            nones = 0;
            for (i in iterables) {
                next = iterables[i].tp$iternext();
                if (next === undefined) {
                    args.push(Sk.builtin.none.none$);
                    nones++;
                } else {
                    args.push(next);
                }
            }
            if (nones !== iterables.length) {
                combined.push(args);
            } else {
                // All iterables are done
                break;
            }
        }
        seq = new Sk.builtin.list(combined);
    }
    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    retval = [];

    for (iter = Sk.abstr.iter(seq), item = iter.tp$iternext();
         item !== undefined;
         item = iter.tp$iternext()) {
        if (fun === Sk.builtin.none.none$) {
            if (item instanceof Array) {
                // With None function and multiple sequences,
                // map should return a list of tuples
                item = new Sk.builtin.tuple(item);
            }
            retval.push(item);
        } else {
            if (!(item instanceof Array)) {
                // If there was only one iterable, convert to Javascript
                // Array for call to apply.
                item = [item];
            }
            retval.push(Sk.misceval.apply(fun, undefined, undefined, undefined, item));
        }
    }

    return new Sk.builtin.list(retval);
};

Sk.builtin.reduce = function reduce (fun, seq, initializer) {
    var item;
    var accum_value;
    var iter;
    Sk.builtin.pyCheckArgs("reduce", arguments, 2, 3);
    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    iter = Sk.abstr.iter(seq);
    if (initializer === undefined) {
        initializer = iter.tp$iternext();
        if (initializer === undefined) {
            throw new Sk.builtin.TypeError("reduce() of empty sequence with no initial value");
        }
    }
    accum_value = initializer;
    for (item = iter.tp$iternext();
         item !== undefined;
         item = iter.tp$iternext()) {
        accum_value = Sk.misceval.callsim(fun, accum_value, item);
    }

    return accum_value;
};

Sk.builtin.filter = function filter (fun, iterable) {
    var result;
    var iter, item;
    var retval;
    var ret;
    var add;
    var ctor;
    Sk.builtin.pyCheckArgs("filter", arguments, 2, 2);

    if (!Sk.builtin.checkIterable(iterable)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
    }

    ctor = function () {
        return [];
    };
    add = function (iter, item) {
        iter.push(item);
        return iter;
    };
    ret = function (iter) {
        return new Sk.builtin.list(iter);
    };

    if (iterable.__class__ === Sk.builtin.str) {
        ctor = function () {
            return new Sk.builtin.str("");
        };
        add = function (iter, item) {
            return iter.sq$concat(item);
        };
        ret = function (iter) {
            return iter;
        };
    } else if (iterable.__class__ === Sk.builtin.tuple) {
        ret = function (iter) {
            return new Sk.builtin.tuple(iter);
        };
    }

    retval = ctor();

    for (iter = Sk.abstr.iter(iterable), item = iter.tp$iternext();
         item !== undefined;
         item = iter.tp$iternext()) {
        if (fun === Sk.builtin.none.none$) {
            result = new Sk.builtin.bool( item);
        } else {
            result = Sk.misceval.callsim(fun, item);
        }

        if (Sk.misceval.isTrue(result)) {
            retval = add(retval, item);
        }
    }

    return ret(retval);
};

Sk.builtin.hasattr = function hasattr (obj, attr) {
    Sk.builtin.pyCheckArgs("hasattr", arguments, 2, 2);
    if (!Sk.builtin.checkString(attr)) {
        throw new Sk.builtin.TypeError("hasattr(): attribute name must be string");
    }

    if (obj.tp$getattr) {
        if (obj.tp$getattr(attr.v)) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    } else {
        throw new Sk.builtin.AttributeError("Object has no tp$getattr method");
    }
};


Sk.builtin.pow = function pow (a, b, c) {
    var ret;
    var res;
    var right;
    var left;
    var c_num;
    var b_num;
    var a_num;
    Sk.builtin.pyCheckArgs("pow", arguments, 2, 3);

    if (c instanceof Sk.builtin.none) {
        c = undefined;
    }

    // add complex type hook here, builtin is messed up anyways
    if (Sk.builtin.checkComplex(a)) {
        return a.nb$power(b, c); // call complex pow function
    }

    a_num = Sk.builtin.asnum$(a);
    b_num = Sk.builtin.asnum$(b);
    c_num = Sk.builtin.asnum$(c);

    if (!Sk.builtin.checkNumber(a) || !Sk.builtin.checkNumber(b)) {
        if (c === undefined) {
            throw new Sk.builtin.TypeError("unsupported operand type(s) for pow(): '" + Sk.abstr.typeName(a) + "' and '" + Sk.abstr.typeName(b) + "'");
        }
        throw new Sk.builtin.TypeError("unsupported operand type(s) for pow(): '" + Sk.abstr.typeName(a) + "', '" + Sk.abstr.typeName(b) + "', '" + Sk.abstr.typeName(c) + "'");
    }
    if (a_num < 0 && b instanceof Sk.builtin.float_) {
        throw new Sk.builtin.ValueError("negative number cannot be raised to a fractional power");
    }

    if (c === undefined) {
        if ((a instanceof Sk.builtin.float_ || b instanceof Sk.builtin.float_) || (b_num < 0)) {
            return new Sk.builtin.float_(Math.pow(a_num, b_num));
        }

        left = new Sk.builtin.int_(a_num);
        right = new Sk.builtin.int_(b_num);
        res = left.nb$power(right);

        if (a instanceof Sk.builtin.lng || b instanceof Sk.builtin.lng) {
            return new Sk.builtin.lng(res);
        }

        return res;
    } else {
        if (!Sk.builtin.checkInt(a) || !Sk.builtin.checkInt(b) || !Sk.builtin.checkInt(c)) {
            throw new Sk.builtin.TypeError("pow() 3rd argument not allowed unless all arguments are integers");
        }
        if (b_num < 0) {
            throw new Sk.builtin.TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
        }

        if ((a instanceof Sk.builtin.lng || b instanceof Sk.builtin.lng || c instanceof Sk.builtin.lng) ||
            (Math.pow(a_num, b_num) === Infinity)) {
            // convert a to a long so that we can use biginteger's modPowInt method
            a = new Sk.builtin.lng(a);
            return a.nb$power(b, c);
        } else {
            ret = new Sk.builtin.int_(Math.pow(a_num, b_num));
            return ret.nb$remainder(c);
        }
    }
};

Sk.builtin.quit = function quit (msg) {
    var s = new Sk.builtin.str(msg).v;
    throw new Sk.builtin.SystemExit(s);
};


Sk.builtin.issubclass = function issubclass (c1, c2) {
    var i;
    var issubclass_internal;
    Sk.builtin.pyCheckArgs("issubclass", arguments, 2, 2);
    if (!Sk.builtin.checkClass(c2) && !(c2 instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("issubclass() arg 2 must be a classinfo, type, or tuple of classes and types");
    }

    issubclass_internal = function (klass, base) {
        var i;
        var bases;
        if (klass === base) {
            return true;
        }
        if (klass["$d"] === undefined) {
            return false;
        }
        if (klass["$d"].mp$subscript) {
            bases = klass["$d"].mp$subscript(Sk.builtin.type.basesStr_);
        } else {
            return false;
        }
        for (i = 0; i < bases.v.length; ++i) {
            if (issubclass_internal(bases.v[i], base)) {
                return true;
            }
        }
        return false;
    };

    if (Sk.builtin.checkClass(c2)) {
        /* Quick test for an exact match */
        if (c1 === c2) {
            return true;
        }

        return issubclass_internal(c1, c2);
    }

    // Handle tuple type argument
    if (c2 instanceof Sk.builtin.tuple) {
        for (i = 0; i < c2.v.length; ++i) {
            if (Sk.builtin.issubclass(c1, c2.v[i])) {
                return true;
            }
        }
        return false;
    }
};

Sk.builtin.globals = function globals () {
    var i;
    var ret = new Sk.builtin.dict([]);
    for (i in Sk["globals"]) {
        ret.mp$ass_subscript(new Sk.builtin.str(i), Sk["globals"][i]);
    }

    return ret;

};

Sk.builtin.divmod = function divmod (a, b) {
    return Sk.abstr.numberBinOp(a, b, "DivMod");
};

/**
 * Convert a value to a “formatted” representation, as controlled by format_spec. The interpretation of format_spec
 * will depend on the type of the value argument, however there is a standard formatting syntax that is used by most
 * built-in types: Format Specification Mini-Language.
 */
Sk.builtin.format = function format (value, format_spec) {
    Sk.builtin.pyCheckArgs("format", arguments, 1, 2);

    return Sk.abstr.objectFormat(value, format_spec);
};

Sk.builtin.reversed = function reversed (seq) {
    Sk.builtin.pyCheckArgs("reversed", arguments, 1, 1);

    var special = Sk.abstr.lookupSpecial(seq, "__reversed__");
    if (special != null) {
        return Sk.misceval.callsim(special, seq);
    } else {
        if (!Sk.builtin.checkSequence(seq)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not a sequence");
        }

        /**
         * Builds an iterator that outputs the items form last to first.
         *
         * @constructor
         */
        var reverseIter = function (obj) {
            this.idx = obj.sq$length() - 1;
            this.myobj = obj;
            this.getitem = Sk.abstr.lookupSpecial(obj, "__getitem__");
            this.tp$iter = function() {
                return this;
            },
            this.tp$iternext = function () {
                var ret;

                if (this.idx < 0) {
                    return undefined;
                }

                try {
                    ret = Sk.misceval.callsim(this.getitem, this.myobj, Sk.ffi.remapToPy(this.idx));
                } catch (e) {
                    if (e instanceof Sk.builtin.IndexError) {
                        return undefined;
                    } else {
                        throw e;
                    }
                }
                this.idx--;
                return ret;
            };
        };

        return new reverseIter(seq);
    }
};

Sk.builtin.bytearray = function bytearray () {
    throw new Sk.builtin.NotImplementedError("bytearray is not yet implemented");
};

Sk.builtin.callable = function callable (obj) {
    // check num of args
    Sk.builtin.pyCheckArgs("callable", arguments, 1, 1);

    if (Sk.builtin.checkCallable(obj)) {
        return Sk.builtin.bool.true$;
    }
    return Sk.builtin.bool.false$;
};

Sk.builtin.delattr = function delattr () {
    throw new Sk.builtin.NotImplementedError("delattr is not yet implemented");
};
Sk.builtin.execfile = function execfile () {
    throw new Sk.builtin.NotImplementedError("execfile is not yet implemented");
};

Sk.builtin.frozenset = function frozenset () {
    throw new Sk.builtin.NotImplementedError("frozenset is not yet implemented");
};

Sk.builtin.help = function help () {
    throw new Sk.builtin.NotImplementedError("help is not yet implemented");
};

Sk.builtin.iter = function iter (obj, sentinel) {
    Sk.builtin.pyCheckArgs("iter", arguments, 1, 2);
    if (arguments.length === 1) {
        if (!Sk.builtin.checkIterable(obj)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) + 
                "' object is not iterable");
        } else {
            return new Sk.builtin.iterator(obj);
        }
    } else {
        if (Sk.builtin.checkCallable(obj)) {
            return new Sk.builtin.iterator(obj, sentinel);
        } else {
            throw new TypeError("iter(v, w): v must be callable");
        }
    }
};

Sk.builtin.locals = function locals () {
    throw new Sk.builtin.NotImplementedError("locals is not yet implemented");
};
Sk.builtin.memoryview = function memoryview () {
    throw new Sk.builtin.NotImplementedError("memoryview is not yet implemented");
};

Sk.builtin.next_ = function next_ (iter, default_) {
    var nxt;
    Sk.builtin.pyCheckArgs("next", arguments, 1, 2);
    if (!iter.tp$iternext) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) +
            "' object is not an iterator");
    }
    nxt = iter.tp$iternext();
    if (nxt === undefined) {
        if (default_) {
            return default_;
        }
        throw new Sk.builtin.StopIteration();
    }
    return nxt;
};

Sk.builtin.property = function property () {
    throw new Sk.builtin.NotImplementedError("property is not yet implemented");
};
Sk.builtin.reload = function reload () {
    throw new Sk.builtin.NotImplementedError("reload is not yet implemented");
};
Sk.builtin.vars = function vars () {
    throw new Sk.builtin.NotImplementedError("vars is not yet implemented");
};
Sk.builtin.xrange = Sk.builtin.range;
Sk.builtin.apply_ = function apply_ () {
    throw new Sk.builtin.NotImplementedError("apply is not yet implemented");
};
Sk.builtin.buffer = function buffer () {
    throw new Sk.builtin.NotImplementedError("buffer is not yet implemented");
};
Sk.builtin.coerce = function coerce () {
    throw new Sk.builtin.NotImplementedError("coerce is not yet implemented");
};
Sk.builtin.intern = function intern () {
    throw new Sk.builtin.NotImplementedError("intern is not yet implemented");
};


/*
 Sk.builtinFiles = {};
 Sk.builtin.read = function read(x) {
 if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
 throw "File not found: '" + x + "'";
 return Sk.builtinFiles["files"][x];
 };
 Sk.builtinFiles = undefined;
 */



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/fromcodepoint.js ---- */ 

/*! https://mths.be/fromcodepoint v0.2.1 by @mathias */
if (!String.fromCodePoint) {
    (function() {
        var defineProperty = (function() {
            // IE 8 only supports `Object.defineProperty` on DOM elements
            var result;
            try {
                var object = {};
                var $defineProperty = Object.defineProperty;
                result = $defineProperty(object, "foo", object) && $defineProperty;
            } catch(error) {}
            return result;
        }());
        var stringFromCharCode = String.fromCharCode;
        var floor = Math.floor;
        var fromCodePoint = function(_) {
            var MAX_SIZE = 0x4000;
            var codeUnits = [];
            var highSurrogate;
            var lowSurrogate;
            var index = -1;
            var length = arguments.length;
            if (!length) {
                return "";
            }
            var result = "";
            while (++index < length) {
                var codePoint = Number(arguments[index]);
                if (
                    !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
                    codePoint < 0 || // not a valid Unicode code point
                    codePoint > 0x10FFFF || // not a valid Unicode code point
                    floor(codePoint) != codePoint // not an integer
                ) {
                    throw RangeError("Invalid code point: " + codePoint);
                }
                if (codePoint <= 0xFFFF) { // BMP code point
                    codeUnits.push(codePoint);
                } else { // Astral code point; split in surrogate halves
                    // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                    codePoint -= 0x10000;
                    highSurrogate = (codePoint >> 10) + 0xD800;
                    lowSurrogate = (codePoint % 0x400) + 0xDC00;
                    codeUnits.push(highSurrogate, lowSurrogate);
                }
                if (index + 1 == length || codeUnits.length > MAX_SIZE) {
                    result += stringFromCharCode.apply(null, codeUnits);
                    codeUnits.length = 0;
                }
            }
            return result;
        };
        if (defineProperty) {
            defineProperty(String, "fromCodePoint", {
                "value": fromCodePoint,
                "configurable": true,
                "writable": true
            });
        } else {
            String.fromCodePoint = fromCodePoint;
        }
    }());
}



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/errors.js ---- */ 

/*
 * The filename, line number, and column number of exceptions are
 * stored within the exception object.  Note that not all exceptions
 * clearly report the column number.  To customize the exception
 * message to use any/all of these fields, you can either modify
 * tp$str below to print the desired message, or use them in the
 * skulpt wrapper (i.e., runit) to present the exception message.
 */


/**
 * @constructor
 * @param {...Object|null} args
 */
Sk.builtin.BaseException = function (args) {
    var i, o;

    if (!(this instanceof Sk.builtin.BaseException)) {
        o = Object.create(Sk.builtin.BaseException.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }

    args = Array.prototype.slice.call(arguments);
    // hackage to allow shorter throws
    for (i = 0; i < args.length; ++i) {
        if (typeof args[i] === "string") {
            args[i] = new Sk.builtin.str(args[i]);
        }
    }
    this.args = new Sk.builtin.tuple(args);
    this.traceback = [];

    // For errors occurring during normal execution, the line/col/etc
    // of the error are populated by each stack frame of the runtime code,
    // but we can seed it with the supplied parameters.
    if (this.args.sq$length() >= 3) {

        // if !this.args[1].v, this is an error, and the exception that causes it
        // probably needs to be fixed, but we mark as "<unknown>" for now
        this.traceback.push({lineno: this.args.v[2],
                             filename: this.args.v[1].v || "<unknown>"});
    }
};
Sk.abstr.setUpInheritance("BaseException", Sk.builtin.BaseException, Sk.builtin.object);

Sk.builtin.BaseException.prototype.tp$str = function () {
    var i;
    var ret = "";

    ret += this.tp$name;
    if (this.args) {
        ret += ": " + (this.args.v.length > 0 ? this.args.v[0].v : "");
    }
    if (this.traceback.length !== 0) {
        ret += " on line " + this.traceback[0].lineno;
    } else {
        ret += " at <unknown>";
    }

    if (this.args.v.length > 4) {
        ret += "\n" + this.args.v[4].v + "\n";
        for (i = 0; i < this.args.v[3]; ++i) {
            ret += " ";
        }
        ret += "^\n";
    }

    /*for (i = 0; i < this.traceback.length; i++) {
        ret += "\n  at " + this.traceback[i].filename + " line " + this.traceback[i].lineno;
        if ("colno" in this.traceback[i]) {
            ret += " column " + this.traceback[i].colno;
        }
    }*/

    return new Sk.builtin.str(ret);
};

Sk.builtin.BaseException.prototype.toString = function () {
    return this.tp$str().v;
};

goog.exportSymbol("Sk.builtin.BaseException", Sk.builtin.BaseException);

/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {...*} args
 */
Sk.builtin.Exception = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.Exception)) {
        o = Object.create(Sk.builtin.Exception.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.BaseException.apply(this, arguments);
};
Sk.abstr.setUpInheritance("Exception", Sk.builtin.Exception, Sk.builtin.BaseException);
goog.exportSymbol("Sk.builtin.Exception", Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.StandardError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.StandardError)) {
        o = Object.create(Sk.builtin.StandardError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("StandardError", Sk.builtin.StandardError, Sk.builtin.Exception);
goog.exportSymbol("Sk.builtin.StandardError", Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.AssertionError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.AssertionError)) {
        o = Object.create(Sk.builtin.AssertionError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("AssertionError", Sk.builtin.AssertionError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.AssertionError", Sk.builtin.AssertionError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.AttributeError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.AttributeError)) {
        o = Object.create(Sk.builtin.AttributeError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("AttributeError", Sk.builtin.AttributeError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.ImportError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.ImportError)) {
        o = Object.create(Sk.builtin.ImportError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ImportError", Sk.builtin.ImportError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.IndentationError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.IndentationError)) {
        o = Object.create(Sk.builtin.IndentationError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IndentationError", Sk.builtin.IndentationError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.IndexError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.IndexError)) {
        o = Object.create(Sk.builtin.IndexError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IndexError", Sk.builtin.IndexError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.KeyError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.KeyError)) {
        o = Object.create(Sk.builtin.KeyError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("KeyError", Sk.builtin.KeyError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.NameError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.NameError)) {
        o = Object.create(Sk.builtin.NameError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NameError", Sk.builtin.NameError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.UnboundLocalError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.UnboundLocalError)) {
        o = Object.create(Sk.builtin.UnboundLocalError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("UnboundLocalError", Sk.builtin.UnboundLocalError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.OverflowError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.OverflowError)) {
        o = Object.create(Sk.builtin.OverflowError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("OverflowError", Sk.builtin.OverflowError, Sk.builtin.StandardError);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.SyntaxError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.SyntaxError)) {
        o = Object.create(Sk.builtin.SyntaxError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SyntaxError", Sk.builtin.SyntaxError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.RuntimeError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.RuntimeError)) {
        o = Object.create(Sk.builtin.RuntimeError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("RuntimeError", Sk.builtin.RuntimeError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.RuntimeError", Sk.builtin.RuntimeError);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.SuspensionError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.SuspensionError)) {
        o = Object.create(Sk.builtin.SuspensionError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SuspensionError", Sk.builtin.SuspensionError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.SuspensionError", Sk.builtin.SuspensionError);


/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {...*} args
 */
Sk.builtin.SystemExit = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.SystemExit)) {
        o = Object.create(Sk.builtin.SystemExit.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.BaseException.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SystemExit", Sk.builtin.SystemExit, Sk.builtin.BaseException);
goog.exportSymbol("Sk.builtin.SystemExit", Sk.builtin.SystemExit);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.TypeError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.TypeError)) {
        o = Object.create(Sk.builtin.TypeError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("TypeError", Sk.builtin.TypeError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.TypeError", Sk.builtin.TypeError);
/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.ValueError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.ValueError)) {
        o = Object.create(Sk.builtin.ValueError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ValueError", Sk.builtin.ValueError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.ValueError", Sk.builtin.ValueError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.ZeroDivisionError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.ZeroDivisionError)) {
        o = Object.create(Sk.builtin.ZeroDivisionError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ZeroDivisionError", Sk.builtin.ZeroDivisionError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.TimeLimitError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.TimeLimitError)) {
        o = Object.create(Sk.builtin.TimeLimitError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("TimeLimitError", Sk.builtin.TimeLimitError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.TimeLimitError", Sk.builtin.TimeLimitError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.IOError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.IOError)) {
        o = Object.create(Sk.builtin.IOError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IOError", Sk.builtin.IOError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.IOError", Sk.builtin.IOError);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.NotImplementedError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.NotImplementedError)) {
        o = Object.create(Sk.builtin.NotImplementedError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NotImplementedError", Sk.builtin.NotImplementedError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.NotImplementedError", Sk.builtin.NotImplementedError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.NegativePowerError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.NegativePowerError)) {
        o = Object.create(Sk.builtin.NegativePowerError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NegativePowerError", Sk.builtin.NegativePowerError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.NegativePowerError", Sk.builtin.NegativePowerError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {*} nativeError
 * @param {...*} args
 */
Sk.builtin.ExternalError = function (nativeError, args) {
    var o;
    if (!(this instanceof Sk.builtin.ExternalError)) {
        o = Object.create(Sk.builtin.ExternalError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    // Make the first argument a string, so it can be printed in Python without errors,
    // but save a reference to the real thing for Javascript consumption
    args = Array.prototype.slice.call(arguments);
    this.nativeError = args[0];
    if (!(args[0] instanceof Sk.builtin.str)) {
        args[0] = ""+args[0];
    }
    Sk.builtin.StandardError.apply(this, args);
};
Sk.abstr.setUpInheritance("ExternalError", Sk.builtin.ExternalError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.ExternalError", Sk.builtin.ExternalError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.OperationError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.OperationError)) {
        o = Object.create(Sk.builtin.OperationError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("OperationError", Sk.builtin.OperationError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.OperationError", Sk.builtin.OperationError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.SystemError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.SystemError)) {
        o = Object.create(Sk.builtin.SystemError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SystemError", Sk.builtin.SystemError, Sk.builtin.StandardError);
goog.exportSymbol("Sk.builtin.SystemError", Sk.builtin.SystemError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.StopIteration = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.StopIteration)) {
        o = Object.create(Sk.builtin.StopIteration.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("StopIteration", Sk.builtin.StopIteration, Sk.builtin.Exception);
goog.exportSymbol("Sk.builtin.StopIteration", Sk.builtin.StopIteration);


goog.exportSymbol("Sk", Sk);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/native.js ---- */ 

/*jshint loopfunc: true */

/*
 * Object to facilitate building native Javascript functions that
 * behave similarly to Python functions.
 *
 * Use:
 * foo = Sk.nativejs.func(function foo(...) {...});
 */


Sk.nativejs = {
    FN_ARGS            : /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
    FN_ARG_SPLIT       : /,/,
    FN_ARG             : /^\s*(_?)(\S+?)\1\s*$/,
    STRIP_COMMENTS     : /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
    formalParameterList: function (fn) {
        var r;
        var a;
        var arg;
        var fnText, argDecl;
        var args = [];
        fnText = fn.toString().replace(this.STRIP_COMMENTS, "");
        argDecl = fnText.match(this.FN_ARGS);

        r = argDecl[1].split(this.FN_ARG_SPLIT);
        for (a in r) {
            arg = r[a];
            arg.replace(this.FN_ARG, function (all, underscore, name) {
                args.push(name);
            });
        }
        return args;
    },
    func               : function (code) {
        code["co_name"] = new Sk.builtin.str(code.name);
        code["co_varnames"] = Sk.nativejs.formalParameterList(code);
        return new Sk.builtin.func(code);
    },
    func_nokw          : function (code) {
        code["co_name"] = new Sk.builtin.str(code.name);
        code["co_varnames"] = Sk.nativejs.formalParameterList(code);
        code["no_kw"] = true;
        return new Sk.builtin.func(code);
    }
};
goog.exportSymbol("Sk.nativejs.func", Sk.nativejs.func);
goog.exportSymbol("Sk.nativejs.func_nokw", Sk.nativejs.func_nokw);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/method.js ---- */ 

/**
 * @constructor
 *
 * co_varnames and co_name come from generated code, must access as dict.
 */
Sk.builtin.method = function (func, self) {
    this.im_func = func;
    this.im_self = self;
    //print("constructing method", this.im_func.tp$name, this.im_self.tp$name);
};
goog.exportSymbol("Sk.builtin.method", Sk.builtin.method);

Sk.builtin.method.prototype.tp$call = function (args, kw) {
    goog.asserts.assert(this.im_self, "should just be a function, not a method since there's no self?");
    goog.asserts.assert(this.im_func instanceof Sk.builtin.func);

    // 'args' and 'kw' get mucked around with heavily in applyOrSuspend();
    // changing it here is OK.
    args.unshift(this.im_self);

    // A method call is just a call to this.im_func with 'self' on the beginning of the args.
    // Do the necessary.

    return this.im_func.tp$call(args, kw);
};

Sk.builtin.method.prototype.tp$name = "instancemethod";

Sk.builtin.method.prototype["$r"] = function () {
    var name = (this.im_func.func_code && this.im_func.func_code["co_name"] && this.im_func.func_code["co_name"].v) || "<native JS>";
    return new Sk.builtin.str("<bound method " + this.im_self.ob$type.tp$name + "." + name +
        " of " + this.im_self["$r"]().v + ">");
};



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/misceval.js ---- */ 

/**
 * @namespace Sk.misceval
 *
 */
Sk.misceval = {};

/*
  Suspension object format:
  {resume: function() {...}, // the continuation - returns either another suspension or the return value
   data: <copied down from innermost level>,
   optional: <if true, can be resumed immediately (eg debug stops)>,
   child: <Suspension, or null if we are the innermost level>,
   $blk: <>, $loc: <>, $gbl: <>, $exc: <>, $err: <>, [$cell: <>],
  }
*/

/**
 *
 * Hi kids lets make a suspension...
 * @constructor
 * @param{function(?)=} resume A function to be called on resume. child is resumed first and its return value is passed to this function.
 * @param{Object=} child A child suspension. 'optional' will be copied from here if supplied.
 * @param{Object=} data Data attached to this suspension. Will be copied from child if not supplied.
 */
Sk.misceval.Suspension = function Suspension(resume, child, data) {
    this.$isSuspension = true;
    if (resume !== undefined && child !== undefined) {
        this.resume = function() { return resume(child.resume()); };
    }
    this.child = child;
    this.optional = child !== undefined && child.optional;
    if (data === undefined && child !== undefined) {
        this.data = child.data;
    } else {
        this.data = data;
    }
};
goog.exportSymbol("Sk.misceval.Suspension", Sk.misceval.Suspension);

/**
 *
 * Well this seems pretty obvious by the name what it should do..
 *
 * @param{Sk.misceval.Suspension} susp
 * @param{string=} message
 */
Sk.misceval.retryOptionalSuspensionOrThrow = function (susp, message) {
    while (susp instanceof Sk.misceval.Suspension) {
        if (!susp.optional) {
            throw new Sk.builtin.SuspensionError(message || "Cannot call a function that blocks or suspends here");
        }
        susp = susp.resume();
    }
    return susp;
};
goog.exportSymbol("Sk.misceval.retryOptionalSuspensionOrThrow", Sk.misceval.retryOptionalSuspensionOrThrow);

/**
 * Check if the given object is valid to use as an index. Only ints, or if the object has an `__index__` method.
 * @param o
 * @returns {boolean}
 */
Sk.misceval.isIndex = function (o) {
    if (Sk.builtin.checkInt(o)) {
        return true;
    }
    if (Sk.abstr.lookupSpecial(o, "__index__")) {
        return true;
    }
    return false;
};
goog.exportSymbol("Sk.misceval.isIndex", Sk.misceval.isIndex);

Sk.misceval.asIndex = function (o) {
    var idxfn, ret;

    if (!Sk.misceval.isIndex(o)) {
        return undefined;
    }
    if (o === null) {
        return undefined;
    }
    if (o === true) {
        return 1;
    }
    if (o === false) {
        return 0;
    }
    if (typeof o === "number") {
        return o;
    }
    if (o.constructor === Sk.builtin.int_) {
        return o.v;
    }
    if (o.constructor === Sk.builtin.lng) {
        return o.tp$index();
    }
    if (o.constructor === Sk.builtin.bool) {
        return Sk.builtin.asnum$(o);
    }
    idxfn = Sk.abstr.lookupSpecial(o, "__index__");
    if (idxfn) {
        ret = Sk.misceval.callsim(idxfn, o);
        if (!Sk.builtin.checkInt(ret)) {
            throw new Sk.builtin.TypeError("__index__ returned non-(int,long) (type " +
                                           Sk.abstr.typeName(ret) + ")");
        }
        return Sk.builtin.asnum$(ret);
    }
    goog.asserts.fail("todo asIndex;");
};

/**
 * return u[v:w]
 */
Sk.misceval.applySlice = function (u, v, w, canSuspend) {
    var ihigh;
    var ilow;
    if (u.sq$slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w)) {
        ilow = Sk.misceval.asIndex(v);
        if (ilow === undefined) {
            ilow = 0;
        }
        ihigh = Sk.misceval.asIndex(w);
        if (ihigh === undefined) {
            ihigh = 1e100;
        }
        return Sk.abstr.sequenceGetSlice(u, ilow, ihigh);
    }
    return Sk.abstr.objectGetItem(u, new Sk.builtin.slice(v, w, null), canSuspend);
};
goog.exportSymbol("Sk.misceval.applySlice", Sk.misceval.applySlice);

/**
 * u[v:w] = x
 */
Sk.misceval.assignSlice = function (u, v, w, x, canSuspend) {
    var slice;
    var ihigh;
    var ilow;
    if (u.sq$ass_slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w)) {
        ilow = Sk.misceval.asIndex(v) || 0;
        ihigh = Sk.misceval.asIndex(w) || 1e100;
        if (x === null) {
            Sk.abstr.sequenceDelSlice(u, ilow, ihigh);
        } else {
            Sk.abstr.sequenceSetSlice(u, ilow, ihigh, x);
        }
    } else {
        slice = new Sk.builtin.slice(v, w);
        if (x === null) {
            return Sk.abstr.objectDelItem(u, slice);
        } else {
            return Sk.abstr.objectSetItem(u, slice, x, canSuspend);
        }
    }
};
goog.exportSymbol("Sk.misceval.assignSlice", Sk.misceval.assignSlice);

/**
 * Used by min() and max() to get an array from arbitrary input.
 * Note that this does no validation, just coercion.
 */
Sk.misceval.arrayFromArguments = function (args) {
    // If args is not a single thing return as is
    var it, i;
    var res;
    var arg;
    if (args.length != 1) {
        return args;
    }
    arg = args[0];
    if (arg instanceof Sk.builtin.set) {
        // this is a Sk.builtin.set
        arg = arg.tp$iter().$obj;
    } else if (arg instanceof Sk.builtin.dict) {
        // this is a Sk.builtin.list
        arg = Sk.builtin.dict.prototype["keys"].func_code(arg);
    }

    // shouldn't else if here as the above may output lists to arg.
    if (arg instanceof Sk.builtin.list || arg instanceof Sk.builtin.tuple) {
        return arg.v;
    } else if (Sk.builtin.checkIterable(arg)) {
        // handle arbitrary iterable (strings, generators, etc.)
        res = [];
        for (it = Sk.abstr.iter(arg), i = it.tp$iternext();
             i !== undefined; i = it.tp$iternext()) {
            res.push(i);
        }
        return res;
    }

    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(arg) + "' object is not iterable");
};
goog.exportSymbol("Sk.misceval.arrayFromArguments", Sk.misceval.arrayFromArguments);

/**
 * for reversed comparison: Gt -> Lt, etc.
 */
Sk.misceval.swappedOp_ = {
    "Eq"   : "Eq",
    "NotEq": "NotEq",
    "Lt"   : "GtE",
    "LtE"  : "Gt",
    "Gt"   : "LtE",
    "GtE"  : "Lt",
    "Is"   : "IsNot",
    "IsNot": "Is",
    "In_"  : "NotIn",
    "NotIn": "In_"
};

/**
* @param{*} v
* @param{*} w
* @param{string} op
* @param{boolean=} canSuspend
 */
Sk.misceval.richCompareBool = function (v, w, op, canSuspend) {
    // v and w must be Python objects. will return Javascript true or false for internal use only
    // if you want to return a value from richCompareBool to Python you must wrap as Sk.builtin.bool first
    var wname,
        vname,
        ret,
        swapped_method,
        method,
        swapped_shortcut,
        shortcut,
        v_has_shortcut,
        w_has_shortcut,
        op2method,
        op2shortcut,
        vcmp,
        wcmp,
        w_seq_type,
        w_num_type,
        v_seq_type,
        v_num_type,
        sequence_types,
        numeric_types,
        w_type,
        v_type;

    goog.asserts.assert((v !== null) && (v !== undefined), "passed null or undefined parameter to Sk.misceval.richCompareBool");
    goog.asserts.assert((w !== null) && (w !== undefined), "passed null or undefined parameter to Sk.misceval.richCompareBool");

    v_type = new Sk.builtin.type(v);
    w_type = new Sk.builtin.type(w);

    // Python has specific rules when comparing two different builtin types
    // currently, this code will execute even if the objects are not builtin types
    // but will fall through and not return anything in this section
    if ((v_type !== w_type) &&
        (op === "GtE" || op === "Gt" || op === "LtE" || op === "Lt")) {
        // note: sets are omitted here because they can only be compared to other sets
        numeric_types = [Sk.builtin.float_.prototype.ob$type,
            Sk.builtin.int_.prototype.ob$type,
            Sk.builtin.lng.prototype.ob$type,
            Sk.builtin.bool.prototype.ob$type];
        sequence_types = [Sk.builtin.dict.prototype.ob$type,
            Sk.builtin.enumerate.prototype.ob$type,
            Sk.builtin.list.prototype.ob$type,
            Sk.builtin.str.prototype.ob$type,
            Sk.builtin.tuple.prototype.ob$type];

        v_num_type = numeric_types.indexOf(v_type);
        v_seq_type = sequence_types.indexOf(v_type);
        w_num_type = numeric_types.indexOf(w_type);
        w_seq_type = sequence_types.indexOf(w_type);

        // NoneTypes are considered less than any other type in Python
        // note: this only handles comparing NoneType with any non-NoneType.
        // Comparing NoneType with NoneType is handled further down.
        if (v_type === Sk.builtin.none.prototype.ob$type) {
            switch (op) {
                case "Lt":
                    return true;
                case "LtE":
                    return true;
                case "Gt":
                    return false;
                case "GtE":
                    return false;
            }
        }

        if (w_type === Sk.builtin.none.prototype.ob$type) {
            switch (op) {
                case "Lt":
                    return false;
                case "LtE":
                    return false;
                case "Gt":
                    return true;
                case "GtE":
                    return true;
            }
        }

        // numeric types are always considered smaller than sequence types in Python
        if (v_num_type !== -1 && w_seq_type !== -1) {
            switch (op) {
                case "Lt":
                    return true;
                case "LtE":
                    return true;
                case "Gt":
                    return false;
                case "GtE":
                    return false;
            }
        }

        if (v_seq_type !== -1 && w_num_type !== -1) {
            switch (op) {
                case "Lt":
                    return false;
                case "LtE":
                    return false;
                case "Gt":
                    return true;
                case "GtE":
                    return true;
            }
        }

        // in Python, different sequence types are ordered alphabetically
        // by name so that dict < list < str < tuple
        if (v_seq_type !== -1 && w_seq_type !== -1) {
            switch (op) {
                case "Lt":
                    return v_seq_type < w_seq_type;
                case "LtE":
                    return v_seq_type <= w_seq_type;
                case "Gt":
                    return v_seq_type > w_seq_type;
                case "GtE":
                    return v_seq_type >= w_seq_type;
            }
        }
    }


    // handle identity and membership comparisons
    if (op === "Is") {
        if (v instanceof Sk.builtin.int_ && w instanceof Sk.builtin.int_) {
            return v.numberCompare(w) === 0;
        } else if (v instanceof Sk.builtin.float_ && w instanceof Sk.builtin.float_) {
            return v.numberCompare(w) === 0;
        } else if (v instanceof Sk.builtin.lng && w instanceof Sk.builtin.lng) {
            return v.longCompare(w) === 0;
        }

        return v === w;
    }

    if (op === "IsNot") {
        if (v instanceof Sk.builtin.int_ && w instanceof Sk.builtin.int_) {
            return v.numberCompare(w) !== 0;
        } else if (v instanceof Sk.builtin.float_ && w instanceof Sk.builtin.float_) {
            return v.numberCompare(w) !== 0;
        }else if (v instanceof Sk.builtin.lng && w instanceof Sk.builtin.lng) {
            return v.longCompare(w) !== 0;
        }

        return v !== w;
    }

    if (op === "In") {
        return Sk.misceval.chain(Sk.abstr.sequenceContains(w, v, canSuspend), Sk.misceval.isTrue);
    }
    if (op === "NotIn") {
        return Sk.misceval.chain(Sk.abstr.sequenceContains(w, v, canSuspend),
                                 function(x) { return !Sk.misceval.isTrue(x); });
    }

    // Call Javascript shortcut method if exists for either object

    op2shortcut = {
        "Eq"   : "ob$eq",
        "NotEq": "ob$ne",
        "Gt"   : "ob$gt",
        "GtE"  : "ob$ge",
        "Lt"   : "ob$lt",
        "LtE"  : "ob$le"
    };

    shortcut = op2shortcut[op];
    v_has_shortcut = v.constructor.prototype.hasOwnProperty(shortcut);
    if (v_has_shortcut) {
        if ((ret = v[shortcut](w)) !== Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    swapped_shortcut = op2shortcut[Sk.misceval.swappedOp_[op]];
    w_has_shortcut = w.constructor.prototype.hasOwnProperty(swapped_shortcut);
    if (w_has_shortcut) {

        if ((ret = w[swapped_shortcut](v)) !== Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    // use comparison methods if they are given for either object
    if (v.tp$richcompare && (ret = v.tp$richcompare(w, op)) !== undefined) {
        if (ret != Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    if (w.tp$richcompare && (ret = w.tp$richcompare(v, Sk.misceval.swappedOp_[op])) !== undefined) {
        if (ret != Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }


    // depending on the op, try left:op:right, and if not, then
    // right:reversed-top:left

    op2method = {
        "Eq"   : "__eq__",
        "NotEq": "__ne__",
        "Gt"   : "__gt__",
        "GtE"  : "__ge__",
        "Lt"   : "__lt__",
        "LtE"  : "__le__"
    };

    method = Sk.abstr.lookupSpecial(v, op2method[op]);
    if (method && !v_has_shortcut) {
        ret = Sk.misceval.callsim(method, v, w);
        if (ret != Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    swapped_method = Sk.abstr.lookupSpecial(w, op2method[Sk.misceval.swappedOp_[op]]);
    if (swapped_method && !w_has_shortcut) {
        ret = Sk.misceval.callsim(swapped_method, w, v);
        if (ret != Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    vcmp = Sk.abstr.lookupSpecial(v, "__cmp__");
    if (vcmp) {
        try {
            ret = Sk.misceval.callsim(vcmp, v, w);
            if (Sk.builtin.checkNumber(ret)) {
                ret = Sk.builtin.asnum$(ret);
                if (op === "Eq") {
                    return ret === 0;
                } else if (op === "NotEq") {
                    return ret !== 0;
                } else if (op === "Lt") {
                    return ret < 0;
                } else if (op === "Gt") {
                    return ret > 0;
                } else if (op === "LtE") {
                    return ret <= 0;
                } else if (op === "GtE") {
                    return ret >= 0;
                }
            }

            if (ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                throw new Sk.builtin.TypeError("comparison did not return an int");
            }
        } catch (e) {
            throw new Sk.builtin.TypeError("comparison did not return an int");
        }
    }

    wcmp = Sk.abstr.lookupSpecial(w, "__cmp__");
    if (wcmp) {
        // note, flipped on return value and call
        try {
            ret = Sk.misceval.callsim(wcmp, w, v);
            if (Sk.builtin.checkNumber(ret)) {
                ret = Sk.builtin.asnum$(ret);
                if (op === "Eq") {
                    return ret === 0;
                } else if (op === "NotEq") {
                    return ret !== 0;
                } else if (op === "Lt") {
                    return ret > 0;
                } else if (op === "Gt") {
                    return ret < 0;
                } else if (op === "LtE") {
                    return ret >= 0;
                } else if (op === "GtE") {
                    return ret <= 0;
                }
            }

            if (ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                throw new Sk.builtin.TypeError("comparison did not return an int");
            }
        } catch (e) {
            throw new Sk.builtin.TypeError("comparison did not return an int");
        }
    }

    // handle special cases for comparing None with None or Bool with Bool
    if (((v instanceof Sk.builtin.none) && (w instanceof Sk.builtin.none)) ||
        ((v instanceof Sk.builtin.bool) && (w instanceof Sk.builtin.bool))) {
        // Javascript happens to return the same values when comparing null
        // with null or true/false with true/false as Python does when
        // comparing None with None or True/False with True/False

        if (op === "Eq") {
            return v.v === w.v;
        }
        if (op === "NotEq") {
            return v.v !== w.v;
        }
        if (op === "Gt") {
            return v.v > w.v;
        }
        if (op === "GtE") {
            return v.v >= w.v;
        }
        if (op === "Lt") {
            return v.v < w.v;
        }
        if (op === "LtE") {
            return v.v <= w.v;
        }
    }


    // handle equality comparisons for any remaining objects
    if (op === "Eq") {
        if ((v instanceof Sk.builtin.str) && (w instanceof Sk.builtin.str)) {
            return v.v === w.v;
        }
        return v === w;
    }
    if (op === "NotEq") {
        if ((v instanceof Sk.builtin.str) && (w instanceof Sk.builtin.str)) {
            return v.v !== w.v;
        }
        return v !== w;
    }

    vname = Sk.abstr.typeName(v);
    wname = Sk.abstr.typeName(w);
    throw new Sk.builtin.ValueError("don't know how to compare '" + vname + "' and '" + wname + "'");
};
goog.exportSymbol("Sk.misceval.richCompareBool", Sk.misceval.richCompareBool);

Sk.misceval.objectRepr = function (v) {
    goog.asserts.assert(v !== undefined, "trying to repr undefined");
    if ((v === null) || (v instanceof Sk.builtin.none)) {
        return new Sk.builtin.str("None");
    } else if (v === true) {
        // todo; these should be consts
        return new Sk.builtin.str("True");
    } else if (v === false) {
        return new Sk.builtin.str("False");
    } else if (typeof v === "number") {
        return new Sk.builtin.str("" + v);
    } else if (!v["$r"]) {
        if (v.tp$name) {
            return new Sk.builtin.str("<" + v.tp$name + " object>");
        } else {
            return new Sk.builtin.str("<unknown>");
        }
    } else if (v.constructor === Sk.builtin.float_) {
        if (v.v === Infinity) {
            return new Sk.builtin.str("inf");
        } else if (v.v === -Infinity) {
            return new Sk.builtin.str("-inf");
        } else {
            return v["$r"]();
        }
    } else if (v.constructor === Sk.builtin.int_) {
        return v["$r"]();
    } else {
        return v["$r"]();
    }
};
goog.exportSymbol("Sk.misceval.objectRepr", Sk.misceval.objectRepr);

Sk.misceval.opAllowsEquality = function (op) {
    switch (op) {
        case "LtE":
        case "Eq":
        case "GtE":
            return true;
    }
    return false;
};
goog.exportSymbol("Sk.misceval.opAllowsEquality", Sk.misceval.opAllowsEquality);

Sk.misceval.isTrue = function (x) {
    var ret;
    if (x === true) {
        return true;
    }
    if (x === false) {
        return false;
    }
    if (x === null) {
        return false;
    }
    if (x.constructor === Sk.builtin.none) {
        return false;
    }

    if (x.constructor === Sk.builtin.NotImplemented) {
        return false;
    }

    if (x.constructor === Sk.builtin.bool) {
        return x.v;
    }
    if (typeof x === "number") {
        return x !== 0;
    }
    if (x instanceof Sk.builtin.lng) {
        return x.nb$nonzero();
    }
    if (x.constructor === Sk.builtin.int_) {
        return x.v !== 0;
    }
    if (x.constructor === Sk.builtin.float_) {
        return x.v !== 0;
    }
    if (x["__nonzero__"]) {
        ret = Sk.misceval.callsim(x["__nonzero__"], x);
        if (!Sk.builtin.checkInt(ret)) {
            throw new Sk.builtin.TypeError("__nonzero__ should return an int");
        }
        return Sk.builtin.asnum$(ret) !== 0;
    }
    if (x["__len__"]) {
        ret = Sk.misceval.callsim(x["__len__"], x);
        if (!Sk.builtin.checkInt(ret)) {
            throw new Sk.builtin.TypeError("__len__ should return an int");
        }
        return Sk.builtin.asnum$(ret) !== 0;
    }
    if (x.mp$length) {
        return Sk.builtin.asnum$(x.mp$length()) !== 0;
    }
    if (x.sq$length) {
        return Sk.builtin.asnum$(x.sq$length()) !== 0;
    }
    return true;
};
goog.exportSymbol("Sk.misceval.isTrue", Sk.misceval.isTrue);

Sk.misceval.softspace_ = false;
Sk.misceval.print_ = function (x) {
    // this was function print(x)   not sure why...
    var isspace;
    var s;
    if (Sk.misceval.softspace_) {
        if (x !== "\n") {
            Sk.output(" ");
        }
        Sk.misceval.softspace_ = false;
    }
    s = new Sk.builtin.str(x);
    var sys = Sk.importModule("sys");
    Sk.misceval.apply(sys["$d"]["stdout"]["write"], undefined, undefined, undefined, [sys["$d"]["stdout"], s]);
    isspace = function (c) {
        return c === "\n" || c === "\t" || c === "\r";
    };
    if (s.v.length === 0 || !isspace(s.v[s.v.length - 1]) || s.v[s.v.length - 1] === " ") {
        Sk.misceval.softspace_ = true;
    }
};
goog.exportSymbol("Sk.misceval.print_", Sk.misceval.print_);

/**
 * @param {string} name
 * @param {Object=} other generally globals
 */
Sk.misceval.loadname = function (name, other) {
    var bi;
    var v = other[name];
    if (v !== undefined) {
        return v;
    }

    bi = Sk.builtins[name];
    if (bi !== undefined) {
        return bi;
    }

    name = name.replace("_$rw$", "");
    name = name.replace("_$rn$", "");
    throw new Sk.builtin.NameError("name '" + name + "' is not defined");
};
goog.exportSymbol("Sk.misceval.loadname", Sk.misceval.loadname);

/**
 *
 * Notes on necessity for 'call()':
 *
 * Classes are callable in python to create an instance of the class. If
 * we're calling "C()" we cannot tell at the call site whether we're
 * calling a standard function, or instantiating a class.
 *
 * JS does not support user-level callables. So, we can't use the normal
 * prototype hierarchy to make the class inherit from a 'class' type
 * where the various tp$getattr, etc. methods would live.
 *
 * Instead, we must copy all the methods from the prototype of our class
 * type onto every instance of the class constructor function object.
 * That way, both "C()" and "C.tp$getattr(...)" can still work. This is
 * of course quite expensive.
 *
 * The alternative would be to indirect all calls (whether classes or
 * regular functions) through something like C.$call(...). In the case
 * of class construction, $call could then call the constructor after
 * munging arguments to pass them on. This would impose a penalty on
 * regular function calls unfortunately, as they would have to do the
 * same thing.
 *
 * Note that the same problem exists for function objects too (a "def"
 * creates a function object that also has properties). It just happens
 * that attributes on classes in python are much more useful and common
 * that the attributes on functions.
 *
 * Also note, that for full python compatibility we have to do the $call
 * method because any python object could have a __call__ method which
 * makes the python object callable too. So, unless we were to make
 * *all* objects simply (function(){...}) and use the dict to create
 * hierarchy, there would be no way to call that python user function. I
 * think I'm prepared to sacrifice __call__ support, or only support it
 * post-ECMA5 or something.
 *
 * Is using (function(){...}) as the only object type too crazy?
 * Probably. Better or worse than having two levels of function
 * invocation for every function call?
 *
 * For a class `C' with instance `inst' we have the following cases:
 *
 * 1. C.attr
 *
 * 2. C.staticmeth()
 *
 * 3. x = C.staticmeth; x()
 *
 * 4. inst = C()
 *
 * 5. inst.attr
 *
 * 6. inst.meth()
 *
 * 7. x = inst.meth; x()
 *
 * 8. inst(), where C defines a __call__
 *
 * Because in general these are accomplished by a helper function
 * (tp$getattr/setattr/slice/ass_slice/etc.) it seems appropriate to add
 * a call that generally just calls through, but sometimes handles the
 * unusual cases. Once ECMA-5 is more broadly supported we can revisit
 * and hopefully optimize.
 *
 * @param {Object} func the thing to call
 * @param {Object=} kwdict **kwargs
 * @param {Object=} varargseq **args
 * @param {Object=} kws keyword args or undef
 * @param {...*} args stuff to pass it
 *
 *
 * TODO I think all the above is out of date.
 */
Sk.misceval.call = function (func, kwdict, varargseq, kws, args) {
    args = Array.prototype.slice.call(arguments, 4);
    // todo; possibly inline apply to avoid extra stack frame creation
    return Sk.misceval.apply(func, kwdict, varargseq, kws, args);
};
goog.exportSymbol("Sk.misceval.call", Sk.misceval.call);

/**
 * @param {?Object} suspensionHandlers
 * @param {Object} func the thing to call
 * @param {Object=} kwdict **kwargs
 * @param {Object=} varargseq **args
 * @param {Object=} kws keyword args or undef
 * @param {...*} args stuff to pass it
 *
 *
 * TODO I think all the above is out of date.
 */

Sk.misceval.callAsync = function (suspensionHandlers, func, kwdict, varargseq, kws, args) {
    args = Array.prototype.slice.call(arguments, 5);
    // todo; possibly inline apply to avoid extra stack frame creation
    return Sk.misceval.applyAsync(suspensionHandlers, func, kwdict, varargseq, kws, args);
};
goog.exportSymbol("Sk.misceval.callAsync", Sk.misceval.callAsync);


Sk.misceval.callOrSuspend = function (func, kwdict, varargseq, kws, args) {
    args = Array.prototype.slice.call(arguments, 4);
    // todo; possibly inline apply to avoid extra stack frame creation
    return Sk.misceval.applyOrSuspend(func, kwdict, varargseq, kws, args);
};
goog.exportSymbol("Sk.misceval.callOrSuspend", Sk.misceval.callOrSuspend);

/**
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
Sk.misceval.callsim = function (func, args) {
    args = Array.prototype.slice.call(arguments, 1);
    return Sk.misceval.apply(func, undefined, undefined, undefined, args);
};
goog.exportSymbol("Sk.misceval.callsim", Sk.misceval.callsim);

/**
 * @param {?Object} suspensionHandlers any custom suspension handlers
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
Sk.misceval.callsimAsync = function (suspensionHandlers, func, args) {
    args = Array.prototype.slice.call(arguments, 2);
    return Sk.misceval.applyAsync(suspensionHandlers, func, undefined, undefined, undefined, args);
};
goog.exportSymbol("Sk.misceval.callsimAsync", Sk.misceval.callsimAsync);


/**
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
Sk.misceval.callsimOrSuspend = function (func, args) {
    args = Array.prototype.slice.call(arguments, 1);
    return Sk.misceval.applyOrSuspend(func, undefined, undefined, undefined, args);
};
goog.exportSymbol("Sk.misceval.callsimOrSuspend", Sk.misceval.callsimOrSuspend);

/**
 * Wrap Sk.misceval.applyOrSuspend, but throw an error if we suspend
 */
Sk.misceval.apply = function (func, kwdict, varargseq, kws, args) {
    var r = Sk.misceval.applyOrSuspend(func, kwdict, varargseq, kws, args);
    if (r instanceof Sk.misceval.Suspension) {
        return Sk.misceval.retryOptionalSuspensionOrThrow(r);
    } else {
        return r;
    }
};
goog.exportSymbol("Sk.misceval.apply", Sk.misceval.apply);

/**
 * Wraps anything that can return an Sk.misceval.Suspension, and returns a
 * JS Promise with the result. Also takes an object map of suspension handlers:
 * pass in {"suspType": function (susp) {} }, and your function will be called
 * with the Suspension object if susp.type=="suspType". The type "*" will match
 * all otherwise unhandled suspensions.
 *
 * A suspension handler should return a Promise yielding the return value of
 * r.resume() - ie, either the final return value of this call or another
 * Suspension. That is, the null suspension handler is:
 *
 *     function handler(susp) {
 *       return new Promise(function(resolve, reject) {
 *         try {
 *           resolve(susp.resume());
 *         } catch(e) {
 *           reject(e);
 *         }
 *       });
 *     }
 *
 * Alternatively, a handler can return null to perform the default action for
 * that suspension type.
 *
 * (Note: do *not* call asyncToPromise() in a suspension handler; this will
 * create a new Promise object for each such suspension that occurs)
 *
 * asyncToPromise() returns a Promise that will be resolved with the final
 * return value, or rejected with an exception if one is thrown.
 *
 * @param{function()} suspendablefn returns either a result or a Suspension
 * @param{Object=} suspHandlers an object map of suspension handlers
 */
Sk.misceval.asyncToPromise = function(suspendablefn, suspHandlers) {
    return new Promise(function(resolve, reject) {
        try {
            var r = suspendablefn();

            (function handleResponse (r) {
                try {
                    // jsh*nt insists these be defined outside the loop
                    var resume = function() {
                        handleResponse(r.resume());
                    };
                    var resumeWithData = function resolved(x) {
                        try {
                            r.data["result"] = x;
                            resume();
                        } catch(e) {
                            reject(e);
                        }
                    };
                    var resumeWithError = function rejected(e) {
                        try {
                            r.data["error"] = e;
                            resume();
                        } catch(ex) {
                            reject(ex);
                        }
                    };


                    while (r instanceof Sk.misceval.Suspension) {

                        var handler = suspHandlers && (suspHandlers[r.data["type"]] || suspHandlers["*"]);

                        if (handler) {
                            var handlerPromise = handler(r);
                            if (handlerPromise) {
                                handlerPromise.then(handleResponse, reject);
                                return;
                            }
                        }

                        if (r.data["type"] == "Sk.promise") {
                            r.data["promise"].then(resumeWithData, resumeWithError);
                            return;

                        } else if (r.data["type"] == "Sk.yield") {
                            // Assumes all yields are optional, as Sk.setTimeout might
                            // not be able to yield.
                            Sk.setTimeout(resume, 0);
                            return;

                        } else if (r.optional) {
                            // Unhandled optional suspensions just get
                            // resumed immediately, and we go around the loop again.
                            r = r.resume();

                        } else {
                            // Unhandled, non-optional suspension.
                            throw new Sk.builtin.SuspensionError("Unhandled non-optional suspension of type '"+r.data["type"]+"'");
                        }
                    }

                    resolve(r);
                } catch(e) {
                    reject(e);
                }
            })(r);

        } catch (e) {
            reject(e);
        }
    });
};
goog.exportSymbol("Sk.misceval.asyncToPromise", Sk.misceval.asyncToPromise);

Sk.misceval.applyAsync = function (suspHandlers, func, kwdict, varargseq, kws, args) {
    return Sk.misceval.asyncToPromise(function() {
        return Sk.misceval.applyOrSuspend(func, kwdict, varargseq, kws, args);
    }, suspHandlers);
};
goog.exportSymbol("Sk.misceval.applyAsync", Sk.misceval.applyAsync);

/**
 * Chain together a set of functions, each of which might return a value or
 * an Sk.misceval.Suspension. Each function is called with the return value of
 * the preceding function, but does not see any suspensions. If a function suspends,
 * Sk.misceval.chain() returns a suspension that will resume the chain once an actual
 * return value is available.
 *
 * The idea is to allow a Promise-like chaining of possibly-suspending steps without
 * repeating boilerplate suspend-and-resume code.
 *
 * For example, imagine we call Sk.misceval.chain(x, f).
 *  - If x is a value, we return f(x).
 *  - If x is a suspension, we suspend. We will suspend and resume until we get a
 *    return value, and then we will return f(<resumed-value).
 * This can be expanded to an arbitrary number of functions
 * (eg Sk.misceval.chain(x, f, g), which is equivalent to chain(chain(x, f), g).)
 *
 * @param {*}              initialValue
 * @param {...function(*)} chainedFns
 */

Sk.misceval.chain = function (initialValue, chainedFns) {
    // We try to minimse overhead when nothing suspends (the common case)
    var i = 1, value = initialValue, j, fs;

    while (true) {
        if (i == arguments.length) {
            return value;
        }
        if (value && value.$isSuspension) { break; } // oops, slow case
        value = arguments[i](value);
        i++;
    }

    // Okay, we've suspended at least once, so we're taking the slow(er) path.

    // Copy our remaining arguments into an array (inline, because passing
    // "arguments" out of a function kills the V8 optimiser).
    // (discussion: https://github.com/skulpt/skulpt/pull/552)
    fs = new Array(arguments.length - i);

    for (j = 0; j < arguments.length - i; j++) {
        fs[j] = arguments[i+j];
    }

    j = 0;

    return (function nextStep(r) {
        while (j < fs.length) {
            if (r instanceof Sk.misceval.Suspension) {
                return new Sk.misceval.Suspension(nextStep, r);
            }

            r = fs[j](r);
            j++;
        }

        return r;
    })(value);
};
goog.exportSymbol("Sk.misceval.chain", Sk.misceval.chain);


/**
 * Catch any exceptions thrown by a function, or by resuming any suspension it
 * returns.
 *
 *     var result = Sk.misceval.tryCatch(asyncFunc, function(err) {
 *       console.log(err);
 *     });
 *
 * Because exceptions are returned asynchronously aswell you can't catch them
 * with a try/catch. That's what this function is for.
 */
Sk.misceval.tryCatch = function (tryFn, catchFn) {
    var r;

    try {
        r = tryFn();
    } catch(e) {
        return catchFn(e);
    }

    if (r instanceof Sk.misceval.Suspension) {
        var susp = new Sk.misceval.Suspension(undefined, r);
        susp.resume = function() { return Sk.misceval.tryCatch(r.resume, catchFn); };
        return susp;
    } else {
        return r;
    }
};
goog.exportSymbol("Sk.misceval.tryCatch", Sk.misceval.tryCatch);

/**
 * Perform a suspension-aware for-each on an iterator, without
 * blowing up the stack.
 * forFn() is called for each element in the iterator, with two
 * arguments: the current element and the previous return value
 * of forFn() (or initialValue on the first call). In this way,
 * iterFor() can be used as a simple for loop, or alternatively
 * as a 'reduce' operation. The return value of the final call to
 * forFn() will be the return value of iterFor() (after all
 * suspensions are resumed, that is; if the iterator is empty then
 * initialValue will be returned.)
 *
 * The iteration can be terminated early, by returning
 * an instance of Sk.misceval.Break. If an argument is given to
 * the Sk.misceval.Break() constructor, that value will be
 * returned from iterFor(). It is therefore possible to use
 * iterFor() on infinite iterators.
 *
 * @param {*} iter
 * @param {function(*,*=)} forFn
 * @param {*=} initialValue
 */
Sk.misceval.iterFor = function (iter, forFn, initialValue) {
    var prevValue = initialValue;

    var breakOrIterNext = function(r) {
        prevValue = r;
        return (r instanceof Sk.misceval.Break) ? r : iter.tp$iternext(true);
    };

    return (function nextStep(i) {
        while (i !== undefined) {
            if (i instanceof Sk.misceval.Suspension) {
                return new Sk.misceval.Suspension(nextStep, i);
            }

            if (i === Sk.misceval.Break || i instanceof Sk.misceval.Break) {
                return i.brValue;
            }

            i = Sk.misceval.chain(
                forFn(i, prevValue),
                breakOrIterNext
            );
        }
        return prevValue;
    })(iter.tp$iternext(true));
};
goog.exportSymbol("Sk.misceval.iterFor", Sk.misceval.iterFor);

/**
 * A special value to return from an iterFor() function,
 * to abort the iteration. Optionally supply a value for iterFor() to return
 * (defaults to 'undefined')
 *
 * @constructor
 * @param {*=}  brValue
 */
Sk.misceval.Break = function(brValue) {
    if (!(this instanceof Sk.misceval.Break)) {
        return new Sk.misceval.Break(brValue);
    }

    this.brValue = brValue;
};
goog.exportSymbol("Sk.misceval.Break", Sk.misceval.Break);

/**
 * same as Sk.misceval.call except args is an actual array, rather than
 * varargs.
 */
Sk.misceval.applyOrSuspend = function (func, kwdict, varargseq, kws, args) {
    var fcall;
    var kwix;
    var numPosParams;
    var numNonOptParams;
    var it, i;

    if (func === null || func instanceof Sk.builtin.none) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(func) + "' object is not callable");
    } else if (typeof func === "function") {
        // todo; i believe the only time this happens is the wrapper
        // function around generators (that creates the iterator).
        // should just make that a real function object and get rid
        // of this case.
        // alternatively, put it to more use, and perhaps use
        // descriptors to create builtin.func's in other places.

        // This actually happens for all builtin functions (in
        // builtin.js, for example) as they are javascript functions,
        // not Sk.builtin.func objects.

        if (func.sk$klass) {
            // klass wrapper around __init__ requires special handling
            return func.apply(null, [kwdict, varargseq, kws, args, true]);
        }

        if (varargseq) {
            for (it = varargseq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                args.push(i);
            }
        }

        if (kwdict) {
            for (it = Sk.abstr.iter(kwdict), i = it.tp$iternext(); i!== undefined; i = it.tp$iternext()) {
                if (!Sk.builtin.checkString(i)) {
                    throw new Sk.builtin.TypeError("Function keywords must be strings");
                }
                kws.push(i.v);
                kws.push(Sk.abstr.objectGetItem(kwdict, i, false));
            }
        }

        //goog.asserts.assert(((kws === undefined) || (kws.length === 0)));
        //print('kw args location: '+ kws + ' args ' + args.length)
        if (kws !== undefined && kws.length > 0) {
            if (!func.co_varnames) {
                throw new Sk.builtin.ValueError("Keyword arguments are not supported by this function");
            }

            //number of positionally placed optional parameters
            numNonOptParams = func.co_numargs - func.co_varnames.length;
            numPosParams = args.length - numNonOptParams;

            //add defaults
            args = args.concat(func.$defaults.slice(numPosParams));

            for (i = 0; i < kws.length; i = i + 2) {
                kwix = func.co_varnames.indexOf(kws[i]);

                if (kwix === -1) {
                    throw new Sk.builtin.TypeError("'" + kws[i] + "' is an invalid keyword argument for this function");
                }

                if (kwix < numPosParams) {
                    throw new Sk.builtin.TypeError("Argument given by name ('" + kws[i] + "') and position (" + (kwix + numNonOptParams + 1) + ")");
                }

                args[kwix + numNonOptParams] = kws[i + 1];
            }
        }
        //append kw args to args, filling in the default value where none is provided.
        return func.apply(null, args);
    } else {
        fcall = func.tp$call;
        if (fcall !== undefined) {
            if (varargseq) {
                for (it = varargseq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    args.push(i);
                }
            }

            if (kwdict) {
                for (it = Sk.abstr.iter(kwdict), i = it.tp$iternext(); i!== undefined; i = it.tp$iternext()) {
                    if (!Sk.builtin.checkString(i)) {
                        throw new Sk.builtin.TypeError("Function keywords must be strings");
                    }
                    kws.push(i.v);
                    kws.push(Sk.abstr.objectGetItem(kwdict, i, false));
                }
            }
            return fcall.call(func, args, kws, kwdict);
        }

        // todo; can we push this into a tp$call somewhere so there's
        // not redundant checks everywhere for all of these __x__ ones?
        fcall = func.__call__;
        if (fcall !== undefined) {
            // func is actually the object here because we got __call__
            // from it. todo; should probably use descr_get here
            args.unshift(func);
            return Sk.misceval.apply(fcall, kwdict, varargseq, kws, args);
        }
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(func) + "' object is not callable");
    }
};
goog.exportSymbol("Sk.misceval.applyOrSuspend", Sk.misceval.applyOrSuspend);

/**
 * Constructs a class object given a code object representing the body
 * of the class, the name of the class, and the list of bases.
 *
 * There are no "old-style" classes in Skulpt, so use the user-specified
 * metaclass (todo;) if there is one, the type of the 0th base class if
 * there's bases, or otherwise the 'type' type.
 *
 * The func code object is passed a (js) dict for its locals which it
 * stores everything into.
 *
 * The metaclass is then called as metaclass(name, bases, locals) and
 * should return a newly constructed class object.
 *
 */
Sk.misceval.buildClass = function (globals, func, name, bases) {
    // todo; metaclass
    var klass;
    var meta = Sk.builtin.type;

    var locals = {};

    // init the dict for the class
    func(globals, locals, []);
    // ToDo: check if func contains the __meta__ attribute
    // or if the bases contain __meta__
    // new Syntax would be different

    // file's __name__ is class's __module__
    locals.__module__ = globals["__name__"];
    var _name = new Sk.builtin.str(name);
    var _bases = new Sk.builtin.tuple(bases);
    var _locals = [];
    var key;

    // build array for python dict
    for (key in locals) {
        if (!locals.hasOwnProperty(key)) {
            //The current property key not a direct property of p
            continue;
        }
        _locals.push(new Sk.builtin.str(key)); // push key
        _locals.push(locals[key]); // push associated value
    }
    _locals = new Sk.builtin.dict(_locals);

    klass = Sk.misceval.callsim(meta, _name, _bases, _locals);
    return klass;
};
goog.exportSymbol("Sk.misceval.buildClass", Sk.misceval.buildClass);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/seqtype.js ---- */ 

/**
 * @constructor
 * Sk.builtin.seqtype
 *
 * @description
 * Abstract class for Python sequence types.
 *
 * @extends {Sk.builtin.object}
 *
 * @return {undefined} Cannot instantiate a Sk.builtin.seqtype object
 */
Sk.builtin.seqtype = function () {

    throw new Sk.builtin.ExternalError("Cannot instantiate abstract Sk.builtin.seqtype class");

};

Sk.abstr.setUpInheritance("SequenceType", Sk.builtin.seqtype, Sk.builtin.object);

Sk.builtin.seqtype.sk$abstract = true;

/**
 * Python wrapper of `__len__` method.
 *
 * @name  __len__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__len__"] = new Sk.builtin.func(function (self) {

    Sk.builtin.pyCheckArgs("__len__", arguments, 0, 0, false, true);

    return new Sk.builtin.int_(self.sq$length());    

});

/**
 * Python wrapper of `__iter__` method.
 *
 * @name  __iter__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__iter__"] = new Sk.builtin.func(function (self) {

    Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, false, true);

    return self.tp$iter();

});

/**
 * Python wrapper of `__contains__` method.
 *
 * @name  __contains__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__contains__"] = new Sk.builtin.func(function (self, item) {

    Sk.builtin.pyCheckArgs("__contains__", arguments, 1, 1, false, true);

    if (self.sq$contains(item)) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.bool.false$;
    }

});

/**
 * Python wrapper of `__getitem__` method.
 *
 * @name  __getitem__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__getitem__"] = new Sk.builtin.func(function (self, key) {

    Sk.builtin.pyCheckArgs("__getitem__", arguments, 1, 1, false, true);

    return self.mp$subscript(key);

});

/**
 * Python wrapper of `__add__` method.
 *
 * @name  __add__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__add__"] = new Sk.builtin.func(function (self, other) {

    Sk.builtin.pyCheckArgs("__add__", arguments, 1, 1, false, true);

    return self.sq$concat(other);

});

/**
 * Python wrapper of `__mul__` method.
 *
 * @name  __mul__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__mul__"] = new Sk.builtin.func(function (self, n) {

    Sk.builtin.pyCheckArgs("__mul__", arguments, 1, 1, false, true);

    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    return self.sq$repeat(n);

});

/**
 * Python wrapper of `__rmul__` method.
 *
 * @name  __rmul__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__rmul__"] = new Sk.builtin.func(function (self, n) {

    Sk.builtin.pyCheckArgs("__rmul__", arguments, 1, 1, false, true);

    return self.sq$repeat(n);    

});



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/str.js ---- */ 

Sk.builtin.interned = {};

/**
 * @constructor
 * @param {*} x
 * @extends Sk.builtin.object
 */
Sk.builtin.str = function (x) {
    var ret;
    if (x === undefined) {
        x = "";
    }
    if (x instanceof Sk.builtin.str) {
        return x;
    }
    if (!(this instanceof Sk.builtin.str)) {
        return new Sk.builtin.str(x);
    }


    // convert to js string
    if (x === true) {
        ret = "True";
    } else if (x === false) {
        ret = "False";
    } else if ((x === null) || (x instanceof Sk.builtin.none)) {
        ret = "None";
    } else if (x instanceof Sk.builtin.bool) {
        if (x.v) {
            ret = "True";
        } else {
            ret = "False";
        }
    } else if (typeof x === "number") {
        ret = x.toString();
        if (ret === "Infinity") {
            ret = "inf";
        } else if (ret === "-Infinity") {
            ret = "-inf";
        }
    } else if (typeof x === "string") {
        ret = x;
    } else if (x.tp$str !== undefined) {
        ret = x.tp$str();
        if (!(ret instanceof Sk.builtin.str)) {
            throw new Sk.builtin.ValueError("__str__ didn't return a str");
        }
        return ret;
    } else {
        return Sk.misceval.objectRepr(x);
    }

    // interning required for strings in py
    if (Sk.builtin.interned["1" + ret]) {
        return Sk.builtin.interned["1" + ret];
    }

    this.__class__ = Sk.builtin.str;
    this.v = ret;
    this["v"] = this.v;
    Sk.builtin.interned["1" + ret] = this;
    return this;

};
goog.exportSymbol("Sk.builtin.str", Sk.builtin.str);

Sk.abstr.setUpInheritance("str", Sk.builtin.str, Sk.builtin.seqtype);

Sk.builtin.str.prototype.mp$subscript = function (index) {
    var ret;
    if (Sk.misceval.isIndex(index)) {
        index = Sk.misceval.asIndex(index);
        if (index < 0) {
            index = this.v.length + index;
        }
        if (index < 0 || index >= this.v.length) {
            throw new Sk.builtin.IndexError("string index out of range");
        }
        return new Sk.builtin.str(this.v.charAt(index));
    } else if (index instanceof Sk.builtin.slice) {
        ret = "";
        index.sssiter$(this, function (i, wrt) {
            if (i >= 0 && i < wrt.v.length) {
                ret += wrt.v.charAt(i);
            }
        });
        return new Sk.builtin.str(ret);
    } else {
        throw new Sk.builtin.TypeError("string indices must be integers, not " + Sk.abstr.typeName(index));
    }
};

Sk.builtin.str.prototype.sq$length = function () {
    return this.v.length;
};
Sk.builtin.str.prototype.sq$concat = function (other) {
    var otypename;
    if (!other || !Sk.builtin.checkString(other)) {
        otypename = Sk.abstr.typeName(other);
        throw new Sk.builtin.TypeError("cannot concatenate 'str' and '" + otypename + "' objects");
    }
    return new Sk.builtin.str(this.v + other.v);
};
Sk.builtin.str.prototype.nb$add = Sk.builtin.str.prototype.sq$concat;
Sk.builtin.str.prototype.nb$inplace_add = Sk.builtin.str.prototype.sq$concat;
Sk.builtin.str.prototype.sq$repeat = function (n) {
    var i;
    var ret;

    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    n = Sk.misceval.asIndex(n);
    ret = "";
    for (i = 0; i < n; ++i) {
        ret += this.v;
    }
    return new Sk.builtin.str(ret);
};
Sk.builtin.str.prototype.nb$multiply = Sk.builtin.str.prototype.sq$repeat;
Sk.builtin.str.prototype.nb$inplace_multiply = Sk.builtin.str.prototype.sq$repeat;
Sk.builtin.str.prototype.sq$item = function () {
    goog.asserts.fail();
};
Sk.builtin.str.prototype.sq$slice = function (i1, i2) {
    i1 = Sk.builtin.asnum$(i1);
    i2 = Sk.builtin.asnum$(i2);
    if (i1 < 0) {
        i1 = 0;
    }
    return new Sk.builtin.str(this.v.substr(i1, i2 - i1));
};

Sk.builtin.str.prototype.sq$contains = function (ob) {
    if (!(ob instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("TypeError: 'In <string> requires string as left operand");
    }
    return this.v.indexOf(ob.v) != -1;
};

Sk.builtin.str.prototype.__iter__ = new Sk.builtin.func(function (self) {
    return new Sk.builtin.str_iter_(self);
});

Sk.builtin.str.prototype.tp$iter = function () {
    return new Sk.builtin.str_iter_(this);
};

Sk.builtin.str.prototype.tp$richcompare = function (other, op) {
    if (!(other instanceof Sk.builtin.str)) {
        return undefined;
    }

    switch (op) {
        case "Lt":
            return this.v < other.v;
        case "LtE":
            return this.v <= other.v;
        case "Eq":
            return this.v === other.v;
        case "NotEq":
            return this.v !== other.v;
        case "Gt":
            return this.v > other.v;
        case "GtE":
            return this.v >= other.v;
        default:
            goog.asserts.fail();
    }
};

Sk.builtin.str.prototype["$r"] = function () {
    // single is preferred
    var ashex;
    var c;
    var i;
    var ret;
    var len;
    var quote = "'";
    //jshint ignore:start
    if (this.v.indexOf("'") !== -1 && this.v.indexOf('"') === -1) {
        quote = '"';
    }
    //jshint ignore:end
    len = this.v.length;
    ret = quote;
    for (i = 0; i < len; ++i) {
        c = this.v.charAt(i);
        if (c === quote || c === "\\") {
            ret += "\\" + c;
        } else if (c === "\t") {
            ret += "\\t";
        } else if (c === "\n") {
            ret += "\\n";
        } else if (c === "\r") {
            ret += "\\r";
        } else if (c < " " || c >= 0x7f) {
            ashex = c.charCodeAt(0).toString(16);
            if (ashex.length < 2) {
                ashex = "0" + ashex;
            }
            ret += "\\x" + ashex;
        } else {
            ret += c;
        }
    }
    ret += quote;
    return new Sk.builtin.str(ret);
};


Sk.builtin.str.re_escape_ = function (s) {
    var c;
    var i;
    var ret = [];
    var re = /^[A-Za-z0-9]+$/;
    for (i = 0; i < s.length; ++i) {
        c = s.charAt(i);

        if (re.test(c)) {
            ret.push(c);
        } else {
            if (c === "\\000") {
                ret.push("\\000");
            } else {
                ret.push("\\" + c);
            }
        }
    }
    return ret.join("");
};

Sk.builtin.str.prototype["lower"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("lower", arguments, 1, 1);
    return new Sk.builtin.str(self.v.toLowerCase());
});

Sk.builtin.str.prototype["upper"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("upper", arguments, 1, 1);
    return new Sk.builtin.str(self.v.toUpperCase());
});

Sk.builtin.str.prototype["capitalize"] = new Sk.builtin.func(function (self) {
    var i;
    var cap;
    var orig;
    Sk.builtin.pyCheckArgs("capitalize", arguments, 1, 1);
    orig = self.v;

    if (orig.length === 0) {
        return new Sk.builtin.str("");
    }
    cap = orig.charAt(0).toUpperCase();

    for (i = 1; i < orig.length; i++) {
        cap += orig.charAt(i).toLowerCase();
    }
    return new Sk.builtin.str(cap);
});

Sk.builtin.str.prototype["join"] = new Sk.builtin.func(function (self, seq) {
    var it, i;
    var arrOfStrs;
    Sk.builtin.pyCheckArgs("join", arguments, 2, 2);
    Sk.builtin.pyCheckType("seq", "iterable", Sk.builtin.checkIterable(seq));
    arrOfStrs = [];
    for (it = seq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (i.constructor !== Sk.builtin.str) {
            throw new Sk.builtin.TypeError("TypeError: sequence item " + arrOfStrs.length + ": expected string, " + typeof i + " found");
        }
        arrOfStrs.push(i.v);
    }
    return new Sk.builtin.str(arrOfStrs.join(self.v));
});

Sk.builtin.str.prototype["split"] = new Sk.builtin.func(function (self, on, howmany) {
    var splits;
    var index;
    var match;
    var result;
    var s;
    var str;
    var regex;
    Sk.builtin.pyCheckArgs("split", arguments, 1, 3);
    if ((on === undefined) || (on instanceof Sk.builtin.none)) {
        on = null;
    }
    if ((on !== null) && !Sk.builtin.checkString(on)) {
        throw new Sk.builtin.TypeError("expected a string");
    }
    if ((on !== null) && on.v === "") {
        throw new Sk.builtin.ValueError("empty separator");
    }
    if ((howmany !== undefined) && !Sk.builtin.checkInt(howmany)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }

    howmany = Sk.builtin.asnum$(howmany);
    regex = /[\s]+/g;
    str = self.v;
    if (on === null) {
        str = goog.string.trimLeft(str);
    } else {
        // Escape special characters in "on" so we can use a regexp
        s = on.v.replace(/([.*+?=|\\\/()\[\]\{\}^$])/g, "\\$1");
        regex = new RegExp(s, "g");
    }

    // This is almost identical to re.split,
    // except how the regexp is constructed

    result = [];
    index = 0;
    splits = 0;
    while ((match = regex.exec(str)) != null) {
        if (match.index === regex.lastIndex) {
            // empty match
            break;
        }
        result.push(new Sk.builtin.str(str.substring(index, match.index)));
        index = regex.lastIndex;
        splits += 1;
        if (howmany && (splits >= howmany)) {
            break;
        }
    }
    str = str.substring(index);
    if (on !== null || (str.length > 0)) {
        result.push(new Sk.builtin.str(str));
    }

    return new Sk.builtin.list(result);
});

Sk.builtin.str.prototype["strip"] = new Sk.builtin.func(function (self, chars) {
    var regex;
    var pattern;
    Sk.builtin.pyCheckArgs("strip", arguments, 1, 2);
    if ((chars !== undefined) && !Sk.builtin.checkString(chars)) {
        throw new Sk.builtin.TypeError("strip arg must be None or str");
    }
    if (chars === undefined) {
        pattern = /^\s+|\s+$/g;
    } else {
        regex = Sk.builtin.str.re_escape_(chars.v);
        pattern = new RegExp("^[" + regex + "]+|[" + regex + "]+$", "g");
    }
    return new Sk.builtin.str(self.v.replace(pattern, ""));
});

Sk.builtin.str.prototype["lstrip"] = new Sk.builtin.func(function (self, chars) {
    var regex;
    var pattern;
    Sk.builtin.pyCheckArgs("lstrip", arguments, 1, 2);
    if ((chars !== undefined) && !Sk.builtin.checkString(chars)) {
        throw new Sk.builtin.TypeError("lstrip arg must be None or str");
    }
    if (chars === undefined) {
        pattern = /^\s+/g;
    } else {
        regex = Sk.builtin.str.re_escape_(chars.v);
        pattern = new RegExp("^[" + regex + "]+", "g");
    }
    return new Sk.builtin.str(self.v.replace(pattern, ""));
});

Sk.builtin.str.prototype["rstrip"] = new Sk.builtin.func(function (self, chars) {
    var regex;
    var pattern;
    Sk.builtin.pyCheckArgs("rstrip", arguments, 1, 2);
    if ((chars !== undefined) && !Sk.builtin.checkString(chars)) {
        throw new Sk.builtin.TypeError("rstrip arg must be None or str");
    }
    if (chars === undefined) {
        pattern = /\s+$/g;
    } else {
        regex = Sk.builtin.str.re_escape_(chars.v);
        pattern = new RegExp("[" + regex + "]+$", "g");
    }
    return new Sk.builtin.str(self.v.replace(pattern, ""));
});

Sk.builtin.str.prototype["partition"] = new Sk.builtin.func(function (self, sep) {
    var pos;
    var sepStr;
    Sk.builtin.pyCheckArgs("partition", arguments, 2, 2);
    Sk.builtin.pyCheckType("sep", "string", Sk.builtin.checkString(sep));
    sepStr = new Sk.builtin.str(sep);
    pos = self.v.indexOf(sepStr.v);
    if (pos < 0) {
        return new Sk.builtin.tuple([self, Sk.builtin.str.$emptystr, Sk.builtin.str.$emptystr]);
    }

    return new Sk.builtin.tuple([
        new Sk.builtin.str(self.v.substring(0, pos)),
        sepStr,
        new Sk.builtin.str(self.v.substring(pos + sepStr.v.length))]);
});

Sk.builtin.str.prototype["rpartition"] = new Sk.builtin.func(function (self, sep) {
    var pos;
    var sepStr;
    Sk.builtin.pyCheckArgs("rpartition", arguments, 2, 2);
    Sk.builtin.pyCheckType("sep", "string", Sk.builtin.checkString(sep));
    sepStr = new Sk.builtin.str(sep);
    pos = self.v.lastIndexOf(sepStr.v);
    if (pos < 0) {
        return new Sk.builtin.tuple([Sk.builtin.str.$emptystr, Sk.builtin.str.$emptystr, self]);
    }

    return new Sk.builtin.tuple([
        new Sk.builtin.str(self.v.substring(0, pos)),
        sepStr,
        new Sk.builtin.str(self.v.substring(pos + sepStr.v.length))]);
});

Sk.builtin.str.prototype["count"] = new Sk.builtin.func(function (self, pat, start, end) {
    var normaltext;
    var ctl;
    var slice;
    var m;
    Sk.builtin.pyCheckArgs("count", arguments, 2, 4);
    if (!Sk.builtin.checkString(pat)) {
        throw new Sk.builtin.TypeError("expected a character buffer object");
    }
    if ((start !== undefined) && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }
    if ((end !== undefined) && !Sk.builtin.checkInt(end)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }

    if (start === undefined) {
        start = 0;
    } else {
        start = Sk.builtin.asnum$(start);
        start = start >= 0 ? start : self.v.length + start;
    }

    if (end === undefined) {
        end = self.v.length;
    } else {
        end = Sk.builtin.asnum$(end);
        end = end >= 0 ? end : self.v.length + end;
    }

    normaltext = pat.v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    m = new RegExp(normaltext, "g");
    slice = self.v.slice(start, end);
    ctl = slice.match(m);
    if (!ctl) {
        return  new Sk.builtin.int_(0);
    } else {
        return new Sk.builtin.int_(ctl.length);
    }

});

Sk.builtin.str.prototype["ljust"] = new Sk.builtin.func(function (self, len, fillchar) {
    var newstr;
    Sk.builtin.pyCheckArgs("ljust", arguments, 2, 3);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepcted, got " + Sk.abstr.typeName(len));
    }
    if ((fillchar !== undefined) && (!Sk.builtin.checkString(fillchar) || fillchar.v.length !== 1)) {
        throw new Sk.builtin.TypeError("must be char, not " + Sk.abstr.typeName(fillchar));
    }
    if (fillchar === undefined) {
        fillchar = " ";
    } else {
        fillchar = fillchar.v;
    }
    len = Sk.builtin.asnum$(len);
    if (self.v.length >= len) {
        return self;
    } else {
        newstr = Array.prototype.join.call({length: Math.floor(len - self.v.length) + 1}, fillchar);
        return new Sk.builtin.str(self.v + newstr);
    }
});

Sk.builtin.str.prototype["rjust"] = new Sk.builtin.func(function (self, len, fillchar) {
    var newstr;
    Sk.builtin.pyCheckArgs("rjust", arguments, 2, 3);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepcted, got " + Sk.abstr.typeName(len));
    }
    if ((fillchar !== undefined) && (!Sk.builtin.checkString(fillchar) || fillchar.v.length !== 1)) {
        throw new Sk.builtin.TypeError("must be char, not " + Sk.abstr.typeName(fillchar));
    }
    if (fillchar === undefined) {
        fillchar = " ";
    } else {
        fillchar = fillchar.v;
    }
    len = Sk.builtin.asnum$(len);
    if (self.v.length >= len) {
        return self;
    } else {
        newstr = Array.prototype.join.call({length: Math.floor(len - self.v.length) + 1}, fillchar);
        return new Sk.builtin.str(newstr + self.v);
    }

});

Sk.builtin.str.prototype["center"] = new Sk.builtin.func(function (self, len, fillchar) {
    var newstr;
    var newstr1;
    Sk.builtin.pyCheckArgs("center", arguments, 2, 3);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepcted, got " + Sk.abstr.typeName(len));
    }
    if ((fillchar !== undefined) && (!Sk.builtin.checkString(fillchar) || fillchar.v.length !== 1)) {
        throw new Sk.builtin.TypeError("must be char, not " + Sk.abstr.typeName(fillchar));
    }
    if (fillchar === undefined) {
        fillchar = " ";
    } else {
        fillchar = fillchar.v;
    }
    len = Sk.builtin.asnum$(len);
    if (self.v.length >= len) {
        return self;
    } else {
        newstr1 = Array.prototype.join.call({length: Math.floor((len - self.v.length) / 2) + 1}, fillchar);
        newstr = newstr1 + self.v + newstr1;
        if (newstr.length < len) {
            newstr = newstr + fillchar;
        }
        return new Sk.builtin.str(newstr);
    }

});

Sk.builtin.str.prototype["find"] = new Sk.builtin.func(function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgs("find", arguments, 2, 4);
    if (!Sk.builtin.checkString(tgt)) {
        throw new Sk.builtin.TypeError("expected a character buffer object");
    }
    if ((start !== undefined) && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }
    if ((end !== undefined) && !Sk.builtin.checkInt(end)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }

    if (start === undefined) {
        start = 0;
    } else {
        start = Sk.builtin.asnum$(start);
        start = start >= 0 ? start : self.v.length + start;
    }

    if (end === undefined) {
        end = self.v.length;
    } else {
        end = Sk.builtin.asnum$(end);
        end = end >= 0 ? end : self.v.length + end;
    }

    idx = self.v.indexOf(tgt.v, start);
    idx = ((idx >= start) && (idx < end)) ? idx : -1;

    return new Sk.builtin.int_(idx);
});

Sk.builtin.str.prototype["index"] = new Sk.builtin.func(function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgs("index", arguments, 2, 4);
    idx = Sk.misceval.callsim(self["find"], self, tgt, start, end);
    if (Sk.builtin.asnum$(idx) === -1) {
        throw new Sk.builtin.ValueError("substring not found");
    }
    return idx;
});

Sk.builtin.str.prototype["rfind"] = new Sk.builtin.func(function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgs("rfind", arguments, 2, 4);
    if (!Sk.builtin.checkString(tgt)) {
        throw new Sk.builtin.TypeError("expected a character buffer object");
    }
    if ((start !== undefined) && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }
    if ((end !== undefined) && !Sk.builtin.checkInt(end)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }

    if (start === undefined) {
        start = 0;
    } else {
        start = Sk.builtin.asnum$(start);
        start = start >= 0 ? start : self.v.length + start;
    }

    if (end === undefined) {
        end = self.v.length;
    } else {
        end = Sk.builtin.asnum$(end);
        end = end >= 0 ? end : self.v.length + end;
    }

    idx = self.v.lastIndexOf(tgt.v, end);
    idx = (idx !== end) ? idx : self.v.lastIndexOf(tgt.v, end - 1);
    idx = ((idx >= start) && (idx < end)) ? idx : -1;

    return new Sk.builtin.int_(idx);
});

Sk.builtin.str.prototype["rindex"] = new Sk.builtin.func(function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgs("rindex", arguments, 2, 4);
    idx = Sk.misceval.callsim(self["rfind"], self, tgt, start, end);
    if (Sk.builtin.asnum$(idx) === -1) {
        throw new Sk.builtin.ValueError("substring not found");
    }
    return idx;
});

Sk.builtin.str.prototype["startswith"] = new Sk.builtin.func(function (self, tgt) {
    Sk.builtin.pyCheckArgs("startswith", arguments, 2, 2);
    Sk.builtin.pyCheckType("tgt", "string", Sk.builtin.checkString(tgt));
    return new Sk.builtin.bool( self.v.indexOf(tgt.v) === 0);
});

// http://stackoverflow.com/questions/280634/endswith-in-javascript
Sk.builtin.str.prototype["endswith"] = new Sk.builtin.func(function (self, tgt) {
    Sk.builtin.pyCheckArgs("endswith", arguments, 2, 2);
    Sk.builtin.pyCheckType("tgt", "string", Sk.builtin.checkString(tgt));
    return new Sk.builtin.bool( self.v.indexOf(tgt.v, self.v.length - tgt.v.length) !== -1);
});

Sk.builtin.str.prototype["replace"] = new Sk.builtin.func(function (self, oldS, newS, count) {
    var c;
    var patt;
    Sk.builtin.pyCheckArgs("replace", arguments, 3, 4);
    Sk.builtin.pyCheckType("oldS", "string", Sk.builtin.checkString(oldS));
    Sk.builtin.pyCheckType("newS", "string", Sk.builtin.checkString(newS));
    if ((count !== undefined) && !Sk.builtin.checkInt(count)) {
        throw new Sk.builtin.TypeError("integer argument expected, got " +
            Sk.abstr.typeName(count));
    }
    count = Sk.builtin.asnum$(count);
    patt = new RegExp(Sk.builtin.str.re_escape_(oldS.v), "g");

    if ((count === undefined) || (count < 0)) {
        return new Sk.builtin.str(self.v.replace(patt, newS.v));
    }

    c = 0;

    function replacer (match) {
        c++;
        if (c <= count) {
            return newS.v;
        }
        return match;
    }

    return new Sk.builtin.str(self.v.replace(patt, replacer));
});

Sk.builtin.str.prototype["zfill"] = new Sk.builtin.func(function (self, len) {
    var str = self.v;
    var ret;
    var zeroes;
    var offset;
    var pad = "";

    Sk.builtin.pyCheckArgs("zfill", arguments, 2, 2);
    if (! Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepected, got " + Sk.abstr.typeName(len));
    }

    // figure out how many zeroes are needed to make the proper length
    zeroes = len.v - str.length;
    // offset by 1 if there is a +/- at the beginning of the string
    offset = (str[0] === "+" || str[0] === "-") ? 1 : 0;
    for(var i = 0; i < zeroes; i++){
        pad += "0";
    }
    // combine the string and the zeroes
    ret = str.substr(0, offset) + pad + str.substr(offset);
    return new Sk.builtin.str(ret);


});

Sk.builtin.str.prototype["isdigit"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isdigit", arguments, 1, 1);
    return new Sk.builtin.bool( /^\d+$/.test(self.v));
});

Sk.builtin.str.prototype["isspace"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isspace", arguments, 1, 1);
    return new Sk.builtin.bool( /^\s+$/.test(self.v));
});


Sk.builtin.str.prototype["expandtabs"] = new Sk.builtin.func(function (self, tabsize) {
    // var input = self.v;
    // var expanded = "";
    // var split;
    // var spacestr = "";
    // var spacerem;


    var spaces;
    var expanded;

    Sk.builtin.pyCheckArgs("expandtabs", arguments, 1, 2);


    if ((tabsize !== undefined) && ! Sk.builtin.checkInt(tabsize)) {
        throw new Sk.builtin.TypeError("integer argument exepected, got " + Sk.abstr.typeName(tabsize));
    }
    if (tabsize === undefined) {
        tabsize = 8;
    } else {
        tabsize = Sk.builtin.asnum$(tabsize);
    }

    spaces = (new Array(tabsize + 1)).join(" ");
    expanded = self.v.replace(/([^\r\n\t]*)\t/g, function(a, b) {
        return b + spaces.slice(b.length % tabsize);
    });
    return new Sk.builtin.str(expanded);
});

Sk.builtin.str.prototype["swapcase"] = new Sk.builtin.func(function (self) {
    var ret;
    Sk.builtin.pyCheckArgs("swapcase", arguments, 1, 1);


    ret = self.v.replace(/[a-z]/gi, function(c) {
        var lc = c.toLowerCase();
        return lc === c ? c.toUpperCase() : lc;
    });

    return new Sk.builtin.str(ret);
});

Sk.builtin.str.prototype["splitlines"] = new Sk.builtin.func(function (self, keepends) {
    var data = self.v;
    var i = 0;
    var j = i;
    var selflen = self.v.length;
    var strs_w = [];
    var ch;
    var eol;
    var sol = 0;
    var slice;
    Sk.builtin.pyCheckArgs("splitlines", arguments, 1, 2);
    if ((keepends !== undefined) && ! Sk.builtin.checkBool(keepends)) {
        throw new Sk.builtin.TypeError("boolean argument expected, got " + Sk.abstr.typeName(keepends));
    }
    if (keepends === undefined) {
        keepends = false;
    } else {
        keepends = keepends.v;
    }


    for (i = 0; i < selflen; i ++) {
        ch = data.charAt(i);
        if (data.charAt(i + 1) === "\n" && ch === "\r") {
            eol = i + 2;
            slice = data.slice(sol, eol);
            if (! keepends) {
                slice = slice.replace(/(\r|\n)/g, "");
            }
            strs_w.push(new Sk.builtin.str(slice));
            sol = eol;
        } else if ((ch === "\n" && data.charAt(i - 1) !== "\r") || ch === "\r") {
            eol = i + 1;
            slice = data.slice(sol, eol);
            if (! keepends) {
                slice = slice.replace(/(\r|\n)/g, "");
            }
            strs_w.push(new Sk.builtin.str(slice));
            sol = eol;
        }

    }
    if (sol < selflen) {
        eol = selflen;
        slice = data.slice(sol, eol);
        if (! keepends) {
            slice = slice.replace(/(\r|\n)/g, "");
        }
        strs_w.push(new Sk.builtin.str(slice));
    }
    return new Sk.builtin.list(strs_w);
});

Sk.builtin.str.prototype["title"] = new Sk.builtin.func(function (self) {
    var ret;

    Sk.builtin.pyCheckArgs("title", arguments, 1, 1);

    ret = self.v.replace(/[a-z][a-z]*/gi, function(str) {
        return str[0].toUpperCase() + str.substr(1).toLowerCase();
    });

    return new Sk.builtin.str(ret);
});

Sk.builtin.str.prototype["isalpha"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isalpha", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && goog.string.isAlpha(self.v));
});

Sk.builtin.str.prototype["isalnum"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isalnum", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && goog.string.isAlphaNumeric(self.v));
});

// does not account for unicode numeric values
Sk.builtin.str.prototype["isnumeric"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isnumeric", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && goog.string.isNumeric(self.v));
});

Sk.builtin.str.prototype["islower"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("islower", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && /[a-z]/.test(self.v) && !/[A-Z]/.test(self.v));
});

Sk.builtin.str.prototype["isupper"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isupper", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && !/[a-z]/.test(self.v) && /[A-Z]/.test(self.v));
});

Sk.builtin.str.prototype["istitle"] = new Sk.builtin.func(function (self) {
    // Comparing to str.title() seems the most intuitive thing, but it fails on "",
    // Other empty-ish strings with no change.
    var input = self.v;
    var cased = false;
    var previous_is_cased = false;
    var pos;
    var ch;
    Sk.builtin.pyCheckArgs("istitle", arguments, 1, 1);
    for (pos = 0; pos < input.length; pos ++) {
        ch = input.charAt(pos);
        if (! /[a-z]/.test(ch) && /[A-Z]/.test(ch)) {
            if (previous_is_cased) {
                return new Sk.builtin.bool( false);
            }
            previous_is_cased = true;
            cased = true;
        } else if (/[a-z]/.test(ch) && ! /[A-Z]/.test(ch)) {
            if (! previous_is_cased) {
                return new Sk.builtin.bool( false);
            }
            cased = true;
        } else {
            previous_is_cased = false;
        }
    }
    return new Sk.builtin.bool( cased);
});

Sk.builtin.str.prototype.nb$remainder = function (rhs) {
    // % format op. rhs can be a value, a tuple, or something with __getitem__ (dict)

    // From http://docs.python.org/library/stdtypes.html#string-formatting the
    // format looks like:
    // 1. The '%' character, which marks the start of the specifier.
    // 2. Mapping key (optional), consisting of a parenthesised sequence of characters (for example, (somename)).
    // 3. Conversion flags (optional), which affect the result of some conversion types.
    // 4. Minimum field width (optional). If specified as an '*' (asterisk), the actual width is read from the next
    // element of the tuple in values, and the object to convert comes after the minimum field width and optional
    // precision. 5. Precision (optional), given as a '.' (dot) followed by the precision. If specified as '*' (an
    // asterisk), the actual width is read from the next element of the tuple in values, and the value to convert comes
    // after the precision. 6. Length modifier (optional). 7. Conversion type.  length modifier is ignored

    var ret;
    var replFunc;
    var index;
    var regex;
    if (rhs.constructor !== Sk.builtin.tuple && (rhs.mp$subscript === undefined || rhs.constructor === Sk.builtin.str)) {
        rhs = new Sk.builtin.tuple([rhs]);
    }

    // general approach is to use a regex that matches the format above, and
    // do an re.sub with a function as replacement to make the subs.

    //           1 2222222222222222   33333333   444444444   5555555555555  66666  777777777777777777
    regex = /%(\([a-zA-Z0-9]+\))?([#0 +\-]+)?(\*|[0-9]+)?(\.(\*|[0-9]+))?[hlL]?([diouxXeEfFgGcrs%])/g;
    index = 0;
    replFunc = function (substring, mappingKey, conversionFlags, fieldWidth, precision, precbody, conversionType) {
        var result;
        var convName;
        var convValue;
        var base;
        var r;
        var mk;
        var value;
        var handleWidth;
        var formatNumber;
        var alternateForm;
        var precedeWithSign;
        var blankBeforePositive;
        var leftAdjust;
        var zeroPad;
        var i;
        fieldWidth = Sk.builtin.asnum$(fieldWidth);
        precision = Sk.builtin.asnum$(precision);

        if (mappingKey === undefined || mappingKey === "") {
            i = index++;
        } // ff passes '' not undef for some reason

        if (precision === "") { // ff passes '' here aswell causing problems with G,g, etc.
            precision = undefined;
        }

        zeroPad = false;
        leftAdjust = false;
        blankBeforePositive = false;
        precedeWithSign = false;
        alternateForm = false;
        if (conversionFlags) {
            if (conversionFlags.indexOf("-") !== -1) {
                leftAdjust = true;
            } else if (conversionFlags.indexOf("0") !== -1) {
                zeroPad = true;
            }

            if (conversionFlags.indexOf("+") !== -1) {
                precedeWithSign = true;
            } else if (conversionFlags.indexOf(" ") !== -1) {
                blankBeforePositive = true;
            }

            alternateForm = conversionFlags.indexOf("#") !== -1;
        }

        if (precision) {
            precision = parseInt(precision.substr(1), 10);
        }

        formatNumber = function (n, base) {
            var precZeroPadded;
            var prefix;
            var didSign;
            var neg;
            var r;
            var j;
            base = Sk.builtin.asnum$(base);
            neg = false;
            didSign = false;
            if (typeof n === "number") {
                if (n < 0) {
                    n = -n;
                    neg = true;
                }
                r = n.toString(base);
            } else if (n instanceof Sk.builtin.float_) {
                r = n.str$(base, false);
                if (r.length > 2 && r.substr(-2) === ".0") {
                    r = r.substr(0, r.length - 2);
                }
                neg = n.nb$isnegative();
            } else if (n instanceof Sk.builtin.int_) {
                r = n.str$(base, false);
                neg = n.nb$isnegative();
            } else if (n instanceof Sk.builtin.lng) {
                r = n.str$(base, false);
                neg = n.nb$isnegative();	//	neg = n.size$ < 0;	RNL long.js change
            }

            goog.asserts.assert(r !== undefined, "unhandled number format");

            precZeroPadded = false;

            if (precision) {
                //print("r.length",r.length,"precision",precision);
                for (j = r.length; j < precision; ++j) {
                    r = "0" + r;
                    precZeroPadded = true;
                }
            }

            prefix = "";

            if (neg) {
                prefix = "-";
            } else if (precedeWithSign) {
                prefix = "+" + prefix;
            } else if (blankBeforePositive) {
                prefix = " " + prefix;
            }

            if (alternateForm) {
                if (base === 16) {
                    prefix += "0x";
                } else if (base === 8 && !precZeroPadded && r !== "0") {
                    prefix += "0";
                }
            }

            return [prefix, r];
        };

        handleWidth = function (args) {
            var totLen;
            var prefix = args[0];
            var r = args[1];
            var j;
            if (fieldWidth) {
                fieldWidth = parseInt(fieldWidth, 10);
                totLen = r.length + prefix.length;
                if (zeroPad) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = "0" + r;
                    }
                } else if (leftAdjust) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = r + " ";
                    }
                } else {
                    for (j = totLen; j < fieldWidth; ++j) {
                        prefix = " " + prefix;
                    }
                }
            }
            return prefix + r;
        };

        //print("Rhs:",rhs, "ctor", rhs.constructor);
        if (rhs.constructor === Sk.builtin.tuple) {
            value = rhs.v[i];
        } else if (rhs.mp$subscript !== undefined && mappingKey !== undefined) {
            mk = mappingKey.substring(1, mappingKey.length - 1);
            //print("mk",mk);
            value = rhs.mp$subscript(new Sk.builtin.str(mk));
        } else if (rhs.constructor === Sk.builtin.dict || rhs.constructor === Sk.builtin.list) {
            // new case where only one argument is provided
            value = rhs;
        } else {
            throw new Sk.builtin.AttributeError(rhs.tp$name + " instance has no attribute 'mp$subscript'");
        }
        base = 10;
        if (conversionType === "d" || conversionType === "i") {
            return handleWidth(formatNumber(value, 10));
        } else if (conversionType === "o") {
            return handleWidth(formatNumber(value, 8));
        } else if (conversionType === "x") {
            return handleWidth(formatNumber(value, 16));
        } else if (conversionType === "X") {
            return handleWidth(formatNumber(value, 16)).toUpperCase();
        } else if (conversionType === "f" || conversionType === "F" || conversionType === "e" || conversionType === "E" || conversionType === "g" || conversionType === "G") {
            convValue = Sk.builtin.asnum$(value);
            if (typeof convValue === "string") {
                convValue = Number(convValue);
            }
            if (convValue === Infinity) {
                return "inf";
            }
            if (convValue === -Infinity) {
                return "-inf";
            }
            if (isNaN(convValue)) {
                return "nan";
            }
            convName = ["toExponential", "toFixed", "toPrecision"]["efg".indexOf(conversionType.toLowerCase())];
            if (precision === undefined || precision === "") {
                if (conversionType === "e" || conversionType === "E") {
                    precision = 6;
                } else if (conversionType === "f" || conversionType === "F") {
                    precision = 7;
                }
            }
            result = (convValue)[convName](precision); // possible loose of negative zero sign

            // apply sign to negative zeros, floats only!
            if(Sk.builtin.checkFloat(value)) {
                if(convValue === 0 && 1/convValue === -Infinity) {
                    result = "-" + result; // add sign for zero
                }
            }

            if ("EFG".indexOf(conversionType) !== -1) {
                result = result.toUpperCase();
            }
            return handleWidth(["", result]);
        } else if (conversionType === "c") {
            if (typeof value === "number") {
                return String.fromCharCode(value);
            } else if (value instanceof Sk.builtin.int_) {
                return String.fromCharCode(value.v);
            } else if (value instanceof Sk.builtin.float_) {
                return String.fromCharCode(value.v);
            } else if (value instanceof Sk.builtin.lng) {
                return String.fromCharCode(value.str$(10, false)[0]);
            } else if (value.constructor === Sk.builtin.str) {
                return value.v.substr(0, 1);
            } else {
                throw new Sk.builtin.TypeError("an integer is required");
            }
        } else if (conversionType === "r") {
            r = Sk.builtin.repr(value);
            if (precision) {
                return r.v.substr(0, precision);
            }
            return r.v;
        } else if (conversionType === "s") {
            r = new Sk.builtin.str(value);
            if (precision) {
                return r.v.substr(0, precision);
            }
            if(fieldWidth) {
                r.v = handleWidth([" ", r.v]);
            }
            return r.v;
        } else if (conversionType === "%") {
            return "%";
        }
    };

    ret = this.v.replace(regex, replFunc);
    return new Sk.builtin.str(ret);
};

/**
 * @constructor
 * @param {Object} obj
 */
Sk.builtin.str_iter_ = function (obj) {
    if (!(this instanceof Sk.builtin.str_iter_)) {
        return new Sk.builtin.str_iter_(obj);
    }
    this.$index = 0;
    this.$obj = obj.v.slice();
    this.sq$length = this.$obj.length;
    this.tp$iter = this;
    this.tp$iternext = function () {
        if (this.$index >= this.sq$length) {
            return undefined;
        }
        return new Sk.builtin.str(this.$obj.substr(this.$index++, 1));
    };
    this.$r = function () {
        return new Sk.builtin.str("iterator");
    };
    return this;
};

Sk.abstr.setUpInheritance("iterator", Sk.builtin.str_iter_, Sk.builtin.object);

Sk.builtin.str_iter_.prototype.__class__ = Sk.builtin.str_iter_;

Sk.builtin.str_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, true, false);
    return self;
});

Sk.builtin.str_iter_.prototype["next"] = new Sk.builtin.func(function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
});



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/tuple.js ---- */ 

/**
 * @constructor
 * @param {Array.<Object>|Object} L
 */
Sk.builtin.tuple = function (L) {
    var it, i;
    if (!(this instanceof Sk.builtin.tuple)) {
        return new Sk.builtin.tuple(L);
    }


    if (L === undefined) {
        L = [];
    }

    if (Object.prototype.toString.apply(L) === "[object Array]") {
        this.v = L;
    } else {
        if (Sk.builtin.checkIterable(L)) {
            this.v = [];
            for (it = Sk.abstr.iter(L), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                this.v.push(i);
            }
        } else {
            throw new Sk.builtin.TypeError("expecting Array or iterable");
        }
    }

    this.__class__ = Sk.builtin.tuple;

    this["v"] = this.v;
    return this;
};

Sk.abstr.setUpInheritance("tuple", Sk.builtin.tuple, Sk.builtin.seqtype);

Sk.builtin.tuple.prototype["$r"] = function () {
    var ret;
    var i;
    var bits;
    if (this.v.length === 0) {
        return new Sk.builtin.str("()");
    }
    bits = [];
    for (i = 0; i < this.v.length; ++i) {
        bits[i] = Sk.misceval.objectRepr(this.v[i]).v;
    }
    ret = bits.join(", ");
    if (this.v.length === 1) {
        ret += ",";
    }
    return new Sk.builtin.str("(" + ret + ")");
};

Sk.builtin.tuple.prototype.mp$subscript = function (index) {
    var ret;
    var i;
    if (Sk.misceval.isIndex(index)) {
        i = Sk.misceval.asIndex(index);
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.length + i;
            }
            if (i < 0 || i >= this.v.length) {
                throw new Sk.builtin.IndexError("tuple index out of range");
            }
            return this.v[i];
        }
    } else if (index instanceof Sk.builtin.slice) {
        ret = [];
        index.sssiter$(this, function (i, wrt) {
            ret.push(wrt.v[i]);
        });
        return new Sk.builtin.tuple(ret);
    }

    throw new Sk.builtin.TypeError("tuple indices must be integers, not " + Sk.abstr.typeName(index));
};

// todo; the numbers and order are taken from python, but the answer's
// obviously not the same because there's no int wrapping. shouldn't matter,
// but would be nice to make the hash() values the same if it's not too
// expensive to simplify tests.
Sk.builtin.tuple.prototype.tp$hash = function () {
    var y;
    var i;
    var mult = 1000003;
    var x = 0x345678;
    var len = this.v.length;
    for (i = 0; i < len; ++i) {
        y = Sk.builtin.hash(this.v[i]).v;
        if (y === -1) {
            return new Sk.builtin.int_(-1);
        }
        x = (x ^ y) * mult;
        mult += 82520 + len + len;
    }
    x += 97531;
    if (x === -1) {
        x = -2;
    }
    return new Sk.builtin.int_(x | 0);
};

Sk.builtin.tuple.prototype.sq$repeat = function (n) {
    var j;
    var i;
    var ret;

    n = Sk.misceval.asIndex(n);
    ret = [];
    for (i = 0; i < n; ++i) {
        for (j = 0; j < this.v.length; ++j) {
            ret.push(this.v[j]);
        }
    }
    return new Sk.builtin.tuple(ret);
};
Sk.builtin.tuple.prototype.nb$multiply = Sk.builtin.tuple.prototype.sq$repeat;
Sk.builtin.tuple.prototype.nb$inplace_multiply = Sk.builtin.tuple.prototype.sq$repeat;

Sk.builtin.tuple.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__iter__", arguments, 1, 1);
    return new Sk.builtin.tuple_iter_(self);
});

Sk.builtin.tuple.prototype.tp$iter = function () {
    return new Sk.builtin.tuple_iter_(this);
};

Sk.builtin.tuple.prototype.tp$richcompare = function (w, op) {
    //print("  tup rc", JSON.stringify(this.v), JSON.stringify(w), op);

    // w not a tuple
    var k;
    var i;
    var wl;
    var vl;
    var v;
    if (!w.__class__ ||
        !Sk.misceval.isTrue(Sk.builtin.isinstance(w, Sk.builtin.tuple))) {
        // shortcuts for eq/not
        if (op === "Eq") {
            return false;
        }
        if (op === "NotEq") {
            return true;
        }

        // todo; other types should have an arbitrary order
        return false;
    }

    v = this.v;
    w = w.v;
    vl = v.length;
    wl = w.length;

    for (i = 0; i < vl && i < wl; ++i) {
        k = Sk.misceval.richCompareBool(v[i], w[i], "Eq");
        if (!k) {
            break;
        }
    }

    if (i >= vl || i >= wl) {
        // no more items to compare, compare sizes
        switch (op) {
            case "Lt":
                return vl < wl;
            case "LtE":
                return vl <= wl;
            case "Eq":
                return vl === wl;
            case "NotEq":
                return vl !== wl;
            case "Gt":
                return vl > wl;
            case "GtE":
                return vl >= wl;
            default:
                goog.asserts.fail();
        }
    }

    // we have an item that's different

    // shortcuts for eq/not
    if (op === "Eq") {
        return false;
    }
    if (op === "NotEq") {
        return true;
    }

    // or, compare the differing element using the proper operator
    //print("  tup rcb end", i, v[i] instanceof Sk.builtin.str, JSON.stringify(v[i]), w[i] instanceof Sk.builtin.str, JSON.stringify(w[i]), op);
    return Sk.misceval.richCompareBool(v[i], w[i], op);
};

Sk.builtin.tuple.prototype.sq$concat = function (other) {
    var msg;
    if (other.__class__ != Sk.builtin.tuple) {
        msg = "can only concatenate tuple (not \"";
        msg += Sk.abstr.typeName(other) + "\") to tuple";
        throw new Sk.builtin.TypeError(msg);
    }

    return new Sk.builtin.tuple(this.v.concat(other.v));
};

Sk.builtin.tuple.prototype.sq$contains = function (ob) {
    var it, i;

    for (it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.misceval.richCompareBool(i, ob, "Eq")) {
            return true;
        }
    }

    return false;
};

Sk.builtin.tuple.prototype.nb$add = Sk.builtin.tuple.prototype.sq$concat;
Sk.builtin.tuple.prototype.nb$inplace_add = Sk.builtin.tuple.prototype.sq$concat;

Sk.builtin.tuple.prototype.sq$length = function () {
    return this.v.length;
};


Sk.builtin.tuple.prototype["index"] = new Sk.builtin.func(function (self, item) {
    var i;
    var len = self.v.length;
    var obj = self.v;
    for (i = 0; i < len; ++i) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            return new Sk.builtin.int_(i);
        }
    }
    throw new Sk.builtin.ValueError("tuple.index(x): x not in tuple");
});

Sk.builtin.tuple.prototype["count"] = new Sk.builtin.func(function (self, item) {
    var i;
    var len = self.v.length;
    var obj = self.v;
    var count = 0;
    for (i = 0; i < len; ++i) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            count += 1;
        }
    }
    return  new Sk.builtin.int_(count);
});

goog.exportSymbol("Sk.builtin.tuple", Sk.builtin.tuple);

/**
 * @constructor
 * @param {Object} obj
 */
Sk.builtin.tuple_iter_ = function (obj) {
    if (!(this instanceof Sk.builtin.tuple_iter_)) {
        return new Sk.builtin.tuple_iter_(obj);
    }
    this.$index = 0;
    this.$obj = obj.v.slice();
    this.sq$length = this.$obj.length;
    this.tp$iter = this;
    this.tp$iternext = function () {
        if (this.$index >= this.sq$length) {
            return undefined;
        }
        return this.$obj[this.$index++];
    };
    this.$r = function () {
        return new Sk.builtin.str("tupleiterator");
    };
    return this;
};

Sk.abstr.setUpInheritance("tupleiterator", Sk.builtin.tuple_iter_, Sk.builtin.object);

Sk.builtin.tuple_iter_.prototype.__class__ = Sk.builtin.tuple_iter_;

Sk.builtin.tuple_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    return self;
});

Sk.builtin.tuple_iter_.prototype["next"] = new Sk.builtin.func(function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
});



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/dict.js ---- */ 

/**
 * @constructor
 * @param {Array.<Object>} L
 */
Sk.builtin.dict = function dict (L) {
    var v;
    var it, k;
    var i;
    if (!(this instanceof Sk.builtin.dict)) {
        return new Sk.builtin.dict(L);
    }


    if (L === undefined) {
        L = [];
    }

    this.size = 0;
    this.buckets = {};

    if (Object.prototype.toString.apply(L) === "[object Array]") {
        // Handle dictionary literals
        for (i = 0; i < L.length; i += 2) {
            this.mp$ass_subscript(L[i], L[i + 1]);
        }
    } else if (L instanceof Sk.builtin.dict) {
        // Handle calls of type "dict(mapping)" from Python code
        for (it = Sk.abstr.iter(L), k = it.tp$iternext();
             k !== undefined;
             k = it.tp$iternext()) {
            v = L.mp$subscript(k);
            if (v === undefined) {
                //print(k, "had undefined v");
                v = null;
            }
            this.mp$ass_subscript(k, v);
        }
    } else if (Sk.builtin.checkIterable(L)) {
        // Handle calls of type "dict(iterable)" from Python code
        for (it = Sk.abstr.iter(L), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            if (i.mp$subscript) {
                this.mp$ass_subscript(i.mp$subscript(0), i.mp$subscript(1));
            } else {
                throw new Sk.builtin.TypeError("element " + this.size + " is not a sequence");
            }
        }
    } else {
        throw new Sk.builtin.TypeError("object is not iterable");
    }

    this.__class__ = Sk.builtin.dict;

    return this;
};

Sk.abstr.setUpInheritance("dict", Sk.builtin.dict, Sk.builtin.object);
Sk.abstr.markUnhashable(Sk.builtin.dict);

var kf = Sk.builtin.hash;

Sk.builtin.dict.prototype.key$lookup = function (bucket, key) {
    var item;
    var eq;
    var i;

    for (i = 0; i < bucket.items.length; i++) {
        item = bucket.items[i];
        eq = Sk.misceval.richCompareBool(item.lhs, key, "Eq");
        if (eq) {
            return item;
        }
    }

    return null;
};

Sk.builtin.dict.prototype.key$pop = function (bucket, key) {
    var item;
    var eq;
    var i;

    for (i = 0; i < bucket.items.length; i++) {
        item = bucket.items[i];
        eq = Sk.misceval.richCompareBool(item.lhs, key, "Eq");
        if (eq) {
            bucket.items.splice(i, 1);
            this.size -= 1;
            return item;
        }
    }
    return undefined;
};

// Perform dictionary lookup, either return value or undefined if key not in dictionary
Sk.builtin.dict.prototype.mp$lookup = function (key) {
    var k = kf(key);
    var bucket = this.buckets[k.v];
    var item;

    // todo; does this need to go through mp$ma_lookup

    if (bucket !== undefined) {
        item = this.key$lookup(bucket, key);
        if (item) {
            return item.rhs;
        }
    }

    // Not found in dictionary
    return undefined;
};

Sk.builtin.dict.prototype.mp$subscript = function (key) {
    Sk.builtin.pyCheckArgs("[]", arguments, 1, 2, false, false);
    var s;
    var res = this.mp$lookup(key);

    if (res !== undefined) {
        // Found in dictionary
        return res;
    } else {
        // Not found in dictionary
        s = new Sk.builtin.str(key);
        throw new Sk.builtin.KeyError(s.v);
    }
};

Sk.builtin.dict.prototype.sq$contains = function (ob) {
    Sk.builtin.pyCheckArgs("__contains__()", arguments, 1, 1, false, false);
    var res = this.mp$lookup(ob);

    return (res !== undefined);
};

Sk.builtin.dict.prototype.mp$ass_subscript = function (key, w) {
    var k = kf(key);
    var bucket = this.buckets[k.v];
    var item;

    if (bucket === undefined) {
        // New bucket
        bucket = {$hash: k, items: [
            {lhs: key, rhs: w}
        ]};
        this.buckets[k.v] = bucket;
        this.size += 1;
        return;
    }

    item = this.key$lookup(bucket, key);
    if (item) {
        item.rhs = w;
        return;
    }

    // Not found in dictionary
    bucket.items.push({lhs: key, rhs: w});
    this.size += 1;
};

Sk.builtin.dict.prototype.mp$del_subscript = function (key) {
    Sk.builtin.pyCheckArgs("del", arguments, 1, 1, false, false);
    var k = kf(key);
    var bucket = this.buckets[k.v];
    var item;
    var s;

    // todo; does this need to go through mp$ma_lookup

    if (bucket !== undefined) {
        item = this.key$pop(bucket, key);
        if (item !== undefined) {
            return;
        }
    }

    // Not found in dictionary
    s = new Sk.builtin.str(key);
    throw new Sk.builtin.KeyError(s.v);
};

Sk.builtin.dict.prototype["$r"] = function () {
    var v;
    var iter, k;
    var ret = [];
    for (iter = Sk.abstr.iter(this), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        v = this.mp$subscript(k);
        if (v === undefined) {
            //print(k, "had undefined v");
            v = null;
        }

        // we need to check if value is same as object
        // otherwise it would cause an stack overflow
        if(v === this) {
            ret.push(Sk.misceval.objectRepr(k).v + ": {...}");
        } else {
            ret.push(Sk.misceval.objectRepr(k).v + ": " + Sk.misceval.objectRepr(v).v);
        }
    }
    return new Sk.builtin.str("{" + ret.join(", ") + "}");
};

Sk.builtin.dict.prototype.mp$length = function () {
    return this.size;
};

Sk.builtin.dict.prototype["get"] = new Sk.builtin.func(function (self, k, d) {
    Sk.builtin.pyCheckArgs("get()", arguments, 1, 2, false, true);
    var ret;

    if (d === undefined) {
        d = Sk.builtin.none.none$;
    }

    ret = self.mp$lookup(k);
    if (ret === undefined) {
        ret = d;
    }

    return ret;
});

Sk.builtin.dict.prototype["pop"] = new Sk.builtin.func(function (self, key, d) {
    Sk.builtin.pyCheckArgs("pop()", arguments, 1, 2, false, true);
    var k = kf(key);
    var bucket = self.buckets[k.v];
    var item;
    var s;

    // todo; does this need to go through mp$ma_lookup
    if (bucket !== undefined) {
        item = self.key$pop(bucket, key);
        if (item !== undefined) {
            return item.rhs;
        }
    }

    // Not found in dictionary
    if (d !== undefined) {
        return d;
    }

    s = new Sk.builtin.str(key);
    throw new Sk.builtin.KeyError(s.v);
});

Sk.builtin.dict.prototype["has_key"] = new Sk.builtin.func(function (self, k) {
    Sk.builtin.pyCheckArgs("has_key()", arguments, 1, 1, false, true);
    return new Sk.builtin.bool( self.sq$contains(k));
});

Sk.builtin.dict.prototype["items"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("items()", arguments, 0, 0, false, true);
    var v;
    var iter, k;
    var ret = [];

    for (iter = Sk.abstr.iter(self), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        v = self.mp$subscript(k);
        if (v === undefined) {
            //print(k, "had undefined v");
            v = null;
        }
        ret.push(new Sk.builtin.tuple([k, v]));
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype["keys"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("keys()", arguments, 0, 0, false, true);
    var iter, k;
    var ret = [];

    for (iter = Sk.abstr.iter(self), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        ret.push(k);
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype["values"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("values()", arguments, 0, 0, false, true);
    var v;
    var iter, k;
    var ret = [];

    for (iter = Sk.abstr.iter(self), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        v = self.mp$subscript(k);
        if (v === undefined) {
            v = null;
        }
        ret.push(v);
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype["clear"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("clear()", arguments, 0, 0, false, true);
    var k;
    var iter;

    for (iter = Sk.abstr.iter(self), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        self.mp$del_subscript(k);
    }
});

Sk.builtin.dict.prototype["setdefault"] = new Sk.builtin.func(function (self, key, default_) {
    try {
        return self.mp$subscript(key);
    }
    catch (e) {
        if (default_ === undefined) {
            default_ = Sk.builtin.none.none$;
        }
        self.mp$ass_subscript(key, default_);
        return default_;
    }
});

/*
    this function mimics the cpython implementation, which is also the reason for the
    almost similar code, this may be changed in future
*/
Sk.builtin.dict.prototype.dict_merge = function(b) {
    var iter;
    var k, v;
    if(b instanceof Sk.builtin.dict) {
        // fast way
        for (iter = b.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
            v = b.mp$subscript(k);
            if (v === undefined) {
                throw new Sk.builtin.AttributeError("cannot get item for key: " + k.v);
            }
            this.mp$ass_subscript(k, v);
        }
    } else {
        // generic slower way
        var keys = Sk.misceval.callsim(b["keys"], b);
        for (iter = Sk.abstr.iter(keys), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
            v = b.tp$getitem(k); // get value
            if (v === undefined) {
                throw new Sk.builtin.AttributeError("cannot get item for key: " + k.v);
            }
            this.mp$ass_subscript(k, v);
        }
    }
};

/**
 *   update() accepts either another dictionary object or an iterable of key/value pairs (as tuples or other iterables of length two).
 *   If keyword arguments are specified, the dictionary is then updated with those key/value pairs: d.update(red=1, blue=2).
 *   https://hg.python.org/cpython/file/4ff865976bb9/Objects/dictobject.c
 */
var update_f = function (kwargs, self, other) {
    // case another dict or obj with keys and getitem has been provided
    if(other !== undefined && (other.tp$name === "dict" || other["keys"])) {
        self.dict_merge(other); // we merge with override
    } else if(other !== undefined && Sk.builtin.checkIterable(other)) {
        // 2nd case, we expect an iterable that contains another iterable of length 2
        var iter;
        var k, v;
        var seq_i = 0; // index of current sequence item
        for (iter = Sk.abstr.iter(other), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext(), seq_i++) {
            // check if value is iter
            if (!Sk.builtin.checkIterable(k)) {
                throw new Sk.builtin.TypeError("cannot convert dictionary update sequence element #" + seq_i + " to a sequence");
            }

            // cpython impl. would transform iterable into sequence
            // we just call iternext twice if k has length of 2
            if(k.sq$length() === 2) {
                var k_iter = Sk.abstr.iter(k);
                var k_key = k_iter.tp$iternext();
                var k_value = k_iter.tp$iternext();
                self.mp$ass_subscript(k_key, k_value);
            } else {
                // throw exception
                throw new Sk.builtin.ValueError("dictionary update sequence element #" + seq_i + " has length " + k.sq$length() + "; 2 is required");
            }
        }
    } else if(other !== undefined) {
        // other is not a dict or iterable
        throw new Sk.builtin.TypeError("'" +Sk.abstr.typeName(other) + "' object is not iterable");
    }

    // apply all key/value pairs of kwargs
    // create here kwargs_dict, there could be exceptions in other cases before
    var kwargs_dict = new Sk.builtins.dict(kwargs);
    self.dict_merge(kwargs_dict);

    // returns none, when successful or throws exception
    return  Sk.builtin.none.none$;
};

update_f.co_kwargs = true;
Sk.builtin.dict.prototype.update = new Sk.builtin.func(update_f);

Sk.builtin.dict.prototype.__contains__ = new Sk.builtin.func(function (self, item) {
    Sk.builtin.pyCheckArgs("__contains__", arguments, 1, 1, false, true);
    return Sk.builtin.dict.prototype.sq$contains.call(self, item);
});

Sk.builtin.dict.prototype.__cmp__ = new Sk.builtin.func(function (self, other, op) {
    // __cmp__ cannot be supported until dict lt/le/gt/ge operations are supported
    return Sk.builtin.NotImplemented.NotImplemented$;
});

Sk.builtin.dict.prototype.__delitem__ = new Sk.builtin.func(function (self, item) {
    Sk.builtin.pyCheckArgs("__delitem__", arguments, 1, 1, false, true);
    return Sk.builtin.dict.prototype.mp$del_subscript.call(self, item);
});

Sk.builtin.dict.prototype.__getitem__ = new Sk.builtin.func(function (self, item) {
    Sk.builtin.pyCheckArgs("__getitem__", arguments, 1, 1, false, true);
    return Sk.builtin.dict.prototype.mp$subscript.call(self, item);
});

Sk.builtin.dict.prototype.__setitem__ = new Sk.builtin.func(function (self, item, value) {
    Sk.builtin.pyCheckArgs("__setitem__", arguments, 2, 2, false, true);
    return Sk.builtin.dict.prototype.mp$ass_subscript.call(self, item, value);
});

Sk.builtin.dict.prototype.__hash__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__hash__", arguments, 0, 0, false, true);
    return Sk.builtin.dict.prototype.tp$hash.call(self);
});

Sk.builtin.dict.prototype.__len__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__len__", arguments, 0, 0, false, true);
    return Sk.builtin.dict.prototype.mp$length.call(self);
});

Sk.builtin.dict.prototype.__getattr__ = new Sk.builtin.func(function (self, attr) {
    Sk.builtin.pyCheckArgs("__getattr__", arguments, 1, 1, false, true);
    if (!Sk.builtin.checkString(attr)) { throw new Sk.builtin.TypeError("__getattr__ requires a string"); }
    return Sk.builtin.dict.prototype.tp$getattr.call(self, Sk.ffi.remapToJs(attr));
});

Sk.builtin.dict.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, false, true);

    return new Sk.builtin.dict_iter_(self);
});

Sk.builtin.dict.prototype.tp$iter = function () {
    return new Sk.builtin.dict_iter_(this);
};

Sk.builtin.dict.prototype.__repr__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__repr__", arguments, 0, 0, false, true);
    return Sk.builtin.dict.prototype["$r"].call(self);
});

/* python3 recommends implementing simple ops */
Sk.builtin.dict.prototype.ob$eq = function (other) {

    var iter, k, v, otherv;

    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    if (!(other instanceof Sk.builtin.dict)) {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    if (this.size !== other.size) {
        return Sk.builtin.bool.false$;
    }

    for (iter = this.tp$iter(), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        v = this.mp$subscript(k);
        otherv = other.mp$subscript(k);

        if (!Sk.misceval.richCompareBool(v, otherv, "Eq")) {
            return Sk.builtin.bool.false$;
        }
    }

    return Sk.builtin.bool.true$;
};

Sk.builtin.dict.prototype.ob$ne = function (other) {

    var isEqual = this.ob$eq(other);

    if (isEqual instanceof Sk.builtin.NotImplemented) {
        return isEqual;
    } else if (isEqual.v) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.bool.true$;
    }

};

Sk.builtin.dict.prototype["copy"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.copy is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["fromkeys"] = new Sk.builtin.func(function (seq, value) {
    throw new Sk.builtin.NotImplementedError("dict.fromkeys is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["iteritems"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.iteritems is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["iterkeys"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.iterkeys is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["itervalues"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.itervalues is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["popitem"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.popitem is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["viewitems"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.viewitems is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["viewkeys"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.viewkeys is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["viewvalues"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.viewvalues is not yet implemented in Skulpt");
});

goog.exportSymbol("Sk.builtin.dict", Sk.builtin.dict);

/**
 * @constructor
 * @param {Object} obj
 */
Sk.builtin.dict_iter_ = function (obj) {
    var k, i, bucket, allkeys, buckets;
    if (!(this instanceof Sk.builtin.dict_iter_)) {
        return new Sk.builtin.dict_iter_(obj);
    }
    this.$index = 0;
    this.$obj = obj;
    allkeys = [];
    buckets = obj.buckets;
    for (k in buckets) {
        if (buckets.hasOwnProperty(k)) {
            bucket = buckets[k];
            if (bucket && bucket.$hash !== undefined && bucket.items !== undefined) {
                // skip internal stuff. todo; merge pyobj and this
                for (i = 0; i < bucket.items.length; i++) {
                    allkeys.push(bucket.items[i].lhs);
                }
            }
        }
    }
    this.$keys = allkeys;
    this.tp$iter = this;
    this.tp$iternext = function () {
        // todo; StopIteration
        if (this.$index >= this.$keys.length) {
            return undefined;
        }
        return this.$keys[this.$index++];
        // return this.$obj[this.$keys[this.$index++]].lhs;
    };
    this.$r = function () {
        return new Sk.builtin.str("dictionary-keyiterator");
    };
    return this;
};

Sk.abstr.setUpInheritance("dictionary-keyiterator", Sk.builtin.dict_iter_, Sk.builtin.object);

Sk.builtin.dict_iter_.prototype.__class__ = Sk.builtin.dict_iter_;

Sk.builtin.dict_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    return self;
});

Sk.builtin.dict_iter_.prototype["next"] = new Sk.builtin.func(function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
});



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/numtype.js ---- */ 

/**
 * @constructor
 * Sk.builtin.numtype
 *
 * @description
 * Abstract class for Python numeric types.
 *
 * @extends {Sk.builtin.object}
 *
 * @return {undefined} Cannot instantiate a Sk.builtin.numtype object
 */
Sk.builtin.numtype = function () {

    throw new Sk.builtin.ExternalError("Cannot instantiate abstract Sk.builtin.numtype class");

};

Sk.abstr.setUpInheritance("NumericType", Sk.builtin.numtype, Sk.builtin.object);

Sk.builtin.numtype.sk$abstract = true;

/**
 * Python wrapper of `__abs__` method.
 *
 * @name  __abs__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__abs__"] = new Sk.builtin.func(function (self) {

    if (self.nb$abs === undefined) {
        throw new Sk.builtin.NotImplementedError("__abs__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__abs__", arguments, 0, 0, false, true);
    return self.nb$abs();

});

/**
 * Python wrapper of `__neg__` method.
 *
 * @name  __neg__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__neg__"] = new Sk.builtin.func(function (self) {

    if (self.nb$negative === undefined) {
        throw new Sk.builtin.NotImplementedError("__neg__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__neg__", arguments, 0, 0, false, true);
    return self.nb$negative();

});

/**
 * Python wrapper of `__pos__` method.
 *
 * @name  __pos__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__pos__"] = new Sk.builtin.func(function (self) {

    if (self.nb$positive === undefined) {
        throw new Sk.builtin.NotImplementedError("__pos__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__pos__", arguments, 0, 0, false, true);
    return self.nb$positive();

});

/**
 * Python wrapper of `__int__` method.
 *
 * @name  __int__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__int__"] = new Sk.builtin.func(function (self) {

    if (self.nb$int_ === undefined) {
        throw new Sk.builtin.NotImplementedError("__int__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__int__", arguments, 0, 0, false, true);
    return self.nb$int_();

});

/**
 * Python wrapper of `__long__` method.
 *
 * @name  __long__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__long__"] = new Sk.builtin.func(function (self) {

    if (self.nb$lng === undefined) {
        throw new Sk.builtin.NotImplementedError("__long__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__long__", arguments, 0, 0, false, true);
    return self.nb$lng();

});

/**
 * Python wrapper of `__float__` method.
 *
 * @name  __float__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__float__"] = new Sk.builtin.func(function (self) {

    if (self.nb$float_ === undefined) {
        throw new Sk.builtin.NotImplementedError("__float__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__float__", arguments, 0, 0, false, true);
    return self.nb$float_();

});

/**
 * Python wrapper of `__add__` method.
 *
 * @name  __add__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__add__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$add === undefined) {
        throw new Sk.builtin.NotImplementedError("__add__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__add__", arguments, 1, 1, false, true);
    return self.nb$add(other);

});

/**
 * Python wrapper of `__radd__` method.
 *
 * @name  __radd__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__radd__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_add === undefined) {
        throw new Sk.builtin.NotImplementedError("__radd__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__radd__", arguments, 1, 1, false, true);
    return self.nb$reflected_add(other);

});

/**
 * Python wrapper of `__sub__` method.
 *
 * @name  __sub__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__sub__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$subtract === undefined) {
        throw new Sk.builtin.NotImplementedError("__sub__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__sub__", arguments, 1, 1, false, true);
    return self.nb$subtract(other);

});

/**
 * Python wrapper of `__rsub__` method.
 *
 * @name  __rsub__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rsub__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_subtract === undefined) {
        throw new Sk.builtin.NotImplementedError("__rsub__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rsub__", arguments, 1, 1, false, true);
    return self.nb$reflected_subtract(other);

});

/**
 * Python wrapper of `__mul__` method.
 *
 * @name  __mul__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__mul__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$multiply === undefined) {
        throw new Sk.builtin.NotImplementedError("__mul__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__mul__", arguments, 1, 1, false, true);
    return self.nb$multiply(other);

});

/**
 * Python wrapper of `__rmul__` method.
 *
 * @name  __rmul__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rmul__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_multiply === undefined) {
        throw new Sk.builtin.NotImplementedError("__rmul__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rmul__", arguments, 1, 1, false, true);
    return self.nb$reflected_multiply(other);

});

/**
 * Python wrapper of `__div__` method.
 *
 * @name  __div__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__div__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__div__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__div__", arguments, 1, 1, false, true);
    return self.nb$divide(other);

});

/**
 * Python wrapper of `__rdiv__` method.
 *
 * @name  __rdiv__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rdiv__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__rdiv__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rdiv__", arguments, 1, 1, false, true);
    return self.nb$reflected_divide(other);

});

/**
 * Python wrapper of `__floordiv__` method.
 *
 * @name  __floordiv__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__floordiv__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$floor_divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__floordiv__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__floordiv__", arguments, 1, 1, false, true);
    return self.nb$floor_divide(other);

});

/**
 * Python wrapper of `__rfloordiv__` method.
 *
 * @name  __rfloordiv__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rfloordiv__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_floor_divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__rfloordiv__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rfloordiv__", arguments, 1, 1, false, true);
    return self.nb$reflected_floor_divide(other);

});

/**
 * Python wrapper of `__mod__` method.
 *
 * @name  __mod__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__mod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$remainder === undefined) {
        throw new Sk.builtin.NotImplementedError("__mod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__mod__", arguments, 1, 1, false, true);
    return self.nb$remainder(other);

});

/**
 * Python wrapper of `__rmod__` method.
 *
 * @name  __rmod__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rmod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_remainder === undefined) {
        throw new Sk.builtin.NotImplementedError("__rmod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rmod__", arguments, 1, 1, false, true);
    return self.nb$reflected_remainder(other);

});

/**
 * Python wrapper of `__divmod__` method.
 *
 * @name  __divmod__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__divmod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$divmod === undefined) {
        throw new Sk.builtin.NotImplementedError("__divmod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__divmod__", arguments, 1, 1, false, true);
    return self.nb$divmod(other);

});

/**
 * Python wrapper of `__rdivmod__` method.
 *
 * @name  __rdivmod__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rdivmod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_divmod === undefined) {
        throw new Sk.builtin.NotImplementedError("__rdivmod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rdivmod__", arguments, 1, 1, false, true);
    return self.nb$reflected_divmod(other);

});

/**
 * Python wrapper of `__pow__` method.
 *
 * @name  __pow__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__pow__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$power === undefined) {
        throw new Sk.builtin.NotImplementedError("__pow__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__pow__", arguments, 1, 1, false, true);
    return self.nb$power(other);

});

/**
 * Python wrapper of `__rpow__` method.
 *
 * @name  __rpow__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rpow__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_power === undefined) {
        throw new Sk.builtin.NotImplementedError("__rpow__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rpow__", arguments, 1, 1, false, true);
    return self.nb$reflected_power(other);

});

/**
 * Python wrapper of `__coerce__` method.
 *
 * @name  __coerce__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__coerce__"] = new Sk.builtin.func(function (self, other) {

    throw new Sk.builtin.NotImplementedError("__coerce__ is not yet implemented");

});

/**
 * Add a Python object to this instance and return the result (i.e. this + other).
 *
 * Returns NotImplemented if addition between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to add.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the addition.
 */
Sk.builtin.numtype.prototype.nb$add = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_add = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_add = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Subtract a Python object from this instance and return the result (i.e. this - other).
 *
 * Returns NotImplemented if subtraction between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to subtract.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the subtraction.
 */
Sk.builtin.numtype.prototype.nb$subtract = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_subtract = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_subtract = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Multiply this instance by a Python object and return the result (i.e. this * other).
 *
 * Returns NotImplemented if multiplication between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The multiplier, which must be a Python object.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the multiplication
 */
Sk.builtin.numtype.prototype.nb$multiply = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};


Sk.builtin.numtype.prototype.nb$reflected_multiply = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_multiply = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Divide this instance by a Python object and return the result (i.e this / other).
 *
 * Returns NotImplemented if division between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The divisor, which must be a Python object.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the division
 */
Sk.builtin.numtype.prototype.nb$divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Floor divide this instance by a Python object and return the result (i.e. this // other).
 *
 * Returns NotImplemented if floor division between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The divisor, which must be a Python object.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the floor division
 */
Sk.builtin.numtype.prototype.nb$floor_divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_floor_divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_floor_divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Modulo this instance by a Python object and return the result (i.e. this % other).
 *
 * Returns NotImplemented if modulation between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The divisor, which must be a Python object.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the modulation
 */
Sk.builtin.numtype.prototype.nb$remainder = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_remainder = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_remainder = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the quotient and the remainder of this instance and a given Python object and return the result.
 *
 * Returns NotImplemented if division or modulo operations between this type and other type are unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The divisor, which must be a Python object.
 * @return {(Sk.builtin.tuple|Sk.builtin.NotImplemented)} The result of the operation.
 * If both operations are supported, a Python tuple containing (quotient, remainder) in that order.
 */
Sk.builtin.numtype.prototype.nb$divmod = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_divmod = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Raise this instance by a Python object, optionally modulo the exponent, and return the final result.
 *
 * If mod is undefined, return this \*\* other. Else, return (this \*\* other) % mod.
 *
 * Returns NotImplemented if exponentiation or modulation between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The exponent, which must be a Python object.
 * @param  {!Sk.builtin.object=} mod The optional divisor, which must be a Python object if defined.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the exponentiation.
 */
Sk.builtin.numtype.prototype.nb$power = function (other, mod) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_power = function (other, mod) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_power = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the absolute value of this instance and return.
 *
 * Javascript function, returns Python object.
 *
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The absolute value
 */
Sk.builtin.numtype.prototype.nb$abs = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the unary negative of this instance (i.e. -this).
 *
 * Javscript function, returns Python object.
 *
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} A copy of this instance with the value negated
 */
Sk.builtin.numtype.prototype.nb$negative = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the unary positive of this instance (i.e. +this).
 *
 * Javscript function, returns Python object.
 *
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} A copy of this instance with the value unchanged
 */
Sk.builtin.numtype.prototype.nb$positive = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is nonzero.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this instance is not equal to zero, false otherwise
 */
Sk.builtin.numtype.prototype.nb$nonzero = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is negative.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this instance is negative, false otherwise
 */
Sk.builtin.numtype.prototype.nb$isnegative = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is positive.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this instance is positive, false otherwise
 */
Sk.builtin.numtype.prototype.nb$ispositive = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/biginteger.js ---- */ 

/**
 * @fileoverview
 * @suppress {checkTypes}
 */

/*
 * Basic JavaScript BN library - subset useful for RSA encryption.
 *
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */


// (public) Constructor
/**
 * @constructor
 * @param {number|string|null} a
 * @param {number=} b
 * @param {*=} c
 */
Sk.builtin.biginteger = function (a, b, c) {
    if (a != null) {
        if ("number" == typeof a) {
            this.fromNumber(a, b, c);
        } else if (b == null && "string" != typeof a) {
            this.fromString(a, 256);
        } else {
            this.fromString(a, b);
        }
    }
};

// Bits per digit
//Sk.builtin.biginteger.dbits;

// JavaScript engine analysis
Sk.builtin.biginteger.canary = 0xdeadbeefcafe;
Sk.builtin.biginteger.j_lm = ((Sk.builtin.biginteger.canary & 0xffffff) == 0xefcafe);

// return new, unset Sk.builtin.biginteger
Sk.builtin.biginteger.nbi = function () {
    return new Sk.builtin.biginteger(null);
};

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
Sk.builtin.biginteger.prototype.am1 = function (i, x, w, j, c, n) {
    var v;
    while (--n >= 0) {
        v = x * this[i++] + w[j] + c;
        c = Math.floor(v / 0x4000000);
        w[j++] = v & 0x3ffffff;
    }
    return c;
};
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
Sk.builtin.biginteger.prototype.am2 = function (i, x, w, j, c, n) {
    var m;
    var h;
    var l;
    var xl = x & 0x7fff, xh = x >> 15;
    while (--n >= 0) {
        l = this[i] & 0x7fff;
        h = this[i++] >> 15;
        m = xh * l + h * xl;
        l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
        c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
        w[j++] = l & 0x3fffffff;
    }
    return c;
};
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
Sk.builtin.biginteger.prototype.am3 = function (i, x, w, j, c, n) {
    var m;
    var h;
    var l;
    var xl = x & 0x3fff, xh = x >> 14;
    while (--n >= 0) {
        l = this[i] & 0x3fff;
        h = this[i++] >> 14;
        m = xh * l + h * xl;
        l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
        c = (l >> 28) + (m >> 14) + xh * h;
        w[j++] = l & 0xfffffff;
    }
    return c;
};

// We need to select the fastest one that works in this environment.
//if (Sk.builtin.biginteger.j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
//	Sk.builtin.biginteger.prototype.am = am2;
//	Sk.builtin.biginteger.dbits = 30;
//} else if (Sk.builtin.biginteger.j_lm && (navigator.appName != "Netscape")) {
//	Sk.builtin.biginteger.prototype.am = am1;
//	Sk.builtin.biginteger.dbits = 26;
//} else { // Mozilla/Netscape seems to prefer am3
//	Sk.builtin.biginteger.prototype.am = am3;
//	Sk.builtin.biginteger.dbits = 28;
//}

// For node.js, we pick am3 with max Sk.builtin.biginteger.dbits to 28.
Sk.builtin.biginteger.prototype.am = Sk.builtin.biginteger.prototype.am3;
Sk.builtin.biginteger.dbits = 28;

Sk.builtin.biginteger.prototype.DB = Sk.builtin.biginteger.dbits;
Sk.builtin.biginteger.prototype.DM = ((1 << Sk.builtin.biginteger.dbits) - 1);
Sk.builtin.biginteger.prototype.DV = (1 << Sk.builtin.biginteger.dbits);

Sk.builtin.biginteger.BI_FP = 52;
Sk.builtin.biginteger.prototype.FV = Math.pow(2, Sk.builtin.biginteger.BI_FP);
Sk.builtin.biginteger.prototype.F1 = Sk.builtin.biginteger.BI_FP - Sk.builtin.biginteger.dbits;
Sk.builtin.biginteger.prototype.F2 = 2 * Sk.builtin.biginteger.dbits - Sk.builtin.biginteger.BI_FP;

// Digit conversions
Sk.builtin.biginteger.BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
Sk.builtin.biginteger.BI_RC = [];
var rr, vv;
rr = "0".charCodeAt(0);
for (vv = 0; vv <= 9; ++vv) {
    Sk.builtin.biginteger.BI_RC[rr++] = vv;
}
rr = "a".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    Sk.builtin.biginteger.BI_RC[rr++] = vv;
}
rr = "A".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    Sk.builtin.biginteger.BI_RC[rr++] = vv;
}

Sk.builtin.biginteger.int2char = function (n) {
    return Sk.builtin.biginteger.BI_RM.charAt(n);
};
Sk.builtin.biginteger.intAt = function (s, i) {
    var c = Sk.builtin.biginteger.BI_RC[s.charCodeAt(i)];
    return (c == null) ? -1 : c;
};

// (protected) copy this to r
Sk.builtin.biginteger.prototype.bnpCopyTo = function (r) {
    var i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i] = this[i];
    }
    r.t = this.t;
    r.s = this.s;
};

// (protected) set from integer value x, -DV <= x < DV
Sk.builtin.biginteger.prototype.bnpFromInt = function (x) {
    this.t = 1;
    this.s = (x < 0) ? -1 : 0;
    if (x > 0) {
        this[0] = x;
    } else if (x < -1) {
        this[0] = x + this.DV;
    } else {
        this.t = 0;
    }
};

// return bigint initialized to value
Sk.builtin.biginteger.nbv = function (i) {
    var r = new Sk.builtin.biginteger(null);
    r.bnpFromInt(i);
    return r;
};

// (protected) set from string and radix
Sk.builtin.biginteger.prototype.bnpFromString = function (s, b) {
    var x;
    var i, mi, sh;
    var k;
    if (b == 16) {
        k = 4;
    } else if (b == 8) {
        k = 3;
    } else if (b == 256) {
        k = 8;
    }  else if (b == 2) {
        // byte array
        k = 1;
    } else if (b == 32) {
        k = 5;
    } else if (b == 4) {
        k = 2;
    } else {
        this.fromRadix(s, b);
        return;
    }
    this.t = 0;
    this.s = 0;
    i = s.length;
    mi = false;
    sh = 0;
    while (--i >= 0) {
        x = (k == 8) ? s[i] & 0xff : Sk.builtin.biginteger.intAt(s, i);
        if (x < 0) {
            if (s.charAt(i) == "-") {
                mi = true;
            }
            continue;
        }
        mi = false;
        if (sh === 0) {
            this[this.t++] = x;
        } else if (sh + k > this.DB) {
            this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
            this[this.t++] = (x >> (this.DB - sh));
        } else {
            this[this.t - 1] |= x << sh;
        }
        sh += k;
        if (sh >= this.DB) {
            sh -= this.DB;
        }
    }
    if (k == 8 && (s[0] & 0x80) !== 0) {
        this.s = -1;
        if (sh > 0) {
            this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
        }
    }
    this.clamp();
    if (mi) {
        Sk.builtin.biginteger.ZERO.subTo(this, this);
    }
};

// (protected) clamp off excess high words
Sk.builtin.biginteger.prototype.bnpClamp = function () {
    var c = this.s & this.DM;
    while (this.t > 0 && this[this.t - 1] == c) {
        --this.t;
    }
};

// (public) return string representation in given radix
Sk.builtin.biginteger.prototype.bnToString = function (b) {
    var p;
    var km, d, m, r, i;
    var k;
    if (this.s < 0) {
        return "-" + this.negate().toString(b);
    }
    if (b == 16) {
        k = 4;
    } else if (b == 8) {
        k = 3;
    } else if (b == 2) {
        k = 1;
    } else if (b == 32) {
        k = 5;
    } else if (b == 4) {
        k = 2;
    } else {
        return this.toRadix(b);
    }
    km = (1 << k) - 1, m = false, r = "", i = this.t;
    p = this.DB - (i * this.DB) % k;
    if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) > 0) {
            m = true;
            r = Sk.builtin.biginteger.int2char(d);
        }
        while (i >= 0) {
            if (p < k) {
                d = (this[i] & ((1 << p) - 1)) << (k - p);
                d |= this[--i] >> (p += this.DB - k);
            } else {
                d = (this[i] >> (p -= k)) & km;
                if (p <= 0) {
                    p += this.DB;
                    --i;
                }
            }
            if (d > 0) {
                m = true;
            }
            if (m) {
                r += Sk.builtin.biginteger.int2char(d);
            }
        }
    }
    return m ? r : "0";
};

// (public) -this
Sk.builtin.biginteger.prototype.bnNegate = function () {
    var r = Sk.builtin.biginteger.nbi();
    Sk.builtin.biginteger.ZERO.subTo(this, r);
    return r;
};

// (public) |this|
Sk.builtin.biginteger.prototype.bnAbs = function () {
    return (this.s < 0) ? this.negate() : this;
};

// (public) return + if this > a, - if this < a, 0 if equal
Sk.builtin.biginteger.prototype.bnCompareTo = function (a) {
    var i;
    var r = this.s - a.s;
    if (r !== 0) {
        return r;
    }
    i = this.t;
    r = i - a.t;
    if (r !== 0) {
        return (this.s < 0) ? -r : r;
    }
    while (--i >= 0) {
        if ((r = this[i] - a[i]) !== 0) {
            return r;
        }
    }
    return 0;
};

// returns bit length of the integer x
Sk.builtin.biginteger.nbits = function (x) {
    var r = 1, t;
    if ((t = x >>> 16) !== 0) {
        x = t;
        r += 16;
    }
    if ((t = x >> 8) !== 0) {
        x = t;
        r += 8;
    }
    if ((t = x >> 4) !== 0) {
        x = t;
        r += 4;
    }
    if ((t = x >> 2) !== 0) {
        x = t;
        r += 2;
    }
    if ((t = x >> 1) !== 0) {
        x = t;
        r += 1;
    }
    return r;
};

// (public) return the number of bits in "this"
Sk.builtin.biginteger.prototype.bnBitLength = function () {
    if (this.t <= 0) {
        return 0;
    }
    return this.DB * (this.t - 1) + Sk.builtin.biginteger.nbits(this[this.t - 1] ^ (this.s & this.DM));
};

// (protected) r = this << n*DB
Sk.builtin.biginteger.prototype.bnpDLShiftTo = function (n, r) {
    var i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i + n] = this[i];
    }
    for (i = n - 1; i >= 0; --i) {
        r[i] = 0;
    }
    r.t = this.t + n;
    r.s = this.s;
};

// (protected) r = this >> n*DB
Sk.builtin.biginteger.prototype.bnpDRShiftTo = function (n, r) {
    var i;
    for (i = n; i < this.t; ++i) {
        r[i - n] = this[i];
    }
    r.t = Math.max(this.t - n, 0);
    r.s = this.s;
};

// (protected) r = this << n
Sk.builtin.biginteger.prototype.bnpLShiftTo = function (n, r) {
    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << cbs) - 1;
    var ds = Math.floor(n / this.DB), c = (this.s << bs) & this.DM, i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i + ds + 1] = (this[i] >> cbs) | c;
        c = (this[i] & bm) << bs;
    }
    for (i = ds - 1; i >= 0; --i) {
        r[i] = 0;
    }
    r[ds] = c;
    r.t = this.t + ds + 1;
    r.s = this.s;
    r.clamp();
};

// (protected) r = this >> n
Sk.builtin.biginteger.prototype.bnpRShiftTo = function (n, r) {
    var i;
    var bm;
    var cbs;
    var bs;
    var ds;
    r.s = this.s;
    ds = Math.floor(n / this.DB);
    if (ds >= this.t) {
        r.t = 0;
        return;
    }
    bs = n % this.DB;
    cbs = this.DB - bs;
    bm = (1 << bs) - 1;
    r[0] = this[ds] >> bs;
    for (i = ds + 1; i < this.t; ++i) {
        r[i - ds - 1] |= (this[i] & bm) << cbs;
        r[i - ds] = this[i] >> bs;
    }
    if (bs > 0) {
        r[this.t - ds - 1] |= (this.s & bm) << cbs;
    }
    r.t = this.t - ds;
    r.clamp();
};

// (protected) r = this - a
Sk.builtin.biginteger.prototype.bnpSubTo = function (a, r) {
    var i = 0, c = 0, m = Math.min(a.t, this.t);
    while (i < m) {
        c += this[i] - a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
    }
    if (a.t < this.t) {
        c -= a.s;
        while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += this.s;
    } else {
        c += this.s;
        while (i < a.t) {
            c -= a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c -= a.s;
    }
    r.s = (c < 0) ? -1 : 0;
    if (c < -1) {
        r[i++] = this.DV + c;
    } else if (c > 0) {
        r[i++] = c;
    }
    r.t = i;
    r.clamp();
};

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
Sk.builtin.biginteger.prototype.bnpMultiplyTo = function (a, r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i + y.t;
    while (--i >= 0) {
        r[i] = 0;
    }
    for (i = 0; i < y.t; ++i) {
        r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
    }
    r.s = 0;
    r.clamp();
    if (this.s != a.s) {
        Sk.builtin.biginteger.ZERO.subTo(r, r);
    }
};

// (protected) r = this^2, r != this (HAC 14.16)
Sk.builtin.biginteger.prototype.bnpSquareTo = function (r) {
    var c;
    var x = this.abs();
    var i = r.t = 2 * x.t;
    while (--i >= 0) {
        r[i] = 0;
    }
    for (i = 0; i < x.t - 1; ++i) {
        c = x.am(i, x[i], r, 2 * i, 0, 1);
        if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
            r[i + x.t] -= x.DV;
            r[i + x.t + 1] = 1;
        }
    }
    if (r.t > 0) {
        r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
    }
    r.s = 0;
    r.clamp();
};

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
Sk.builtin.biginteger.prototype.bnpDivRemTo = function (m, q, r) {
    var qd;
    var i, j, t;
    var d1, d2, e;
    var yt;
    var y0;
    var ys;
    var nsh;
    var y, ts, ms;
    var pt;
    var pm = m.abs();
    if (pm.t <= 0) {
        return;
    }
    pt = this.abs();
    if (pt.t < pm.t) {
        if (q != null) {
            q.fromInt(0);
        }
        if (r != null) {
            this.copyTo(r);
        }
        return;
    }
    if (r == null) {
        r = Sk.builtin.biginteger.nbi();
    }
    y = Sk.builtin.biginteger.nbi();
    ts = this.s;
    ms = m.s;
    nsh = this.DB - Sk.builtin.biginteger.nbits(pm[pm.t - 1]);	// normalize modulus
    if (nsh > 0) {
        pm.lShiftTo(nsh, y);
        pt.lShiftTo(nsh, r);
    } else {
        pm.copyTo(y);
        pt.copyTo(r);
    }
    ys = y.t;
    y0 = y[ys - 1];
    if (y0 === 0) {
        return;
    }
    yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
    d1 = this.FV / yt, d2 = (1 << this.F1) / yt;
    e = 1 << this.F2;
    i = r.t, j = i - ys;
    t = (q == null) ? Sk.builtin.biginteger.nbi() : q;
    y.dlShiftTo(j, t);
    if (r.compareTo(t) >= 0) {
        r[r.t++] = 1;
        r.subTo(t, r);
    }
    Sk.builtin.biginteger.ONE.dlShiftTo(ys, t);
    t.subTo(y, y);	// "negative" y so we can replace sub with am later
    while (y.t < ys) {
        y[y.t++] = 0;
    }
    while (--j >= 0) {
        // Estimate quotient digit
        qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
        if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {	// Try it out
            y.dlShiftTo(j, t);
            r.subTo(t, r);
            while (r[i] < --qd) {
                r.subTo(t, r);
            }
        }
    }
    if (q != null) {
        r.drShiftTo(ys, q);
        if (ts != ms) {
            Sk.builtin.biginteger.ZERO.subTo(q, q);
        }
    }
    r.t = ys;
    r.clamp();
    if (nsh > 0) {
        r.rShiftTo(nsh, r);
    }	// Denormalize remainder
    if (ts < 0) {
        Sk.builtin.biginteger.ZERO.subTo(r, r);
    }
};

// (public) this mod a
Sk.builtin.biginteger.prototype.bnMod = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.abs().divRemTo(a, null, r);
    if (this.s < 0 && r.compareTo(Sk.builtin.biginteger.ZERO) > 0) {
        a.subTo(r, r);
    }
    return r;
};

// Modular reduction using "classic" algorithm
/**
 * @constructor
 * @extends Sk.builtin.biginteger
 */
Sk.builtin.biginteger.Classic = function (m) {
    this.m = m;
};
Sk.builtin.biginteger.prototype.cConvert = function (x) {
    if (x.s < 0 || x.compareTo(this.m) >= 0) {
        return x.mod(this.m);
    } else {
        return x;
    }
};
Sk.builtin.biginteger.prototype.cRevert = function (x) {
    return x;
};
Sk.builtin.biginteger.prototype.cReduce = function (x) {
    x.divRemTo(this.m, null, x);
};
Sk.builtin.biginteger.prototype.cMulTo = function (x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
};
Sk.builtin.biginteger.prototype.cSqrTo = function (x, r) {
    x.squareTo(r);
    this.reduce(r);
};

Sk.builtin.biginteger.Classic.prototype.convert = Sk.builtin.biginteger.prototype.cConvert;
Sk.builtin.biginteger.Classic.prototype.revert = Sk.builtin.biginteger.prototype.cRevert;
Sk.builtin.biginteger.Classic.prototype.reduce = Sk.builtin.biginteger.prototype.cReduce;
Sk.builtin.biginteger.Classic.prototype.mulTo = Sk.builtin.biginteger.prototype.cMulTo;
Sk.builtin.biginteger.Classic.prototype.sqrTo = Sk.builtin.biginteger.prototype.cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
Sk.builtin.biginteger.prototype.bnpInvDigit = function () {
    var y;
    var x;
    if (this.t < 1) {
        return 0;
    }
    x = this[0];
    if ((x & 1) === 0) {
        return 0;
    }
    y = x & 3;		// y == 1/x mod 2^2
    y = (y * (2 - (x & 0xf) * y)) & 0xf;	// y == 1/x mod 2^4
    y = (y * (2 - (x & 0xff) * y)) & 0xff;	// y == 1/x mod 2^8
    y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y * (2 - x * y % this.DV)) % this.DV;		// y == 1/x mod 2^Sk.builtin.biginteger.dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y > 0) ? this.DV - y : -y;
};

// Sk.builtin.Montgomery reduction
/**
 * @constructor
 * @extends Sk.builtin.biginteger
 */
Sk.builtin.biginteger.Montgomery = function (m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp & 0x7fff;
    this.mph = this.mp >> 15;
    this.um = (1 << (m.DB - 15)) - 1;
    this.mt2 = 2 * m.t;
};

// xR mod m
Sk.builtin.biginteger.prototype.montConvert = function (x) {
    var r = Sk.builtin.biginteger.nbi();
    x.abs().dlShiftTo(this.m.t, r);
    r.divRemTo(this.m, null, r);
    if (x.s < 0 && r.compareTo(Sk.builtin.biginteger.ZERO) > 0) {
        this.m.subTo(r, r);
    }
    return r;
};

// x/R mod m
Sk.builtin.biginteger.prototype.montRevert = function (x) {
    var r = Sk.builtin.biginteger.nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
};

// x = x/R mod m (HAC 14.32)
Sk.builtin.biginteger.prototype.montReduce = function (x) {
    var u0;
    var j;
    var i;
    while (x.t <= this.mt2) {
        // pad x so am has enough room later
        x[x.t++] = 0;
    }
    for (i = 0; i < this.m.t; ++i) {
        // faster way of calculating u0 = x[i]*mp mod DV
        j = x[i] & 0x7fff;
        u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
        // use am to combine the multiply-shift-add into one call
        j = i + this.m.t;
        x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
        // propagate carry
        while (x[j] >= x.DV) {
            x[j] -= x.DV;
            x[++j]++;
        }
    }
    x.clamp();
    x.drShiftTo(this.m.t, x);
    if (x.compareTo(this.m) >= 0) {
        x.subTo(this.m, x);
    }
};

// r = "x^2/R mod m"; x != r
Sk.builtin.biginteger.prototype.montSqrTo = function (x, r) {
    x.squareTo(r);
    this.reduce(r);
};

// r = "xy/R mod m"; x,y != r
Sk.builtin.biginteger.prototype.montMulTo = function (x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
};

Sk.builtin.biginteger.Montgomery.prototype.convert = Sk.builtin.biginteger.prototype.montConvert;
Sk.builtin.biginteger.Montgomery.prototype.revert = Sk.builtin.biginteger.prototype.montRevert;
Sk.builtin.biginteger.Montgomery.prototype.reduce = Sk.builtin.biginteger.prototype.montReduce;
Sk.builtin.biginteger.Montgomery.prototype.mulTo = Sk.builtin.biginteger.prototype.montMulTo;
Sk.builtin.biginteger.Montgomery.prototype.sqrTo = Sk.builtin.biginteger.prototype.montSqrTo;

// (protected) true iff this is even
Sk.builtin.biginteger.prototype.bnpIsEven = function () {
    return ((this.t > 0) ? (this[0] & 1) : this.s) === 0;
};

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
Sk.builtin.biginteger.prototype.bnpExp = function (e, z) {
    var t;
    var r, r2, g, i;
    if (e > 0xffffffff || e < 1) {
        return Sk.builtin.biginteger.ONE;
    }
    r = Sk.builtin.biginteger.nbi();
    r2 = Sk.builtin.biginteger.nbi();
    g = z.convert(this);
    i = Sk.builtin.biginteger.nbits(e) - 1;
    g.copyTo(r);
    while (--i >= 0) {
        z.sqrTo(r, r2);
        if ((e & (1 << i)) > 0) {
            z.mulTo(r2, g, r);
        } else {
            t = r;
            r = r2;
            r2 = t;
        }
    }
    return z.revert(r);
};

// (public) this^e % m, 0 <= e < 2^32
Sk.builtin.biginteger.prototype.bnModPowInt = function (e, m) {
    var z;
    if (e < 256 || m.isEven()) {
        z = new Sk.builtin.biginteger.Classic(m);
    } else {
        z = new Sk.builtin.biginteger.Montgomery(m);
    }
    return this.exp(e, z);
};

// protected
Sk.builtin.biginteger.prototype.copyTo = Sk.builtin.biginteger.prototype.bnpCopyTo;
Sk.builtin.biginteger.prototype.fromInt = Sk.builtin.biginteger.prototype.bnpFromInt;
Sk.builtin.biginteger.prototype.fromString = Sk.builtin.biginteger.prototype.bnpFromString;
Sk.builtin.biginteger.prototype.clamp = Sk.builtin.biginteger.prototype.bnpClamp;
Sk.builtin.biginteger.prototype.dlShiftTo = Sk.builtin.biginteger.prototype.bnpDLShiftTo;
Sk.builtin.biginteger.prototype.drShiftTo = Sk.builtin.biginteger.prototype.bnpDRShiftTo;
Sk.builtin.biginteger.prototype.lShiftTo = Sk.builtin.biginteger.prototype.bnpLShiftTo;
Sk.builtin.biginteger.prototype.rShiftTo = Sk.builtin.biginteger.prototype.bnpRShiftTo;
Sk.builtin.biginteger.prototype.subTo = Sk.builtin.biginteger.prototype.bnpSubTo;
Sk.builtin.biginteger.prototype.multiplyTo = Sk.builtin.biginteger.prototype.bnpMultiplyTo;
Sk.builtin.biginteger.prototype.squareTo = Sk.builtin.biginteger.prototype.bnpSquareTo;
Sk.builtin.biginteger.prototype.divRemTo = Sk.builtin.biginteger.prototype.bnpDivRemTo;
Sk.builtin.biginteger.prototype.invDigit = Sk.builtin.biginteger.prototype.bnpInvDigit;
Sk.builtin.biginteger.prototype.isEven = Sk.builtin.biginteger.prototype.bnpIsEven;
Sk.builtin.biginteger.prototype.exp = Sk.builtin.biginteger.prototype.bnpExp;

// public
Sk.builtin.biginteger.prototype.toString = Sk.builtin.biginteger.prototype.bnToString;
Sk.builtin.biginteger.prototype.negate = Sk.builtin.biginteger.prototype.bnNegate;
Sk.builtin.biginteger.prototype.abs = Sk.builtin.biginteger.prototype.bnAbs;
Sk.builtin.biginteger.prototype.compareTo = Sk.builtin.biginteger.prototype.bnCompareTo;
Sk.builtin.biginteger.prototype.bitLength = Sk.builtin.biginteger.prototype.bnBitLength;
Sk.builtin.biginteger.prototype.mod = Sk.builtin.biginteger.prototype.bnMod;
Sk.builtin.biginteger.prototype.modPowInt = Sk.builtin.biginteger.prototype.bnModPowInt;

// "constants"
Sk.builtin.biginteger.ZERO = Sk.builtin.biginteger.nbv(0);
Sk.builtin.biginteger.ONE = Sk.builtin.biginteger.nbv(1);

//Copyright (c) 2005-2009  Tom Wu
//All Rights Reserved.
//See "LICENSE" for details.

//Extended JavaScript BN functions, required for RSA private ops.

//Version 1.1: new Sk.builtin.biginteger("0", 10) returns "proper" zero

//(public)
Sk.builtin.biginteger.prototype.bnClone = function () {
    var r = Sk.builtin.biginteger.nbi();
    this.copyTo(r);
    return r;
};

//(public) return value as integer
Sk.builtin.biginteger.prototype.bnIntValue = function () {
    if (this.s < 0) {
        if (this.t == 1) {
            return this[0] - this.DV;
        } else if (this.t === 0) {
            return -1;
        }
    } else if (this.t == 1) {
        return this[0];
    } else if (this.t === 0) {
        return 0;
    }
    return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
};

//(public) return value as byte
Sk.builtin.biginteger.prototype.bnByteValue = function () {
    return (this.t === 0) ? this.s : (this[0] << 24) >> 24;
};

//(public) return value as short (assumes DB>=16)
Sk.builtin.biginteger.prototype.bnShortValue = function () {
    return (this.t === 0) ? this.s : (this[0] << 16) >> 16;
};

//(protected) return x s.t. r^x < DV
Sk.builtin.biginteger.prototype.bnpChunkSize = function (r) {
    return Math.floor(Math.LN2 * this.DB / Math.log(r));
};

//(public) 0 if this == 0, 1 if this > 0
Sk.builtin.biginteger.prototype.bnSigNum = function () {
    if (this.s < 0) {
        return -1;
    } else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) {
        return 0;
    } else {
        return 1;
    }
};

//(protected) convert to radix string
Sk.builtin.biginteger.prototype.bnpToRadix = function (b) {
    var d, y, z, r;
    var a;
    var cs;
    if (b == null) {
        b = 10;
    }
    if (this.signum() === 0 || b < 2 || b > 36) {
        return "0";
    }
    cs = this.chunkSize(b);
    a = Math.pow(b, cs);
    d = Sk.builtin.biginteger.nbv(a);
    y = Sk.builtin.biginteger.nbi(); z = Sk.builtin.biginteger.nbi();
    r = "";
    this.divRemTo(d, y, z);
    while (y.signum() > 0) {
        r = (a + z.intValue()).toString(b).substr(1) + r;
        y.divRemTo(d, y, z);
    }
    return z.intValue().toString(b) + r;
};

//(protected) convert from radix string
Sk.builtin.biginteger.prototype.bnpFromRadix = function (s, b) {
    var x;
    var i;
    var d, mi, j, w;
    var cs;
    this.fromInt(0);
    if (b == null) {
        b = 10;
    }
    cs = this.chunkSize(b);
    d = Math.pow(b, cs);
    mi = false;
    j = 0;
    w = 0;
    for (i = 0; i < s.length; ++i) {
        x = Sk.builtin.biginteger.intAt(s, i);
        if (x < 0) {
            if (s.charAt(i) == "-" && this.signum() === 0) {
                mi = true;
            }
            if (s.charAt(i) == ".") {
                break;
            }
            continue;
        }
        w = b * w + x;
        if (++j >= cs) {
            this.dMultiply(d);
            this.dAddOffset(w, 0);
            j = 0;
            w = 0;
        }
    }
    if (j > 0) {
        this.dMultiply(Math.pow(b, j));
        this.dAddOffset(w, 0);
    }
    if (mi) {
        Sk.builtin.biginteger.ZERO.subTo(this, this);
    }
};

//(protected) alternate constructor
Sk.builtin.biginteger.prototype.bnpFromNumber = function (a, b, c) {
    if ("number" == typeof b) {
        // new Sk.builtin.biginteger(int,int,RNG)
        if (a < 2) {
            this.fromInt(1);
        } else {
            this.fromNumber(a, c);
            if (!this.testBit(a - 1))	{
                // force MSB set
                this.bitwiseTo(Sk.builtin.biginteger.ONE.shiftLeft(a - 1), Sk.builtin.biginteger.op_or, this);
            }
            if (this.isEven()) {
                this.dAddOffset(1, 0);
            } // force odd
            while (!this.isProbablePrime(b)) {
                this.dAddOffset(2, 0);
                if (this.bitLength() > a) {
                    this.subTo(Sk.builtin.biginteger.ONE.shiftLeft(a - 1), this);
                }
            }
        }
    }
    //	Constructor to support Java BigInteger random generation.  Forget it.
    this.fromString(a + "");
};

//(public) convert to bigendian byte array
Sk.builtin.biginteger.prototype.bnToByteArray = function () {
    var p, d, k;
    var i = this.t, r = [];
    r[0] = this.s;
    p = this.DB - (i * this.DB) % 8;
    k = 0;
    if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) {
            r[k++] = d | (this.s << (this.DB - p));
        }
        while (i >= 0) {
            if (p < 8) {
                d = (this[i] & ((1 << p) - 1)) << (8 - p);
                d |= this[--i] >> (p += this.DB - 8);
            } else {
                d = (this[i] >> (p -= 8)) & 0xff;
                if (p <= 0) {
                    p += this.DB;
                    --i;
                }
            }
            if ((d & 0x80) !== 0) {
                d |= -256;
            }
            if (k === 0 && (this.s & 0x80) != (d & 0x80)) {
                ++k;
            }
            if (k > 0 || d != this.s) {
                r[k++] = d;
            }
        }
    }
    return r;
};

Sk.builtin.biginteger.prototype.bnEquals = function (a) {
    return(this.compareTo(a) === 0);
};
Sk.builtin.biginteger.prototype.bnMin = function (a) {
    return(this.compareTo(a) < 0) ? this : a;
};
Sk.builtin.biginteger.prototype.bnMax = function (a) {
    return(this.compareTo(a) > 0) ? this : a;
};

//(protected) r = this op a (bitwise)
Sk.builtin.biginteger.prototype.bnpBitwiseTo = function (a, op, r) {
    var i, f, m = Math.min(a.t, this.t);
    for (i = 0; i < m; ++i) {
        r[i] = op(this[i], a[i]);
    }
    if (a.t < this.t) {
        f = a.s & this.DM;
        for (i = m; i < this.t; ++i) {
            r[i] = op(this[i], f);
        }
        r.t = this.t;
    } else {
        f = this.s & this.DM;
        for (i = m; i < a.t; ++i) {
            r[i] = op(f, a[i]);
        }
        r.t = a.t;
    }
    r.s = op(this.s, a.s);
    r.clamp();
};

//(public) this & a
Sk.builtin.biginteger.op_and = function (x, y) {
    return x & y;
};
Sk.builtin.biginteger.prototype.bnAnd = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.bitwiseTo(a, Sk.builtin.biginteger.op_and, r);
    return r;
};

//(public) this | a
Sk.builtin.biginteger.op_or = function (x, y) {
    return x | y;
};
Sk.builtin.biginteger.prototype.bnOr = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.bitwiseTo(a, Sk.builtin.biginteger.op_or, r);
    return r;
};

//(public) this ^ a
Sk.builtin.biginteger.op_xor = function (x, y) {
    return x ^ y;
};
Sk.builtin.biginteger.prototype.bnXor = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.bitwiseTo(a, Sk.builtin.biginteger.op_xor, r);
    return r;
};

//(public) this & ~a
Sk.builtin.biginteger.op_andnot = function (x, y) {
    return x & ~y;
};
Sk.builtin.biginteger.prototype.bnAndNot = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.bitwiseTo(a, Sk.builtin.biginteger.op_andnot, r);
    return r;
};

//(public) ~this
Sk.builtin.biginteger.prototype.bnNot = function () {
    var i;
    var r = Sk.builtin.biginteger.nbi();
    for (i = 0; i < this.t; ++i) {
        r[i] = this.DM & ~this[i];
    }
    r.t = this.t;
    r.s = ~this.s;
    return r;
};

//(public) this << n
Sk.builtin.biginteger.prototype.bnShiftLeft = function (n) {
    var r = Sk.builtin.biginteger.nbi();
    if (n < 0) {
        this.rShiftTo(-n, r);
    } else {
        this.lShiftTo(n, r);
    }
    return r;
};

//(public) this >> n
Sk.builtin.biginteger.prototype.bnShiftRight = function (n) {
    var r = Sk.builtin.biginteger.nbi();
    if (n < 0) {
        this.lShiftTo(-n, r);
    } else {
        this.rShiftTo(n, r);
    }
    return r;
};

//return index of lowest 1-bit in x, x < 2^31
Sk.builtin.biginteger.lbit = function (x) {
    var r;
    if (x === 0) {
        return -1;
    }
    r = 0;
    if ((x & 0xffff) === 0) {
        x >>= 16;
        r += 16;
    }
    if ((x & 0xff) === 0) {
        x >>= 8;
        r += 8;
    }
    if ((x & 0xf) === 0) {
        x >>= 4;
        r += 4;
    }
    if ((x & 3) === 0) {
        x >>= 2;
        r += 2;
    }
    if ((x & 1) === 0) {
        ++r;
    }
    return r;
};

//(public) returns index of lowest 1-bit (or -1 if none)
Sk.builtin.biginteger.prototype.bnGetLowestSetBit = function () {
    var i;
    for (i = 0; i < this.t; ++i) {
        if (this[i] !== 0) {
            return i * this.DB + Sk.builtin.biginteger.lbit(this[i]);
        }
    }
    if (this.s < 0) {
        return this.t * this.DB;
    }
    return -1;
};

//return number of 1 bits in x
Sk.builtin.biginteger.cbit = function (x) {
    var r = 0;
    while (x !== 0) {
        x &= x - 1;
        ++r;
    }
    return r;
};

//(public) return number of set bits
Sk.builtin.biginteger.prototype.bnBitCount = function () {
    var i;
    var r = 0, x = this.s & this.DM;
    for (i = 0; i < this.t; ++i) {
        r += Sk.builtin.biginteger.cbit(this[i] ^ x);
    }
    return r;
};

//(public) true iff nth bit is set
Sk.builtin.biginteger.prototype.bnTestBit = function (n) {
    var j = Math.floor(n / this.DB);
    if (j >= this.t) {
        return(this.s !== 0);
    }
    return((this[j] & (1 << (n % this.DB))) !== 0);
};

//(protected) this op (1<<n)
Sk.builtin.biginteger.prototype.bnpChangeBit = function (n, op) {
    var r = Sk.builtin.biginteger.ONE.shiftLeft(n);
    this.bitwiseTo(r, op, r);
    return r;
};

//(public) this | (1<<n)
Sk.builtin.biginteger.prototype.bnSetBit = function (n) {
    return this.changeBit(n, Sk.builtin.biginteger.op_or);
};

//(public) this & ~(1<<n)
Sk.builtin.biginteger.prototype.bnClearBit = function (n) {
    return this.changeBit(n, Sk.builtin.biginteger.op_andnot);
};

//(public) this ^ (1<<n)
Sk.builtin.biginteger.prototype.bnFlipBit = function (n) {
    return this.changeBit(n, Sk.builtin.biginteger.op_xor);
};

//(protected) r = this + a
Sk.builtin.biginteger.prototype.bnpAddTo = function (a, r) {
    var i = 0, c = 0, m = Math.min(a.t, this.t);
    while (i < m) {
        c += this[i] + a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
    }
    if (a.t < this.t) {
        c += a.s;
        while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += this.s;
    } else {
        c += this.s;
        while (i < a.t) {
            c += a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += a.s;
    }
    r.s = (c < 0) ? -1 : 0;
    if (c > 0) {
        r[i++] = c;
    } else if (c < -1) {
        r[i++] = this.DV + c;
    }
    r.t = i;
    r.clamp();
};

//(public) this + a
Sk.builtin.biginteger.prototype.bnAdd = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.addTo(a, r);
    return r;
};

//(public) this - a
Sk.builtin.biginteger.prototype.bnSubtract = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.subTo(a, r);
    return r;
};

//(public) this * a
Sk.builtin.biginteger.prototype.bnMultiply = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.multiplyTo(a, r);
    return r;
};

//(public) this / a
Sk.builtin.biginteger.prototype.bnDivide = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.divRemTo(a, r, null);
    return r;
};

//(public) this % a
Sk.builtin.biginteger.prototype.bnRemainder = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.divRemTo(a, null, r);
    return r;
};

//(public) [this/a,this%a]
Sk.builtin.biginteger.prototype.bnDivideAndRemainder = function (a) {
    var q = Sk.builtin.biginteger.nbi(), r = Sk.builtin.biginteger.nbi();
    this.divRemTo(a, q, r);
    return new Array(q, r);
};

//(protected) this *= n, this >= 0, 1 < n < DV
Sk.builtin.biginteger.prototype.bnpDMultiply = function (n) {
    this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
    ++this.t;
    this.clamp();
};

//(protected) this += n << w words, this >= 0
Sk.builtin.biginteger.prototype.bnpDAddOffset = function (n, w) {
    if (n === 0) {
        return;
    }
    while (this.t <= w) {
        this[this.t++] = 0;
    }
    this[w] += n;
    while (this[w] >= this.DV) {
        this[w] -= this.DV;
        if (++w >= this.t) {
            this[this.t++] = 0;
        }
        ++this[w];
    }
};

//A "null" reducer
/**
 * @constructor
 * @extends Sk.builtin.biginteger
 */
Sk.builtin.biginteger.NullExp = function () {
};
Sk.builtin.biginteger.prototype.nNop = function (x) {
    return x;
};
Sk.builtin.biginteger.prototype.nMulTo = function (x, y, r) {
    x.multiplyTo(y, r);
};
Sk.builtin.biginteger.prototype.nSqrTo = function (x, r) {
    x.squareTo(r);
};

Sk.builtin.biginteger.NullExp.prototype.convert = Sk.builtin.biginteger.prototype.nNop;
Sk.builtin.biginteger.NullExp.prototype.revert = Sk.builtin.biginteger.prototype.nNop;
Sk.builtin.biginteger.NullExp.prototype.mulTo = Sk.builtin.biginteger.prototype.nMulTo;
Sk.builtin.biginteger.NullExp.prototype.sqrTo = Sk.builtin.biginteger.prototype.nSqrTo;

//(public) this^e
Sk.builtin.biginteger.prototype.bnPow = function (e) {
    return this.exp(e, new Sk.builtin.biginteger.NullExp());
};

//(protected) r = lower n words of "this * a", a.t <= n
//"this" should be the larger one if appropriate.
Sk.builtin.biginteger.prototype.bnpMultiplyLowerTo = function (a, n, r) {
    var j;
    var i = Math.min(this.t + a.t, n);
    r.s = 0; // assumes a,this >= 0
    r.t = i;
    while (i > 0) {
        r[--i] = 0;
    }
    for (j = r.t - this.t; i < j; ++i) {
        r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
    }
    for (j = Math.min(a.t, n); i < j; ++i) {
        this.am(0, a[i], r, i, 0, n - i);
    }
    r.clamp();
};

//(protected) r = "this * a" without lower n words, n > 0
//"this" should be the larger one if appropriate.
Sk.builtin.biginteger.prototype.bnpMultiplyUpperTo = function (a, n, r) {
    var i;
    --n;
    i = r.t = this.t + a.t - n;
    r.s = 0; // assumes a,this >= 0
    while (--i >= 0) {
        r[i] = 0;
    }
    for (i = Math.max(n - this.t, 0); i < a.t; ++i) {
        r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
    }
    r.clamp();
    r.drShiftTo(1, r);
};

//Barrett modular reduction
/**
 * @constructor
 * @extends Sk.builtin.biginteger
 */
Sk.builtin.biginteger.Barrett = function (m) {
    this.r2 = Sk.builtin.biginteger.nbi();
    this.q3 = Sk.builtin.biginteger.nbi();
    Sk.builtin.biginteger.ONE.dlShiftTo(2 * m.t, this.r2);
    this.mu = this.r2.divide(m);
    this.m = m;
};

Sk.builtin.biginteger.prototype.barrettConvert = function (x) {
    var r;
    if (x.s < 0 || x.t > 2 * this.m.t) {
        return x.mod(this.m);
    } else if (x.compareTo(this.m) < 0) {
        return x;
    } else {
        r = Sk.builtin.biginteger.nbi();
        x.copyTo(r);
        this.reduce(r);
        return r;
    }
};

Sk.builtin.biginteger.prototype.barrettRevert = function (x) {
    return x;
};

//x = x mod m (HAC 14.42)
Sk.builtin.biginteger.prototype.barrettReduce = function (x) {
    x.drShiftTo(this.m.t - 1, this.r2);
    if (x.t > this.m.t + 1) {
        x.t = this.m.t + 1;
        x.clamp();
    }
    this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
    this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
    while (x.compareTo(this.r2) < 0) {
        x.dAddOffset(1, this.m.t + 1);
    }
    x.subTo(this.r2, x);
    while (x.compareTo(this.m) >= 0) {
        x.subTo(this.m, x);
    }
};

//r = x^2 mod m; x != r
Sk.builtin.biginteger.prototype.barrettSqrTo = function (x, r) {
    x.squareTo(r);
    this.reduce(r);
};

//r = x*y mod m; x,y != r
Sk.builtin.biginteger.prototype.barrettMulTo = function (x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
};

Sk.builtin.biginteger.Barrett.prototype.convert = Sk.builtin.biginteger.prototype.barrettConvert;
Sk.builtin.biginteger.Barrett.prototype.revert = Sk.builtin.biginteger.prototype.barrettRevert;
Sk.builtin.biginteger.Barrett.prototype.reduce = Sk.builtin.biginteger.prototype.barrettReduce;
Sk.builtin.biginteger.Barrett.prototype.mulTo = Sk.builtin.biginteger.prototype.barrettMulTo;
Sk.builtin.biginteger.Barrett.prototype.sqrTo = Sk.builtin.biginteger.prototype.barrettSqrTo;

//(public) this^e % m (HAC 14.85)
Sk.builtin.biginteger.prototype.bnModPow = function (e, m) {
    var j, w, is1, r2, t;
    var g2;
    var g, n, k1, km;
    var i = e.bitLength(), k, r = Sk.builtin.biginteger.nbv(1), z;
    if (i <= 0) {
        return r;
    } else if (i < 18) {
        k = 1;
    } else if (i < 48) {
        k = 3;
    } else if (i < 144) {
        k = 4;
    } else if (i < 768) {
        k = 5;
    } else {
        k = 6;
    }
    if (i < 8) {
        z = new Sk.builtin.biginteger.Classic(m);
    } else if (m.isEven()) {
        z = new Sk.builtin.biginteger.Barrett(m);
    } else {
        z = new Sk.builtin.biginteger.Montgomery(m);
    }

    g = [];
    n = 3;
    k1 = k - 1;
    km = (1 << k) - 1;
    g[1] = z.convert(this);
    if (k > 1) {
        g2 = Sk.builtin.biginteger.nbi();
        z.sqrTo(g[1], g2);
        while (n <= km) {
            g[n] = Sk.builtin.biginteger.nbi();
            z.mulTo(g2, g[n - 2], g[n]);
            n += 2;
        }
    }

    j = e.t - 1;
    is1 = true;
    r2 = Sk.builtin.biginteger.nbi();
    i = Sk.builtin.biginteger.nbits(e[j]) - 1;
    while (j >= 0) {
        if (i >= k1) {
            w = (e[j] >> (i - k1)) & km;
        } else {
            w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
            if (j > 0) {
                w |= e[j - 1] >> (this.DB + i - k1);
            }
        }

        n = k;
        while ((w & 1) === 0) {
            w >>= 1;
            --n;
        }
        if ((i -= n) < 0) {
            i += this.DB;
            --j;
        }
        if (is1) {	// ret == 1, don't bother squaring or multiplying it
            g[w].copyTo(r);
            is1 = false;
        } else {
            while (n > 1) {
                z.sqrTo(r, r2);
                z.sqrTo(r2, r);
                n -= 2;
            }
            if (n > 0) {
                z.sqrTo(r, r2);
            } else {
                t = r;
                r = r2;
                r2 = t;
            }
            z.mulTo(r2, g[w], r);
        }

        while (j >= 0 && (e[j] & (1 << i)) === 0) {
            z.sqrTo(r, r2);
            t = r;
            r = r2;
            r2 = t;
            if (--i < 0) {
                i = this.DB - 1;
                --j;
            }
        }
    }
    return z.revert(r);
};

//(public) gcd(this,a) (HAC 14.54)
Sk.builtin.biginteger.prototype.bnGCD = function (a) {
    var i, g;
    var t;
    var x = (this.s < 0) ? this.negate() : this.clone();
    var y = (a.s < 0) ? a.negate() : a.clone();
    if (x.compareTo(y) < 0) {
        t = x;
        x = y;
        y = t;
    }
    i = x.getLowestSetBit();
    g = y.getLowestSetBit();
    if (g < 0) {
        return x;
    }
    if (i < g) {
        g = i;
    }
    if (g > 0) {
        x.rShiftTo(g, x);
        y.rShiftTo(g, y);
    }
    while (x.signum() > 0) {
        if ((i = x.getLowestSetBit()) > 0) {
            x.rShiftTo(i, x);
        }
        if ((i = y.getLowestSetBit()) > 0) {
            y.rShiftTo(i, y);
        }
        if (x.compareTo(y) >= 0) {
            x.subTo(y, x);
            x.rShiftTo(1, x);
        } else {
            y.subTo(x, y);
            y.rShiftTo(1, y);
        }
    }
    if (g > 0) {
        y.lShiftTo(g, y);
    }
    return y;
};

//(protected) this % n, n < 2^26
Sk.builtin.biginteger.prototype.bnpModInt = function (n) {
    var i;
    var d, r;
    if (n <= 0) {
        return 0;
    }
    d = this.DV % n;
    r = (this.s < 0) ? n - 1 : 0;
    if (this.t > 0) {
        if (d === 0) {
            r = this[0] % n;
        } else {
            for (i = this.t - 1; i >= 0; --i) {
                r = (d * r + this[i]) % n;
            }
        }
    }
    return r;
};

//(public) 1/this % m (HAC 14.61)
Sk.builtin.biginteger.prototype.bnModInverse = function (m) {
    var a, b, c, d;
    var u, v;
    var ac = m.isEven();
    if ((this.isEven() && ac) || m.signum() === 0) {
        return Sk.builtin.biginteger.ZERO;
    }
    u = m.clone();
    v = this.clone();
    a = Sk.builtin.biginteger.nbv(1);
    b = Sk.builtin.biginteger.nbv(0);
    c = Sk.builtin.biginteger.nbv(0);
    d = Sk.builtin.biginteger.nbv(1);
    while (u.signum() !== 0) {
        while (u.isEven()) {
            u.rShiftTo(1, u);
            if (ac) {
                if (!a.isEven() || !b.isEven()) {
                    a.addTo(this, a);
                    b.subTo(m, b);
                }
                a.rShiftTo(1, a);
            } else if (!b.isEven()) {
                b.subTo(m, b);
            }
            b.rShiftTo(1, b);
        }
        while (v.isEven()) {
            v.rShiftTo(1, v);
            if (ac) {
                if (!c.isEven() || !d.isEven()) {
                    c.addTo(this, c);
                    d.subTo(m, d);
                }
                c.rShiftTo(1, c);
            } else if (!d.isEven()) {
                d.subTo(m, d);
            }
            d.rShiftTo(1, d);
        }
        if (u.compareTo(v) >= 0) {
            u.subTo(v, u);
            if (ac) {
                a.subTo(c, a);
            }
            b.subTo(d, b);
        } else {
            v.subTo(u, v);
            if (ac) {
                c.subTo(a, c);
            }
            d.subTo(b, d);
        }
    }
    if (v.compareTo(Sk.builtin.biginteger.ONE) !== 0) {
        return Sk.builtin.biginteger.ZERO;
    }
    if (d.compareTo(m) >= 0) {
        return d.subtract(m);
    }
    if (d.signum() < 0) {
        d.addTo(m, d);
    } else {
        return d;
    }
    if (d.signum() < 0) {
        return d.add(m);
    } else {
        return d;
    }
};

Sk.builtin.biginteger.lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509];
Sk.builtin.biginteger.lplim = (1 << 26) / Sk.builtin.biginteger.lowprimes[Sk.builtin.biginteger.lowprimes.length - 1];

//(public) test primality with certainty >= 1-.5^t
Sk.builtin.biginteger.prototype.bnIsProbablePrime = function (t) {
    var m, j;
    var i, x = this.abs();
    if (x.t == 1 && x[0] <= Sk.builtin.biginteger.lowprimes[Sk.builtin.biginteger.lowprimes.length - 1]) {
        for (i = 0; i < Sk.builtin.biginteger.lowprimes.length; ++i) {
            if (x[0] == Sk.builtin.biginteger.lowprimes[i]) {
                return true;
            }
        }
        return false;
    }
    if (x.isEven()) {
        return false;
    }
    i = 1;
    while (i < Sk.builtin.biginteger.lowprimes.length) {
        m = Sk.builtin.biginteger.lowprimes[i];
        j = i + 1;
        while (j < Sk.builtin.biginteger.lowprimes.length && m < Sk.builtin.biginteger.lplim) {
            m *= Sk.builtin.biginteger.lowprimes[j++];
        }
        m = x.modInt(m);
        while (i < j) {
            if (m % Sk.builtin.biginteger.lowprimes[i++] === 0) {
                return false;
            }
        }
    }
    return x.millerRabin(t);
};

//(protected) true if probably prime (HAC 4.24, Miller-Rabin)
Sk.builtin.biginteger.prototype.bnpMillerRabin = function (t) {
    var j;
    var y;
    var i;
    var a;
    var r;
    var n1 = this.subtract(Sk.builtin.biginteger.ONE);
    var k = n1.getLowestSetBit();
    if (k <= 0) {
        return false;
    }
    r = n1.shiftRight(k);
    t = (t + 1) >> 1;
    if (t > Sk.builtin.biginteger.lowprimes.length) {
        t = Sk.builtin.biginteger.lowprimes.length;
    }
    a = Sk.builtin.biginteger.nbi();
    for (i = 0; i < t; ++i) {
        a.fromInt(Sk.builtin.biginteger.lowprimes[i]);
        y = a.modPow(r, this);
        if (y.compareTo(Sk.builtin.biginteger.ONE) !== 0 && y.compareTo(n1) !== 0) {
            j = 1;
            while (j++ < k && y.compareTo(n1) !== 0) {
                y = y.modPowInt(2, this);
                if (y.compareTo(Sk.builtin.biginteger.ONE) === 0) {
                    return false;
                }
            }
            if (y.compareTo(n1) !== 0) {
                return false;
            }
        }
    }
    return true;
};

Sk.builtin.biginteger.prototype.isnegative = function () {
    return this.s < 0;
};
Sk.builtin.biginteger.prototype.ispositive = function () {
    return this.s >= 0;
};
Sk.builtin.biginteger.prototype.trueCompare = function (a) {
    if (this.s >= 0 && a.s < 0) {
        return 1;
    }
    if (this.s < 0 && a.s >= 0) {
        return -1;
    }
    return this.compare(a);
};

//protected
Sk.builtin.biginteger.prototype.chunkSize = Sk.builtin.biginteger.prototype.bnpChunkSize;
Sk.builtin.biginteger.prototype.toRadix = Sk.builtin.biginteger.prototype.bnpToRadix;
Sk.builtin.biginteger.prototype.fromRadix = Sk.builtin.biginteger.prototype.bnpFromRadix;
Sk.builtin.biginteger.prototype.fromNumber = Sk.builtin.biginteger.prototype.bnpFromNumber;
Sk.builtin.biginteger.prototype.bitwiseTo = Sk.builtin.biginteger.prototype.bnpBitwiseTo;
Sk.builtin.biginteger.prototype.changeBit = Sk.builtin.biginteger.prototype.bnpChangeBit;
Sk.builtin.biginteger.prototype.addTo = Sk.builtin.biginteger.prototype.bnpAddTo;
Sk.builtin.biginteger.prototype.dMultiply = Sk.builtin.biginteger.prototype.bnpDMultiply;
Sk.builtin.biginteger.prototype.dAddOffset = Sk.builtin.biginteger.prototype.bnpDAddOffset;
Sk.builtin.biginteger.prototype.multiplyLowerTo = Sk.builtin.biginteger.prototype.bnpMultiplyLowerTo;
Sk.builtin.biginteger.prototype.multiplyUpperTo = Sk.builtin.biginteger.prototype.bnpMultiplyUpperTo;
Sk.builtin.biginteger.prototype.modInt = Sk.builtin.biginteger.prototype.bnpModInt;
Sk.builtin.biginteger.prototype.millerRabin = Sk.builtin.biginteger.prototype.bnpMillerRabin;

//public
Sk.builtin.biginteger.prototype.clone = Sk.builtin.biginteger.prototype.bnClone;
Sk.builtin.biginteger.prototype.intValue = Sk.builtin.biginteger.prototype.bnIntValue;
Sk.builtin.biginteger.prototype.byteValue = Sk.builtin.biginteger.prototype.bnByteValue;
Sk.builtin.biginteger.prototype.shortValue = Sk.builtin.biginteger.prototype.bnShortValue;
Sk.builtin.biginteger.prototype.signum = Sk.builtin.biginteger.prototype.bnSigNum;
Sk.builtin.biginteger.prototype.toByteArray = Sk.builtin.biginteger.prototype.bnToByteArray;
Sk.builtin.biginteger.prototype.equals = Sk.builtin.biginteger.prototype.bnEquals;
Sk.builtin.biginteger.prototype.compare = Sk.builtin.biginteger.prototype.compareTo;
Sk.builtin.biginteger.prototype.min = Sk.builtin.biginteger.prototype.bnMin;
Sk.builtin.biginteger.prototype.max = Sk.builtin.biginteger.prototype.bnMax;
Sk.builtin.biginteger.prototype.and = Sk.builtin.biginteger.prototype.bnAnd;
Sk.builtin.biginteger.prototype.or = Sk.builtin.biginteger.prototype.bnOr;
Sk.builtin.biginteger.prototype.xor = Sk.builtin.biginteger.prototype.bnXor;
Sk.builtin.biginteger.prototype.andNot = Sk.builtin.biginteger.prototype.bnAndNot;
Sk.builtin.biginteger.prototype.not = Sk.builtin.biginteger.prototype.bnNot;
Sk.builtin.biginteger.prototype.shiftLeft = Sk.builtin.biginteger.prototype.bnShiftLeft;
Sk.builtin.biginteger.prototype.shiftRight = Sk.builtin.biginteger.prototype.bnShiftRight;
Sk.builtin.biginteger.prototype.getLowestSetBit = Sk.builtin.biginteger.prototype.bnGetLowestSetBit;
Sk.builtin.biginteger.prototype.bitCount = Sk.builtin.biginteger.prototype.bnBitCount;
Sk.builtin.biginteger.prototype.testBit = Sk.builtin.biginteger.prototype.bnTestBit;
Sk.builtin.biginteger.prototype.setBit = Sk.builtin.biginteger.prototype.bnSetBit;
Sk.builtin.biginteger.prototype.clearBit = Sk.builtin.biginteger.prototype.bnClearBit;
Sk.builtin.biginteger.prototype.flipBit = Sk.builtin.biginteger.prototype.bnFlipBit;
Sk.builtin.biginteger.prototype.add = Sk.builtin.biginteger.prototype.bnAdd;
Sk.builtin.biginteger.prototype.subtract = Sk.builtin.biginteger.prototype.bnSubtract;
Sk.builtin.biginteger.prototype.multiply = Sk.builtin.biginteger.prototype.bnMultiply;
Sk.builtin.biginteger.prototype.divide = Sk.builtin.biginteger.prototype.bnDivide;
Sk.builtin.biginteger.prototype.remainder = Sk.builtin.biginteger.prototype.bnRemainder;
Sk.builtin.biginteger.prototype.divideAndRemainder = Sk.builtin.biginteger.prototype.bnDivideAndRemainder;
Sk.builtin.biginteger.prototype.modPow = Sk.builtin.biginteger.prototype.bnModPow;
Sk.builtin.biginteger.prototype.modInverse = Sk.builtin.biginteger.prototype.bnModInverse;
Sk.builtin.biginteger.prototype.pow = Sk.builtin.biginteger.prototype.bnPow;
Sk.builtin.biginteger.prototype.gcd = Sk.builtin.biginteger.prototype.bnGCD;
Sk.builtin.biginteger.prototype.isProbablePrime = Sk.builtin.biginteger.prototype.bnIsProbablePrime;
//Sk.builtin.biginteger.int2char = int2char;

//Sk.builtin.biginteger interfaces not implemented in jsbn:

//Sk.builtin.biginteger(int signum, byte[] magnitude)
//double doubleValue()
//float floatValue()
//int hashCode()
//long longValue()
//static Sk.builtin.biginteger valueOf(long val)

//module.exports = Sk.builtin.biginteger;



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/int.js ---- */ 

/* jslint nomen: true, bitwise: true */
/* global Sk: true */

/**
 * @namespace Sk.builtin
 */

/**
 * @constructor
 * Sk.builtin.int_
 *
 * @description
 * Constructor for Python int. If provided number is greater than integer threshold, will return a Python long instead.
 *
 * type int, all integers are created with this method, it is also used
 * for the builtin int()
 *
 * Takes also implemented `__int__` and `__trunc__` methods for x into account
 * and tries to use `__index__` and/or `__int__` if base is not a number
 *
 * @extends {Sk.builtin.numtype}
 * 
 * @param  {!(Object|number)} x    Python object or Javascript number to convert to Python int
 * @param  {!(Object|number)=} base Optional base, can only be used when x is Sk.builtin.str
 * @return {(Sk.builtin.int_|Sk.builtin.lng)}      Python int (or long, if overflow)
 */
Sk.builtin.int_ = function (x, base) {
    "use strict";
    var val;
    var ret; // return value
    var magicName; // name of magic method

    if (!(this instanceof Sk.builtin.int_)) {
        return new Sk.builtin.int_(x, base);
    }


    if (this instanceof Sk.builtin.bool) {
        return this;
    }

    if (x instanceof Sk.builtin.int_ && base === undefined) {
        this.v = x.v;
        return this;
    }

    // if base is not of type int, try calling .__index__
    if(base !== undefined && !Sk.builtin.checkInt(base)) {
        if (Sk.builtin.checkFloat(base)) {
            throw new Sk.builtin.TypeError("integer argument expected, got " + Sk.abstr.typeName(base));
        } else if (base.__index__) {
            base = Sk.misceval.callsim(base.__index__, base);
        } else if(base.__int__) {
            base = Sk.misceval.callsim(base.__int__, base);
        } else {
            throw new Sk.builtin.AttributeError(Sk.abstr.typeName(base) + " instance has no attribute '__index__' or '__int__'");
        }
    }

    if (x instanceof Sk.builtin.str) {
        base = Sk.builtin.asnum$(base);

        val = Sk.str2number(x.v, base, parseInt, function (x) {
            return -x;
        }, "int");

        if ((val > Sk.builtin.int_.threshold$) || (val < -Sk.builtin.int_.threshold$)) {
            // Too big for int, convert to long
            return new Sk.builtin.lng(x, base);
        }

        this.v = val;
        return this;
    }

    if (base !== undefined) {
        throw new Sk.builtin.TypeError("int() can't convert non-string with explicit base");
    }

    if (x === undefined || x === Sk.builtin.none) {
        x = 0;
    }

    /**
     * try calling special methods:
     *  1. __int__
     *  2. __trunc__
     */
    if(x !== undefined && (x.tp$getattr && x.tp$getattr("__int__"))) {
        // calling a method which contains im_self and im_func
        // causes skulpt to automatically map the im_self as first argument
        ret = Sk.misceval.callsim(x.tp$getattr("__int__"));
        magicName = "__int__";
    } else if(x !== undefined && x.__int__) {
        // required for internal types
        // __int__ method is on prototype
        ret = Sk.misceval.callsim(x.__int__, x);
        magicName = "__int__";
    } else if(x !== undefined && (x.tp$getattr && x.tp$getattr("__trunc__"))) {
        ret = Sk.misceval.callsim(x.tp$getattr("__trunc__"));
        magicName = "__trunc__";
    } else if(x !== undefined && x.__trunc__) {
        ret = Sk.misceval.callsim(x.__trunc__, x);
        magicName = "__trunc__";
    }

    // check return type of magic methods
    if(ret !== undefined && !Sk.builtin.checkInt(ret)) {
        throw new Sk.builtin.TypeError(magicName + " returned non-Integral (type " + Sk.abstr.typeName(ret)+")");
    } else if(ret !== undefined){
        x = ret; // valid return value, proceed in function
    }

    // check type even without magic numbers
    if(!Sk.builtin.checkNumber(x)) {
        throw new Sk.builtin.TypeError("int() argument must be a string or a number, not '" + Sk.abstr.typeName(x) + "'");
    }

    x = Sk.builtin.asnum$(x);
    if (x > Sk.builtin.int_.threshold$ || x < -Sk.builtin.int_.threshold$) {
        return new Sk.builtin.lng(x);
    }
    if ((x > -1) && (x < 1)) {
        x = 0;
    }

    this.v = parseInt(x, base);
    return this;
};

Sk.abstr.setUpInheritance("int", Sk.builtin.int_, Sk.builtin.numtype);

/* NOTE: See constants used for kwargs in constants.js */

Sk.builtin.int_.prototype.nb$int_ = function () {
    return this;
};

Sk.builtin.int_.prototype.nb$float_ = function() {
    return new Sk.builtin.float_(this.v);
};

Sk.builtin.int_.prototype.nb$lng = function () {
    return new Sk.builtin.lng(this.v);
};

/**
 * Python wrapper of `__trunc__` dunder method.
 *
 * @instance
 */
Sk.builtin.int_.prototype.__trunc__ = new Sk.builtin.func(function(self) {
    return self;
});

/**
 * Python wrapper of `__index__` dunder method.
 *
 * @instance
 */
Sk.builtin.int_.prototype.__index__ = new Sk.builtin.func(function(self) {
    return self;
});

/**
 * Python wrapper of `__complex__` dunder method.
 *
 * @instance
 */
Sk.builtin.int_.prototype.__complex__ = new Sk.builtin.func(function(self) {
    return Sk.builtin.NotImplemented.NotImplemented$;
});

/**
 * Return this instance's Javascript value.
 *
 * Javascript function, returns Javascript object.
 *
 * @return {number} This instance's value.
 */
Sk.builtin.int_.prototype.tp$index = function () {
    return this.v;
};

/** @override */
Sk.builtin.int_.prototype.tp$hash = function () {
    //the hash of all numbers should be an int and since javascript doesn't really
    //care every number can be an int.
    return new Sk.builtin.int_(this.v);
};

/**
 * Threshold to determine when types should be converted to long.
 *
 * Note: be sure to check against threshold in both positive and negative directions.
 *
 * @type {number}
 */
Sk.builtin.int_.threshold$ = Math.pow(2, 53) - 1;

/**
 * Returns a copy of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.int_} The copy
 */
Sk.builtin.int_.prototype.clone = function () {
    return new Sk.builtin.int_(this.v);
};

/** @override */
Sk.builtin.int_.prototype.nb$add = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.int_(this.v + other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$add(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$add(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_add = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    return Sk.builtin.int_.prototype.nb$add.call(this, other);
};

/** @override */
Sk.builtin.int_.prototype.nb$subtract = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.int_(this.v - other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$subtract(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$subtract(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_subtract = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    var negative_this = this.nb$negative();
    return Sk.builtin.int_.prototype.nb$add.call(negative_this, other);
};

/** @override */
Sk.builtin.int_.prototype.nb$multiply = function (other) {
    var product, thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        product = this.v * other.v;

        if (product > Sk.builtin.int_.threshold$ ||
            product < -Sk.builtin.int_.threshold$) {
            thisAsLong = new Sk.builtin.lng(this.v);
            return thisAsLong.nb$multiply(other);
        } else {
            return new Sk.builtin.int_(product);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$multiply(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$multiply(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_multiply = function (other) {
    // Should not automatically call this.nb$multiply, as nb$multiply may have
    // been overridden by a subclass
    return Sk.builtin.int_.prototype.nb$multiply.call(this, other);
};

/** @override */
Sk.builtin.int_.prototype.nb$divide = function (other) {
    var thisAsLong, thisAsFloat;
    if (Sk.python3) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$divide(other);
    }

    if (other instanceof Sk.builtin.int_) {
        return this.nb$floor_divide(other);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$divide(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$divide(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_divide = function (other) {
    return this.nb$reflected_floor_divide(other);
};

/** @override */
Sk.builtin.int_.prototype.nb$floor_divide = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {

        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        return new Sk.builtin.int_(Math.floor(this.v / other.v));
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$floor_divide(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$floor_divide(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_floor_divide = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$remainder = function (other) {
    var thisAsLong, thisAsFloat;
    var tmp;
    var divResult;

    if (other instanceof Sk.builtin.int_) {
        //  Javacript logic on negatives doesn't work for Python... do this instead
        divResult = Sk.abstr.numberBinOp(this, other, "FloorDiv");
        tmp = Sk.abstr.numberBinOp(divResult, other, "Mult");
        tmp = Sk.abstr.numberBinOp(this, tmp, "Sub");
        tmp = tmp.v;

        if (other.v < 0 && tmp === 0) {
            tmp = -0.0; // otherwise the sign gets lost by javascript modulo
        } else if (tmp === 0 && Infinity/tmp === -Infinity) {
            tmp = 0.0;
        }

        return new Sk.builtin.int_(tmp);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$remainder(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$remainder(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_remainder = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$remainder(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$divmod = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$divmod(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$divmod(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_divmod = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.tuple([
            other.nb$floor_divide(this),
            other.nb$remainder(this)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$power = function (other, mod) {
    var power, ret, thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_ && (mod === undefined || mod instanceof Sk.builtin.int_)) {

        power = Math.pow(this.v, other.v);

        if (power > Sk.builtin.int_.threshold$ ||
            power < -Sk.builtin.int_.threshold$) {
            thisAsLong = new Sk.builtin.lng(this.v);
            ret = thisAsLong.nb$power(other, mod);
        } else if (other.v < 0) {
            ret = new Sk.builtin.float_(power);
        } else {
            ret = new Sk.builtin.int_(power);
        }

        if (mod !== undefined) {
            if (other.v < 0) {
                throw new Sk.builtin.TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
            }

            return ret.nb$remainder(mod);
        } else {
            return ret;
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$power(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$power(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_power = function (other, mod) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$power(this, mod);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$abs = function () {
    return new Sk.builtin.int_(Math.abs(this.v));
};

/**
 * Compute the bitwise AND of this instance and a Python object (i.e. this & other).
 *
 * Returns NotImplemented if bitwise AND operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to AND with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the conjunction
 */
Sk.builtin.int_.prototype.nb$and = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        other = Sk.builtin.asnum$(other);
        tmp = this.v & other;
        if ((tmp !== undefined) && (tmp < 0)) {
            tmp = tmp + 4294967296; // convert back to unsigned
        }

        if (tmp !== undefined) {
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$and(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_and = Sk.builtin.int_.prototype.nb$and;

/**
 * Compute the bitwise OR of this instance and a Python object (i.e. this | other).
 *
 * Returns NotImplemented if bitwise OR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to OR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the disjunction
 */
Sk.builtin.int_.prototype.nb$or = function (other) {
    var thisAsLong;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        other = Sk.builtin.asnum$(other);
        tmp = this.v | other;
        if ((tmp !== undefined) && (tmp < 0)) {
            tmp = tmp + 4294967296; // convert back to unsigned
        }

        if (tmp !== undefined) {
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$and(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_or = Sk.builtin.int_.prototype.nb$or;

/**
 * Compute the bitwise XOR of this instance and a Python object (i.e. this ^ other).
 *
 * Returns NotImplemented if bitwise XOR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to XOR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the exclusive disjunction
 */
Sk.builtin.int_.prototype.nb$xor = function (other) {
    var thisAsLong;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        other = Sk.builtin.asnum$(other);
        tmp = this.v ^ other;
        if ((tmp !== undefined) && (tmp < 0)) {
            tmp = tmp + 4294967296; // convert back to unsigned
        }

        if (tmp !== undefined) {
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$xor(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_xor = Sk.builtin.int_.prototype.nb$xor;

/**
 * Compute the bitwise left shift of this instance by a Python object (i.e. this << other).
 *
 * Returns NotImplemented if bitwise left shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to left shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the left shift
 */
Sk.builtin.int_.prototype.nb$lshift = function (other) {
    var thisAsLong;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        var shift = Sk.builtin.asnum$(other);

        if (shift !== undefined) {
            if (shift < 0) {
                throw new Sk.builtin.ValueError("negative shift count");
            }
            tmp = this.v << shift;
            if (tmp <= this.v) {
                // Fail, recompute with longs
                return new Sk.builtin.lng(this.v).nb$lshift(other);
            }
        }

        if (tmp !== undefined) {
            tmp = /** @type {number} */ (tmp);
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$lshift(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_lshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$lshift(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the bitwise right shift of this instance by a Python object (i.e. this >> other).
 *
 * Returns NotImplemented if bitwise right shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to right shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the right shift
 */
Sk.builtin.int_.prototype.nb$rshift = function (other) {
    var thisAsLong;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        var shift = Sk.builtin.asnum$(other);

        if (shift !== undefined) {
            if (shift < 0) {
                throw new Sk.builtin.ValueError("negative shift count");
            }
            tmp = this.v >> shift;
            if ((this.v > 0) && (tmp < 0)) {
                // Fix incorrect sign extension
                tmp = tmp & (Math.pow(2, 32 - shift) - 1);
            }
        }

        if (tmp !== undefined) {
            tmp = /** @type {number} */ (tmp);
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$rshift(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_rshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$rshift(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the bitwise inverse of this instance (i.e. ~this).
 *
 * Javscript function, returns Python object.
 *
 * @return {Sk.builtin.int_} The result of the inversion
 */
Sk.builtin.int_.prototype.nb$invert = function () {
    return new Sk.builtin.int_(~this.v);
};

/** @override */
Sk.builtin.int_.prototype.nb$inplace_add = Sk.builtin.int_.prototype.nb$add;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_subtract = Sk.builtin.int_.prototype.nb$subtract;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_multiply = Sk.builtin.int_.prototype.nb$multiply;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_divide = Sk.builtin.int_.prototype.nb$divide;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_remainder = Sk.builtin.int_.prototype.nb$remainder;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_floor_divide = Sk.builtin.int_.prototype.nb$floor_divide;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_power = Sk.builtin.int_.prototype.nb$power;

/**
 * @function
 * @name  nb$inplace_and
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise AND of this instance and a Python object (i.e. this &= other).
 *
 * Returns NotImplemented if inplace bitwise AND operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to AND with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the conjunction
 */
Sk.builtin.int_.prototype.nb$inplace_and = Sk.builtin.int_.prototype.nb$and;

/**
 * @function
 * @name  nb$inplace_or
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise OR of this instance and a Python object (i.e. this |= other).
 *
 * Returns NotImplemented if inplace bitwise OR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to OR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the disjunction
 */
Sk.builtin.int_.prototype.nb$inplace_or = Sk.builtin.int_.prototype.nb$or;

/**
 * @function
 * @name  nb$inplace_xor
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise XOR of this instance and a Python object (i.e. this ^= other).
 *
 * Returns NotImplemented if inplace bitwise XOR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to XOR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the exclusive disjunction
 */
Sk.builtin.int_.prototype.nb$inplace_xor = Sk.builtin.int_.prototype.nb$xor;

/**
 * @function
 * @name  nb$inplace_lshift
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise left shift of this instance by a Python object (i.e. this <<= other).
 *
 * Returns NotImplemented if inplace bitwise left shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to left shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the left shift
 */
Sk.builtin.int_.prototype.nb$inplace_lshift = Sk.builtin.int_.prototype.nb$lshift;

/**
 * @function
 * @name  nb$inplace_rshift
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise right shift of this instance by a Python object (i.e. this >>= other).
 *
 * Returns NotImplemented if inplace bitwise right shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to right shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the right shift
 */
Sk.builtin.int_.prototype.nb$inplace_rshift = Sk.builtin.int_.prototype.nb$rshift;

/**
 * @override
 *
 * @return {Sk.builtin.int_} A copy of this instance with the value negated.
 */
Sk.builtin.int_.prototype.nb$negative = function () {
    return new Sk.builtin.int_(-this.v);
};

/** @override */
Sk.builtin.int_.prototype.nb$positive = function () {
    return this.clone();
};

/** @override */
Sk.builtin.int_.prototype.nb$nonzero = function () {
    return this.v !== 0;
};

/** @override */
Sk.builtin.int_.prototype.nb$isnegative = function () {
    return this.v < 0;
};

/** @override */
Sk.builtin.int_.prototype.nb$ispositive = function () {
    return this.v >= 0;
};

/**
 * Compare this instance's value to another Python object's value.
 *
 * Returns NotImplemented if comparison between int and other type is unsupported.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(number|Sk.builtin.NotImplemented)} negative if this < other, zero if this == other, positive if this > other
 */
Sk.builtin.int_.prototype.numberCompare = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return this.v - other.v;
    }

    if (other instanceof Sk.builtin.lng) {
        return -other.longCompare(this);
    }

    if (other instanceof Sk.builtin.float_) {
        return -other.numberCompare(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

// Despite what jshint may want us to do, these two  functions need to remain
// as == and !=  Unless you modify the logic of numberCompare do not change
// these.

/** @override */
Sk.builtin.int_.prototype.ob$eq = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) == 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$ne = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) != 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$lt = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) < 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$le = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) <= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$gt = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) > 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$ge = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) >= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/**
 * Round this instance to a given number of digits, or zero if omitted.
 *
 * Implements `__round__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Sk.builtin.int_} self This instance.
 * @param  {Object|number=} ndigits The number of digits after the decimal point to which to round.
 * @return {Sk.builtin.int_} The rounded integer.
 */
Sk.builtin.int_.prototype.__round__ = function (self, ndigits) {
    Sk.builtin.pyCheckArgs("__round__", arguments, 1, 2);

    var result, multiplier, number;

    if ((ndigits !== undefined) && !Sk.misceval.isIndex(ndigits)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(ndigits) + "' object cannot be interpreted as an index");
    }

    if (ndigits === undefined) {
        ndigits = 0;
    }

    number = Sk.builtin.asnum$(self);
    ndigits = Sk.misceval.asIndex(ndigits);

    multiplier = Math.pow(10, ndigits);
    result = Math.round(number * multiplier) / multiplier;

    return new Sk.builtin.int_(result);
};

Sk.builtin.int_.prototype.conjugate = new Sk.builtin.func(function (self) {
    return new Sk.builtin.int_(self.v);
});

/** @override */
Sk.builtin.int_.prototype["$r"] = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

/**
 * Return the string representation of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.str} The Python string representation of this instance.
 */
Sk.builtin.int_.prototype.tp$str = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

/**
 * Convert this instance's value to a Javascript string.
 *
 * Javascript function, returns Javascript object.
 *
 * @param {number} base The base of the value.
 * @param {boolean} sign true if the value should be signed, false otherwise.
 * @return {string} The Javascript string representation of this instance.
 */
Sk.builtin.int_.prototype.str$ = function (base, sign) {
    var tmp;
    var work;

    if (sign === undefined) {
        sign = true;
    }

    work = sign ? this.v : Math.abs(this.v);

    if (base === undefined || base === 10) {
        tmp = work.toString();
    } else {
        tmp = work.toString(base);
    }

    return tmp;
};

/**
 * Takes a JavaScript string and returns a number using the parser and negater
 *  functions (for int/long right now)
 * @param  {string} s       Javascript string to convert to a number.
 * @param  {number} base    The base of the number.
 * @param  {function(string, number): number} parser  Function which should take
 *  a string that is a postive number which only contains characters that are
 *  valid in the given base and a base and return a number.
 * @param  {function((number|Sk.builtin.biginteger)): number} negater Function which should take a
 *  number and return its negation
 * @param  {string} fname   The name of the calling function, to be used in error messages
 * @return {number}         The number equivalent of the string in the given base
 */
Sk.str2number = function (s, base, parser, negater, fname) {
    "use strict";
    var origs = s,
        neg = false,
        i,
        ch,
        val;

    // strip whitespace from ends
    // s = s.trim();
    s = s.replace(/^\s+|\s+$/g, "");

    // check for minus sign
    if (s.charAt(0) === "-") {
        neg = true;
        s = s.substring(1);
    }

    // check for plus sign
    if (s.charAt(0) === "+") {
        s = s.substring(1);
    }

    if (base === undefined) {
        base = 10;
    } // default radix is 10, not dwim

    if (base < 2 || base > 36) {
        if (base !== 0) {
            throw new Sk.builtin.ValueError(fname + "() base must be >= 2 and <= 36");
        }
    }

    if (s.substring(0, 2).toLowerCase() === "0x") {
        if (base === 16 || base === 0) {
            s = s.substring(2);
            base = 16;
        } else if (base < 34) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0b") {
        if (base === 2 || base === 0) {
            s = s.substring(2);
            base = 2;
        } else if (base < 12) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0o") {
        if (base === 8 || base === 0) {
            s = s.substring(2);
            base = 8;
        } else if (base < 25) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.charAt(0) === "0") {
        if (s === "0") {
            return 0;
        }
        if (base === 8 || base === 0) {
            base = 8;
        }
    }

    if (base === 0) {
        base = 10;
    }

    if (s.length === 0) {
        throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
    }

    // check all characters are valid
    for (i = 0; i < s.length; i = i + 1) {
        ch = s.charCodeAt(i);
        val = base;
        if ((ch >= 48) && (ch <= 57)) {
            // 0-9
            val = ch - 48;
        } else if ((ch >= 65) && (ch <= 90)) {
            // A-Z
            val = ch - 65 + 10;
        } else if ((ch >= 97) && (ch <= 122)) {
            // a-z
            val = ch - 97 + 10;
        }

        if (val >= base) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    }

    // parse number
    val = parser(s, base);
    if (neg) {
        val = negater(val);
    }
    return val;
};

goog.exportSymbol("Sk.builtin.int_", Sk.builtin.int_);


/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/bool.js ---- */ 

/**
 * @constructor
 * Sk.builtin.bool
 *
 * @description
 * Constructor for Python bool. Also used for builtin bool() function.
 *
 * Where possible, do not create a new instance but use the constants 
 * Sk.builtin.bool.true$ or Sk.builtin.bool.false$. These are defined in src/constant.js
 *
 * @extends {Sk.builtin.object}
 * 
 * @param  {(Object|number|boolean)} x Value to evaluate as true or false
 * @return {Sk.builtin.bool} Sk.builtin.bool.true$ if x is true, Sk.builtin.bool.false$ otherwise
 */
Sk.builtin.bool = function (x) {
    Sk.builtin.pyCheckArgs("bool", arguments, 1);
    if (Sk.misceval.isTrue(x)) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.bool.false$;
    }
};

Sk.abstr.setUpInheritance("bool", Sk.builtin.bool, Sk.builtin.int_);

Sk.builtin.bool.prototype["$r"] = function () {
    if (this.v) {
        return new Sk.builtin.str("True");
    }
    return new Sk.builtin.str("False");
};

Sk.builtin.bool.prototype.tp$hash = function () {
    return new Sk.builtin.int_(this.v);
};

Sk.builtin.bool.prototype.__int__ = new Sk.builtin.func(function(self) {
    var v = Sk.builtin.asnum$(self);

    return new Sk.builtin.int_(v);
});

Sk.builtin.bool.prototype.__float__ = new Sk.builtin.func(function(self) {
    return new Sk.builtin.float_(Sk.ffi.remapToJs(self));
});

goog.exportSymbol("Sk.builtin.bool", Sk.builtin.bool);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/float.js ---- */ 

/**
 * @namespace Sk.builtin
 */

/**
 * @constructor
 * Sk.builtin.float_
 *
 * @description
 * Constructor for Python float. Also used for builtin float().
 *
 * @extends {Sk.builtin.numtype}
 *
 * @param {!(Object|number|string)} x Object or number to convert to Python float.
 * @return {Sk.builtin.float_} Python float
 */
Sk.builtin.float_ = function (x) {
    var tmp;
    if (x === undefined) {
        return new Sk.builtin.float_(0.0);
    }

    if (!(this instanceof Sk.builtin.float_)) {
        return new Sk.builtin.float_(x);
    }


    if (x instanceof Sk.builtin.str) {

        if (x.v.match(/^-inf$/i)) {
            tmp = -Infinity;
        } else if (x.v.match(/^[+]?inf$/i)) {
            tmp = Infinity;
        } else if (x.v.match(/^[-+]?nan$/i)) {
            tmp = NaN;
        } else if (!isNaN(x.v)) {
            tmp = parseFloat(x.v);
        } else {
            throw new Sk.builtin.ValueError("float: Argument: " + x.v + " is not number");
        }
        return new Sk.builtin.float_(tmp);
    }

    // Floats are just numbers
    if (typeof x === "number" || x instanceof Sk.builtin.int_ || x instanceof Sk.builtin.lng || x instanceof Sk.builtin.float_) {
        this.v = Sk.builtin.asnum$(x);
        return this;
    }

    // Convert booleans
    if (x instanceof Sk.builtin.bool) {
        this.v = Sk.builtin.asnum$(x);
        return this;
    }

    // this is a special internal case
    if(typeof x === "boolean") {
        this.v = x ? 1.0 : 0.0;
        return this;
    }

    if (typeof x === "string") {
        this.v = parseFloat(x);
        return this;
    }

    // try calling __float__
    var special = Sk.abstr.lookupSpecial(x, "__float__");
    if (special != null) {
        // method on builtin, provide this arg
        return Sk.misceval.callsim(special, x);
    }

    throw new Sk.builtin.TypeError("float() argument must be a string or a number");
};

Sk.abstr.setUpInheritance("float", Sk.builtin.float_, Sk.builtin.numtype);

Sk.builtin.float_.prototype.nb$int_ = function () {
    var v = this.v;

    if (v < 0) {
        v = Math.ceil(v);
    } else {
        v = Math.floor(v);
    }

    // this should take care of int/long fitting
    return new Sk.builtin.int_(v);
};

Sk.builtin.float_.prototype.nb$float_ = function() {
    return this;
};

Sk.builtin.float_.prototype.nb$lng = function () {
    return new Sk.builtin.lng(this.v);
};

/**
 * Checks for float subtypes, though skulpt does not allow to
 * extend them for now.
 *
 * Javascript function, returns Javascript object.
 * @param {Object} op The object to check as subtype.
 * @return {boolean} true if op is a subtype of Sk.builtin.float_, false otherwise
 */
Sk.builtin.float_.PyFloat_Check = function (op) {
    if (op === undefined) {
        return false;
    }

    // this is a little bit hacky
    // ToDo: subclassable builtins do not require this
    if (Sk.builtin.checkNumber(op)) {
        return true;
    }

    if (Sk.builtin.checkFloat(op)) {
        return true;
    }

    if (Sk.builtin.issubclass(op.ob$type, Sk.builtin.float_)) {
        return true;
    }

    return false;
};

/**
 * Checks if ob is a Python float.
 *
 * This method is just a wrapper, but uses the correct cpython API name.
 *
 * Javascript function, returns Javascript object.
 * @param {Object} op The object to check.
 * @return {boolean} true if op is an instance of Sk.builtin.float_, false otherwise
 */
Sk.builtin.float_.PyFloat_Check_Exact = function (op) {
    return Sk.builtin.checkFloat(op);
};

Sk.builtin.float_.PyFloat_AsDouble = function (op) {
    var f; // nb_float;
    var fo; // PyFloatObject *fo;
    var val;

    // it is a subclass or direct float
    if (op && Sk.builtin.float_.PyFloat_Check(op)) {
        return Sk.ffi.remapToJs(op);
    }

    if (op == null) {
        throw new Error("bad argument for internal PyFloat_AsDouble function");
    }

    // check if special method exists (nb_float is not implemented in skulpt, hence we use __float__)
    f = Sk.builtin.type.typeLookup(op.ob$type, "__float__");
    if (f == null) {
        throw new Sk.builtin.TypeError("a float is required");
    }

    // call internal float method
    fo = Sk.misceval.callsim(f, op);

    // return value of __float__ must be a python float
    if (!Sk.builtin.float_.PyFloat_Check(fo)) {
        throw new Sk.builtin.TypeError("nb_float should return float object");
    }

    val = Sk.ffi.remapToJs(fo);

    return val;
};

/**
 * Return this instance's Javascript value.
 *
 * Javascript function, returns Javascript object.
 *
 * @return {number} This instance's value.
 */
Sk.builtin.float_.prototype.tp$index = function () {
    return this.v;
};

/** @override */
Sk.builtin.float_.prototype.tp$hash = function () {
    //the hash of all numbers should be an int and since javascript doesn't really
    //care every number can be an int.
    return this.nb$int_();
};


/**
 * Returns a copy of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.float_} The copy
 */
Sk.builtin.float_.prototype.clone = function () {
    return new Sk.builtin.float_(this.v);
};

/**
 * Returns this instance's value as a string formatted using fixed-point notation.
 *
 * Javascript function, returns Javascript object.
 *
 * @param  {Object|number} x The numer of digits to appear after the decimal point.
 * @return {string}   The string representation of this instance's value.
 */
Sk.builtin.float_.prototype.toFixed = function (x) {
    x = Sk.builtin.asnum$(x);
    return this.v.toFixed(x);
};

/** @override */
Sk.builtin.float_.prototype.nb$add = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(this.v + other.v);
    } else if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.float_(this.v + parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_add = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    return Sk.builtin.float_.prototype.nb$add.call(this, other);
};

/** @override */
Sk.builtin.float_.prototype.nb$subtract = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(this.v - other.v);
    } else if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.float_(this.v - parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_subtract = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    var negative_this = this.nb$negative();
    return Sk.builtin.float_.prototype.nb$add.call(negative_this, other);
};

/** @override */
Sk.builtin.float_.prototype.nb$multiply = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(this.v * other.v);
    } else if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.float_(this.v * parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_multiply = function (other) {
    // Should not automatically call this.nb$multiply, as nb$multiply may have
    // been overridden by a subclass
    return Sk.builtin.float_.prototype.nb$multiply.call(this, other);
};

/** @override */
Sk.builtin.float_.prototype.nb$divide = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {

        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === Infinity) {
            if (other.v === Infinity || other.v === -Infinity) {
                return new Sk.builtin.float_(NaN);
            } else if (other.nb$isnegative()) {
                return new Sk.builtin.float_(-Infinity);
            } else {
                return new Sk.builtin.float_(Infinity);
            }
        }
        if (this.v === -Infinity) {
            if (other.v === Infinity || other.v === -Infinity) {
                return new Sk.builtin.float_(NaN);
            } else if (other.nb$isnegative()) {
                return new Sk.builtin.float_(Infinity);
            } else {
                return new Sk.builtin.float_(-Infinity);
            }
        }

        return new Sk.builtin.float_(this.v / other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === Infinity) {
            if (other.nb$isnegative()) {
                return new Sk.builtin.float_(-Infinity);
            } else {
                return new Sk.builtin.float_(Infinity);
            }
        }
        if (this.v === -Infinity) {
            if (other.nb$isnegative()) {
                return new Sk.builtin.float_(Infinity);
            } else {
                return new Sk.builtin.float_(-Infinity);
            }
        }

        return new Sk.builtin.float_(this.v / parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_divide = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return other.nb$divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$floor_divide = function (other) {

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {

        if (this.v === Infinity || this.v === -Infinity) {
            return new Sk.builtin.float_(NaN);
        }

        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (other.v === Infinity) {
            if (this.nb$isnegative()) {
                return new Sk.builtin.float_(-1);
            } else {
                return new Sk.builtin.float_(0);
            }
        }
        if (other.v === -Infinity) {
            if (this.nb$isnegative() || !this.nb$nonzero()) {
                return new Sk.builtin.float_(0);
            } else {
                return new Sk.builtin.float_(-1);
            }
        }

        return new Sk.builtin.float_(Math.floor(this.v / other.v));
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === Infinity || this.v === -Infinity) {
            return new Sk.builtin.float_(NaN);
        }

        return new Sk.builtin.float_(Math.floor(this.v / parseFloat(other.str$(10, true))));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_floor_divide = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return other.nb$floor_divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$remainder = function (other) {
    var thisAsLong;
    var op2;
    var tmp;
    var result;

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {

        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === 0) {
            return new Sk.builtin.float_(0);
        }

        if (other.v === Infinity) {
            if (this.v === Infinity || this.v === -Infinity) {
                return new Sk.builtin.float_(NaN);
            } else if (this.nb$ispositive()) {
                return new Sk.builtin.float_(this.v);
            } else {
                return new Sk.builtin.float_(Infinity);
            }
        }

        //  Javacript logic on negatives doesn't work for Python... do this instead
        tmp = this.v % other.v;

        if (this.v < 0) {
            if (other.v > 0 && tmp < 0) {
                tmp = tmp + other.v;
            }
        } else {
            if (other.v < 0 && tmp !== 0) {
                tmp = tmp + other.v;
            }
        }

        if (other.v < 0 && tmp === 0) {
            tmp = -0.0; // otherwise the sign gets lost by javascript modulo
        } else if (tmp === 0 && Infinity/tmp === -Infinity) {
            tmp = 0.0;
        }

        return new Sk.builtin.float_(tmp);
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === 0) {
            return new Sk.builtin.float_(0);
        }

        op2 = parseFloat(other.str$(10, true));
        tmp = this.v % op2;

        if (tmp < 0) {
            if (op2 > 0 && tmp !== 0) {
                tmp = tmp + op2;
            }
        } else {
            if (op2 < 0 && tmp !== 0) {
                tmp = tmp + op2;
            }
        }

        if (other.nb$isnegative() && tmp === 0) {
            tmp = -0.0; // otherwise the sign gets lost by javascript modulo
        } else if (tmp === 0 && Infinity/tmp === -Infinity) {
            tmp = 0.0;
        }

        return new Sk.builtin.float_(tmp);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_remainder = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return other.nb$remainder(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$divmod = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_divmod = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return new Sk.builtin.tuple([
            other.nb$floor_divide(this),
            other.nb$remainder(this)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$power = function (other, mod) {
    var thisAsLong;
    var result;

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        if (this.v < 0 && other.v % 1 !== 0) {
            throw new Sk.builtin.NegativePowerError("cannot raise a negative number to a fractional power");
        }
        if (this.v === 0 && other.v < 0) {
            throw new Sk.builtin.NegativePowerError("cannot raise zero to a negative power");
        }

        result = new Sk.builtin.float_(Math.pow(this.v, other.v));

        if ((Math.abs(result.v) === Infinity) &&
            (Math.abs(this.v) !== Infinity) &&
            (Math.abs(other.v) !== Infinity)) {
            throw new Sk.builtin.OverflowError("Numerical result out of range");
        }
        return result;
    }

    if (other instanceof Sk.builtin.lng) {
        if (this.v === 0 && other.longCompare(Sk.builtin.biginteger.ZERO) < 0) {
            throw new Sk.builtin.NegativePowerError("cannot raise zero to a negative power");
        }

        return new Sk.builtin.float_(Math.pow(this.v, parseFloat(other.str$(10, true))));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_power = function (n, mod) {
    if (n instanceof Sk.builtin.int_ ||
        n instanceof Sk.builtin.lng) {
        n = new Sk.builtin.float_(n);
    }

    if (n instanceof Sk.builtin.float_) {
        return n.nb$power(this, mod);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$abs = function () {
    return new Sk.builtin.float_(Math.abs(this.v));
};

/** @override */
Sk.builtin.float_.prototype.nb$inplace_add = Sk.builtin.float_.prototype.nb$add;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_subtract = Sk.builtin.float_.prototype.nb$subtract;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_multiply = Sk.builtin.float_.prototype.nb$multiply;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_divide = Sk.builtin.float_.prototype.nb$divide;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_remainder = Sk.builtin.float_.prototype.nb$remainder;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_floor_divide = Sk.builtin.float_.prototype.nb$floor_divide;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_power = Sk.builtin.float_.prototype.nb$power;

/**
 * @override
 *
 * @return {Sk.builtin.float_} A copy of this instance with the value negated.
 */
Sk.builtin.float_.prototype.nb$negative = function () {
    return new Sk.builtin.float_(-this.v);
};

/** @override */
Sk.builtin.float_.prototype.nb$positive = function () {
    return this.clone();
};

/** @override */
Sk.builtin.float_.prototype.nb$nonzero = function () {
    return this.v !== 0;
};

/** @override */
Sk.builtin.float_.prototype.nb$isnegative = function () {
    return this.v < 0;
};

/** @override */
Sk.builtin.float_.prototype.nb$ispositive = function () {
    return this.v >= 0;
};

/**
 * Compare this instance's value to another Python object's value.
 *
 * Returns NotImplemented if comparison between float and other type is unsupported.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(number|Sk.builtin.NotImplemented)} negative if this < other, zero if this == other, positive if this > other
 */
Sk.builtin.float_.prototype.numberCompare = function (other) {
    var diff;
    var tmp;
    var thisAsLong;

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        if (this.v == Infinity && other.v == Infinity) {
            return 0;
        }
        if (this.v == -Infinity && other.v == -Infinity) {
            return 0;
        }
        return this.v - other.v;
    }

    if (other instanceof Sk.builtin.lng) {
        if (this.v % 1 === 0) {
            thisAsLong = new Sk.builtin.lng(this.v);
            tmp = thisAsLong.longCompare(other);
            return tmp;
        }
        diff = this.nb$subtract(other);
        if (diff instanceof Sk.builtin.float_) {
            return diff.v;
        } else if (diff instanceof Sk.builtin.lng) {
            return diff.longCompare(Sk.builtin.biginteger.ZERO);
        }
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

// Despite what jshint may want us to do, these two  functions need to remain
// as == and !=  Unless you modify the logic of numberCompare do not change
// these.

/** @override */
Sk.builtin.float_.prototype.ob$eq = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) == 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$ne = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) != 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$lt = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) < 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$le = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) <= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$gt = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) > 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$ge = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) >= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/**
 * Round this instance to a given number of digits, or zero if omitted.
 *
 * Implements `__round__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Sk.builtin.int_} self This instance.
 * @param  {Object|number=} ndigits The number of digits after the decimal point to which to round.
 * @return {Sk.builtin.float_} The rounded float.
 */
Sk.builtin.float_.prototype.__round__ = function (self, ndigits) {
    Sk.builtin.pyCheckArgs("__round__", arguments, 1, 2);

    var result, multiplier, number;

    if ((ndigits !== undefined) && !Sk.misceval.isIndex(ndigits)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(ndigits) + "' object cannot be interpreted as an index");
    }

    if (ndigits === undefined) {
        ndigits = 0;
    }

    number = Sk.builtin.asnum$(self);
    ndigits = Sk.misceval.asIndex(ndigits);

    multiplier = Math.pow(10, ndigits);
    result = Math.round(number * multiplier) / multiplier;

    return new Sk.builtin.float_(result);
};

Sk.builtin.float_.prototype.conjugate = new Sk.builtin.func(function (self) {
    return new Sk.builtin.float_(self.v);
});

/** @override */
Sk.builtin.float_.prototype["$r"] = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

/**
 * Return the string representation of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.str} The Python string representation of this instance.
 */
Sk.builtin.float_.prototype.tp$str = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

/**
 * Convert this instance's value to a Javascript string.
 *
 * Javascript function, returns Javascript object.
 *
 * @param {number} base The base of the value.
 * @param {boolean} sign true if the value should be signed, false otherwise.
 * @return {string} The Javascript string representation of this instance.
 */
Sk.builtin.float_.prototype.str$ = function (base, sign) {
    var post;
    var pre;
    var idx;
    var tmp;
    var work;

    if (isNaN(this.v)) {
        return "nan";
    }

    if (sign === undefined) {
        sign = true;
    }

    if (this.v == Infinity) {
        return "inf";
    }
    if (this.v == -Infinity && sign) {
        return "-inf";
    }
    if (this.v == -Infinity && !sign) {
        return "inf";
    }

    work = sign ? this.v : Math.abs(this.v);


    if (base === undefined || base === 10) {
        tmp = work.toPrecision(12);

        // transform fractions with 4 or more leading zeroes into exponents
        idx = tmp.indexOf(".");
        pre = work.toString().slice(0, idx);
        post = work.toString().slice(idx);

        if (pre.match(/^-?0$/) && post.slice(1).match(/^0{4,}/)) {
            if (tmp.length < 12) {
                tmp = work.toExponential();
            } else {
                tmp = work.toExponential(11);
            }
        }

        if (tmp.indexOf("e") < 0 && tmp.indexOf(".") >= 0) {
            while (tmp.charAt(tmp.length-1) == "0") {
                tmp = tmp.substring(0,tmp.length-1);
            }
            if (tmp.charAt(tmp.length-1) == ".") {
                tmp = tmp + "0";
            }
        }

        tmp = tmp.replace(new RegExp("\\.0+e"), "e", "i");
        // make exponent two digits instead of one (ie e+09 not e+9)
        tmp = tmp.replace(/(e[-+])([1-9])$/, "$10$2");
        // remove trailing zeroes before the exponent
        tmp = tmp.replace(/0+(e.*)/, "$1");
    } else {
        tmp = work.toString(base);
    }

    // restore negative zero sign
    if(this.v === 0 && 1/this.v === -Infinity) {
        tmp = "-" + tmp;
    }

    if (tmp.indexOf(".") < 0 && tmp.indexOf("E") < 0 && tmp.indexOf("e") < 0) {
        tmp = tmp + ".0";
    }

    return tmp;
};


/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/number.js ---- */ 

var deprecatedError = new Sk.builtin.ExternalError("Sk.builtin.nmber is deprecated.");

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ constructors instead.
 * If you do not know at complile time which type of number, use Sk.builtin.assk$.
 */
Sk.builtin.nmber = function (x, skType)    /* number is a reserved word */ {
    throw new Sk.builtin.ExternalError("Sk.builtin.nmber is deprecated. Please replace with Sk.builtin.int_, Sk.builtin.float_, or Sk.builtin.assk$.");
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.tp$index = function () {
    return this.v;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.tp$hash = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.fromInt$ = function (ival) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.clone = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.toFixed = function (x) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$add = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$subtract = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$multiply = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$divide = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$floor_divide = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$remainder = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$divmod = function (other) {
    throw deprecatedError;

};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$power = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$and = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$or = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$xor = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$lshift = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$rshift = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_add = Sk.builtin.nmber.prototype.nb$add;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_subtract = Sk.builtin.nmber.prototype.nb$subtract;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_multiply = Sk.builtin.nmber.prototype.nb$multiply;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_divide = Sk.builtin.nmber.prototype.nb$divide;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_remainder = Sk.builtin.nmber.prototype.nb$remainder;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_floor_divide = Sk.builtin.nmber.prototype.nb$floor_divide;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_power = Sk.builtin.nmber.prototype.nb$power;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_and = Sk.builtin.nmber.prototype.nb$and;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_or = Sk.builtin.nmber.prototype.nb$or;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_xor = Sk.builtin.nmber.prototype.nb$xor;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_lshift = Sk.builtin.nmber.prototype.nb$lshift;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_rshift = Sk.builtin.nmber.prototype.nb$rshift;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$negative = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$positive = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$nonzero = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$isnegative = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$ispositive = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.numberCompare = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__eq__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__ne__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__lt__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__le__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__gt__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__ge__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__round__ = function (self, ndigits) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype["$r"] = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.tp$str = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.str$ = function (base, sign) {
    throw deprecatedError;
};

goog.exportSymbol("Sk.builtin.nmber", Sk.builtin.nmber);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/long.js ---- */ 

/* global Sk: true, goog:true */

// long aka "bignumber" implementation
//
//  Using javascript BigInteger by Tom Wu
/**
 * @constructor
 * Sk.builtin.lng
 *
 * @description
 * Constructor for Python long. Also used for builtin long().
 *
 * @extends {Sk.builtin.numtype}
 * 
 * @param {*} x Object or number to convert to Python long.
 * @param {number=} base Optional base.
 * @return {Sk.builtin.lng} Python long
 */
Sk.builtin.lng = function (x, base) {   /* long is a reserved word */
    base = Sk.builtin.asnum$(base);
    if (!(this instanceof Sk.builtin.lng)) {
        return new Sk.builtin.lng(x, base);
    }


    if (x === undefined) {
        this.biginteger = new Sk.builtin.biginteger(0);
        return this;
    }
    if (x instanceof Sk.builtin.lng) {
        this.biginteger = x.biginteger.clone();
        return this;
    }
    if (x instanceof Sk.builtin.biginteger) {
        this.biginteger = x;
        return this;
    }
    if (x instanceof String || typeof x === "string") {
        return Sk.longFromStr(x, base);
    }
    if (x instanceof Sk.builtin.str) {
        return Sk.longFromStr(x.v, base);
    }

    if ((x !== undefined) && (!Sk.builtin.checkString(x) && !Sk.builtin.checkNumber(x))) {
        if (x === true) {
            x = 1;
        } else if (x === false) {
            x = 0;
        } else {
            throw new Sk.builtin.TypeError("long() argument must be a string or a number, not '" + Sk.abstr.typeName(x) + "'");
        }
    }

    x = Sk.builtin.asnum$nofloat(x);
    this.biginteger = new Sk.builtin.biginteger(x);
    return this;
};

Sk.abstr.setUpInheritance("long", Sk.builtin.lng, Sk.builtin.numtype);

/* NOTE: See constants used for kwargs in constants.js */

Sk.builtin.lng.prototype.tp$index = function () {
    return parseInt(this.str$(10, true), 10);
};

Sk.builtin.lng.prototype.tp$hash = function () {
    return new Sk.builtin.int_(this.tp$index());
};

Sk.builtin.lng.prototype.nb$int_ = function() {
    if (this.cantBeInt()) {
        return new Sk.builtin.lng(this);
    }

    return new Sk.builtin.int_(this.toInt$());
};

Sk.builtin.lng.prototype.__index__ = new Sk.builtin.func(function(self) {
    return self.nb$int_(self);
});

Sk.builtin.lng.prototype.nb$lng_ = function () {
    return this;
};

Sk.builtin.lng.prototype.nb$float_ = function() {
    return new Sk.builtin.float_(Sk.ffi.remapToJs(this));
};

//    Threshold to determine when types should be converted to long
//Sk.builtin.lng.threshold$ = Sk.builtin.int_.threshold$;

Sk.builtin.lng.MAX_INT$ = new Sk.builtin.lng(Sk.builtin.int_.threshold$);
Sk.builtin.lng.MIN_INT$ = new Sk.builtin.lng(-Sk.builtin.int_.threshold$);

Sk.builtin.lng.prototype.cantBeInt = function () {
    return (this.longCompare(Sk.builtin.lng.MAX_INT$) > 0) || (this.longCompare(Sk.builtin.lng.MIN_INT$) < 0);
};

Sk.builtin.lng.fromInt$ = function (ival) {
    return new Sk.builtin.lng(ival);
};

// js string (not Sk.builtin.str) -> long. used to create longs in transformer, respects
// 0x, 0o, 0b, etc.
Sk.longFromStr = function (s, base) {
    // l/L are valid digits with base >= 22
    // goog.asserts.assert(s.charAt(s.length - 1) !== "L" && s.charAt(s.length - 1) !== 'l', "L suffix should be removed before here");

    var parser = function (s, base) {
            if (base === 10) {
                return new Sk.builtin.biginteger(s);
            }
            return new Sk.builtin.biginteger(s, base);
        },
        biginteger = Sk.str2number(s, base, parser, function (x) {
            return x.negate();
        }, "long");

    return new Sk.builtin.lng(biginteger);
};
goog.exportSymbol("Sk.longFromStr", Sk.longFromStr);

Sk.builtin.lng.prototype.toInt$ = function () {
    return this.biginteger.intValue();
};

Sk.builtin.lng.prototype.clone = function () {
    return new Sk.builtin.lng(this);
};

Sk.builtin.lng.prototype.conjugate = new Sk.builtin.func(function (self) {
    return self.clone();
});

Sk.builtin.lng.prototype.nb$add = function (other) {
    var thisAsFloat;

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$add(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //    Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.add(other.biginteger));
    }

    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.add(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.lng.prototype.nb$reflected_add = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    return Sk.builtin.lng.prototype.nb$add.call(this, other);
};

Sk.builtin.lng.prototype.nb$inplace_add = Sk.builtin.lng.prototype.nb$add;

Sk.builtin.lng.prototype.nb$subtract = function (other) {
    var thisAsFloat;

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$subtract(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //    Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.subtract(other.biginteger));
    }

    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.subtract(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.lng.prototype.nb$reflected_subtract = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    var negative_this = this.nb$negative();
    return Sk.builtin.lng.prototype.nb$add.call(negative_this, other);
};

Sk.builtin.lng.prototype.nb$inplace_subtract = Sk.builtin.lng.prototype.nb$subtract;

Sk.builtin.lng.prototype.nb$multiply = function (other) {
    var thisAsFloat;
    
    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$multiply(other);
    }

    if (other instanceof Sk.builtin.int_) {
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.multiply(other.biginteger));
    }

    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.multiply(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.lng.prototype.nb$reflected_multiply = function (other) {
    // Should not automatically call this.nb$multiply, as nb$multiply may have
    // been overridden by a subclass
    return Sk.builtin.lng.prototype.nb$multiply.call(this, other);
};

Sk.builtin.lng.prototype.nb$inplace_multiply = Sk.builtin.lng.prototype.nb$multiply;

Sk.builtin.lng.prototype.nb$divide = function (other) {
    var thisAsFloat, thisneg, otherneg, result;

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$divide(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //    Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    //    Standard, long result mode

    if (other instanceof Sk.builtin.lng) {
        //    Special logic to round DOWN towards negative infinity for negative results
        thisneg = this.nb$isnegative();
        otherneg = other.nb$isnegative();
        if ((thisneg && !otherneg) || (otherneg && !thisneg)) {
            result = this.biginteger.divideAndRemainder(other.biginteger);
            //    If remainder is zero or positive, just return division result
            if (result[1].trueCompare(Sk.builtin.biginteger.ZERO) === 0) {
                //    No remainder, just return result
                return new Sk.builtin.lng(result[0]);
            }
            //    Reminder... subtract 1 from the result (like rounding to neg infinity)
            result = result[0].subtract(Sk.builtin.biginteger.ONE);
            return new Sk.builtin.lng(result);
        }
        return new Sk.builtin.lng(this.biginteger.divide(other.biginteger));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_divide = function (other) {
    var thisneg, otherneg, result;

    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    //    Standard, long result mode
    if (other instanceof Sk.builtin.lng) {
        return other.nb$divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$floor_divide = function (other) {
    var thisAsFloat;

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$floor_divide(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    //    Standard, long result mode
    if (other instanceof Sk.builtin.lng) {
        return other.nb$divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$divmod = function (other) {
    if (other instanceof Sk.builtin.int_) {
        // Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_divmod = function (other) {
    if (other instanceof Sk.builtin.int_) {
        // Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.tuple([
            other.nb$floor_divide(this),
            other.nb$remainder(this)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_divide = Sk.builtin.lng.prototype.nb$divide;

Sk.builtin.lng.prototype.nb$floor_divide = Sk.builtin.lng.prototype.nb$divide;

Sk.builtin.lng.prototype.nb$reflected_floor_divide = Sk.builtin.lng.prototype.nb$reflected_divide;

Sk.builtin.lng.prototype.nb$inplace_floor_divide = Sk.builtin.lng.prototype.nb$floor_divide;

Sk.builtin.lng.prototype.nb$remainder = function (other) {
    var thisAsFloat, tmp;

    if (this.biginteger.trueCompare(Sk.builtin.biginteger.ZERO) === 0) {
        if (other instanceof Sk.builtin.float_) {
            return new Sk.builtin.float_(0);
        }
        return new Sk.builtin.lng(0);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$remainder(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //    Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {

        tmp = new Sk.builtin.lng(this.biginteger.remainder(other.biginteger));
        if (this.nb$isnegative()) {
            if (other.nb$ispositive() && tmp.nb$nonzero()) {
                tmp = tmp.nb$add(other).nb$remainder(other);
            }
        } else {
            if (other.nb$isnegative() && tmp.nb$nonzero()) {
                tmp = tmp.nb$add(other);
            }
        }
        return tmp;
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_remainder = function (other) {
    if (other instanceof Sk.builtin.int_) {
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return other.nb$remainder(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_remainder = Sk.builtin.lng.prototype.nb$remainder;

Sk.builtin.lng.prototype.nb$divmod = function (other) {
    var thisAsFloat;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.lng(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.lng(0);
    }

    if (other instanceof Sk.builtin.int_) {
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$divmod(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * @param {number|Object} n
 * @param {number|Object=} mod
 * @suppress {checkTypes}
 */
Sk.builtin.lng.prototype.nb$power = function (n, mod) {
    var thisAsFloat;
    if (mod !== undefined) {
        n = new Sk.builtin.biginteger(Sk.builtin.asnum$(n));
        mod = new Sk.builtin.biginteger(Sk.builtin.asnum$(mod));

        return new Sk.builtin.lng(this.biginteger.modPowInt(n, mod));
    }

    if (n instanceof Sk.builtin.float_ || 
        (n instanceof Sk.builtin.int_ && n.v < 0)) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$power(n);
    }

    if (n instanceof Sk.builtin.int_) {
        //    Promote an int to long
        n = new Sk.builtin.lng(n.v);
    }

    if (n instanceof Sk.builtin.lng) {
        if (mod !== undefined) {
            n = new Sk.builtin.biginteger(Sk.builtin.asnum$(n));
            mod = new Sk.builtin.biginteger(Sk.builtin.asnum$(mod));

            return new Sk.builtin.lng(this.biginteger.modPowInt(n, mod));
        }

        if (n.nb$isnegative()) {
            thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
            return thisAsFloat.nb$power(n);
        }
        return new Sk.builtin.lng(this.biginteger.pow(n.biginteger));
    }

    if (n instanceof Sk.builtin.biginteger) {
        if (mod !== undefined) {
            mod = new Sk.builtin.biginteger(Sk.builtin.asnum$(mod));

            return new Sk.builtin.lng(this.biginteger.modPowInt(n, mod));
        }

        if (n.isnegative()) {
            thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
            return thisAsFloat.nb$power(n);
        }
        return new Sk.builtin.lng(this.biginteger.pow(n));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_power = function (n, mod) {
    if (n instanceof Sk.builtin.int_) {
        // Promote an int to long
        n = new Sk.builtin.lng(n.v);
    }

    if (n instanceof Sk.builtin.lng) {
        return n.nb$power(this, mod);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_power = Sk.builtin.lng.prototype.nb$power;

/**
 * Compute the absolute value of this instance and return.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.lng} The absolute value
 */
Sk.builtin.lng.prototype.nb$abs = function () {
    return new Sk.builtin.lng(this.biginteger.bnAbs());
};

Sk.builtin.lng.prototype.nb$lshift = function (other) {

    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.biginteger.signum() < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        return new Sk.builtin.lng(this.biginteger.shiftLeft(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        if (other.signum() < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        return new Sk.builtin.lng(this.biginteger.shiftLeft(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_lshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        // Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return other.nb$lshift(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_lshift = Sk.builtin.lng.prototype.nb$lshift;

Sk.builtin.lng.prototype.nb$rshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.biginteger.signum() < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        return new Sk.builtin.lng(this.biginteger.shiftRight(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        if (other.signum() < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        return new Sk.builtin.lng(this.biginteger.shiftRight(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_rshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        // Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return other.nb$rshift(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_rshift = Sk.builtin.lng.prototype.nb$rshift;

Sk.builtin.lng.prototype.nb$and = function (other) {
    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.and(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.and(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_and = Sk.builtin.lng.prototype.nb$and;

Sk.builtin.lng.prototype.nb$inplace_and = Sk.builtin.lng.prototype.nb$and;

Sk.builtin.lng.prototype.nb$or = function (other) {
    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.or(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.or(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};


Sk.builtin.lng.prototype.nb$reflected_or = Sk.builtin.lng.prototype.nb$or;

Sk.builtin.lng.prototype.nb$inplace_or = Sk.builtin.lng.prototype.nb$or;

Sk.builtin.lng.prototype.nb$xor = function (other) {
    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.xor(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.xor(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_xor = Sk.builtin.lng.prototype.nb$xor;

Sk.builtin.lng.prototype.nb$inplace_xor = Sk.builtin.lng.prototype.nb$xor;

/**
 * @override
 *
 * @return {Sk.builtin.lng} A copy of this instance with the value negated.
 */
Sk.builtin.lng.prototype.nb$negative = function () {
    return new Sk.builtin.lng(this.biginteger.negate());
};

Sk.builtin.lng.prototype.nb$invert = function () {
    return new Sk.builtin.lng(this.biginteger.not());
};

Sk.builtin.lng.prototype.nb$positive = function () {
    return this.clone();
};

Sk.builtin.lng.prototype.nb$nonzero = function () {
    return this.biginteger.trueCompare(Sk.builtin.biginteger.ZERO) !== 0;
};

Sk.builtin.lng.prototype.nb$isnegative = function () {
    return this.biginteger.isnegative();
};

Sk.builtin.lng.prototype.nb$ispositive = function () {
    return !this.biginteger.isnegative();
};

Sk.builtin.lng.prototype.longCompare = function (other) {
    var otherAsLong, thisAsFloat;

    if (typeof other === "number") {
        other = new Sk.builtin.lng(other);
    }

    if (other instanceof Sk.builtin.int_ || 
        (other instanceof Sk.builtin.float_ && other.v % 1 === 0)) {
        otherAsLong = new Sk.builtin.lng(other.v);
        return this.longCompare(otherAsLong);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this);
        return thisAsFloat.numberCompare(other);
    }

    if (other instanceof Sk.builtin.lng) {
        return this.biginteger.subtract(other.biginteger);
    } else if (other instanceof Sk.builtin.biginteger) {
        return this.biginteger.subtract(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

//tests fail if ===
Sk.builtin.lng.prototype.ob$eq = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) == 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$ne = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) != 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$lt = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) < 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$le = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) <= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$gt = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) > 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$ge = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) >= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.$r = function () {
    return new Sk.builtin.str(this.str$(10, true) + "L");
};

Sk.builtin.lng.prototype.tp$str = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

Sk.builtin.lng.prototype.str$ = function (base, sign) {
    var work;
    if (sign === undefined) {
        sign = true;
    }

    work = sign ? this.biginteger : this.biginteger.abs();

    if (base === undefined || base === 10) {
        return work.toString();
    }

    //    Another base... convert...
    return work.toString(base);
};


/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/structseq.js ---- */ 

Sk.builtin.structseq_types = {};

Sk.builtin.make_structseq = function (module, name, fields, doc) {
    var nm = module + "." + name;
    var flds = [];
    var docs = [];
    var i;
    for (var key in fields) {
        flds.push(key);
        docs.push(fields[key]);
    }

    var cons = function structseq_constructor(arg) {
        Sk.builtin.pyCheckArgs(nm, arguments, 1, 1);
        var o;
        var it, i, v;
        if (!(this instanceof Sk.builtin.structseq_types[nm])) {
            o = Object.create(Sk.builtin.structseq_types[nm].prototype);
            o.constructor.apply(o, arguments);
            return o;
        }

        if (Object.prototype.toString.apply(arg) === "[object Array]") {
            v = arg;
        } else {
            v = [];
            for (it = Sk.abstr.iter(arg), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                v.push(i);
            }
            if (v.length != flds.length) {
                throw new Sk.builtin.TypeError(nm + "() takes a " + flds.length + "-sequence (" + v.length + "-sequence given)");
            }
        }

        Sk.builtin.tuple.call(this, v);

        this.__class__ = Sk.builtin.structseq_types[nm];
    };
    Sk.builtin.structseq_types[nm] = cons;

    goog.inherits(cons, Sk.builtin.tuple);
    if (doc) {
        cons.prototype.__doc__ = doc;
    }
    cons.prototype.tp$name = nm;
    cons.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(nm, Sk.builtin.structseq_types[nm]);
    cons.prototype.ob$type["$d"] = new Sk.builtin.dict([]);
    cons.prototype.ob$type["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple([Sk.builtin.tuple]));
    //var mro = Sk.builtin.type.buildMRO(cons.prototype.ob$type);
    //cons.prototype.ob$type["$d"].mp$ass_subscript(Sk.builtin.type.mroStr_, mro);
    //cons.prototype.ob$type.tp$mro = mro;
    cons.prototype.__getitem__ = new Sk.builtin.func(function (self, index) {
        return Sk.builtin.tuple.prototype.mp$subscript.call(self, index);
    });
    cons.prototype.__reduce__ = new Sk.builtin.func(function (self) {
        throw new Sk.builtin.Exception("__reduce__ is not implemented");
    });

    cons.prototype["$r"] = function () {
        var ret;
        var i;
        var bits;
        if (this.v.length === 0) {
            return new Sk.builtin.str(nm + "()");
        }
        bits = [];
        for (i = 0; i < this.v.length; ++i) {
            bits[i] = flds[i] + "=" + Sk.misceval.objectRepr(this.v[i]).v;
        }
        ret = bits.join(", ");
        if (this.v.length === 1) {
            ret += ",";
        }
        return new Sk.builtin.str(nm + "(" + ret + ")");
    };
    cons.prototype.tp$setattr = function (name, value) {
        throw new Sk.builtin.AttributeError("readonly property");
    };

    cons.prototype.tp$getattr = function (name) {
        var i = flds.indexOf(name);
        if (i >= 0) {
            return this.v[i];
        } else {
            return  Sk.builtin.object.prototype.GenericGetAttr(name);
        }
    };

    return cons;
};
goog.exportSymbol("Sk.builtin.make_structseq", Sk.builtin.make_structseq);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/file.js ---- */ 

/**
 * @constructor
 * @param {Sk.builtin.str} name
 * @param {Sk.builtin.str} mode
 * @param {Object} buffering
 */
Sk.builtin.file = function (name, mode, buffering) {
    var i;
    var elem;

    if (!(this instanceof Sk.builtin.file)) {
        return new Sk.builtin.file(name, mode, buffering);
    }

    this.mode = mode;
    this.name = Sk.ffi.remapToJs(name);
    this.closed = false;

    if (this.name === "/dev/stdout") {
        this.data$ = Sk.builtin.none.none$;
        this.fileno = 1;
    } else if (this.name === "/dev/stdin") {
        this.fileno = 0;
    } else if (this.name === "/dev/stderr") {
        this.fileno = 2;
    } else {
        if (Sk.inBrowser) {  // todo:  Maybe provide a replaceable function for non-import files
            this.fileno = 10;
            elem = document.getElementById(name.v);
            if (elem == null) {
                throw new Sk.builtin.IOError("[Errno 2] No such file or directory: '" + name.v + "'");
            } else {
                if (elem.nodeName.toLowerCase() == "textarea") {
                    this.data$ = elem.value;
                } else {
                    this.data$ = elem.textContent;
                }
            }
        } else {
            this.fileno = 11;
            this.data$ = Sk.read(name.v);
        }

        this.lineList = this.data$.split("\n");
        this.lineList = this.lineList.slice(0, -1);

        for (i in this.lineList) {
            this.lineList[i] = this.lineList[i] + "\n";
        }
        this.currentLine = 0;
    }
    this.pos$ = 0;

    this.__class__ = Sk.builtin.file;

    return this;
};

Sk.abstr.setUpInheritance("file", Sk.builtin.file, Sk.builtin.object);

Sk.builtin.file.prototype["$r"] = function () {
    return new Sk.builtin.str("<" +
        (this.closed ? "closed" : "open") +
        "file '" +
        this.name +
        "', mode '" +
        this.mode +
        "'>");
};

Sk.builtin.file.prototype.tp$iter = function () {
    var allLines = this.lineList;

    var ret =
    {
        tp$iter    : function () {
            return ret;
        },
        $obj       : this,
        $index     : 0,
        $lines     : allLines,
        tp$iternext: function () {
            if (ret.$index >= ret.$lines.length) {
                return undefined;
            }
            return new Sk.builtin.str(ret.$lines[ret.$index++]);
        }
    };
    return ret;
};

Sk.builtin.file.prototype["close"] = new Sk.builtin.func(function (self) {
    self.closed = true;
});

Sk.builtin.file.prototype["flush"] = new Sk.builtin.func(function (self) {
});

Sk.builtin.file.prototype["fileno"] = new Sk.builtin.func(function (self) {
    return this.fileno;
}); // > 0, not 1/2/3

Sk.builtin.file.prototype["isatty"] = new Sk.builtin.func(function (self) {
    return false;
});

Sk.builtin.file.prototype["read"] = new Sk.builtin.func(function (self, size) {
    var ret;
    var len;
    if (self.closed) {
        throw new Sk.builtin.ValueError("I/O operation on closed file");
    }
    len = self.data$.length;
    if (size === undefined) {
        size = len;
    }
    ret = new Sk.builtin.str(self.data$.substr(self.pos$, size));
    self.pos$ += size;
    if (self.pos$ >= len) {
        self.pos$ = len;
    }
    return ret;
});

Sk.builtin.file.prototype["readline"] = new Sk.builtin.func(function (self, size) {
    if (self.fileno === 0) {
        var x, resolution, susp;

        var prompt = prompt ? prompt.v : "";
        x = Sk.inputfun(prompt);

        if (x instanceof Promise) {
            susp = new Sk.misceval.Suspension();

            susp.resume = function() {
                return new Sk.builtin.str(resolution);
            };

            susp.data = {
                type: "Sk.promise",
                promise: x.then(function(value) {
                    resolution = value;
                    return value;
                }, function(err) {
                    resolution = "";
                    return err;
                })
            };

            return susp;
        } else {
            return new Sk.builtin.str(x);
        }
    } else {
        var line = "";
        if (self.currentLine < self.lineList.length) {
            line = self.lineList[self.currentLine];
            self.currentLine++;
        }
        return new Sk.builtin.str(line);
    }
});

Sk.builtin.file.prototype["readlines"] = new Sk.builtin.func(function (self, sizehint) {
    if (self.fileno === 0) {
        return new Sk.builtin.NotImplementedError("readlines ins't implemented because the web doesn't support Ctrl+D");
    }

    var i;
    var arr = [];
    for (i = self.currentLine; i < self.lineList.length; i++) {
        arr.push(new Sk.builtin.str(self.lineList[i]));
    }
    return new Sk.builtin.list(arr);
});

Sk.builtin.file.prototype["seek"] = new Sk.builtin.func(function (self, offset, whence) {
    if (whence === undefined) {
        whence = 1;
    }
    if (whence == 1) {
        self.pos$ = offset;
    } else {
        self.pos$ = self.data$ + offset;
    }
});

Sk.builtin.file.prototype["tell"] = new Sk.builtin.func(function (self) {
    return self.pos$;
});


Sk.builtin.file.prototype["truncate"] = new Sk.builtin.func(function (self, size) {
    goog.asserts.fail();
});

Sk.builtin.file.prototype["write"] = new Sk.builtin.func(function (self, str) {
    if (self.fileno === 1) {
        Sk.output(Sk.ffi.remapToJs(str));
    } else {
        goog.asserts.fail();
    }
});


goog.exportSymbol("Sk.builtin.file", Sk.builtin.file);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/tokenize.js ---- */ 

/*
 * This is a port of tokenize.py by Ka-Ping Yee.
 *
 * each call to readline should return one line of input as a string, or
 * undefined if it's finished.
 *
 * callback is called for each token with 5 args:
 * 1. the token type
 * 2. the token string
 * 3. [ start_row, start_col ]
 * 4. [ end_row, end_col ]
 * 5. logical line where the token was found, including continuation lines
 *
 * callback can return true to abort.
 *
 */

/**
 * @constructor
 */
Sk.Tokenizer = function (filename, interactive, callback) {
    this.filename = filename;
    this.callback = callback;
    this.lnum = 0;
    this.parenlev = 0;
    this.continued = false;
    this.namechars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
    this.numchars = "0123456789";
    this.contstr = "";
    this.needcont = false;
    this.contline = undefined;
    this.indents = [0];
    this.endprog = /.*/;
    this.strstart = [-1, -1];
    this.interactive = interactive;
    this.doneFunc = function () {
        var i;
        for (i = 1; i < this.indents.length; ++i) // pop remaining indent levels
        {
            if (this.callback(Sk.Tokenizer.Tokens.T_DEDENT, "", [this.lnum, 0], [this.lnum, 0], "")) {
                return "done";
            }
        }
        if (this.callback(Sk.Tokenizer.Tokens.T_ENDMARKER, "", [this.lnum, 0], [this.lnum, 0], "")) {
            return "done";
        }

        return "failed";
    };

};

/**
 * @enum {number}
 */
Sk.Tokenizer.Tokens = {
    T_ENDMARKER       : 0,
    T_NAME            : 1,
    T_NUMBER          : 2,
    T_STRING          : 3,
    T_NEWLINE         : 4,
    T_INDENT          : 5,
    T_DEDENT          : 6,
    T_LPAR            : 7,
    T_RPAR            : 8,
    T_LSQB            : 9,
    T_RSQB            : 10,
    T_COLON           : 11,
    T_COMMA           : 12,
    T_SEMI            : 13,
    T_PLUS            : 14,
    T_MINUS           : 15,
    T_STAR            : 16,
    T_SLASH           : 17,
    T_VBAR            : 18,
    T_AMPER           : 19,
    T_LESS            : 20,
    T_GREATER         : 21,
    T_EQUAL           : 22,
    T_DOT             : 23,
    T_PERCENT         : 24,
    T_BACKQUOTE       : 25,
    T_LBRACE          : 26,
    T_RBRACE          : 27,
    T_EQEQUAL         : 28,
    T_NOTEQUAL        : 29,
    T_LESSEQUAL       : 30,
    T_GREATEREQUAL    : 31,
    T_TILDE           : 32,
    T_CIRCUMFLEX      : 33,
    T_LEFTSHIFT       : 34,
    T_RIGHTSHIFT      : 35,
    T_DOUBLESTAR      : 36,
    T_PLUSEQUAL       : 37,
    T_MINEQUAL        : 38,
    T_STAREQUAL       : 39,
    T_SLASHEQUAL      : 40,
    T_PERCENTEQUAL    : 41,
    T_AMPEREQUAL      : 42,
    T_VBAREQUAL       : 43,
    T_CIRCUMFLEXEQUAL : 44,
    T_LEFTSHIFTEQUAL  : 45,
    T_RIGHTSHIFTEQUAL : 46,
    T_DOUBLESTAREQUAL : 47,
    T_DOUBLESLASH     : 48,
    T_DOUBLESLASHEQUAL: 49,
    T_AT              : 50,
    T_OP              : 51,
    T_COMMENT         : 52,
    T_NL              : 53,
    T_RARROW          : 54,
    T_ERRORTOKEN      : 55,
    T_N_TOKENS        : 56,
    T_NT_OFFSET       : 256
};

/** @param {...*} x */
function group (x) {
    var args = Array.prototype.slice.call(arguments);
    return "(" + args.join("|") + ")";
}

/** @param {...*} x */
function any (x) {
    return group.apply(null, arguments) + "*";
}

/** @param {...*} x */
function maybe (x) {
    return group.apply(null, arguments) + "?";
}

/* we have to use string and ctor to be able to build patterns up. + on /.../
 * does something strange. */
var Whitespace = "[ \\f\\t]*";
var Comment_ = "#[^\\r\\n]*";
var Ident = "[a-zA-Z_]\\w*";

var Binnumber = "0[bB][01]*";
var Hexnumber = "0[xX][\\da-fA-F]*[lL]?";
var Octnumber = "0[oO]?[0-7]*[lL]?";
var Decnumber = "[1-9]\\d*[lL]?";
var Intnumber = group(Binnumber, Hexnumber, Octnumber, Decnumber);

var Exponent = "[eE][-+]?\\d+";
var Pointfloat = group("\\d+\\.\\d*", "\\.\\d+") + maybe(Exponent);
var Expfloat = "\\d+" + Exponent;
var Floatnumber = group(Pointfloat, Expfloat);
var Imagnumber = group("\\d+[jJ]", Floatnumber + "[jJ]");
var Number_ = group(Imagnumber, Floatnumber, Intnumber);

// tail end of ' string
var Single = "^[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
// tail end of " string
var Double_ = '^[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
// tail end of ''' string
var Single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
// tail end of """ string
var Double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
var Triple = group("[ubUB]?[rR]?'''", '[ubUB]?[rR]?"""');
var String_ = group("[uU]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'",
    '[uU]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');

// Because of leftmost-then-longest match semantics, be sure to put the
// longest operators first (e.g., if = came before ==, == would get
// recognized as two instances of =).
var Operator = group("\\*\\*=?", ">>=?", "<<=?", "<>", "!=",
    "//=?", "->",
    "[+\\-*/%&|^=<>]=?",
    "~");

var Bracket = "[\\][(){}]";
var Special = group("\\r?\\n", "[:;.,`@]");
var Funny = group(Operator, Bracket, Special);

var ContStr = group("[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
        group("'", "\\\\\\r?\\n"),
        "[uUbB]?[rR]?\"[^\\n\"\\\\]*(?:\\\\.[^\\n\"\\\\]*)*" +
        group("\"", "\\\\\\r?\\n"));
var PseudoExtras = group("\\\\\\r?\\n", Comment_, Triple);
// Need to prefix with "^" as we only want to match what's next
var PseudoToken = "^" + group(PseudoExtras, Number_, Funny, ContStr, Ident);


var triple_quoted = {
    "'''"  : true, '"""': true,
    "r'''" : true, 'r"""': true, "R'''": true, 'R"""': true,
    "u'''" : true, 'u"""': true, "U'''": true, 'U"""': true,
    "b'''" : true, 'b"""': true, "B'''": true, 'B"""': true,
    "ur'''": true, 'ur"""': true, "Ur'''": true, 'Ur"""': true,
    "uR'''": true, 'uR"""': true, "UR'''": true, 'UR"""': true,
    "br'''": true, 'br"""': true, "Br'''": true, 'Br"""': true,
    "bR'''": true, 'bR"""': true, "BR'''": true, 'BR"""': true
};

var single_quoted = {
    "'"  : true, '"': true,
    "r'" : true, 'r"': true, "R'": true, 'R"': true,
    "u'" : true, 'u"': true, "U'": true, 'U"': true,
    "b'" : true, 'b"': true, "B'": true, 'B"': true,
    "ur'": true, 'ur"': true, "Ur'": true, 'Ur"': true,
    "uR'": true, 'uR"': true, "UR'": true, 'UR"': true,
    "br'": true, 'br"': true, "Br'": true, 'Br"': true,
    "bR'": true, 'bR"': true, "BR'": true, 'BR"': true
};

// hack to make closure keep those objects. not sure what a better way is.
(function () {
    var k;
    for (k in triple_quoted) {
    }
    for (k in single_quoted) {
    }
}());


var tabsize = 8;

function contains (a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function rstrip (input, what) {
    var i;
    for (i = input.length; i > 0; --i) {
        if (what.indexOf(input.charAt(i - 1)) === -1) {
            break;
        }
    }
    return input.substring(0, i);
}

Sk.Tokenizer.prototype.generateTokens = function (line) {
    var nl_pos;
    var newl;
    var initial;
    var token;
    var epos;
    var spos;
    var start;
    var pseudomatch;
    var capos;
    var comment_token;
    var endmatch, pos, column, end, max;


    // bnm - Move these definitions in this function otherwise test state is preserved between
    // calls on single3prog and double3prog causing weird errors with having multiple instances
    // of triple quoted strings in the same program.

    var pseudoprog = new RegExp(PseudoToken);
    var single3prog = new RegExp(Single3, "g");
    var double3prog = new RegExp(Double3, "g");

    var endprogs = {     "'": new RegExp(Single, "g"), "\"": new RegExp(Double_, "g"),
        "'''"               : single3prog, '"""': double3prog,
        "r'''"              : single3prog, 'r"""': double3prog,
        "u'''"              : single3prog, 'u"""': double3prog,
        "b'''"              : single3prog, 'b"""': double3prog,
        "ur'''"             : single3prog, 'ur"""': double3prog,
        "br'''"             : single3prog, 'br"""': double3prog,
        "R'''"              : single3prog, 'R"""': double3prog,
        "U'''"              : single3prog, 'U"""': double3prog,
        "B'''"              : single3prog, 'B"""': double3prog,
        "uR'''"             : single3prog, 'uR"""': double3prog,
        "Ur'''"             : single3prog, 'Ur"""': double3prog,
        "UR'''"             : single3prog, 'UR"""': double3prog,
        "bR'''"             : single3prog, 'bR"""': double3prog,
        "Br'''"             : single3prog, 'Br"""': double3prog,
        "BR'''"             : single3prog, 'BR"""': double3prog,
        'r'                 : null, 'R': null,
        'u'                 : null, 'U': null,
        'b'                 : null, 'B': null
    };


    if (!line) {
        line = '';
    }
    //print("LINE:'"+line+"'");

    this.lnum += 1;
    pos = 0;
    max = line.length;

    if (this.contstr.length > 0) {
        if (!line) {
            throw new Sk.builtin.SyntaxError("EOF in multi-line string", this.filename, this.strstart[0], this.strstart[1], this.contline);
        }
        this.endprog.lastIndex = 0;
        endmatch = this.endprog.test(line);
        if (endmatch) {
            pos = end = this.endprog.lastIndex;
            if (this.callback(Sk.Tokenizer.Tokens.T_STRING, this.contstr + line.substring(0, end),
                this.strstart, [this.lnum, end], this.contline + line)) {
                return 'done';
            }
            this.contstr = '';
            this.needcont = false;
            this.contline = undefined;
        }
        else if (this.needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n") {
            if (this.callback(Sk.Tokenizer.Tokens.T_ERRORTOKEN, this.contstr + line,
                this.strstart, [this.lnum, line.length], this.contline)) {
                return 'done';
            }
            this.contstr = '';
            this.contline = undefined;
            return false;
        }
        else {
            this.contstr += line;
            this.contline = this.contline + line;
            return false;
        }
    }
    else if (this.parenlev === 0 && !this.continued) {
        if (!line) {
            return this.doneFunc();
        }
        column = 0;
        while (pos < max) {
            if (line.charAt(pos) === ' ') {
                column += 1;
            }
            else if (line.charAt(pos) === '\t') {
                column = (column / tabsize + 1) * tabsize;
            }
            else if (line.charAt(pos) === '\f') {
                column = 0;
            }
            else {
                break;
            }
            pos = pos + 1;
        }
        if (pos === max) {
            return this.doneFunc();
        }

        if ("#\r\n".indexOf(line.charAt(pos)) !== -1) // skip comments or blank lines
        {
            if (line.charAt(pos) === '#') {
                comment_token = rstrip(line.substring(pos), '\r\n');
                nl_pos = pos + comment_token.length;
                if (this.callback(Sk.Tokenizer.Tokens.T_COMMENT, comment_token,
                    [this.lnum, pos], [this.lnum, pos + comment_token.length], line)) {
                    return 'done';
                }
                //print("HERE:1");
                if (this.callback(Sk.Tokenizer.Tokens.T_NL, line.substring(nl_pos),
                    [this.lnum, nl_pos], [this.lnum, line.length], line)) {
                    return 'done';
                }
                return false;
            }
            else {
                //print("HERE:2");
                if (this.callback(Sk.Tokenizer.Tokens.T_NL, line.substring(pos),
                    [this.lnum, pos], [this.lnum, line.length], line)) {
                    return 'done';
                }
                if (!this.interactive) {
                    return false;
                }
            }
        }

        if (column > this.indents[this.indents.length - 1]) // count indents or dedents
        {
            this.indents.push(column);
            if (this.callback(Sk.Tokenizer.Tokens.T_INDENT, line.substring(0, pos), [this.lnum, 0], [this.lnum, pos], line)) {
                return 'done';
            }
        }
        while (column < this.indents[this.indents.length - 1]) {
            if (!contains(this.indents, column)) {
                throw new Sk.builtin.IndentationError("unindent does not match any outer indentation level",
                    this.filename, this.lnum, pos, line);
            }
            this.indents.splice(this.indents.length - 1, 1);
            //print("dedent here");
            if (this.callback(Sk.Tokenizer.Tokens.T_DEDENT, '', [this.lnum, pos], [this.lnum, pos], line)) {
                return 'done';
            }
        }
    }
    else // continued statement
    {
        if (!line) {
            throw new Sk.builtin.SyntaxError("EOF in multi-line statement", this.filename, this.lnum, 0, line);
        }
        this.continued = false;
    }

    while (pos < max) {
        //print("pos:"+pos+":"+max);
        // js regexes don't return any info about matches, other than the
        // content. we'd like to put a \w+ before pseudomatch, but then we
        // can't get any data
        capos = line.charAt(pos);
        while (capos === ' ' || capos === '\f' || capos === '\t') {
            pos += 1;
            capos = line.charAt(pos);
        }
        pseudoprog.lastIndex = 0;
        pseudomatch = pseudoprog.exec(line.substring(pos));
        if (pseudomatch) {
            start = pos;
            end = start + pseudomatch[1].length;
            spos = [this.lnum, start];
            epos = [this.lnum, end];
            pos = end;
            token = line.substring(start, end);
            initial = line.charAt(start);
            //Sk.debugout("token:",token, "initial:",initial, start, end);
            if (this.numchars.indexOf(initial) !== -1 || (initial === '.' && token !== '.')) {
                if (this.callback(Sk.Tokenizer.Tokens.T_NUMBER, token, spos, epos, line)) {
                    return 'done';
                }
            }
            else if (initial === '\r' || initial === '\n') {
                newl = Sk.Tokenizer.Tokens.T_NEWLINE;
                //print("HERE:3");
                if (this.parenlev > 0) {
                    newl = Sk.Tokenizer.Tokens.T_NL;
                }
                if (this.callback(newl, token, spos, epos, line)) {
                    return 'done';
                }
            }
            else if (initial === '#') {
                if (this.callback(Sk.Tokenizer.Tokens.T_COMMENT, token, spos, epos, line)) {
                    return 'done';
                }
            }
            else if (triple_quoted.hasOwnProperty(token)) {
                this.endprog = endprogs[token];
                this.endprog.lastIndex = 0;
                endmatch = this.endprog.test(line.substring(pos));
                if (endmatch) {
                    pos = this.endprog.lastIndex + pos;
                    token = line.substring(start, pos);
                    if (this.callback(Sk.Tokenizer.Tokens.T_STRING, token, spos, [this.lnum, pos], line)) {
                        return 'done';
                    }
                }
                else {
                    this.strstart = [this.lnum, start];
                    this.contstr = line.substring(start);
                    this.contline = line;
                    return false;
                }
            }
            else if (single_quoted.hasOwnProperty(initial) ||
                single_quoted.hasOwnProperty(token.substring(0, 2)) ||
                single_quoted.hasOwnProperty(token.substring(0, 3))) {
                if (token[token.length - 1] === '\n') {
                    this.strstart = [this.lnum, start];
                    this.endprog = endprogs[initial] || endprogs[token[1]] || endprogs[token[2]];
                    this.contstr = line.substring(start);
                    this.needcont = true;
                    this.contline = line;
                    //print("i, t1, t2", initial, token[1], token[2]);
                    //print("ep, cs", this.endprog, this.contstr);
                    return false;
                }
                else {
                    if (this.callback(Sk.Tokenizer.Tokens.T_STRING, token, spos, epos, line)) {
                        return 'done';
                    }
                }
            }
            else if (this.namechars.indexOf(initial) !== -1) {
                if (this.callback(Sk.Tokenizer.Tokens.T_NAME, token, spos, epos, line)) {
                    return 'done';
                }
            }
            else if (initial === '\\') {
                //print("HERE:4");
                if (this.callback(Sk.Tokenizer.Tokens.T_NL, token, spos, [this.lnum, pos], line)) {
                    return 'done';
                }
                this.continued = true;
            }
            else {
                if ('([{'.indexOf(initial) !== -1) {
                    this.parenlev += 1;
                }
                else if (')]}'.indexOf(initial) !== -1) {
                    this.parenlev -= 1;
                }
                if (this.callback(Sk.Tokenizer.Tokens.T_OP, token, spos, epos, line)) {
                    return 'done';
                }
            }
        }
        else {
            if (this.callback(Sk.Tokenizer.Tokens.T_ERRORTOKEN, line.charAt(pos),
                [this.lnum, pos], [this.lnum, pos + 1], line)) {
                return 'done';
            }
            pos += 1;
        }
    }

    return false;
};

Sk.Tokenizer.tokenNames = {
    0  : 'T_ENDMARKER', 1: 'T_NAME', 2: 'T_NUMBER', 3: 'T_STRING', 4: 'T_NEWLINE',
    5  : 'T_INDENT', 6: 'T_DEDENT', 7: 'T_LPAR', 8: 'T_RPAR', 9: 'T_LSQB',
    10 : 'T_RSQB', 11: 'T_COLON', 12: 'T_COMMA', 13: 'T_SEMI', 14: 'T_PLUS',
    15 : 'T_MINUS', 16: 'T_STAR', 17: 'T_SLASH', 18: 'T_VBAR', 19: 'T_AMPER',
    20 : 'T_LESS', 21: 'T_GREATER', 22: 'T_EQUAL', 23: 'T_DOT', 24: 'T_PERCENT',
    25 : 'T_BACKQUOTE', 26: 'T_LBRACE', 27: 'T_RBRACE', 28: 'T_EQEQUAL', 29: 'T_NOTEQUAL',
    30 : 'T_LESSEQUAL', 31: 'T_GREATEREQUAL', 32: 'T_TILDE', 33: 'T_CIRCUMFLEX', 34: 'T_LEFTSHIFT',
    35 : 'T_RIGHTSHIFT', 36: 'T_DOUBLESTAR', 37: 'T_PLUSEQUAL', 38: 'T_MINEQUAL', 39: 'T_STAREQUAL',
    40 : 'T_SLASHEQUAL', 41: 'T_PERCENTEQUAL', 42: 'T_AMPEREQUAL', 43: 'T_VBAREQUAL', 44: 'T_CIRCUMFLEXEQUAL',
    45 : 'T_LEFTSHIFTEQUAL', 46: 'T_RIGHTSHIFTEQUAL', 47: 'T_DOUBLESTAREQUAL', 48: 'T_DOUBLESLASH', 49: 'T_DOUBLESLASHEQUAL',
    50 : 'T_AT', 51: 'T_OP', 52: 'T_COMMENT', 53: 'T_NL', 54: 'T_RARROW',
    55 : 'T_ERRORTOKEN', 56: 'T_N_TOKENS',
    256: 'T_NT_OFFSET'
};

goog.exportSymbol("Sk.Tokenizer", Sk.Tokenizer);
goog.exportSymbol("Sk.Tokenizer.prototype.generateTokens", Sk.Tokenizer.prototype.generateTokens);
goog.exportSymbol("Sk.Tokenizer.tokenNames", Sk.Tokenizer.tokenNames);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/gen/parse_tables.js ---- */ 

// generated by pgen/main.py
Sk.OpMap = {
"(": Sk.Tokenizer.Tokens.T_LPAR,
")": Sk.Tokenizer.Tokens.T_RPAR,
"[": Sk.Tokenizer.Tokens.T_LSQB,
"]": Sk.Tokenizer.Tokens.T_RSQB,
":": Sk.Tokenizer.Tokens.T_COLON,
",": Sk.Tokenizer.Tokens.T_COMMA,
";": Sk.Tokenizer.Tokens.T_SEMI,
"+": Sk.Tokenizer.Tokens.T_PLUS,
"-": Sk.Tokenizer.Tokens.T_MINUS,
"*": Sk.Tokenizer.Tokens.T_STAR,
"/": Sk.Tokenizer.Tokens.T_SLASH,
"|": Sk.Tokenizer.Tokens.T_VBAR,
"&": Sk.Tokenizer.Tokens.T_AMPER,
"<": Sk.Tokenizer.Tokens.T_LESS,
">": Sk.Tokenizer.Tokens.T_GREATER,
"=": Sk.Tokenizer.Tokens.T_EQUAL,
".": Sk.Tokenizer.Tokens.T_DOT,
"%": Sk.Tokenizer.Tokens.T_PERCENT,
"`": Sk.Tokenizer.Tokens.T_BACKQUOTE,
"{": Sk.Tokenizer.Tokens.T_LBRACE,
"}": Sk.Tokenizer.Tokens.T_RBRACE,
"@": Sk.Tokenizer.Tokens.T_AT,
"==": Sk.Tokenizer.Tokens.T_EQEQUAL,
"!=": Sk.Tokenizer.Tokens.T_NOTEQUAL,
"<>": Sk.Tokenizer.Tokens.T_NOTEQUAL,
"<=": Sk.Tokenizer.Tokens.T_LESSEQUAL,
">=": Sk.Tokenizer.Tokens.T_GREATEREQUAL,
"~": Sk.Tokenizer.Tokens.T_TILDE,
"^": Sk.Tokenizer.Tokens.T_CIRCUMFLEX,
"<<": Sk.Tokenizer.Tokens.T_LEFTSHIFT,
">>": Sk.Tokenizer.Tokens.T_RIGHTSHIFT,
"**": Sk.Tokenizer.Tokens.T_DOUBLESTAR,
"+=": Sk.Tokenizer.Tokens.T_PLUSEQUAL,
"-=": Sk.Tokenizer.Tokens.T_MINEQUAL,
"*=": Sk.Tokenizer.Tokens.T_STAREQUAL,
"/=": Sk.Tokenizer.Tokens.T_SLASHEQUAL,
"%=": Sk.Tokenizer.Tokens.T_PERCENTEQUAL,
"&=": Sk.Tokenizer.Tokens.T_AMPEREQUAL,
"|=": Sk.Tokenizer.Tokens.T_VBAREQUAL,
"^=": Sk.Tokenizer.Tokens.T_CIRCUMFLEXEQUAL,
"<<=": Sk.Tokenizer.Tokens.T_LEFTSHIFTEQUAL,
">>=": Sk.Tokenizer.Tokens.T_RIGHTSHIFTEQUAL,
"**=": Sk.Tokenizer.Tokens.T_DOUBLESTAREQUAL,
"//": Sk.Tokenizer.Tokens.T_DOUBLESLASH,
"//=": Sk.Tokenizer.Tokens.T_DOUBLESLASHEQUAL,
"->": Sk.Tokenizer.Tokens.T_RARROW
};
Sk.ParseTables = {
sym:
{and_expr: 257,
 and_test: 258,
 arglist: 259,
 argument: 260,
 arith_expr: 261,
 assert_stmt: 262,
 atom: 263,
 augassign: 264,
 break_stmt: 265,
 classdef: 266,
 comp_for: 267,
 comp_if: 268,
 comp_iter: 269,
 comp_op: 270,
 comparison: 271,
 compound_stmt: 272,
 continue_stmt: 273,
 debugger_stmt: 274,
 decorated: 275,
 decorator: 276,
 decorators: 277,
 del_stmt: 278,
 dictorsetmaker: 279,
 dotted_as_name: 280,
 dotted_as_names: 281,
 dotted_name: 282,
 encoding_decl: 283,
 eval_input: 284,
 except_clause: 285,
 exec_stmt: 286,
 expr: 287,
 expr_stmt: 288,
 exprlist: 289,
 factor: 290,
 file_input: 291,
 flow_stmt: 292,
 for_stmt: 293,
 fpdef: 294,
 fplist: 295,
 funcdef: 296,
 global_stmt: 297,
 if_stmt: 298,
 import_as_name: 299,
 import_as_names: 300,
 import_from: 301,
 import_name: 302,
 import_stmt: 303,
 lambdef: 304,
 list_for: 305,
 list_if: 306,
 list_iter: 307,
 listmaker: 308,
 not_test: 309,
 old_lambdef: 310,
 old_test: 311,
 or_test: 312,
 parameters: 313,
 pass_stmt: 314,
 power: 315,
 print_stmt: 316,
 raise_stmt: 317,
 return_stmt: 318,
 shift_expr: 319,
 simple_stmt: 320,
 single_input: 256,
 sliceop: 321,
 small_stmt: 322,
 stmt: 323,
 subscript: 324,
 subscriptlist: 325,
 suite: 326,
 term: 327,
 test: 328,
 testlist: 329,
 testlist1: 330,
 testlist_comp: 331,
 testlist_safe: 332,
 trailer: 333,
 try_stmt: 334,
 varargslist: 335,
 while_stmt: 336,
 with_item: 337,
 with_stmt: 338,
 xor_expr: 339,
 yield_expr: 340,
 yield_stmt: 341},
number2symbol:
{256: 'single_input',
 257: 'and_expr',
 258: 'and_test',
 259: 'arglist',
 260: 'argument',
 261: 'arith_expr',
 262: 'assert_stmt',
 263: 'atom',
 264: 'augassign',
 265: 'break_stmt',
 266: 'classdef',
 267: 'comp_for',
 268: 'comp_if',
 269: 'comp_iter',
 270: 'comp_op',
 271: 'comparison',
 272: 'compound_stmt',
 273: 'continue_stmt',
 274: 'debugger_stmt',
 275: 'decorated',
 276: 'decorator',
 277: 'decorators',
 278: 'del_stmt',
 279: 'dictorsetmaker',
 280: 'dotted_as_name',
 281: 'dotted_as_names',
 282: 'dotted_name',
 283: 'encoding_decl',
 284: 'eval_input',
 285: 'except_clause',
 286: 'exec_stmt',
 287: 'expr',
 288: 'expr_stmt',
 289: 'exprlist',
 290: 'factor',
 291: 'file_input',
 292: 'flow_stmt',
 293: 'for_stmt',
 294: 'fpdef',
 295: 'fplist',
 296: 'funcdef',
 297: 'global_stmt',
 298: 'if_stmt',
 299: 'import_as_name',
 300: 'import_as_names',
 301: 'import_from',
 302: 'import_name',
 303: 'import_stmt',
 304: 'lambdef',
 305: 'list_for',
 306: 'list_if',
 307: 'list_iter',
 308: 'listmaker',
 309: 'not_test',
 310: 'old_lambdef',
 311: 'old_test',
 312: 'or_test',
 313: 'parameters',
 314: 'pass_stmt',
 315: 'power',
 316: 'print_stmt',
 317: 'raise_stmt',
 318: 'return_stmt',
 319: 'shift_expr',
 320: 'simple_stmt',
 321: 'sliceop',
 322: 'small_stmt',
 323: 'stmt',
 324: 'subscript',
 325: 'subscriptlist',
 326: 'suite',
 327: 'term',
 328: 'test',
 329: 'testlist',
 330: 'testlist1',
 331: 'testlist_comp',
 332: 'testlist_safe',
 333: 'trailer',
 334: 'try_stmt',
 335: 'varargslist',
 336: 'while_stmt',
 337: 'with_item',
 338: 'with_stmt',
 339: 'xor_expr',
 340: 'yield_expr',
 341: 'yield_stmt'},
dfas:
{256: [[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
       {2: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1}],
 257: [[[[38, 1]], [[39, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 26: 1, 30: 1, 37: 1}],
 258: [[[[40, 1]], [[41, 0], [0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 259: [[[[42, 1], [43, 2], [44, 3]],
        [[45, 4]],
        [[46, 5], [0, 2]],
        [[45, 6]],
        [[46, 7], [0, 4]],
        [[42, 1], [43, 2], [44, 3], [0, 5]],
        [[0, 6]],
        [[43, 4], [44, 3]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1,
        42: 1,
        44: 1}],
 260: [[[[45, 1]], [[47, 2], [48, 3], [0, 1]], [[45, 3]], [[0, 3]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 261: [[[[49, 1]], [[26, 0], [37, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 26: 1, 30: 1, 37: 1}],
 262: [[[[21, 1]], [[45, 2]], [[46, 3], [0, 2]], [[45, 4]], [[0, 4]]],
       {21: 1}],
 263: [[[[19, 1], [8, 2], [9, 5], [30, 4], [14, 3], [15, 6], [22, 2]],
        [[19, 1], [0, 1]],
        [[0, 2]],
        [[50, 7], [51, 2]],
        [[52, 2], [53, 8], [54, 8]],
        [[55, 2], [56, 9]],
        [[57, 10]],
        [[51, 2]],
        [[52, 2]],
        [[55, 2]],
        [[15, 2]]],
       {8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 30: 1}],
 264: [[[[58, 1],
         [59, 1],
         [60, 1],
         [61, 1],
         [62, 1],
         [63, 1],
         [64, 1],
         [65, 1],
         [66, 1],
         [67, 1],
         [68, 1],
         [69, 1]],
        [[0, 1]]],
       {58: 1,
        59: 1,
        60: 1,
        61: 1,
        62: 1,
        63: 1,
        64: 1,
        65: 1,
        66: 1,
        67: 1,
        68: 1,
        69: 1}],
 265: [[[[33, 1]], [[0, 1]]], {33: 1}],
 266: [[[[10, 1]],
        [[22, 2]],
        [[70, 3], [30, 4]],
        [[71, 5]],
        [[52, 6], [72, 7]],
        [[0, 5]],
        [[70, 3]],
        [[52, 6]]],
       {10: 1}],
 267: [[[[29, 1]],
        [[73, 2]],
        [[74, 3]],
        [[75, 4]],
        [[76, 5], [0, 4]],
        [[0, 5]]],
       {29: 1}],
 268: [[[[32, 1]], [[77, 2]], [[76, 3], [0, 2]], [[0, 3]]], {32: 1}],
 269: [[[[78, 1], [48, 1]], [[0, 1]]], {29: 1, 32: 1}],
 270: [[[[79, 1],
         [80, 1],
         [7, 2],
         [81, 1],
         [79, 1],
         [74, 1],
         [82, 1],
         [83, 3],
         [84, 1],
         [85, 1]],
        [[0, 1]],
        [[74, 1]],
        [[7, 1], [0, 3]]],
       {7: 1, 74: 1, 79: 1, 80: 1, 81: 1, 82: 1, 83: 1, 84: 1, 85: 1}],
 271: [[[[86, 1]], [[87, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 26: 1, 30: 1, 37: 1}],
 272: [[[[88, 1],
         [89, 1],
         [90, 1],
         [91, 1],
         [92, 1],
         [93, 1],
         [94, 1],
         [95, 1]],
        [[0, 1]]],
       {4: 1, 10: 1, 16: 1, 18: 1, 29: 1, 32: 1, 35: 1, 36: 1}],
 273: [[[[34, 1]], [[0, 1]]], {34: 1}],
 274: [[[[13, 1]], [[0, 1]]], {13: 1}],
 275: [[[[96, 1]], [[94, 2], [91, 2]], [[0, 2]]], {35: 1}],
 276: [[[[35, 1]],
        [[97, 2]],
        [[2, 4], [30, 3]],
        [[52, 5], [98, 6]],
        [[0, 4]],
        [[2, 4]],
        [[52, 5]]],
       {35: 1}],
 277: [[[[99, 1]], [[99, 1], [0, 1]]], {35: 1}],
 278: [[[[23, 1]], [[73, 2]], [[0, 2]]], {23: 1}],
 279: [[[[45, 1]],
        [[70, 2], [48, 3], [46, 4], [0, 1]],
        [[45, 5]],
        [[0, 3]],
        [[45, 6], [0, 4]],
        [[48, 3], [46, 7], [0, 5]],
        [[46, 4], [0, 6]],
        [[45, 8], [0, 7]],
        [[70, 9]],
        [[45, 10]],
        [[46, 7], [0, 10]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 280: [[[[97, 1]], [[100, 2], [0, 1]], [[22, 3]], [[0, 3]]], {22: 1}],
 281: [[[[101, 1]], [[46, 0], [0, 1]]], {22: 1}],
 282: [[[[22, 1]], [[102, 0], [0, 1]]], {22: 1}],
 283: [[[[22, 1]], [[0, 1]]], {22: 1}],
 284: [[[[72, 1]], [[2, 1], [103, 2]], [[0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 285: [[[[104, 1]],
        [[45, 2], [0, 1]],
        [[100, 3], [46, 3], [0, 2]],
        [[45, 4]],
        [[0, 4]]],
       {104: 1}],
 286: [[[[17, 1]],
        [[86, 2]],
        [[74, 3], [0, 2]],
        [[45, 4]],
        [[46, 5], [0, 4]],
        [[45, 6]],
        [[0, 6]]],
       {17: 1}],
 287: [[[[105, 1]], [[106, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 26: 1, 30: 1, 37: 1}],
 288: [[[[72, 1]],
        [[107, 2], [47, 3], [0, 1]],
        [[72, 4], [53, 4]],
        [[72, 5], [53, 5]],
        [[0, 4]],
        [[47, 3], [0, 5]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 289: [[[[86, 1]], [[46, 2], [0, 1]], [[86, 1], [0, 2]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 26: 1, 30: 1, 37: 1}],
 290: [[[[37, 2], [26, 2], [6, 2], [108, 1]], [[0, 1]], [[109, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 26: 1, 30: 1, 37: 1}],
 291: [[[[2, 0], [103, 1], [110, 0]], [[0, 1]]],
       {2: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1,
        103: 1}],
 292: [[[[111, 1], [112, 1], [113, 1], [114, 1], [115, 1]], [[0, 1]]],
       {5: 1, 20: 1, 27: 1, 33: 1, 34: 1}],
 293: [[[[29, 1]],
        [[73, 2]],
        [[74, 3]],
        [[72, 4]],
        [[70, 5]],
        [[71, 6]],
        [[116, 7], [0, 6]],
        [[70, 8]],
        [[71, 9]],
        [[0, 9]]],
       {29: 1}],
 294: [[[[30, 1], [22, 2]], [[117, 3]], [[0, 2]], [[52, 2]]], {22: 1, 30: 1}],
 295: [[[[118, 1]], [[46, 2], [0, 1]], [[118, 1], [0, 2]]], {22: 1, 30: 1}],
 296: [[[[4, 1]], [[22, 2]], [[119, 3]], [[70, 4]], [[71, 5]], [[0, 5]]],
       {4: 1}],
 297: [[[[28, 1]], [[22, 2]], [[46, 1], [0, 2]]], {28: 1}],
 298: [[[[32, 1]],
        [[45, 2]],
        [[70, 3]],
        [[71, 4]],
        [[116, 5], [120, 1], [0, 4]],
        [[70, 6]],
        [[71, 7]],
        [[0, 7]]],
       {32: 1}],
 299: [[[[22, 1]], [[100, 2], [0, 1]], [[22, 3]], [[0, 3]]], {22: 1}],
 300: [[[[121, 1]], [[46, 2], [0, 1]], [[121, 1], [0, 2]]], {22: 1}],
 301: [[[[31, 1]],
        [[97, 2], [102, 3]],
        [[25, 4]],
        [[97, 2], [25, 4], [102, 3]],
        [[122, 5], [42, 5], [30, 6]],
        [[0, 5]],
        [[122, 7]],
        [[52, 5]]],
       {31: 1}],
 302: [[[[25, 1]], [[123, 2]], [[0, 2]]], {25: 1}],
 303: [[[[124, 1], [125, 1]], [[0, 1]]], {25: 1, 31: 1}],
 304: [[[[11, 1]], [[70, 2], [126, 3]], [[45, 4]], [[70, 2]], [[0, 4]]],
       {11: 1}],
 305: [[[[29, 1]],
        [[73, 2]],
        [[74, 3]],
        [[127, 4]],
        [[128, 5], [0, 4]],
        [[0, 5]]],
       {29: 1}],
 306: [[[[32, 1]], [[77, 2]], [[128, 3], [0, 2]], [[0, 3]]], {32: 1}],
 307: [[[[129, 1], [130, 1]], [[0, 1]]], {29: 1, 32: 1}],
 308: [[[[45, 1]],
        [[129, 2], [46, 3], [0, 1]],
        [[0, 2]],
        [[45, 4], [0, 3]],
        [[46, 3], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 309: [[[[7, 1], [131, 2]], [[40, 2]], [[0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 310: [[[[11, 1]], [[70, 2], [126, 3]], [[77, 4]], [[70, 2]], [[0, 4]]],
       {11: 1}],
 311: [[[[132, 1], [75, 1]], [[0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 312: [[[[133, 1]], [[134, 0], [0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 313: [[[[30, 1]], [[52, 2], [126, 3]], [[0, 2]], [[52, 2]]], {30: 1}],
 314: [[[[24, 1]], [[0, 1]]], {24: 1}],
 315: [[[[135, 1]], [[44, 2], [136, 1], [0, 1]], [[109, 3]], [[0, 3]]],
       {8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 30: 1}],
 316: [[[[12, 1]],
        [[45, 2], [137, 3], [0, 1]],
        [[46, 4], [0, 2]],
        [[45, 5]],
        [[45, 2], [0, 4]],
        [[46, 6], [0, 5]],
        [[45, 7]],
        [[46, 8], [0, 7]],
        [[45, 7], [0, 8]]],
       {12: 1}],
 317: [[[[5, 1]],
        [[45, 2], [0, 1]],
        [[46, 3], [0, 2]],
        [[45, 4]],
        [[46, 5], [0, 4]],
        [[45, 6]],
        [[0, 6]]],
       {5: 1}],
 318: [[[[20, 1]], [[72, 2], [0, 1]], [[0, 2]]], {20: 1}],
 319: [[[[138, 1]], [[139, 0], [137, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 26: 1, 30: 1, 37: 1}],
 320: [[[[140, 1]], [[2, 2], [141, 3]], [[0, 2]], [[140, 1], [2, 2]]],
       {5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        17: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        30: 1,
        31: 1,
        33: 1,
        34: 1,
        37: 1}],
 321: [[[[70, 1]], [[45, 2], [0, 1]], [[0, 2]]], {70: 1}],
 322: [[[[142, 1],
         [143, 1],
         [144, 1],
         [145, 1],
         [146, 1],
         [147, 1],
         [148, 1],
         [149, 1],
         [150, 1],
         [151, 1]],
        [[0, 1]]],
       {5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        17: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        30: 1,
        31: 1,
        33: 1,
        34: 1,
        37: 1}],
 323: [[[[1, 1], [3, 1]], [[0, 1]]],
       {4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1}],
 324: [[[[45, 1], [70, 2], [102, 3]],
        [[70, 2], [0, 1]],
        [[45, 4], [152, 5], [0, 2]],
        [[102, 6]],
        [[152, 5], [0, 4]],
        [[0, 5]],
        [[102, 5]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1,
        70: 1,
        102: 1}],
 325: [[[[153, 1]], [[46, 2], [0, 1]], [[153, 1], [0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1,
        70: 1,
        102: 1}],
 326: [[[[1, 1], [2, 2]],
        [[0, 1]],
        [[154, 3]],
        [[110, 4]],
        [[155, 1], [110, 4]]],
       {2: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        17: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        30: 1,
        31: 1,
        33: 1,
        34: 1,
        37: 1}],
 327: [[[[109, 1]], [[156, 0], [42, 0], [157, 0], [158, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 26: 1, 30: 1, 37: 1}],
 328: [[[[75, 1], [159, 2]],
        [[32, 3], [0, 1]],
        [[0, 2]],
        [[75, 4]],
        [[116, 5]],
        [[45, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 329: [[[[45, 1]], [[46, 2], [0, 1]], [[45, 1], [0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 330: [[[[45, 1]], [[46, 0], [0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 331: [[[[45, 1]],
        [[48, 2], [46, 3], [0, 1]],
        [[0, 2]],
        [[45, 4], [0, 3]],
        [[46, 3], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 332: [[[[77, 1]],
        [[46, 2], [0, 1]],
        [[77, 3]],
        [[46, 4], [0, 3]],
        [[77, 3], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 333: [[[[30, 1], [102, 2], [14, 3]],
        [[52, 4], [98, 5]],
        [[22, 4]],
        [[160, 6]],
        [[0, 4]],
        [[52, 4]],
        [[51, 4]]],
       {14: 1, 30: 1, 102: 1}],
 334: [[[[16, 1]],
        [[70, 2]],
        [[71, 3]],
        [[161, 4], [162, 5]],
        [[70, 6]],
        [[70, 7]],
        [[71, 8]],
        [[71, 9]],
        [[161, 4], [116, 10], [162, 5], [0, 8]],
        [[0, 9]],
        [[70, 11]],
        [[71, 12]],
        [[162, 5], [0, 12]]],
       {16: 1}],
 335: [[[[42, 1], [118, 2], [44, 3]],
        [[22, 4]],
        [[47, 5], [46, 6], [0, 2]],
        [[22, 7]],
        [[46, 8], [0, 4]],
        [[45, 9]],
        [[42, 1], [118, 2], [44, 3], [0, 6]],
        [[0, 7]],
        [[44, 3]],
        [[46, 6], [0, 9]]],
       {22: 1, 30: 1, 42: 1, 44: 1}],
 336: [[[[18, 1]],
        [[45, 2]],
        [[70, 3]],
        [[71, 4]],
        [[116, 5], [0, 4]],
        [[70, 6]],
        [[71, 7]],
        [[0, 7]]],
       {18: 1}],
 337: [[[[45, 1]], [[100, 2], [0, 1]], [[86, 3]], [[0, 3]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        15: 1,
        19: 1,
        22: 1,
        26: 1,
        30: 1,
        37: 1}],
 338: [[[[36, 1]], [[163, 2]], [[70, 3], [46, 1]], [[71, 4]], [[0, 4]]],
       {36: 1}],
 339: [[[[164, 1]], [[165, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 15: 1, 19: 1, 22: 1, 26: 1, 30: 1, 37: 1}],
 340: [[[[27, 1]], [[72, 2], [0, 1]], [[0, 2]]], {27: 1}],
 341: [[[[53, 1]], [[0, 1]]], {27: 1}]},
states:
[[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
 [[[38, 1]], [[39, 0], [0, 1]]],
 [[[40, 1]], [[41, 0], [0, 1]]],
 [[[42, 1], [43, 2], [44, 3]],
  [[45, 4]],
  [[46, 5], [0, 2]],
  [[45, 6]],
  [[46, 7], [0, 4]],
  [[42, 1], [43, 2], [44, 3], [0, 5]],
  [[0, 6]],
  [[43, 4], [44, 3]]],
 [[[45, 1]], [[47, 2], [48, 3], [0, 1]], [[45, 3]], [[0, 3]]],
 [[[49, 1]], [[26, 0], [37, 0], [0, 1]]],
 [[[21, 1]], [[45, 2]], [[46, 3], [0, 2]], [[45, 4]], [[0, 4]]],
 [[[19, 1], [8, 2], [9, 5], [30, 4], [14, 3], [15, 6], [22, 2]],
  [[19, 1], [0, 1]],
  [[0, 2]],
  [[50, 7], [51, 2]],
  [[52, 2], [53, 8], [54, 8]],
  [[55, 2], [56, 9]],
  [[57, 10]],
  [[51, 2]],
  [[52, 2]],
  [[55, 2]],
  [[15, 2]]],
 [[[58, 1],
   [59, 1],
   [60, 1],
   [61, 1],
   [62, 1],
   [63, 1],
   [64, 1],
   [65, 1],
   [66, 1],
   [67, 1],
   [68, 1],
   [69, 1]],
  [[0, 1]]],
 [[[33, 1]], [[0, 1]]],
 [[[10, 1]],
  [[22, 2]],
  [[70, 3], [30, 4]],
  [[71, 5]],
  [[52, 6], [72, 7]],
  [[0, 5]],
  [[70, 3]],
  [[52, 6]]],
 [[[29, 1]], [[73, 2]], [[74, 3]], [[75, 4]], [[76, 5], [0, 4]], [[0, 5]]],
 [[[32, 1]], [[77, 2]], [[76, 3], [0, 2]], [[0, 3]]],
 [[[78, 1], [48, 1]], [[0, 1]]],
 [[[79, 1],
   [80, 1],
   [7, 2],
   [81, 1],
   [79, 1],
   [74, 1],
   [82, 1],
   [83, 3],
   [84, 1],
   [85, 1]],
  [[0, 1]],
  [[74, 1]],
  [[7, 1], [0, 3]]],
 [[[86, 1]], [[87, 0], [0, 1]]],
 [[[88, 1], [89, 1], [90, 1], [91, 1], [92, 1], [93, 1], [94, 1], [95, 1]],
  [[0, 1]]],
 [[[34, 1]], [[0, 1]]],
 [[[13, 1]], [[0, 1]]],
 [[[96, 1]], [[94, 2], [91, 2]], [[0, 2]]],
 [[[35, 1]],
  [[97, 2]],
  [[2, 4], [30, 3]],
  [[52, 5], [98, 6]],
  [[0, 4]],
  [[2, 4]],
  [[52, 5]]],
 [[[99, 1]], [[99, 1], [0, 1]]],
 [[[23, 1]], [[73, 2]], [[0, 2]]],
 [[[45, 1]],
  [[70, 2], [48, 3], [46, 4], [0, 1]],
  [[45, 5]],
  [[0, 3]],
  [[45, 6], [0, 4]],
  [[48, 3], [46, 7], [0, 5]],
  [[46, 4], [0, 6]],
  [[45, 8], [0, 7]],
  [[70, 9]],
  [[45, 10]],
  [[46, 7], [0, 10]]],
 [[[97, 1]], [[100, 2], [0, 1]], [[22, 3]], [[0, 3]]],
 [[[101, 1]], [[46, 0], [0, 1]]],
 [[[22, 1]], [[102, 0], [0, 1]]],
 [[[22, 1]], [[0, 1]]],
 [[[72, 1]], [[2, 1], [103, 2]], [[0, 2]]],
 [[[104, 1]],
  [[45, 2], [0, 1]],
  [[100, 3], [46, 3], [0, 2]],
  [[45, 4]],
  [[0, 4]]],
 [[[17, 1]],
  [[86, 2]],
  [[74, 3], [0, 2]],
  [[45, 4]],
  [[46, 5], [0, 4]],
  [[45, 6]],
  [[0, 6]]],
 [[[105, 1]], [[106, 0], [0, 1]]],
 [[[72, 1]],
  [[107, 2], [47, 3], [0, 1]],
  [[72, 4], [53, 4]],
  [[72, 5], [53, 5]],
  [[0, 4]],
  [[47, 3], [0, 5]]],
 [[[86, 1]], [[46, 2], [0, 1]], [[86, 1], [0, 2]]],
 [[[37, 2], [26, 2], [6, 2], [108, 1]], [[0, 1]], [[109, 1]]],
 [[[2, 0], [103, 1], [110, 0]], [[0, 1]]],
 [[[111, 1], [112, 1], [113, 1], [114, 1], [115, 1]], [[0, 1]]],
 [[[29, 1]],
  [[73, 2]],
  [[74, 3]],
  [[72, 4]],
  [[70, 5]],
  [[71, 6]],
  [[116, 7], [0, 6]],
  [[70, 8]],
  [[71, 9]],
  [[0, 9]]],
 [[[30, 1], [22, 2]], [[117, 3]], [[0, 2]], [[52, 2]]],
 [[[118, 1]], [[46, 2], [0, 1]], [[118, 1], [0, 2]]],
 [[[4, 1]], [[22, 2]], [[119, 3]], [[70, 4]], [[71, 5]], [[0, 5]]],
 [[[28, 1]], [[22, 2]], [[46, 1], [0, 2]]],
 [[[32, 1]],
  [[45, 2]],
  [[70, 3]],
  [[71, 4]],
  [[116, 5], [120, 1], [0, 4]],
  [[70, 6]],
  [[71, 7]],
  [[0, 7]]],
 [[[22, 1]], [[100, 2], [0, 1]], [[22, 3]], [[0, 3]]],
 [[[121, 1]], [[46, 2], [0, 1]], [[121, 1], [0, 2]]],
 [[[31, 1]],
  [[97, 2], [102, 3]],
  [[25, 4]],
  [[97, 2], [25, 4], [102, 3]],
  [[122, 5], [42, 5], [30, 6]],
  [[0, 5]],
  [[122, 7]],
  [[52, 5]]],
 [[[25, 1]], [[123, 2]], [[0, 2]]],
 [[[124, 1], [125, 1]], [[0, 1]]],
 [[[11, 1]], [[70, 2], [126, 3]], [[45, 4]], [[70, 2]], [[0, 4]]],
 [[[29, 1]], [[73, 2]], [[74, 3]], [[127, 4]], [[128, 5], [0, 4]], [[0, 5]]],
 [[[32, 1]], [[77, 2]], [[128, 3], [0, 2]], [[0, 3]]],
 [[[129, 1], [130, 1]], [[0, 1]]],
 [[[45, 1]],
  [[129, 2], [46, 3], [0, 1]],
  [[0, 2]],
  [[45, 4], [0, 3]],
  [[46, 3], [0, 4]]],
 [[[7, 1], [131, 2]], [[40, 2]], [[0, 2]]],
 [[[11, 1]], [[70, 2], [126, 3]], [[77, 4]], [[70, 2]], [[0, 4]]],
 [[[132, 1], [75, 1]], [[0, 1]]],
 [[[133, 1]], [[134, 0], [0, 1]]],
 [[[30, 1]], [[52, 2], [126, 3]], [[0, 2]], [[52, 2]]],
 [[[24, 1]], [[0, 1]]],
 [[[135, 1]], [[44, 2], [136, 1], [0, 1]], [[109, 3]], [[0, 3]]],
 [[[12, 1]],
  [[45, 2], [137, 3], [0, 1]],
  [[46, 4], [0, 2]],
  [[45, 5]],
  [[45, 2], [0, 4]],
  [[46, 6], [0, 5]],
  [[45, 7]],
  [[46, 8], [0, 7]],
  [[45, 7], [0, 8]]],
 [[[5, 1]],
  [[45, 2], [0, 1]],
  [[46, 3], [0, 2]],
  [[45, 4]],
  [[46, 5], [0, 4]],
  [[45, 6]],
  [[0, 6]]],
 [[[20, 1]], [[72, 2], [0, 1]], [[0, 2]]],
 [[[138, 1]], [[139, 0], [137, 0], [0, 1]]],
 [[[140, 1]], [[2, 2], [141, 3]], [[0, 2]], [[140, 1], [2, 2]]],
 [[[70, 1]], [[45, 2], [0, 1]], [[0, 2]]],
 [[[142, 1],
   [143, 1],
   [144, 1],
   [145, 1],
   [146, 1],
   [147, 1],
   [148, 1],
   [149, 1],
   [150, 1],
   [151, 1]],
  [[0, 1]]],
 [[[1, 1], [3, 1]], [[0, 1]]],
 [[[45, 1], [70, 2], [102, 3]],
  [[70, 2], [0, 1]],
  [[45, 4], [152, 5], [0, 2]],
  [[102, 6]],
  [[152, 5], [0, 4]],
  [[0, 5]],
  [[102, 5]]],
 [[[153, 1]], [[46, 2], [0, 1]], [[153, 1], [0, 2]]],
 [[[1, 1], [2, 2]], [[0, 1]], [[154, 3]], [[110, 4]], [[155, 1], [110, 4]]],
 [[[109, 1]], [[156, 0], [42, 0], [157, 0], [158, 0], [0, 1]]],
 [[[75, 1], [159, 2]],
  [[32, 3], [0, 1]],
  [[0, 2]],
  [[75, 4]],
  [[116, 5]],
  [[45, 2]]],
 [[[45, 1]], [[46, 2], [0, 1]], [[45, 1], [0, 2]]],
 [[[45, 1]], [[46, 0], [0, 1]]],
 [[[45, 1]],
  [[48, 2], [46, 3], [0, 1]],
  [[0, 2]],
  [[45, 4], [0, 3]],
  [[46, 3], [0, 4]]],
 [[[77, 1]],
  [[46, 2], [0, 1]],
  [[77, 3]],
  [[46, 4], [0, 3]],
  [[77, 3], [0, 4]]],
 [[[30, 1], [102, 2], [14, 3]],
  [[52, 4], [98, 5]],
  [[22, 4]],
  [[160, 6]],
  [[0, 4]],
  [[52, 4]],
  [[51, 4]]],
 [[[16, 1]],
  [[70, 2]],
  [[71, 3]],
  [[161, 4], [162, 5]],
  [[70, 6]],
  [[70, 7]],
  [[71, 8]],
  [[71, 9]],
  [[161, 4], [116, 10], [162, 5], [0, 8]],
  [[0, 9]],
  [[70, 11]],
  [[71, 12]],
  [[162, 5], [0, 12]]],
 [[[42, 1], [118, 2], [44, 3]],
  [[22, 4]],
  [[47, 5], [46, 6], [0, 2]],
  [[22, 7]],
  [[46, 8], [0, 4]],
  [[45, 9]],
  [[42, 1], [118, 2], [44, 3], [0, 6]],
  [[0, 7]],
  [[44, 3]],
  [[46, 6], [0, 9]]],
 [[[18, 1]],
  [[45, 2]],
  [[70, 3]],
  [[71, 4]],
  [[116, 5], [0, 4]],
  [[70, 6]],
  [[71, 7]],
  [[0, 7]]],
 [[[45, 1]], [[100, 2], [0, 1]], [[86, 3]], [[0, 3]]],
 [[[36, 1]], [[163, 2]], [[70, 3], [46, 1]], [[71, 4]], [[0, 4]]],
 [[[164, 1]], [[165, 0], [0, 1]]],
 [[[27, 1]], [[72, 2], [0, 1]], [[0, 2]]],
 [[[53, 1]], [[0, 1]]]],
labels:
[[0, 'EMPTY'],
 [320, null],
 [4, null],
 [272, null],
 [1, 'def'],
 [1, 'raise'],
 [32, null],
 [1, 'not'],
 [2, null],
 [26, null],
 [1, 'class'],
 [1, 'lambda'],
 [1, 'print'],
 [1, 'debugger'],
 [9, null],
 [25, null],
 [1, 'try'],
 [1, 'exec'],
 [1, 'while'],
 [3, null],
 [1, 'return'],
 [1, 'assert'],
 [1, null],
 [1, 'del'],
 [1, 'pass'],
 [1, 'import'],
 [15, null],
 [1, 'yield'],
 [1, 'global'],
 [1, 'for'],
 [7, null],
 [1, 'from'],
 [1, 'if'],
 [1, 'break'],
 [1, 'continue'],
 [50, null],
 [1, 'with'],
 [14, null],
 [319, null],
 [19, null],
 [309, null],
 [1, 'and'],
 [16, null],
 [260, null],
 [36, null],
 [328, null],
 [12, null],
 [22, null],
 [267, null],
 [327, null],
 [308, null],
 [10, null],
 [8, null],
 [340, null],
 [331, null],
 [27, null],
 [279, null],
 [330, null],
 [46, null],
 [39, null],
 [41, null],
 [47, null],
 [42, null],
 [43, null],
 [37, null],
 [44, null],
 [49, null],
 [45, null],
 [38, null],
 [40, null],
 [11, null],
 [326, null],
 [329, null],
 [289, null],
 [1, 'in'],
 [312, null],
 [269, null],
 [311, null],
 [268, null],
 [29, null],
 [21, null],
 [28, null],
 [30, null],
 [1, 'is'],
 [31, null],
 [20, null],
 [287, null],
 [270, null],
 [334, null],
 [298, null],
 [293, null],
 [266, null],
 [338, null],
 [336, null],
 [296, null],
 [275, null],
 [277, null],
 [282, null],
 [259, null],
 [276, null],
 [1, 'as'],
 [280, null],
 [23, null],
 [0, null],
 [1, 'except'],
 [339, null],
 [18, null],
 [264, null],
 [315, null],
 [290, null],
 [323, null],
 [265, null],
 [273, null],
 [317, null],
 [318, null],
 [341, null],
 [1, 'else'],
 [295, null],
 [294, null],
 [313, null],
 [1, 'elif'],
 [299, null],
 [300, null],
 [281, null],
 [302, null],
 [301, null],
 [335, null],
 [332, null],
 [307, null],
 [305, null],
 [306, null],
 [271, null],
 [310, null],
 [258, null],
 [1, 'or'],
 [263, null],
 [333, null],
 [35, null],
 [261, null],
 [34, null],
 [322, null],
 [13, null],
 [292, null],
 [278, null],
 [288, null],
 [314, null],
 [316, null],
 [262, null],
 [286, null],
 [297, null],
 [303, null],
 [274, null],
 [321, null],
 [324, null],
 [5, null],
 [6, null],
 [48, null],
 [17, null],
 [24, null],
 [304, null],
 [325, null],
 [285, null],
 [1, 'finally'],
 [337, null],
 [257, null],
 [33, null]],
keywords:
{'and': 41,
 'as': 100,
 'assert': 21,
 'break': 33,
 'class': 10,
 'continue': 34,
 'debugger': 13,
 'def': 4,
 'del': 23,
 'elif': 120,
 'else': 116,
 'except': 104,
 'exec': 17,
 'finally': 162,
 'for': 29,
 'from': 31,
 'global': 28,
 'if': 32,
 'import': 25,
 'in': 74,
 'is': 83,
 'lambda': 11,
 'not': 7,
 'or': 134,
 'pass': 24,
 'print': 12,
 'raise': 5,
 'return': 20,
 'try': 16,
 'while': 18,
 'with': 36,
 'yield': 27},
tokens:
{0: 103,
 1: 22,
 2: 8,
 3: 19,
 4: 2,
 5: 154,
 6: 155,
 7: 30,
 8: 52,
 9: 14,
 10: 51,
 11: 70,
 12: 46,
 13: 141,
 14: 37,
 15: 26,
 16: 42,
 17: 157,
 18: 106,
 19: 39,
 20: 85,
 21: 80,
 22: 47,
 23: 102,
 24: 158,
 25: 15,
 26: 9,
 27: 55,
 28: 81,
 29: 79,
 30: 82,
 31: 84,
 32: 6,
 33: 165,
 34: 139,
 35: 137,
 36: 44,
 37: 64,
 38: 68,
 39: 59,
 40: 69,
 41: 60,
 42: 62,
 43: 63,
 44: 65,
 45: 67,
 46: 58,
 47: 61,
 48: 156,
 49: 66,
 50: 35},
start: 256
};



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/parser.js ---- */ 

// low level parser to a concrete syntax tree, derived from cpython's lib2to3

/**
 *
 * @constructor
 * @param {Object} grammar
 *
 * p = new Parser(grammar);
 * p.setup([start]);
 * foreach input token:
 *     if p.addtoken(...):
 *         break
 * root = p.rootnode
 *
 * can throw SyntaxError
 */
function Parser (filename, grammar) {
    this.filename = filename;
    this.grammar = grammar;
    this.p_flags = 0;
    return this;
}

// all possible parser flags
Parser.FUTURE_PRINT_FUNCTION = "print_function";
Parser.FUTURE_UNICODE_LITERALS = "unicode_literals";
Parser.FUTURE_DIVISION = "division";
Parser.FUTURE_ABSOLUTE_IMPORT = "absolute_import";
Parser.FUTURE_WITH_STATEMENT = "with_statement";
Parser.FUTURE_NESTED_SCOPES = "nested_scopes";
Parser.FUTURE_GENERATORS = "generators";
Parser.CO_FUTURE_PRINT_FUNCTION = 0x10000;
Parser.CO_FUTURE_UNICODE_LITERALS = 0x20000;
Parser.CO_FUTURE_DIVISON = 0x2000;
Parser.CO_FUTURE_ABSOLUTE_IMPORT = 0x4000;
Parser.CO_FUTURE_WITH_STATEMENT = 0x8000;

Parser.prototype.setup = function (start) {
    var stackentry;
    var newnode;
    start = start || this.grammar.start;
    //print("START:"+start);

    newnode =
    {
        type    : start,
        value   : null,
        context : null,
        children: []
    };
    stackentry =
    {
        dfa  : this.grammar.dfas[start],
        state: 0,
        node : newnode
    };
    this.stack = [stackentry];
    this.used_names = {};
};

function findInDfa (a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i][0] === obj[0] && a[i][1] === obj[1]) {
            return true;
        }
    }
    return false;
}


// Add a token; return true if we're done
Parser.prototype.addtoken = function (type, value, context) {
    var errline;
    var itsfirst;
    var itsdfa;
    var state;
    var v;
    var t;
    var newstate;
    var i;
    var a;
    var arcs;
    var first;
    var states;
    var tp;
    var ilabel = this.classify(type, value, context);
    //print("ilabel:"+ilabel);

    OUTERWHILE:
    while (true) {
        tp = this.stack[this.stack.length - 1];
        states = tp.dfa[0];
        first = tp.dfa[1];
        arcs = states[tp.state];

        // look for a state with this label
        for (a = 0; a < arcs.length; ++a) {
            i = arcs[a][0];
            newstate = arcs[a][1];
            t = this.grammar.labels[i][0];
            v = this.grammar.labels[i][1];
            if (ilabel === i) {
                // look it up in the list of labels
                goog.asserts.assert(t < 256);
                // shift a token; we're done with it
                this.shift(type, value, newstate, context);
                // pop while we are in an accept-only state
                state = newstate;
                //print("before:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                /* jshint ignore:start */
                while (states[state].length === 1
                    && states[state][0][0] === 0
                    && states[state][0][1] === state) {
                    // states[state] == [(0, state)])
                    this.pop();
                    //print("in after pop:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                    if (this.stack.length === 0) {
                        // done!
                        return true;
                    }
                    tp = this.stack[this.stack.length - 1];
                    state = tp.state;
                    states = tp.dfa[0];
                    first = tp.dfa[1];
                    //print(JSON.stringify(states), JSON.stringify(first));
                    //print("bottom:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                }
                /* jshint ignore:end */
                // done with this token
                //print("DONE, return false");
                return false;
            } else if (t >= 256) {
                itsdfa = this.grammar.dfas[t];
                itsfirst = itsdfa[1];
                if (itsfirst.hasOwnProperty(ilabel)) {
                    // push a symbol
                    this.push(t, this.grammar.dfas[t], newstate, context);
                    continue OUTERWHILE;
                }
            }
        }

        //print("findInDfa: " + JSON.stringify(arcs)+" vs. " + tp.state);
        if (findInDfa(arcs, [0, tp.state])) {
            // an accepting state, pop it and try somethign else
            //print("WAA");
            this.pop();
            if (this.stack.length === 0) {
                throw new Sk.builtin.SyntaxError("too much input", this.filename);
            }
        } else {
            // no transition
            errline = context[0][0];
            throw new Sk.builtin.SyntaxError("bad input", this.filename, errline, context);
        }
    }
};

// turn a token into a label
Parser.prototype.classify = function (type, value, context) {
    var ilabel;
    if (type === Sk.Tokenizer.Tokens.T_NAME) {
        this.used_names[value] = true;
        ilabel = this.grammar.keywords.hasOwnProperty(value) && this.grammar.keywords[value];

        /* Check for handling print as an builtin function */
        if(value === "print" && (this.p_flags & Parser.CO_FUTURE_PRINT_FUNCTION || Sk.python3 === true)) {
            ilabel = false; // ilabel determines if the value is a keyword
        }

        if (ilabel) {
            //print("is keyword");
            return ilabel;
        }
    }
    ilabel = this.grammar.tokens.hasOwnProperty(type) && this.grammar.tokens[type];
    if (!ilabel) {
        // throw new Sk.builtin.SyntaxError("bad token", type, value, context);
        // Questionable modification to put line number in position 2
        // like everywhere else and filename in position 1.
        throw new Sk.builtin.SyntaxError("bad token", this.filename, context[0][0], context);
    }
    return ilabel;
};

// shift a token
Parser.prototype.shift = function (type, value, newstate, context) {
    var dfa = this.stack[this.stack.length - 1].dfa;
    var state = this.stack[this.stack.length - 1].state;
    var node = this.stack[this.stack.length - 1].node;
    //print("context", context);
    var newnode = {
        type      : type,
        value     : value,
        lineno    : context[0][0],         // throwing away end here to match cpython
        col_offset: context[0][1],
        children  : null
    };
    if (newnode) {
        node.children.push(newnode);
    }
    this.stack[this.stack.length - 1] = {
        dfa  : dfa,
        state: newstate,
        node : node
    };
};

// push a nonterminal
Parser.prototype.push = function (type, newdfa, newstate, context) {
    var dfa = this.stack[this.stack.length - 1].dfa;
    var node = this.stack[this.stack.length - 1].node;
    var newnode = {
        type      : type,
        value     : null,
        lineno    : context[0][0],      // throwing away end here to match cpython
        col_offset: context[0][1],
        children  : []
    };
    this.stack[this.stack.length - 1] = {
        dfa  : dfa,
        state: newstate,
        node : node
    };
    this.stack.push({
        dfa  : newdfa,
        state: 0,
        node : newnode
    });
};

//var ac = 0;
//var bc = 0;

// pop a nonterminal
Parser.prototype.pop = function () {
    var node;
    var pop = this.stack.pop();
    var newnode = pop.node;
    //print("POP");
    if (newnode) {
        //print("A", ac++, newnode.type);
        //print("stacklen:"+this.stack.length);
        if (this.stack.length !== 0) {
            //print("B", bc++);
            node = this.stack[this.stack.length - 1].node;
            node.children.push(newnode);
        } else {
            //print("C");
            this.rootnode = newnode;
            this.rootnode.used_names = this.used_names;
        }
    }
};

/**
 * parser for interactive input. returns a function that should be called with
 * lines of input as they are entered. the function will return false
 * until the input is complete, when it will return the rootnode of the parse.
 *
 * @param {string} filename
 * @param {string=} style root of parse tree (optional)
 */
function makeParser (filename, style) {
    var tokenizer;
    var T_OP;
    var T_NL;
    var T_COMMENT;
    var prefix;
    var column;
    var lineno;
    var p;
    if (style === undefined) {
        style = "file_input";
    }
    p = new Parser(filename, Sk.ParseTables);
    // for closure's benefit
    if (style === "file_input") {
        p.setup(Sk.ParseTables.sym.file_input);
    } else {
        goog.asserts.fail("todo;");
    }
    lineno = 1;
    column = 0;
    prefix = "";
    T_COMMENT = Sk.Tokenizer.Tokens.T_COMMENT;
    T_NL = Sk.Tokenizer.Tokens.T_NL;
    T_OP = Sk.Tokenizer.Tokens.T_OP;
    tokenizer = new Sk.Tokenizer(filename, style === "single_input", function (type, value, start, end, line) {
        var s_lineno = start[0];
        var s_column = start[1];
        /*
         if (s_lineno !== lineno && s_column !== column)
         {
         // todo; update prefix and line/col
         }
         */
        if (type === T_COMMENT || type === T_NL) {
            prefix += value;
            lineno = end[0];
            column = end[1];
            if (value[value.length - 1] === "\n") {
                lineno += 1;
                column = 0;
            }
            //print("  not calling addtoken");
            return undefined;
        }
        if (type === T_OP) {
            type = Sk.OpMap[value];
        }
        if (p.addtoken(type, value, [start, end, line])) {
            return true;
        }
    });

    // create parser function
    var parseFunc = function (line) {
        var ret = tokenizer.generateTokens(line);
        //print("tok:"+ret);
        if (ret) {
            if (ret !== "done") {
                throw new Sk.builtin.SyntaxError("incomplete input", this.filename);
            }
            return p.rootnode;
        }
        return false;
    };

    // set flags, and return
    parseFunc.p_flags = p.p_flags;
    return parseFunc;
}

Sk.parse = function parse (filename, input) {
    var i;
    var ret;
    var lines;
    var parseFunc = makeParser(filename);
    if (input.substr(input.length - 1, 1) !== "\n") {
        input += "\n";
    }
    //print("input:"+input);
    lines = input.split("\n");
    for (i = 0; i < lines.length; ++i) {
        ret = parseFunc(lines[i] + ((i === lines.length - 1) ? "" : "\n"));
    }

    /*
     * Small adjustments here in order to return th flags and the cst
     */
    return {"cst": ret, "flags": parseFunc.p_flags};
};

Sk.parseTreeDump = function parseTreeDump (n, indent) {
    //return JSON.stringify(n, null, 2);
    var i;
    var ret;
    indent = indent || "";
    ret = "";
    ret += indent;
    if (n.type >= 256) { // non-term
        ret += Sk.ParseTables.number2symbol[n.type] + "\n";
        for (i = 0; i < n.children.length; ++i) {
            ret += Sk.parseTreeDump(n.children[i], indent + "  ");
        }
    } else {
        ret += Sk.Tokenizer.tokenNames[n.type] + ": " + new Sk.builtin.str(n.value)["$r"]().v + "\n";
    }
    return ret;
};


goog.exportSymbol("Sk.parse", Sk.parse);
goog.exportSymbol("Sk.parseTreeDump", Sk.parseTreeDump);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/gen/astnodes.js ---- */ 

/* File automatically generated by ./asdl_js.py. */

/* ----- expr_context ----- */
/** @constructor */
function Load() {}
/** @constructor */
function Store() {}
/** @constructor */
function Del() {}
/** @constructor */
function AugLoad() {}
/** @constructor */
function AugStore() {}
/** @constructor */
function Param() {}

/* ----- boolop ----- */
/** @constructor */
function And() {}
/** @constructor */
function Or() {}

/* ----- operator ----- */
/** @constructor */
function Add() {}
/** @constructor */
function Sub() {}
/** @constructor */
function Mult() {}
/** @constructor */
function Div() {}
/** @constructor */
function Mod() {}
/** @constructor */
function Pow() {}
/** @constructor */
function LShift() {}
/** @constructor */
function RShift() {}
/** @constructor */
function BitOr() {}
/** @constructor */
function BitXor() {}
/** @constructor */
function BitAnd() {}
/** @constructor */
function FloorDiv() {}

/* ----- unaryop ----- */
/** @constructor */
function Invert() {}
/** @constructor */
function Not() {}
/** @constructor */
function UAdd() {}
/** @constructor */
function USub() {}

/* ----- cmpop ----- */
/** @constructor */
function Eq() {}
/** @constructor */
function NotEq() {}
/** @constructor */
function Lt() {}
/** @constructor */
function LtE() {}
/** @constructor */
function Gt() {}
/** @constructor */
function GtE() {}
/** @constructor */
function Is() {}
/** @constructor */
function IsNot() {}
/** @constructor */
function In_() {}
/** @constructor */
function NotIn() {}







/* ---------------------- */
/* constructors for nodes */
/* ---------------------- */





/** @constructor */
function Module(/* {asdl_seq *} */ body)
{
    this.body = body;
    return this;
}

/** @constructor */
function Interactive(/* {asdl_seq *} */ body)
{
    this.body = body;
    return this;
}

/** @constructor */
function Expression(/* {expr_ty} */ body)
{
    goog.asserts.assert(body !== null && body !== undefined);
    this.body = body;
    return this;
}

/** @constructor */
function Suite(/* {asdl_seq *} */ body)
{
    this.body = body;
    return this;
}

/** @constructor */
function FunctionDef(/* {identifier} */ name, /* {arguments__ty} */ args, /*
                          {asdl_seq *} */ body, /* {asdl_seq *} */
                          decorator_list, /* {int} */ lineno, /* {int} */
                          col_offset)
{
    goog.asserts.assert(name !== null && name !== undefined);
    goog.asserts.assert(args !== null && args !== undefined);
    this.name = name;
    this.args = args;
    this.body = body;
    this.decorator_list = decorator_list;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function ClassDef(/* {identifier} */ name, /* {asdl_seq *} */ bases, /*
                       {asdl_seq *} */ body, /* {asdl_seq *} */ decorator_list,
                       /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(name !== null && name !== undefined);
    this.name = name;
    this.bases = bases;
    this.body = body;
    this.decorator_list = decorator_list;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Return_(/* {expr_ty} */ value, /* {int} */ lineno, /* {int} */
                      col_offset)
{
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Delete_(/* {asdl_seq *} */ targets, /* {int} */ lineno, /* {int} */
                      col_offset)
{
    this.targets = targets;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Assign(/* {asdl_seq *} */ targets, /* {expr_ty} */ value, /* {int} */
                     lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(value !== null && value !== undefined);
    this.targets = targets;
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function AugAssign(/* {expr_ty} */ target, /* {operator_ty} */ op, /* {expr_ty}
                        */ value, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(target !== null && target !== undefined);
    goog.asserts.assert(op !== null && op !== undefined);
    goog.asserts.assert(value !== null && value !== undefined);
    this.target = target;
    this.op = op;
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Print(/* {expr_ty} */ dest, /* {asdl_seq *} */ values, /* {bool} */
                    nl, /* {int} */ lineno, /* {int} */ col_offset)
{
    this.dest = dest;
    this.values = values;
    this.nl = nl;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function For_(/* {expr_ty} */ target, /* {expr_ty} */ iter, /* {asdl_seq *} */
                   body, /* {asdl_seq *} */ orelse, /* {int} */ lineno, /*
                   {int} */ col_offset)
{
    goog.asserts.assert(target !== null && target !== undefined);
    goog.asserts.assert(iter !== null && iter !== undefined);
    this.target = target;
    this.iter = iter;
    this.body = body;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function While_(/* {expr_ty} */ test, /* {asdl_seq *} */ body, /* {asdl_seq *}
                     */ orelse, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(test !== null && test !== undefined);
    this.test = test;
    this.body = body;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function If_(/* {expr_ty} */ test, /* {asdl_seq *} */ body, /* {asdl_seq *} */
                  orelse, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(test !== null && test !== undefined);
    this.test = test;
    this.body = body;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function With_(/* {expr_ty} */ context_expr, /* {expr_ty} */ optional_vars, /*
                    {asdl_seq *} */ body, /* {int} */ lineno, /* {int} */
                    col_offset)
{
    goog.asserts.assert(context_expr !== null && context_expr !== undefined);
    this.context_expr = context_expr;
    this.optional_vars = optional_vars;
    this.body = body;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Raise(/* {expr_ty} */ type, /* {expr_ty} */ inst, /* {expr_ty} */
                    tback, /* {int} */ lineno, /* {int} */ col_offset)
{
    this.type = type;
    this.inst = inst;
    this.tback = tback;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function TryExcept(/* {asdl_seq *} */ body, /* {asdl_seq *} */ handlers, /*
                        {asdl_seq *} */ orelse, /* {int} */ lineno, /* {int} */
                        col_offset)
{
    this.body = body;
    this.handlers = handlers;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function TryFinally(/* {asdl_seq *} */ body, /* {asdl_seq *} */ finalbody, /*
                         {int} */ lineno, /* {int} */ col_offset)
{
    this.body = body;
    this.finalbody = finalbody;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Assert(/* {expr_ty} */ test, /* {expr_ty} */ msg, /* {int} */ lineno,
                     /* {int} */ col_offset)
{
    goog.asserts.assert(test !== null && test !== undefined);
    this.test = test;
    this.msg = msg;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Import_(/* {asdl_seq *} */ names, /* {int} */ lineno, /* {int} */
                      col_offset)
{
    this.names = names;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function ImportFrom(/* {identifier} */ module, /* {asdl_seq *} */ names, /*
                         {int} */ level, /* {int} */ lineno, /* {int} */
                         col_offset)
{
    goog.asserts.assert(module !== null && module !== undefined);
    this.module = module;
    this.names = names;
    this.level = level;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Exec(/* {expr_ty} */ body, /* {expr_ty} */ globals, /* {expr_ty} */
                   locals, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(body !== null && body !== undefined);
    this.body = body;
    this.globals = globals;
    this.locals = locals;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Global(/* {asdl_seq *} */ names, /* {int} */ lineno, /* {int} */
                     col_offset)
{
    this.names = names;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Expr(/* {expr_ty} */ value, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(value !== null && value !== undefined);
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Pass(/* {int} */ lineno, /* {int} */ col_offset)
{
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Break_(/* {int} */ lineno, /* {int} */ col_offset)
{
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Continue_(/* {int} */ lineno, /* {int} */ col_offset)
{
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Debugger_(/* {int} */ lineno, /* {int} */ col_offset)
{
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function BoolOp(/* {boolop_ty} */ op, /* {asdl_seq *} */ values, /* {int} */
                     lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(op !== null && op !== undefined);
    this.op = op;
    this.values = values;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function BinOp(/* {expr_ty} */ left, /* {operator_ty} */ op, /* {expr_ty} */
                    right, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(left !== null && left !== undefined);
    goog.asserts.assert(op !== null && op !== undefined);
    goog.asserts.assert(right !== null && right !== undefined);
    this.left = left;
    this.op = op;
    this.right = right;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function UnaryOp(/* {unaryop_ty} */ op, /* {expr_ty} */ operand, /* {int} */
                      lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(op !== null && op !== undefined);
    goog.asserts.assert(operand !== null && operand !== undefined);
    this.op = op;
    this.operand = operand;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Lambda(/* {arguments__ty} */ args, /* {expr_ty} */ body, /* {int} */
                     lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(args !== null && args !== undefined);
    goog.asserts.assert(body !== null && body !== undefined);
    this.args = args;
    this.body = body;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function IfExp(/* {expr_ty} */ test, /* {expr_ty} */ body, /* {expr_ty} */
                    orelse, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(test !== null && test !== undefined);
    goog.asserts.assert(body !== null && body !== undefined);
    goog.asserts.assert(orelse !== null && orelse !== undefined);
    this.test = test;
    this.body = body;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Dict(/* {asdl_seq *} */ keys, /* {asdl_seq *} */ values, /* {int} */
                   lineno, /* {int} */ col_offset)
{
    this.keys = keys;
    this.values = values;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Set(/* {asdl_seq *} */ elts, /* {int} */ lineno, /* {int} */
                  col_offset)
{
    this.elts = elts;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function ListComp(/* {expr_ty} */ elt, /* {asdl_seq *} */ generators, /* {int}
                       */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(elt !== null && elt !== undefined);
    this.elt = elt;
    this.generators = generators;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function SetComp(/* {expr_ty} */ elt, /* {asdl_seq *} */ generators, /* {int}
                      */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(elt !== null && elt !== undefined);
    this.elt = elt;
    this.generators = generators;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function DictComp(/* {expr_ty} */ key, /* {expr_ty} */ value, /* {asdl_seq *}
                       */ generators, /* {int} */ lineno, /* {int} */
                       col_offset)
{
    goog.asserts.assert(key !== null && key !== undefined);
    goog.asserts.assert(value !== null && value !== undefined);
    this.key = key;
    this.value = value;
    this.generators = generators;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function GeneratorExp(/* {expr_ty} */ elt, /* {asdl_seq *} */ generators, /*
                           {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(elt !== null && elt !== undefined);
    this.elt = elt;
    this.generators = generators;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Yield(/* {expr_ty} */ value, /* {int} */ lineno, /* {int} */
                    col_offset)
{
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Compare(/* {expr_ty} */ left, /* {asdl_int_seq *} */ ops, /* {asdl_seq
                      *} */ comparators, /* {int} */ lineno, /* {int} */
                      col_offset)
{
    goog.asserts.assert(left !== null && left !== undefined);
    this.left = left;
    this.ops = ops;
    this.comparators = comparators;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Call(/* {expr_ty} */ func, /* {asdl_seq *} */ args, /* {asdl_seq *} */
                   keywords, /* {expr_ty} */ starargs, /* {expr_ty} */ kwargs,
                   /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(func !== null && func !== undefined);
    this.func = func;
    this.args = args;
    this.keywords = keywords;
    this.starargs = starargs;
    this.kwargs = kwargs;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Repr(/* {expr_ty} */ value, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(value !== null && value !== undefined);
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Num(/* {object} */ n, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(n !== null && n !== undefined);
    this.n = n;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Str(/* {string} */ s, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(s !== null && s !== undefined);
    this.s = s;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Attribute(/* {expr_ty} */ value, /* {identifier} */ attr, /*
                        {expr_context_ty} */ ctx, /* {int} */ lineno, /* {int}
                        */ col_offset)
{
    goog.asserts.assert(value !== null && value !== undefined);
    goog.asserts.assert(attr !== null && attr !== undefined);
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.value = value;
    this.attr = attr;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Subscript(/* {expr_ty} */ value, /* {slice_ty} */ slice, /*
                        {expr_context_ty} */ ctx, /* {int} */ lineno, /* {int}
                        */ col_offset)
{
    goog.asserts.assert(value !== null && value !== undefined);
    goog.asserts.assert(slice !== null && slice !== undefined);
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.value = value;
    this.slice = slice;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Name(/* {identifier} */ id, /* {expr_context_ty} */ ctx, /* {int} */
                   lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(id !== null && id !== undefined);
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.id = id;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function List(/* {asdl_seq *} */ elts, /* {expr_context_ty} */ ctx, /* {int} */
                   lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.elts = elts;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Tuple(/* {asdl_seq *} */ elts, /* {expr_context_ty} */ ctx, /* {int}
                    */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.elts = elts;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Ellipsis()
{
    return this;
}

/** @constructor */
function Slice(/* {expr_ty} */ lower, /* {expr_ty} */ upper, /* {expr_ty} */
                    step)
{
    this.lower = lower;
    this.upper = upper;
    this.step = step;
    return this;
}

/** @constructor */
function ExtSlice(/* {asdl_seq *} */ dims)
{
    this.dims = dims;
    return this;
}

/** @constructor */
function Index(/* {expr_ty} */ value)
{
    goog.asserts.assert(value !== null && value !== undefined);
    this.value = value;
    return this;
}

/** @constructor */
function comprehension(/* {expr_ty} */ target, /* {expr_ty} */ iter, /*
                            {asdl_seq *} */ ifs)
{
    goog.asserts.assert(target !== null && target !== undefined);
    goog.asserts.assert(iter !== null && iter !== undefined);
    this.target = target;
    this.iter = iter;
    this.ifs = ifs;
    return this;
}

/** @constructor */
function ExceptHandler(/* {expr_ty} */ type, /* {expr_ty} */ name, /* {asdl_seq
                            *} */ body, /* {int} */ lineno, /* {int} */
                            col_offset)
{
    this.type = type;
    this.name = name;
    this.body = body;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function arguments_(/* {asdl_seq *} */ args, /* {identifier} */ vararg, /*
                         {identifier} */ kwarg, /* {asdl_seq *} */ defaults)
{
    this.args = args;
    this.vararg = vararg;
    this.kwarg = kwarg;
    this.defaults = defaults;
    return this;
}

/** @constructor */
function keyword(/* {identifier} */ arg, /* {expr_ty} */ value)
{
    goog.asserts.assert(arg !== null && arg !== undefined);
    goog.asserts.assert(value !== null && value !== undefined);
    this.arg = arg;
    this.value = value;
    return this;
}

/** @constructor */
function alias(/* {identifier} */ name, /* {identifier} */ asname)
{
    goog.asserts.assert(name !== null && name !== undefined);
    this.name = name;
    this.asname = asname;
    return this;
}


Module.prototype._astname = "Module";
Module.prototype._fields = [
    "body", function(n) { return n.body; }
];
Interactive.prototype._astname = "Interactive";
Interactive.prototype._fields = [
    "body", function(n) { return n.body; }
];
Expression.prototype._astname = "Expression";
Expression.prototype._fields = [
    "body", function(n) { return n.body; }
];
Suite.prototype._astname = "Suite";
Suite.prototype._fields = [
    "body", function(n) { return n.body; }
];
FunctionDef.prototype._astname = "FunctionDef";
FunctionDef.prototype._fields = [
    "name", function(n) { return n.name; },
    "args", function(n) { return n.args; },
    "body", function(n) { return n.body; },
    "decorator_list", function(n) { return n.decorator_list; }
];
ClassDef.prototype._astname = "ClassDef";
ClassDef.prototype._fields = [
    "name", function(n) { return n.name; },
    "bases", function(n) { return n.bases; },
    "body", function(n) { return n.body; },
    "decorator_list", function(n) { return n.decorator_list; }
];
Return_.prototype._astname = "Return";
Return_.prototype._fields = [
    "value", function(n) { return n.value; }
];
Delete_.prototype._astname = "Delete";
Delete_.prototype._fields = [
    "targets", function(n) { return n.targets; }
];
Assign.prototype._astname = "Assign";
Assign.prototype._fields = [
    "targets", function(n) { return n.targets; },
    "value", function(n) { return n.value; }
];
AugAssign.prototype._astname = "AugAssign";
AugAssign.prototype._fields = [
    "target", function(n) { return n.target; },
    "op", function(n) { return n.op; },
    "value", function(n) { return n.value; }
];
Print.prototype._astname = "Print";
Print.prototype._fields = [
    "dest", function(n) { return n.dest; },
    "values", function(n) { return n.values; },
    "nl", function(n) { return n.nl; }
];
For_.prototype._astname = "For";
For_.prototype._fields = [
    "target", function(n) { return n.target; },
    "iter", function(n) { return n.iter; },
    "body", function(n) { return n.body; },
    "orelse", function(n) { return n.orelse; }
];
While_.prototype._astname = "While";
While_.prototype._fields = [
    "test", function(n) { return n.test; },
    "body", function(n) { return n.body; },
    "orelse", function(n) { return n.orelse; }
];
If_.prototype._astname = "If";
If_.prototype._fields = [
    "test", function(n) { return n.test; },
    "body", function(n) { return n.body; },
    "orelse", function(n) { return n.orelse; }
];
With_.prototype._astname = "With";
With_.prototype._fields = [
    "context_expr", function(n) { return n.context_expr; },
    "optional_vars", function(n) { return n.optional_vars; },
    "body", function(n) { return n.body; }
];
Raise.prototype._astname = "Raise";
Raise.prototype._fields = [
    "type", function(n) { return n.type; },
    "inst", function(n) { return n.inst; },
    "tback", function(n) { return n.tback; }
];
TryExcept.prototype._astname = "TryExcept";
TryExcept.prototype._fields = [
    "body", function(n) { return n.body; },
    "handlers", function(n) { return n.handlers; },
    "orelse", function(n) { return n.orelse; }
];
TryFinally.prototype._astname = "TryFinally";
TryFinally.prototype._fields = [
    "body", function(n) { return n.body; },
    "finalbody", function(n) { return n.finalbody; }
];
Assert.prototype._astname = "Assert";
Assert.prototype._fields = [
    "test", function(n) { return n.test; },
    "msg", function(n) { return n.msg; }
];
Import_.prototype._astname = "Import";
Import_.prototype._fields = [
    "names", function(n) { return n.names; }
];
ImportFrom.prototype._astname = "ImportFrom";
ImportFrom.prototype._fields = [
    "module", function(n) { return n.module; },
    "names", function(n) { return n.names; },
    "level", function(n) { return n.level; }
];
Exec.prototype._astname = "Exec";
Exec.prototype._fields = [
    "body", function(n) { return n.body; },
    "globals", function(n) { return n.globals; },
    "locals", function(n) { return n.locals; }
];
Global.prototype._astname = "Global";
Global.prototype._fields = [
    "names", function(n) { return n.names; }
];
Expr.prototype._astname = "Expr";
Expr.prototype._fields = [
    "value", function(n) { return n.value; }
];
Pass.prototype._astname = "Pass";
Pass.prototype._fields = [
];
Break_.prototype._astname = "Break";
Break_.prototype._fields = [
];
Continue_.prototype._astname = "Continue";
Continue_.prototype._fields = [
];
Debugger_.prototype._astname = "Debugger";
Debugger_.prototype._fields = [
];
BoolOp.prototype._astname = "BoolOp";
BoolOp.prototype._fields = [
    "op", function(n) { return n.op; },
    "values", function(n) { return n.values; }
];
BinOp.prototype._astname = "BinOp";
BinOp.prototype._fields = [
    "left", function(n) { return n.left; },
    "op", function(n) { return n.op; },
    "right", function(n) { return n.right; }
];
UnaryOp.prototype._astname = "UnaryOp";
UnaryOp.prototype._fields = [
    "op", function(n) { return n.op; },
    "operand", function(n) { return n.operand; }
];
Lambda.prototype._astname = "Lambda";
Lambda.prototype._fields = [
    "args", function(n) { return n.args; },
    "body", function(n) { return n.body; }
];
IfExp.prototype._astname = "IfExp";
IfExp.prototype._fields = [
    "test", function(n) { return n.test; },
    "body", function(n) { return n.body; },
    "orelse", function(n) { return n.orelse; }
];
Dict.prototype._astname = "Dict";
Dict.prototype._fields = [
    "keys", function(n) { return n.keys; },
    "values", function(n) { return n.values; }
];
Set.prototype._astname = "Set";
Set.prototype._fields = [
    "elts", function(n) { return n.elts; }
];
ListComp.prototype._astname = "ListComp";
ListComp.prototype._fields = [
    "elt", function(n) { return n.elt; },
    "generators", function(n) { return n.generators; }
];
SetComp.prototype._astname = "SetComp";
SetComp.prototype._fields = [
    "elt", function(n) { return n.elt; },
    "generators", function(n) { return n.generators; }
];
DictComp.prototype._astname = "DictComp";
DictComp.prototype._fields = [
    "key", function(n) { return n.key; },
    "value", function(n) { return n.value; },
    "generators", function(n) { return n.generators; }
];
GeneratorExp.prototype._astname = "GeneratorExp";
GeneratorExp.prototype._fields = [
    "elt", function(n) { return n.elt; },
    "generators", function(n) { return n.generators; }
];
Yield.prototype._astname = "Yield";
Yield.prototype._fields = [
    "value", function(n) { return n.value; }
];
Compare.prototype._astname = "Compare";
Compare.prototype._fields = [
    "left", function(n) { return n.left; },
    "ops", function(n) { return n.ops; },
    "comparators", function(n) { return n.comparators; }
];
Call.prototype._astname = "Call";
Call.prototype._fields = [
    "func", function(n) { return n.func; },
    "args", function(n) { return n.args; },
    "keywords", function(n) { return n.keywords; },
    "starargs", function(n) { return n.starargs; },
    "kwargs", function(n) { return n.kwargs; }
];
Repr.prototype._astname = "Repr";
Repr.prototype._fields = [
    "value", function(n) { return n.value; }
];
Num.prototype._astname = "Num";
Num.prototype._fields = [
    "n", function(n) { return n.n; }
];
Str.prototype._astname = "Str";
Str.prototype._fields = [
    "s", function(n) { return n.s; }
];
Attribute.prototype._astname = "Attribute";
Attribute.prototype._fields = [
    "value", function(n) { return n.value; },
    "attr", function(n) { return n.attr; },
    "ctx", function(n) { return n.ctx; }
];
Subscript.prototype._astname = "Subscript";
Subscript.prototype._fields = [
    "value", function(n) { return n.value; },
    "slice", function(n) { return n.slice; },
    "ctx", function(n) { return n.ctx; }
];
Name.prototype._astname = "Name";
Name.prototype._fields = [
    "id", function(n) { return n.id; },
    "ctx", function(n) { return n.ctx; }
];
List.prototype._astname = "List";
List.prototype._fields = [
    "elts", function(n) { return n.elts; },
    "ctx", function(n) { return n.ctx; }
];
Tuple.prototype._astname = "Tuple";
Tuple.prototype._fields = [
    "elts", function(n) { return n.elts; },
    "ctx", function(n) { return n.ctx; }
];
Load.prototype._astname = "Load";
Load.prototype._isenum = true;
Store.prototype._astname = "Store";
Store.prototype._isenum = true;
Del.prototype._astname = "Del";
Del.prototype._isenum = true;
AugLoad.prototype._astname = "AugLoad";
AugLoad.prototype._isenum = true;
AugStore.prototype._astname = "AugStore";
AugStore.prototype._isenum = true;
Param.prototype._astname = "Param";
Param.prototype._isenum = true;
Ellipsis.prototype._astname = "Ellipsis";
Ellipsis.prototype._fields = [
];
Slice.prototype._astname = "Slice";
Slice.prototype._fields = [
    "lower", function(n) { return n.lower; },
    "upper", function(n) { return n.upper; },
    "step", function(n) { return n.step; }
];
ExtSlice.prototype._astname = "ExtSlice";
ExtSlice.prototype._fields = [
    "dims", function(n) { return n.dims; }
];
Index.prototype._astname = "Index";
Index.prototype._fields = [
    "value", function(n) { return n.value; }
];
And.prototype._astname = "And";
And.prototype._isenum = true;
Or.prototype._astname = "Or";
Or.prototype._isenum = true;
Add.prototype._astname = "Add";
Add.prototype._isenum = true;
Sub.prototype._astname = "Sub";
Sub.prototype._isenum = true;
Mult.prototype._astname = "Mult";
Mult.prototype._isenum = true;
Div.prototype._astname = "Div";
Div.prototype._isenum = true;
Mod.prototype._astname = "Mod";
Mod.prototype._isenum = true;
Pow.prototype._astname = "Pow";
Pow.prototype._isenum = true;
LShift.prototype._astname = "LShift";
LShift.prototype._isenum = true;
RShift.prototype._astname = "RShift";
RShift.prototype._isenum = true;
BitOr.prototype._astname = "BitOr";
BitOr.prototype._isenum = true;
BitXor.prototype._astname = "BitXor";
BitXor.prototype._isenum = true;
BitAnd.prototype._astname = "BitAnd";
BitAnd.prototype._isenum = true;
FloorDiv.prototype._astname = "FloorDiv";
FloorDiv.prototype._isenum = true;
Invert.prototype._astname = "Invert";
Invert.prototype._isenum = true;
Not.prototype._astname = "Not";
Not.prototype._isenum = true;
UAdd.prototype._astname = "UAdd";
UAdd.prototype._isenum = true;
USub.prototype._astname = "USub";
USub.prototype._isenum = true;
Eq.prototype._astname = "Eq";
Eq.prototype._isenum = true;
NotEq.prototype._astname = "NotEq";
NotEq.prototype._isenum = true;
Lt.prototype._astname = "Lt";
Lt.prototype._isenum = true;
LtE.prototype._astname = "LtE";
LtE.prototype._isenum = true;
Gt.prototype._astname = "Gt";
Gt.prototype._isenum = true;
GtE.prototype._astname = "GtE";
GtE.prototype._isenum = true;
Is.prototype._astname = "Is";
Is.prototype._isenum = true;
IsNot.prototype._astname = "IsNot";
IsNot.prototype._isenum = true;
In_.prototype._astname = "In";
In_.prototype._isenum = true;
NotIn.prototype._astname = "NotIn";
NotIn.prototype._isenum = true;
comprehension.prototype._astname = "comprehension";
comprehension.prototype._fields = [
    "target", function(n) { return n.target; },
    "iter", function(n) { return n.iter; },
    "ifs", function(n) { return n.ifs; }
];
ExceptHandler.prototype._astname = "ExceptHandler";
ExceptHandler.prototype._fields = [
    "type", function(n) { return n.type; },
    "name", function(n) { return n.name; },
    "body", function(n) { return n.body; }
];
arguments_.prototype._astname = "arguments";
arguments_.prototype._fields = [
    "args", function(n) { return n.args; },
    "vararg", function(n) { return n.vararg; },
    "kwarg", function(n) { return n.kwarg; },
    "defaults", function(n) { return n.defaults; }
];
keyword.prototype._astname = "keyword";
keyword.prototype._fields = [
    "arg", function(n) { return n.arg; },
    "value", function(n) { return n.value; }
];
alias.prototype._astname = "alias";
alias.prototype._fields = [
    "name", function(n) { return n.name; },
    "asname", function(n) { return n.asname; }
];




/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/ast.js ---- */ 

//
// This is pretty much a straight port of ast.c from CPython 2.6.5.
//
// The previous version was easier to work with and more JS-ish, but having a
// somewhat different ast structure than cpython makes testing more difficult.
//
// This way, we can use a dump from the ast module on any arbitrary python
// code and know that we're the same up to ast level, at least.
//

var SYM = Sk.ParseTables.sym;
var TOK = Sk.Tokenizer.Tokens;
var COMP_GENEXP = 0;
var COMP_SETCOMP = 1;

/** @constructor */
function Compiling (encoding, filename, c_flags) {
    this.c_encoding = encoding;
    this.c_filename = filename;
    this.c_flags = c_flags || 0;
}

/**
 * @return {number}
 */
function NCH (n) {
    goog.asserts.assert(n !== undefined);
    if (n.children === null) {
        return 0;
    }
    return n.children.length;
}

function CHILD (n, i) {
    goog.asserts.assert(n !== undefined);
    goog.asserts.assert(i !== undefined);
    return n.children[i];
}

function REQ (n, type) {
    goog.asserts.assert(n.type === type, "node wasn't expected type");
}

function strobj (s) {
    goog.asserts.assert(typeof s === "string", "expecting string, got " + (typeof s));
    return new Sk.builtin.str(s);
}

/** @return {number} */
function numStmts (n) {
    var ch;
    var i;
    var cnt;
    switch (n.type) {
        case SYM.single_input:
            if (CHILD(n, 0).type === TOK.T_NEWLINE) {
                return 0;
            }
            else {
                return numStmts(CHILD(n, 0));
            }
        case SYM.file_input:
            cnt = 0;
            for (i = 0; i < NCH(n); ++i) {
                ch = CHILD(n, i);
                if (ch.type === SYM.stmt) {
                    cnt += numStmts(ch);
                }
            }
            return cnt;
        case SYM.stmt:
            return numStmts(CHILD(n, 0));
        case SYM.compound_stmt:
            return 1;
        case SYM.simple_stmt:
            return Math.floor(NCH(n) / 2); // div 2 is to remove count of ;s
        case SYM.suite:
            if (NCH(n) === 1) {
                return numStmts(CHILD(n, 0));
            }
            else {
                cnt = 0;
                for (i = 2; i < NCH(n) - 1; ++i) {
                    cnt += numStmts(CHILD(n, i));
                }
                return cnt;
            }
            break;
        default:
            goog.asserts.fail("Non-statement found");
    }
    return 0;
}

function forbiddenCheck (c, n, x, lineno) {
    if (x === "None") {
        throw new Sk.builtin.SyntaxError("assignment to None", c.c_filename, lineno);
    }
    if (x === "True" || x === "False") {
        throw new Sk.builtin.SyntaxError("assignment to True or False is forbidden", c.c_filename, lineno);
    }
}

/**
 * Set the context ctx for e, recursively traversing e.
 *
 * Only sets context for expr kinds that can appear in assignment context as
 * per the asdl file.
 */
function setContext (c, e, ctx, n) {
    var i;
    var exprName;
    var s;
    goog.asserts.assert(ctx !== AugStore && ctx !== AugLoad);
    s = null;
    exprName = null;

    switch (e.constructor) {
        case Attribute:
        case Name:
            if (ctx === Store) {
                forbiddenCheck(c, n, e.attr, n.lineno);
            }
            e.ctx = ctx;
            break;
        case Subscript:
            e.ctx = ctx;
            break;
        case List:
            e.ctx = ctx;
            s = e.elts;
            break;
        case Tuple:
            if (e.elts.length === 0) {
                throw new Sk.builtin.SyntaxError("can't assign to ()", c.c_filename, n.lineno);
            }
            e.ctx = ctx;
            s = e.elts;
            break;
        case Lambda:
            exprName = "lambda";
            break;
        case Call:
            exprName = "function call";
            break;
        case BoolOp:
        case BinOp:
        case UnaryOp:
            exprName = "operator";
            break;
        case GeneratorExp:
            exprName = "generator expression";
            break;
        case Yield:
            exprName = "yield expression";
            break;
        case ListComp:
            exprName = "list comprehension";
            break;
        case SetComp:
            exprName = "set comprehension";
            break;
        case DictComp:
            exprName = "dict comprehension";
            break;
        case Dict:
        case Set:
        case Num:
        case Str:
            exprName = "literal";
            break;
        case Compare:
            exprName = "comparison";
            break;
        case Repr:
            exprName = "repr";
            break;
        case IfExp:
            exprName = "conditional expression";
            break;
        default:
            goog.asserts.fail("unhandled expression in assignment");
    }
    if (exprName) {
        throw new Sk.builtin.SyntaxError("can't " + (ctx === Store ? "assign to" : "delete") + " " + exprName, c.c_filename, n.lineno);
    }

    if (s) {
        for (i = 0; i < s.length; ++i) {
            setContext(c, s[i], ctx, n);
        }
    }
}

var operatorMap = {};
(function () {
    operatorMap[TOK.T_VBAR] = BitOr;
    operatorMap[TOK.T_CIRCUMFLEX] = BitXor;
    operatorMap[TOK.T_AMPER] = BitAnd;
    operatorMap[TOK.T_LEFTSHIFT] = LShift;
    operatorMap[TOK.T_RIGHTSHIFT] = RShift;
    operatorMap[TOK.T_PLUS] = Add;
    operatorMap[TOK.T_MINUS] = Sub;
    operatorMap[TOK.T_STAR] = Mult;
    operatorMap[TOK.T_SLASH] = Div;
    operatorMap[TOK.T_DOUBLESLASH] = FloorDiv;
    operatorMap[TOK.T_PERCENT] = Mod;
}());

function getOperator (n) {
    goog.asserts.assert(operatorMap[n.type] !== undefined);
    return operatorMap[n.type];
}

function astForCompOp (c, n) {
    /* comp_op: '<'|'>'|'=='|'>='|'<='|'<>'|'!='|'in'|'not' 'in'|'is'
     |'is' 'not'
     */
    REQ(n, SYM.comp_op);
    if (NCH(n) === 1) {
        n = CHILD(n, 0);
        switch (n.type) {
            case TOK.T_LESS:
                return Lt;
            case TOK.T_GREATER:
                return Gt;
            case TOK.T_EQEQUAL:
                return Eq;
            case TOK.T_LESSEQUAL:
                return LtE;
            case TOK.T_GREATEREQUAL:
                return GtE;
            case TOK.T_NOTEQUAL:
                return NotEq;
            case TOK.T_NAME:
                if (n.value === "in") {
                    return In_;
                }
                if (n.value === "is") {
                    return Is;
                }
        }
    }
    else if (NCH(n) === 2) {
        if (CHILD(n, 0).type === TOK.T_NAME) {
            if (CHILD(n, 1).value === "in") {
                return NotIn;
            }
            if (CHILD(n, 0).value === "is") {
                return IsNot;
            }
        }
    }
    goog.asserts.fail("invalid comp_op");
}

function seqForTestlist (c, n) {
    /* testlist: test (',' test)* [','] */
    var i;
    var seq = [];
    goog.asserts.assert(n.type === SYM.testlist ||
        n.type === SYM.listmaker ||
        n.type === SYM.testlist_comp ||
        n.type === SYM.testlist_safe ||
        n.type === SYM.testlist1);
    for (i = 0; i < NCH(n); i += 2) {
        goog.asserts.assert(CHILD(n, i).type === SYM.test || CHILD(n, i).type === SYM.old_test);
        seq[i / 2] = astForExpr(c, CHILD(n, i));
    }
    return seq;
}

function astForSuite (c, n) {
    /* suite: simple_stmt | NEWLINE INDENT stmt+ DEDENT */
    var j;
    var num;
    var i;
    var end;
    var ch;
    var pos;
    var seq;
    REQ(n, SYM.suite);
    seq = [];
    pos = 0;
    if (CHILD(n, 0).type === SYM.simple_stmt) {
        n = CHILD(n, 0);
        /* simple_stmt always ends with an NEWLINE and may have a trailing
         * SEMI. */
        end = NCH(n) - 1;
        if (CHILD(n, end - 1).type === TOK.T_SEMI) {
            end -= 1;
        }
        for (i = 0; i < end; i += 2) // by 2 to skip ;
        {
            seq[pos++] = astForStmt(c, CHILD(n, i));
        }
    }
    else {
        for (i = 2; i < NCH(n) - 1; ++i) {
            ch = CHILD(n, i);
            REQ(ch, SYM.stmt);
            num = numStmts(ch);
            if (num === 1) {
                // small_stmt or compound_stmt w/ only 1 child
                seq[pos++] = astForStmt(c, ch);
            }
            else {
                ch = CHILD(ch, 0);
                REQ(ch, SYM.simple_stmt);
                for (j = 0; j < NCH(ch); j += 2) {
                    if (NCH(CHILD(ch, j)) === 0) {
                        goog.asserts.assert(j + 1 === NCH(ch));
                        break;
                    }
                    seq[pos++] = astForStmt(c, CHILD(ch, j));
                }
            }
        }
    }
    goog.asserts.assert(pos === numStmts(n));
    return seq;
}

function astForExceptClause (c, exc, body) {
    /* except_clause: 'except' [test [(',' | 'as') test]] */
    var e;
    REQ(exc, SYM.except_clause);
    REQ(body, SYM.suite);
    if (NCH(exc) === 1) {
        return new ExceptHandler(null, null, astForSuite(c, body), exc.lineno, exc.col_offset);
    }
    else if (NCH(exc) === 2) {
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.lineno, exc.col_offset);
    }
    else if (NCH(exc) === 4) {
        e = astForExpr(c, CHILD(exc, 3));
        setContext(c, e, Store, CHILD(exc, 3));
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.lineno, exc.col_offset);
    }
    goog.asserts.fail("wrong number of children for except clause");
}

function astForTryStmt (c, n) {
    var exceptSt;
    var i;
    var handlers;
    var nc = NCH(n);
    var nexcept = (nc - 3) / 3;
    var body, orelse = [],
        finally_ = null;

    REQ(n, SYM.try_stmt);
    body = astForSuite(c, CHILD(n, 2));
    if (CHILD(n, nc - 3).type === TOK.T_NAME) {
        if (CHILD(n, nc - 3).value === "finally") {
            if (nc >= 9 && CHILD(n, nc - 6).type === TOK.T_NAME) {
                /* we can assume it's an "else",
                 because nc >= 9 for try-else-finally and
                 it would otherwise have a type of except_clause */
                orelse = astForSuite(c, CHILD(n, nc - 4));
                nexcept--;
            }

            finally_ = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
        else {
            /* we can assume it's an "else",
             otherwise it would have a type of except_clause */
            orelse = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
    }
    else if (CHILD(n, nc - 3).type !== SYM.except_clause) {
        throw new Sk.builtin.SyntaxError("malformed 'try' statement", c.c_filename, n.lineno);
    }

    if (nexcept > 0) {
        handlers = [];
        for (i = 0; i < nexcept; ++i) {
            handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
        }
        exceptSt = new TryExcept(body, handlers, orelse, n.lineno, n.col_offset);

        if (!finally_) {
            return exceptSt;
        }

        /* if a 'finally' is present too, we nest the TryExcept within a
         TryFinally to emulate try ... except ... finally */
        body = [exceptSt];
    }

    goog.asserts.assert(finally_ !== null);
    return new TryFinally(body, finally_, n.lineno, n.col_offset);
}


function astForDottedName (c, n) {
    var i;
    var e;
    var id;
    var col_offset;
    var lineno;
    REQ(n, SYM.dotted_name);
    lineno = n.lineno;
    col_offset = n.col_offset;
    id = strobj(CHILD(n, 0).value);
    e = new Name(id, Load, lineno, col_offset);
    for (i = 2; i < NCH(n); i += 2) {
        id = strobj(CHILD(n, i).value);
        e = new Attribute(e, id, Load, lineno, col_offset);
    }
    return e;
}

function astForDecorator (c, n) {
    /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
    var nameExpr;
    REQ(n, SYM.decorator);
    REQ(CHILD(n, 0), TOK.T_AT);
    REQ(CHILD(n, NCH(n) - 1), TOK.T_NEWLINE);
    nameExpr = astForDottedName(c, CHILD(n, 1));
    if (NCH(n) === 3) // no args
    {
        return nameExpr;
    }
    else if (NCH(n) === 5) // call with no args
    {
        return new Call(nameExpr, [], [], null, null, n.lineno, n.col_offset);
    }
    else {
        return astForCall(c, CHILD(n, 3), nameExpr);
    }
}

function astForDecorators (c, n) {
    var i;
    var decoratorSeq;
    REQ(n, SYM.decorators);
    decoratorSeq = [];
    for (i = 0; i < NCH(n); ++i) {
        decoratorSeq[i] = astForDecorator(c, CHILD(n, i));
    }
    return decoratorSeq;
}

function astForDecorated (c, n) {
    var thing;
    var decoratorSeq;
    REQ(n, SYM.decorated);
    decoratorSeq = astForDecorators(c, CHILD(n, 0));
    goog.asserts.assert(CHILD(n, 1).type === SYM.funcdef || CHILD(n, 1).type === SYM.classdef);

    thing = null;
    if (CHILD(n, 1).type === SYM.funcdef) {
        thing = astForFuncdef(c, CHILD(n, 1), decoratorSeq);
    }
    else if (CHILD(n, 1) === SYM.classdef) {
        thing = astForClassdef(c, CHILD(n, 1), decoratorSeq);
    }
    if (thing) {
        thing.lineno = n.lineno;
        thing.col_offset = n.col_offset;
    }
    return thing;
}

//note: with statements need to be updated to 2.7
//see: ast.c lines: 3127 -> 3185

function astForWithVar (c, n) {
    REQ(n, SYM.with_item);
    return astForExpr(c, CHILD(n, 1));
}

function astForWithStmt (c, n) {
    /* with_stmt: 'with' test [ with_var ] ':' suite */
    var optionalVars;
    var contextExpr;
    var suiteIndex = 3; // skip with, test, :
    goog.asserts.assert(n.type === SYM.with_stmt);
    contextExpr = astForExpr(c, CHILD(n, 1));
    if (CHILD(n, 2).type === SYM.with_item) {
        optionalVars = astForWithVar(c, CHILD(n, 2));
        setContext(c, optionalVars, Store, n);
        suiteIndex = 4;
    }
    return new With_(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.lineno, n.col_offset);
}

function astForExecStmt (c, n) {
    var expr1, globals = null, locals = null;
    var nchildren = NCH(n);
    goog.asserts.assert(nchildren === 2 || nchildren === 4 || nchildren === 6);

    /* exec_stmt: 'exec' expr ['in' test [',' test]] */
    REQ(n, SYM.exec_stmt);
    expr1 = astForExpr(c, CHILD(n, 1));
    if (nchildren >= 4) {
        globals = astForExpr(c, CHILD(n, 3));
    }
    if (nchildren === 6) {
        locals = astForExpr(c, CHILD(n, 5));
    }
    return new Exec(expr1, globals, locals, n.lineno, n.col_offset);
}

function astForIfStmt (c, n) {
    /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
     ['else' ':' suite]
     */
    var off;
    var i;
    var orelse;
    var hasElse;
    var nElif;
    var decider;
    var s;
    REQ(n, SYM.if_stmt);
    if (NCH(n) === 4) {
        return new If_(
            astForExpr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            [], n.lineno, n.col_offset);
    }

    s = CHILD(n, 4).value;
    decider = s.charAt(2); // elSe or elIf
    if (decider === "s") {
        return new If_(
            astForExpr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            astForSuite(c, CHILD(n, 6)),
            n.lineno, n.col_offset);
    }
    else if (decider === "i") {
        nElif = NCH(n) - 4;
        hasElse = false;
        orelse = [];

        /* must reference the child nElif+1 since 'else' token is third, not
         * fourth child from the end. */
        if (CHILD(n, nElif + 1).type === TOK.T_NAME &&
            CHILD(n, nElif + 1).value.charAt(2) === "s") {
            hasElse = true;
            nElif -= 3;
        }
        nElif /= 4;

        if (hasElse) {
            orelse = [
                new If_(
                    astForExpr(c, CHILD(n, NCH(n) - 6)),
                    astForSuite(c, CHILD(n, NCH(n) - 4)),
                    astForSuite(c, CHILD(n, NCH(n) - 1)),
                    CHILD(n, NCH(n) - 6).lineno,
                    CHILD(n, NCH(n) - 6).col_offset)];
            nElif--;
        }

        for (i = 0; i < nElif; ++i) {
            off = 5 + (nElif - i - 1) * 4;
            orelse = [
                new If_(
                    astForExpr(c, CHILD(n, off)),
                    astForSuite(c, CHILD(n, off + 2)),
                    orelse,
                    CHILD(n, off).lineno,
                    CHILD(n, off).col_offset)];
        }
        return new If_(
            astForExpr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            orelse, n.lineno, n.col_offset);
    }

    goog.asserts.fail("unexpected token in 'if' statement");
}

function astForExprlist (c, n, context) {
    var e;
    var i;
    var seq;
    REQ(n, SYM.exprlist);
    seq = [];
    for (i = 0; i < NCH(n); i += 2) {
        e = astForExpr(c, CHILD(n, i));
        seq[i / 2] = e;
        if (context) {
            setContext(c, e, context, CHILD(n, i));
        }
    }
    return seq;
}

function astForDelStmt (c, n) {
    /* del_stmt: 'del' exprlist */
    REQ(n, SYM.del_stmt);
    return new Delete_(astForExprlist(c, CHILD(n, 1), Del), n.lineno, n.col_offset);
}

function astForGlobalStmt (c, n) {
    /* global_stmt: 'global' NAME (',' NAME)* */
    var i;
    var s = [];
    REQ(n, SYM.global_stmt);
    for (i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new Global(s, n.lineno, n.col_offset);
}

function astForAssertStmt (c, n) {
    /* assert_stmt: 'assert' test [',' test] */
    REQ(n, SYM.assert_stmt);
    if (NCH(n) === 2) {
        return new Assert(astForExpr(c, CHILD(n, 1)), null, n.lineno, n.col_offset);
    }
    else if (NCH(n) === 4) {
        return new Assert(astForExpr(c, CHILD(n, 1)), astForExpr(c, CHILD(n, 3)), n.lineno, n.col_offset);
    }
    goog.asserts.fail("improper number of parts to assert stmt");
}

function aliasForImportName (c, n) {
    /*
     import_as_name: NAME ['as' NAME]
     dotted_as_name: dotted_name ['as' NAME]
     dotted_name: NAME ('.' NAME)*
     */

    var i;
    var a;
    var name;
    var str;
    loop: while (true) {
        switch (n.type) {
            case SYM.import_as_name:
                str = null;
                name = strobj(CHILD(n, 0).value);
                if (NCH(n) === 3) {
                    str = CHILD(n, 2).value;
                }
                return new alias(name, str == null ? null : strobj(str));
            case SYM.dotted_as_name:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue loop;
                }
                else {
                    a = aliasForImportName(c, CHILD(n, 0));
                    goog.asserts.assert(!a.asname);
                    a.asname = strobj(CHILD(n, 2).value);
                    return a;
                }
                break;
            case SYM.dotted_name:
                if (NCH(n) === 1) {
                    return new alias(strobj(CHILD(n, 0).value), null);
                }
                else {
                    // create a string of the form a.b.c
                    str = "";
                    for (i = 0; i < NCH(n); i += 2) {
                        str += CHILD(n, i).value + ".";
                    }
                    return new alias(strobj(str.substr(0, str.length - 1)), null);
                }
                break;
            case TOK.T_STAR:
                return new alias(strobj("*"), null);
            default:
                throw new Sk.builtin.SyntaxError("unexpected import name", c.c_filename, n.lineno);
        }
        break;
    }
}

function astForImportStmt (c, n) {
    /*
     import_stmt: import_name | import_from
     import_name: 'import' dotted_as_names
     import_from: 'from' ('.'* dotted_name | '.') 'import'
     ('*' | '(' import_as_names ')' | import_as_names)
     */
    var modname;
    var idx;
    var nchildren;
    var ndots;
    var mod;
    var i;
    var aliases;
    var col_offset;
    var lineno;
    REQ(n, SYM.import_stmt);
    lineno = n.lineno;
    col_offset = n.col_offset;
    n = CHILD(n, 0);
    if (n.type === SYM.import_name) {
        n = CHILD(n, 1);
        REQ(n, SYM.dotted_as_names);
        aliases = [];
        for (i = 0; i < NCH(n); i += 2) {
            aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        }
        return new Import_(aliases, lineno, col_offset);
    }
    else if (n.type === SYM.import_from) {
        mod = null;
        ndots = 0;

        for (idx = 1; idx < NCH(n); ++idx) {
            if (CHILD(n, idx).type === SYM.dotted_name) {
                mod = aliasForImportName(c, CHILD(n, idx));
                idx++;
                break;
            }
            else if (CHILD(n, idx).type !== TOK.T_DOT) {
                break;
            }
            ndots++;
        }
        ++idx; // skip the import keyword
        switch (CHILD(n, idx).type) {
            case TOK.T_STAR:
                // from ... import
                n = CHILD(n, idx);
                nchildren = 1;
                break;
            case TOK.T_LPAR:
                // from ... import (x, y, z)
                n = CHILD(n, idx + 1);
                nchildren = NCH(n);
                break;
            case SYM.import_as_names:
                // from ... import x, y, z
                n = CHILD(n, idx);
                nchildren = NCH(n);
                if (nchildren % 2 === 0) {
                    throw new Sk.builtin.SyntaxError("trailing comma not allowed without surrounding parentheses", c.c_filename, n.lineno);
                }
                break;
            default:
                throw new Sk.builtin.SyntaxError("Unexpected node-type in from-import", c.c_filename, n.lineno);
        }
        aliases = [];
        if (n.type === TOK.T_STAR) {
            aliases[0] = aliasForImportName(c, n);
        }
        else {
            for (i = 0; i < NCH(n); i += 2) {
                aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
            }
        }
        modname = mod ? mod.name.v : "";
        return new ImportFrom(strobj(modname), aliases, ndots, lineno, col_offset);
    }
    throw new Sk.builtin.SyntaxError("unknown import statement", c.c_filename, n.lineno);
}

function astForTestlistComp(c, n) {
    /* testlist_comp: test ( comp_for | (',' test)* [','] ) */
    /* argument: test [comp_for] */
    goog.asserts.assert(n.type === SYM.testlist_comp || n.type === SYM.argument);
    if (NCH(n) > 1 && CHILD(n, 1).type === SYM.comp_for) {
        return astForGenExpr(c, n);
    }
    return astForTestlist(c, n);
}

function astForListcomp (c, n) {
    /* listmaker: test ( list_for | (',' test)* [','] )
     list_for: 'for' exprlist 'in' testlist_safe [list_iter]
     list_iter: list_for | list_if
     list_if: 'if' test [list_iter]
     testlist_safe: test [(',' test)+ [',']]
     */

    function countListFors (c, n) {
        var nfors = 0;
        var ch = CHILD(n, 1);
        count_list_for: while (true) {
            nfors++;
            REQ(ch, SYM.list_for);
            if (NCH(ch) === 5) {
                ch = CHILD(ch, 4);
            }
            else {
                return nfors;
            }
            count_list_iter: while (true) {
                REQ(ch, SYM.list_iter);
                ch = CHILD(ch, 0);
                if (ch.type === SYM.list_for) {
                    continue count_list_for;
                }
                else if (ch.type === SYM.list_if) {
                    if (NCH(ch) === 3) {
                        ch = CHILD(ch, 2);
                        continue count_list_iter;
                    }
                    else {
                        return nfors;
                    }
                }
                break;
            }
            break;
        }
    }

    function countListIfs (c, n) {
        var nifs = 0;
        while (true) {
            REQ(n, SYM.list_iter);
            if (CHILD(n, 0).type === SYM.list_for) {
                return nifs;
            }
            n = CHILD(n, 0);
            REQ(n, SYM.list_if);
            nifs++;
            if (NCH(n) == 2) {
                return nifs;
            }
            n = CHILD(n, 2);
        }
    }

    var j;
    var ifs;
    var nifs;
    var lc;
    var expression;
    var t;
    var forch;
    var i;
    var ch;
    var listcomps;
    var nfors;
    var elt;
    REQ(n, SYM.listmaker);
    goog.asserts.assert(NCH(n) > 1);
    elt = astForExpr(c, CHILD(n, 0));
    nfors = countListFors(c, n);
    listcomps = [];
    ch = CHILD(n, 1);
    for (i = 0; i < nfors; ++i) {
        REQ(ch, SYM.list_for);
        forch = CHILD(ch, 1);
        t = astForExprlist(c, forch, Store);
        expression = astForTestlist(c, CHILD(ch, 3));
        if (NCH(forch) === 1) {
            lc = new comprehension(t[0], expression, []);
        }
        else {
            lc = new comprehension(new Tuple(t, Store, ch.lineno, ch.col_offset), expression, []);
        }

        if (NCH(ch) === 5) {
            ch = CHILD(ch, 4);
            nifs = countListIfs(c, ch);
            ifs = [];
            for (j = 0; j < nifs; ++j) {
                REQ(ch, SYM.list_iter);
                ch = CHILD(ch, 0);
                REQ(ch, SYM.list_if);
                ifs[j] = astForExpr(c, CHILD(ch, 1));
                if (NCH(ch) === 3) {
                    ch = CHILD(ch, 2);
                }
            }
            if (ch.type === SYM.list_iter) {
                ch = CHILD(ch, 0);
            }
            lc.ifs = ifs;
        }
        listcomps[i] = lc;
    }
    return new ListComp(elt, listcomps, n.lineno, n.col_offset);
}

function astForFactor (c, n) {
    /* some random peephole thing that cpy does */
    var expression;
    var pnum;
    var patom;
    var ppower;
    var pfactor;
    if (CHILD(n, 0).type === TOK.T_MINUS && NCH(n) === 2) {
        pfactor = CHILD(n, 1);
        if (pfactor.type === SYM.factor && NCH(pfactor) === 1) {
            ppower = CHILD(pfactor, 0);
            if (ppower.type === SYM.power && NCH(ppower) === 1) {
                patom = CHILD(ppower, 0);
                if (patom.type === SYM.atom) {
                    pnum = CHILD(patom, 0);
                    if (pnum.type === TOK.T_NUMBER) {
                        pnum.value = "-" + pnum.value;
                        return astForAtom(c, patom);
                    }
                }
            }
        }
    }

    expression = astForExpr(c, CHILD(n, 1));
    switch (CHILD(n, 0).type) {
        case TOK.T_PLUS:
            return new UnaryOp(UAdd, expression, n.lineno, n.col_offset);
        case TOK.T_MINUS:
            return new UnaryOp(USub, expression, n.lineno, n.col_offset);
        case TOK.T_TILDE:
            return new UnaryOp(Invert, expression, n.lineno, n.col_offset);
    }

    goog.asserts.fail("unhandled factor");
}

function astForForStmt (c, n) {
    /* for_stmt: 'for' exprlist 'in' testlist ':' suite ['else' ':' suite] */
    var target;
    var _target;
    var nodeTarget;
    var seq = [];
    REQ(n, SYM.for_stmt);
    if (NCH(n) === 9) {
        seq = astForSuite(c, CHILD(n, 8));
    }
    nodeTarget = CHILD(n, 1);
    _target = astForExprlist(c, nodeTarget, Store);
    if (NCH(nodeTarget) === 1) {
        target = _target[0];
    }
    else {
        target = new Tuple(_target, Store, n.lineno, n.col_offset);
    }

    return new For_(target,
        astForTestlist(c, CHILD(n, 3)),
        astForSuite(c, CHILD(n, 5)),
        seq, n.lineno, n.col_offset);
}

function astForCall (c, n, func) {
    /*
      arglist: (argument ',')* (argument [',']| '*' test [',' '**' test]
               | '**' test)
      argument: test [comp_for] | test '=' test       # Really [keyword '='] test
    */
    var tmp;
    var k;
    var key;
    var e;
    var kwarg;
    var vararg;
    var keywords;
    var args;
    var ch;
    var i;
    var ngens;
    var nkeywords;
    var nargs;

    REQ(n, SYM.arglist);
    nargs = 0;
    nkeywords = 0;
    ngens = 0;
    for (i = 0; i < NCH(n); i++) {
        ch = CHILD(n, i);
        if (ch.type === SYM.argument) {
            if (NCH(ch) === 1) {
                nargs++;
            }
            else if (CHILD(ch, 1).type === SYM.comp_for) {
                ngens++;
            }
            else {
                nkeywords++;
            }
        }
    }
    if (ngens > 1 || (ngens && (nargs || nkeywords))) {
        throw new Sk.builtin.SyntaxError("Generator expression must be parenthesized if not sole argument", c.c_filename, n.lineno);
    }
    if (nargs + nkeywords + ngens > 255) {
        throw new Sk.builtin.SyntaxError("more than 255 arguments", c.c_filename, n.lineno);
    }
    args = [];
    keywords = [];
    nargs = 0;
    nkeywords = 0;
    vararg = null;
    kwarg = null;
    for (i = 0; i < NCH(n); i++) {
        ch = CHILD(n, i);
        if (ch.type === SYM.argument) {
            if (NCH(ch) === 1) {
                if (nkeywords) {
                    throw new Sk.builtin.SyntaxError("non-keyword arg after keyword arg", c.c_filename, n.lineno);
                }
                if (vararg) {
                    throw new Sk.builtin.SyntaxError("only named arguments may follow *expression", c.c_filename, n.lineno);
                }
                args[nargs++] = astForExpr(c, CHILD(ch, 0));
            }
            else if (CHILD(ch, 1).type === SYM.comp_for) {
                args[nargs++] = astForGenExpr(c, ch);
            }
            else {
                e = astForExpr(c, CHILD(ch, 0));
                if (e.constructor === Lambda) {
                    throw new Sk.builtin.SyntaxError("lambda cannot contain assignment", c.c_filename, n.lineno);
                }
                else if (e.constructor !== Name) {
                    throw new Sk.builtin.SyntaxError("keyword can't be an expression", c.c_filename, n.lineno);
                }
                key = e.id;
                forbiddenCheck(c, CHILD(ch, 0), key, n.lineno);
                for (k = 0; k < nkeywords; ++k) {
                    tmp = keywords[k].arg;
                    if (tmp === key) {
                        throw new Sk.builtin.SyntaxError("keyword argument repeated", c.c_filename, n.lineno);
                    }
                }
                keywords[nkeywords++] = new keyword(key, astForExpr(c, CHILD(ch, 2)));
            }
        }
        else if (ch.type === TOK.T_STAR) {
            vararg = astForExpr(c, CHILD(n, ++i));
        }
        else if (ch.type === TOK.T_DOUBLESTAR) {
            kwarg = astForExpr(c, CHILD(n, ++i));
        }
    }
    return new Call(func, args, keywords, vararg, kwarg, func.lineno, func.col_offset);
}

function astForTrailer (c, n, leftExpr) {
    /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME 
     subscriptlist: subscript (',' subscript)* [',']
     subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
     */
    var e;
    var elts;
    var slc;
    var j;
    var slices;
    var simple;
    REQ(n, SYM.trailer);
    if (CHILD(n, 0).type === TOK.T_LPAR) {
        if (NCH(n) === 2) {
            return new Call(leftExpr, [], [], null, null, n.lineno, n.col_offset);
        }
        else {
            return astForCall(c, CHILD(n, 1), leftExpr);
        }
    }
    else if (CHILD(n, 0).type === TOK.T_DOT) {
        return new Attribute(leftExpr, strobj(CHILD(n, 1).value), Load, n.lineno, n.col_offset);
    }
    else {
        REQ(CHILD(n, 0), TOK.T_LSQB);
        REQ(CHILD(n, 2), TOK.T_RSQB);
        n = CHILD(n, 1);
        if (NCH(n) === 1) {
            return new Subscript(leftExpr, astForSlice(c, CHILD(n, 0)), Load, n.lineno, n.col_offset);
        }
        else {
            /* The grammar is ambiguous here. The ambiguity is resolved 
             by treating the sequence as a tuple literal if there are
             no slice features.
             */
            simple = true;
            slices = [];
            for (j = 0; j < NCH(n); j += 2) {
                slc = astForSlice(c, CHILD(n, j));
                if (slc.constructor !== Index) {
                    simple = false;
                }
                slices[j / 2] = slc;
            }
            if (!simple) {
                return new Subscript(leftExpr, new ExtSlice(slices), Load, n.lineno, n.col_offset);
            }
            elts = [];
            for (j = 0; j < slices.length; ++j) {
                slc = slices[j];
                goog.asserts.assert(slc.constructor === Index && slc.value !== null && slc.value !== undefined);
                elts[j] = slc.value;
            }
            e = new Tuple(elts, Load, n.lineno, n.col_offset);
            return new Subscript(leftExpr, new Index(e), Load, n.lineno, n.col_offset);
        }
    }
}

function astForFlowStmt (c, n) {
    /*
     flow_stmt: break_stmt | continue_stmt | return_stmt | raise_stmt
     | yield_stmt
     break_stmt: 'break'
     continue_stmt: 'continue'
     return_stmt: 'return' [testlist]
     yield_stmt: yield_expr
     yield_expr: 'yield' testlist
     raise_stmt: 'raise' [test [',' test [',' test]]]
     */
    var ch;
    REQ(n, SYM.flow_stmt);
    ch = CHILD(n, 0);
    switch (ch.type) {
        case SYM.break_stmt:
            return new Break_(n.lineno, n.col_offset);
        case SYM.continue_stmt:
            return new Continue_(n.lineno, n.col_offset);
        case SYM.yield_stmt:
            return new Expr(astForExpr(c, CHILD(ch, 0)), n.lineno, n.col_offset);
        case SYM.return_stmt:
            if (NCH(ch) === 1) {
                return new Return_(null, n.lineno, n.col_offset);
            }
            else {
                return new Return_(astForTestlist(c, CHILD(ch, 1)), n.lineno, n.col_offset);
            }
            break;
        case SYM.raise_stmt:
            if (NCH(ch) === 1) {
                return new Raise(null, null, null, n.lineno, n.col_offset);
            }
            else if (NCH(ch) === 2) {
                return new Raise(astForExpr(c, CHILD(ch, 1)), null, null, n.lineno, n.col_offset);
            }
            else if (NCH(ch) === 4) {
                return new Raise(
                    astForExpr(c, CHILD(ch, 1)),
                    astForExpr(c, CHILD(ch, 3)),
                    null, n.lineno, n.col_offset);
            }
            else if (NCH(ch) === 6) {
                return new Raise(
                    astForExpr(c, CHILD(ch, 1)),
                    astForExpr(c, CHILD(ch, 3)),
                    astForExpr(c, CHILD(ch, 5)),
                    n.lineno, n.col_offset);
            }
            break;
        default:
            goog.asserts.fail("unexpected flow_stmt");
    }
    goog.asserts.fail("unhandled flow statement");
}

function astForArguments (c, n) {
    /* parameters: '(' [varargslist] ')'
     varargslist: (fpdef ['=' test] ',')* ('*' NAME [',' '**' NAME]
     | '**' NAME) | fpdef ['=' test] (',' fpdef ['=' test])* [',']
     */
    var parenthesized;
    var id;
    var complexArgs;
    var k;
    var j;
    var i;
    var foundDefault;
    var defaults;
    var args;
    var ch;
    var vararg = null;
    var kwarg = null;
    if (n.type === SYM.parameters) {
        if (NCH(n) === 2) // () as arglist
        {
            return new arguments_([], null, null, []);
        }
        n = CHILD(n, 1);
    }
    REQ(n, SYM.varargslist);

    args = [];
    defaults = [];

    /* fpdef: NAME | '(' fplist ')'
     fplist: fpdef (',' fpdef)* [',']
     */
    foundDefault = false;
    i = 0;
    j = 0; // index for defaults
    k = 0; // index for args
    while (i < NCH(n)) {
        ch = CHILD(n, i);
        switch (ch.type) {
            case SYM.fpdef:
                complexArgs = 0;
                parenthesized = 0;
                handle_fpdef: while (true) {
                    if (i + 1 < NCH(n) && CHILD(n, i + 1).type === TOK.T_EQUAL) {
                        defaults[j++] = astForExpr(c, CHILD(n, i + 2));
                        i += 2;
                        foundDefault = true;
                    }
                    else if (foundDefault) {
                        /* def f((x)=4): pass should raise an error.
                         def f((x, (y))): pass will just incur the tuple unpacking warning. */
                        if (parenthesized && !complexArgs) {
                            throw new Sk.builtin.SyntaxError("parenthesized arg with default", c.c_filename, n.lineno);
                        }
                        throw new Sk.builtin.SyntaxError("non-default argument follows default argument", c.c_filename, n.lineno);
                    }

                    if (NCH(ch) === 3) {
                        ch = CHILD(ch, 1);
                        // def foo((x)): is not complex, special case.
                        if (NCH(ch) !== 1) {
                            throw new Sk.builtin.SyntaxError("tuple parameter unpacking has been removed", c.c_filename, n.lineno);
                        }
                        else {
                            /* def foo((x)): setup for checking NAME below. */
                            /* Loop because there can be many parens and tuple
                             unpacking mixed in. */
                            parenthesized = true;
                            ch = CHILD(ch, 0);
                            goog.asserts.assert(ch.type === SYM.fpdef);
                            continue handle_fpdef;
                        }
                    }
                    if (CHILD(ch, 0).type === TOK.T_NAME) {
                        forbiddenCheck(c, n, CHILD(ch, 0).value, n.lineno);
                        id = strobj(CHILD(ch, 0).value);
                        args[k++] = new Name(id, Param, ch.lineno, ch.col_offset);
                    }
                    i += 2;
                    if (parenthesized) {
                        throw new Sk.builtin.SyntaxError("parenthesized argument names are invalid", c.c_filename, n.lineno);
                    }
                    break;
                }
                break;
            case TOK.T_STAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.lineno);
                vararg = strobj(CHILD(n, i + 1).value);
                i += 3;
                break;
            case TOK.T_DOUBLESTAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.lineno);
                kwarg = strobj(CHILD(n, i + 1).value);
                i += 3;
                break;
            default:
                goog.asserts.fail("unexpected node in varargslist");
        }
    }
    return new arguments_(args, vararg, kwarg, defaults);
}

function astForFuncdef (c, n, decoratorSeq) {
    /* funcdef: 'def' NAME parameters ':' suite */
    var body;
    var args;
    var name;
    REQ(n, SYM.funcdef);
    name = strobj(CHILD(n, 1).value);
    forbiddenCheck(c, CHILD(n, 1), CHILD(n, 1).value, n.lineno);
    args = astForArguments(c, CHILD(n, 2));
    body = astForSuite(c, CHILD(n, 4));
    return new FunctionDef(name, args, body, decoratorSeq, n.lineno, n.col_offset);
}

function astForClassBases (c, n) {
    /* testlist: test (',' test)* [','] */
    goog.asserts.assert(NCH(n) > 0);
    REQ(n, SYM.testlist);
    if (NCH(n) === 1) {
        return [ astForExpr(c, CHILD(n, 0)) ];
    }
    return seqForTestlist(c, n);
}

function astForClassdef (c, n, decoratorSeq) {
    /* classdef: 'class' NAME ['(' testlist ')'] ':' suite */
    var s;
    var bases;
    var classname;
    REQ(n, SYM.classdef);
    forbiddenCheck(c, n, CHILD(n, 1).value, n.lineno);
    classname = strobj(CHILD(n, 1).value);
    if (NCH(n) === 4) {
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 3)), decoratorSeq, n.lineno, n.col_offset);
    }
    if (CHILD(n, 3).type === TOK.T_RPAR) {
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.lineno, n.col_offset);
    }

    bases = astForClassBases(c, CHILD(n, 3));
    s = astForSuite(c, CHILD(n, 6));
    return new ClassDef(classname, bases, s, decoratorSeq, n.lineno, n.col_offset);
}

function astForLambdef (c, n) {
    /* lambdef: 'lambda' [varargslist] ':' test */
    var args;
    var expression;
    if (NCH(n) === 3) {
        args = new arguments_([], null, null, []);
        expression = astForExpr(c, CHILD(n, 2));
    }
    else {
        args = astForArguments(c, CHILD(n, 1));
        expression = astForExpr(c, CHILD(n, 3));
    }
    return new Lambda(args, expression, n.lineno, n.col_offset);
}

function astForComprehension(c, n) {
    /* testlist_comp: test ( comp_for | (',' test)* [','] )
       argument: test [comp_for] | test '=' test       # Really [keyword '='] test */
    
    var j;
    var ifs;
    var nifs;
    var ge;
    var expression;
    var t;
    var forch;
    var i;
    var ch;
    var genexps;
    var nfors;
    var elt;
    var comps;
    var comp;

    function countCompFors(c, n) {
        var nfors = 0;
        count_comp_for: while (true) {
            nfors++;
            REQ(n, SYM.comp_for);
            if (NCH(n) === 5) {
                n = CHILD(n, 4);
            } else {
                return nfors;
            }
            count_comp_iter: while (true) {
                REQ(n, SYM.comp_iter);
                n = CHILD(n, 0);
                if (n.type === SYM.comp_for) {
                    continue count_comp_for;
                } else if (n.type === SYM.comp_if) {
                    if (NCH(n) === 3) {
                        n = CHILD(n, 2);
                        continue count_comp_iter;
                    } else {
                        return nfors;
                    }
                }
                break;
            }
            break;
        }
        goog.asserts.fail("logic error in countCompFors");
    }

    function countCompIfs(c, n) {
        var nifs = 0;
        while (true) {
            REQ(n, SYM.comp_iter);
            if (CHILD(n, 0).type === SYM.comp_for) {
                return nifs;
            }
            n = CHILD(n, 0);
            REQ(n, SYM.comp_if);
            nifs++;
            if (NCH(n) == 2) {
                return nifs;
            }
            n = CHILD(n, 2);
        }
    }

    nfors = countCompFors(c, n);
    comps = [];
    for (i = 0; i < nfors; ++i) {
        REQ(n, SYM.comp_for);
        forch = CHILD(n, 1);
        t = astForExprlist(c, forch, Store);
        expression = astForExpr(c, CHILD(n, 3));
        if (NCH(forch) === 1) {
            comp = new comprehension(t[0], expression, []);
        } else {
            comp = new comprehension(new Tuple(t, Store, n.lineno, n.col_offset), expression, []);
        }
        if (NCH(n) === 5) {
            n = CHILD(n, 4);
            nifs = countCompIfs(c, n);
            ifs = [];
            for (j = 0; j < nifs; ++j) {
                REQ(n, SYM.comp_iter);
                n = CHILD(n, 0);
                REQ(n, SYM.comp_if);
                expression = astForExpr(c, CHILD(n, 1));
                ifs[j] = expression;
                if (NCH(n) === 3) {
                    n = CHILD(n, 2);
                }
            }
            if (n.type === SYM.comp_iter) {
                n = CHILD(n, 0);
            }
            comp.ifs = ifs;
        }
        comps[i] = comp;
    }
    return comps;
}

function astForIterComp(c, n, type) {
    var elt, comps;
    goog.asserts.assert(NCH(n) > 1);
    elt = astForExpr(c, CHILD(n, 0));
    comps = astForComprehension(c, CHILD(n, 1));
    if (type === COMP_GENEXP) {
        return new GeneratorExp(elt, comps, n.lineno, n.col_offset);
    } else if (type === COMP_SETCOMP) {
        return new SetComp(elt, comps, n.lineno, n.col_offset);
    }
}

function astForDictComp(c, n) {
    var key, value;
    var comps = [];
    goog.asserts.assert(NCH(n) > 3);
    REQ(CHILD(n, 1), TOK.T_COLON);
    key = astForExpr(c, CHILD(n, 0));
    value = astForExpr(c, CHILD(n, 2));
    comps = astForComprehension(c, CHILD(n, 3));
    return new DictComp(key, value, comps, n.lineno, n.col_offset);
}

function astForGenExpr(c, n) {
    goog.asserts.assert(n.type === SYM.testlist_comp || n.type === SYM.argument);
    return astForIterComp(c, n, COMP_GENEXP);
}

function astForSetComp(c, n) {
    goog.asserts.assert(n.type === SYM.dictorsetmaker);
    return astForIterComp(c, n, COMP_SETCOMP);
}

function astForWhileStmt (c, n) {
    /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
    REQ(n, SYM.while_stmt);
    if (NCH(n) === 4) {
        return new While_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
    }
    else if (NCH(n) === 7) {
        return new While_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
    }
    goog.asserts.fail("wrong number of tokens for 'while' stmt");
}

function astForAugassign (c, n) {
    REQ(n, SYM.augassign);
    n = CHILD(n, 0);
    switch (n.value.charAt(0)) {
        case "+":
            return Add;
        case "-":
            return Sub;
        case "/":
            if (n.value.charAt(1) === "/") {
                return FloorDiv;
            }
            return Div;
        case "%":
            return Mod;
        case "<":
            return LShift;
        case ">":
            return RShift;
        case "&":
            return BitAnd;
        case "^":
            return BitXor;
        case "|":
            return BitOr;
        case "*":
            if (n.value.charAt(1) === "*") {
                return Pow;
            }
            return Mult;
        default:
            goog.asserts.fail("invalid augassign");
    }
}

function astForBinop (c, n) {
    /* Must account for a sequence of expressions.
     How should A op B op C by represented?
     BinOp(BinOp(A, op, B), op, C).
     */
    var tmp;
    var newoperator;
    var nextOper;
    var i;
    var result = new BinOp(
        astForExpr(c, CHILD(n, 0)),
        getOperator(CHILD(n, 1)),
        astForExpr(c, CHILD(n, 2)),
        n.lineno, n.col_offset);
    var nops = (NCH(n) - 1) / 2;
    for (i = 1; i < nops; ++i) {
        nextOper = CHILD(n, i * 2 + 1);
        newoperator = getOperator(nextOper);
        tmp = astForExpr(c, CHILD(n, i * 2 + 2));
        result = new BinOp(result, newoperator, tmp, nextOper.lineno, nextOper.col_offset);
    }
    return result;

}


function astForTestlist(c, n) {
    /* this doesn't show up in Grammar.txt never did: testlist_gexp: test (',' test)* [','] */
    /* testlist_comp: test (',' test)* [','] */
    /* testlist: test (',' test)* [','] */
    /* testlist_safe: test (',' test)+ [','] */
    /* testlist1: test (',' test)* */
    goog.asserts.assert(NCH(n) > 0);
    if (n.type === SYM.testlist_comp) {
        if (NCH(n) > 1) {
            goog.asserts.assert(CHILD(n, 1).type !== SYM.comp_for);
        }
    }
    else {
        goog.asserts.assert(n.type === SYM.testlist || n.type === SYM.testlist_safe || n.type === SYM.testlist1);
    }

    if (NCH(n) === 1) {
        return astForExpr(c, CHILD(n, 0));
    }
    else {
        return new Tuple(seqForTestlist(c, n), Load, n.lineno, n.col_offset);
    }

}

function astForExprStmt (c, n) {
    var expression;
    var value;
    var e;
    var i;
    var targets;
    var expr2;
    var varName;
    var expr1;
    var ch;
    REQ(n, SYM.expr_stmt);
    /* expr_stmt: testlist (augassign (yield_expr|testlist) 
     | ('=' (yield_expr|testlist))*)
     testlist: test (',' test)* [',']
     augassign: '+=' | '-=' | '*=' | '/=' | '%=' | '&=' | '|=' | '^='
     | '<<=' | '>>=' | '**=' | '//='
     test: ... here starts the operator precendence dance
     */
    if (NCH(n) === 1) {
        return new Expr(astForTestlist(c, CHILD(n, 0)), n.lineno, n.col_offset);
    }
    else if (CHILD(n, 1).type === SYM.augassign) {
        ch = CHILD(n, 0);
        expr1 = astForTestlist(c, ch);
        switch (expr1.constructor) {
            case GeneratorExp:
                throw new Sk.builtin.SyntaxError("augmented assignment to generator expression not possible", c.c_filename, n.lineno);
            case Yield:
                throw new Sk.builtin.SyntaxError("augmented assignment to yield expression not possible", c.c_filename, n.lineno);
            case Name:
                varName = expr1.id;
                forbiddenCheck(c, ch, varName, n.lineno);
                break;
            case Attribute:
            case Subscript:
                break;
            default:
                throw new Sk.builtin.SyntaxError("illegal expression for augmented assignment", c.c_filename, n.lineno);
        }
        setContext(c, expr1, Store, ch);

        ch = CHILD(n, 2);
        if (ch.type === SYM.testlist) {
            expr2 = astForTestlist(c, ch);
        }
        else {
            expr2 = astForExpr(c, ch);
        }

        return new AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.lineno, n.col_offset);
    }
    else {
        // normal assignment
        REQ(CHILD(n, 1), TOK.T_EQUAL);
        targets = [];
        for (i = 0; i < NCH(n) - 2; i += 2) {
            ch = CHILD(n, i);
            if (ch.type === SYM.yield_expr) {
                throw new Sk.builtin.SyntaxError("assignment to yield expression not possible", c.c_filename, n.lineno);
            }
            e = astForTestlist(c, ch);
            setContext(c, e, Store, CHILD(n, i));
            targets[i / 2] = e;
        }
        value = CHILD(n, NCH(n) - 1);
        if (value.type === SYM.testlist) {
            expression = astForTestlist(c, value);
        }
        else {
            expression = astForExpr(c, value);
        }
        return new Assign(targets, expression, n.lineno, n.col_offset);
    }
}

function astForIfexpr (c, n) {
    /* test: or_test 'if' or_test 'else' test */
    goog.asserts.assert(NCH(n) === 5);
    return new IfExp(
        astForExpr(c, CHILD(n, 2)),
        astForExpr(c, CHILD(n, 0)),
        astForExpr(c, CHILD(n, 4)),
        n.lineno, n.col_offset);
}

/**
 * s is a python-style string literal, including quote characters and u/r/b
 * prefixes. Returns decoded string object.
 */
function parsestr (c, s) {
    var encodeUtf8 = function (s) {
        return unescape(encodeURIComponent(s));
    };
    var decodeUtf8 = function (s) {
        return decodeURIComponent(escape(s));
    };
    var decodeEscape = function (s, quote) {
        var d3;
        var d2;
        var d1;
        var d0;
        var c;
        var i;
        var len = s.length;
        var ret = "";
        for (i = 0; i < len; ++i) {
            c = s.charAt(i);
            if (c === "\\") {
                ++i;
                c = s.charAt(i);
                if (c === "n") {
                    ret += "\n";
                }
                else if (c === "\\") {
                    ret += "\\";
                }
                else if (c === "t") {
                    ret += "\t";
                }
                else if (c === "r") {
                    ret += "\r";
                }
                else if (c === "b") {
                    ret += "\b";
                }
                else if (c === "f") {
                    ret += "\f";
                }
                else if (c === "v") {
                    ret += "\v";
                }
                else if (c === "0") {
                    ret += "\0";
                }
                else if (c === '"') {
                    ret += '"';
                }
                else if (c === '\'') {
                    ret += '\'';
                }
                else if (c === "\n") /* escaped newline, join lines */ {
                }
                else if (c === "x") {
                    d0 = s.charAt(++i);
                    d1 = s.charAt(++i);
                    ret += String.fromCharCode(parseInt(d0 + d1, 16));
                }
                else if (c === "u" || c === "U") {
                    d0 = s.charAt(++i);
                    d1 = s.charAt(++i);
                    d2 = s.charAt(++i);
                    d3 = s.charAt(++i);
                    ret += String.fromCharCode(parseInt(d0 + d1, 16), parseInt(d2 + d3, 16));
                }
                else {
                    // Leave it alone
                    ret += "\\" + c;
                    // goog.asserts.fail("unhandled escape: '" + c.charCodeAt(0) + "'");
                }
            }
            else {
                ret += c;
            }
        }
        return ret;
    };

    //print("parsestr", s);

    var quote = s.charAt(0);
    var rawmode = false;
    var unicode = false;

    // treats every sequence as unicodes even if they are not treated with uU prefix
    // kinda hacking though working for most purposes
    if((c.c_flags & Parser.CO_FUTURE_UNICODE_LITERALS || Sk.python3 === true)) {
        unicode = true;
    }

    if (quote === "u" || quote === "U") {
        s = s.substr(1);
        quote = s.charAt(0);
        unicode = true;
    }
    else if (quote === "r" || quote === "R") {
        s = s.substr(1);
        quote = s.charAt(0);
        rawmode = true;
    }
    goog.asserts.assert(quote !== "b" && quote !== "B", "todo; haven't done b'' strings yet");

    goog.asserts.assert(quote === "'" || quote === '"' && s.charAt(s.length - 1) === quote);
    s = s.substr(1, s.length - 2);
    if (unicode) {
        s = encodeUtf8(s);
    }

    if (s.length >= 4 && s.charAt(0) === quote && s.charAt(1) === quote) {
        goog.asserts.assert(s.charAt(s.length - 1) === quote && s.charAt(s.length - 2) === quote);
        s = s.substr(2, s.length - 4);
    }

    if (rawmode || s.indexOf("\\") === -1) {
        return strobj(decodeUtf8(s));
    }
    return strobj(decodeEscape(s, quote));
}

function parsestrplus (c, n) {
    var i;
    var ret;
    REQ(CHILD(n, 0), TOK.T_STRING);
    ret = new Sk.builtin.str("");
    for (i = 0; i < NCH(n); ++i) {
        try {
            ret = ret.sq$concat(parsestr(c, CHILD(n, i).value));
        } catch (x) {
            throw new Sk.builtin.SyntaxError("invalid string (possibly contains a unicode character)", c.c_filename, CHILD(n, i).lineno);
        }
    }
    return ret;
}

function parsenumber (c, s, lineno) {
    var neg;
    var val;
    var tmp;
    var end = s.charAt(s.length - 1);

    // call internal complex type constructor for complex strings
    if (end === "j" || end === "J") {
        return Sk.builtin.complex.complex_subtype_from_string(s);
    }

    // Handle longs
    if (end === "l" || end === "L") {
        return Sk.longFromStr(s.substr(0, s.length - 1), 0);
    }

    // todo; we don't currently distinguish between int and float so
    // str is wrong for these.
    if (s.indexOf(".") !== -1) {
        return new Sk.builtin.float_(parseFloat(s));
    }

    // Handle integers of various bases
    tmp = s;
    neg = false;
    if (s.charAt(0) === "-") {
        tmp = s.substr(1);
        neg = true;
    }

    if (tmp.charAt(0) === "0" && (tmp.charAt(1) === "x" || tmp.charAt(1) === "X")) {
        // Hex
        tmp = tmp.substring(2);
        val = parseInt(tmp, 16);
    } else if ((s.indexOf("e") !== -1) || (s.indexOf("E") !== -1)) {
        // Float with exponent (needed to make sure e/E wasn't hex first)
        return new Sk.builtin.float_(parseFloat(s));
    } else if (tmp.charAt(0) === "0" && (tmp.charAt(1) === "b" || tmp.charAt(1) === "B")) {
        // Binary
        tmp = tmp.substring(2);
        val = parseInt(tmp, 2);
    } else if (tmp.charAt(0) === "0") {
        if (tmp === "0") {
            // Zero
            val = 0;
        } else {
            // Octal
            tmp = tmp.substring(1);
            if ((tmp.charAt(0) === "o") || (tmp.charAt(0) === "O")) {
                tmp = tmp.substring(1);
            }
            val = parseInt(tmp, 8);
        }
    }
    else {
        // Decimal
        val = parseInt(tmp, 10);
    }

    // Convert to long
    if (val > Sk.builtin.int_.threshold$ &&
        Math.floor(val) === val &&
        (s.indexOf("e") === -1 && s.indexOf("E") === -1)) {
        return Sk.longFromStr(s, 0);
    }

    // Small enough, return parsed number
    if (neg) {
        return new Sk.builtin.int_(-val);
    } else {
        return new Sk.builtin.int_(val);
    }
}

function astForSlice (c, n) {
    var n2;
    var step;
    var upper;
    var lower;
    var ch;
    REQ(n, SYM.subscript);

    /*
     subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
     sliceop: ':' [test]
     */
    ch = CHILD(n, 0);
    lower = null;
    upper = null;
    step = null;
    if (ch.type === TOK.T_DOT) {
        return new Ellipsis();
    }
    if (NCH(n) === 1 && ch.type === SYM.test) {
        return new Index(astForExpr(c, ch));
    }
    if (ch.type === SYM.test) {
        lower = astForExpr(c, ch);
    }
    if (ch.type === TOK.T_COLON) {
        if (NCH(n) > 1) {
            n2 = CHILD(n, 1);
            if (n2.type === SYM.test) {
                upper = astForExpr(c, n2);
            }
        }
    }
    else if (NCH(n) > 2) {
        n2 = CHILD(n, 2);
        if (n2.type === SYM.test) {
            upper = astForExpr(c, n2);
        }
    }

    ch = CHILD(n, NCH(n) - 1);
    if (ch.type === SYM.sliceop) {
        if (NCH(ch) === 1) {
            ch = CHILD(ch, 0);
            step = new Name(strobj("None"), Load, ch.lineno, ch.col_offset);
        }
        else {
            ch = CHILD(ch, 1);
            if (ch.type === SYM.test) {
                step = astForExpr(c, ch);
            }
        }
    }
    return new Slice(lower, upper, step);
}

function astForAtom(c, n) {
    /* atom: ('(' [yield_expr|testlist_comp] ')' |
       '[' [listmaker] ']' |
       '{' [dictorsetmaker] '}' |
       '`' testlist1 '`' |
       NAME | NUMBER | STRING+)
    */
    var i;
    var values;
    var keys;
    var size;
    var ch = CHILD(n, 0);
    var elts;
    switch (ch.type) {
        case TOK.T_NAME:
            // All names start in Load context, but may be changed later
            return new Name(strobj(ch.value), Load, n.lineno, n.col_offset);
        case TOK.T_STRING:
            return new Str(parsestrplus(c, n), n.lineno, n.col_offset);
        case TOK.T_NUMBER:
            return new Num(parsenumber(c, ch.value, n.lineno), n.lineno, n.col_offset);
        case TOK.T_LPAR: // various uses for parens
            ch = CHILD(n, 1);
            if (ch.type === TOK.T_RPAR) {
                return new Tuple([], Load, n.lineno, n.col_offset);
            }
            if (ch.type === SYM.yield_expr) {
                return astForExpr(c, ch);
            }
            //            if (NCH(ch) > 1 && CHILD(ch, 1).type === SYM.comp_for) {
            //                return astForComprehension(c, ch);
            //            }
            return astForTestlistComp(c, ch);
        case TOK.T_LSQB: // list or listcomp
            ch = CHILD(n, 1);
            if (ch.type === TOK.T_RSQB) {
                return new List([], Load, n.lineno, n.col_offset);
            }
            REQ(ch, SYM.listmaker);
            if (NCH(ch) === 1 || CHILD(ch, 1).type === TOK.T_COMMA) {
                return new List(seqForTestlist(c, ch), Load, n.lineno, n.col_offset);
            } 
            return astForListcomp(c, ch);
            
        case TOK.T_LBRACE:
            /* dictorsetmaker: 
             *     (test ':' test (comp_for : (',' test ':' test)* [','])) |
             *     (test (comp_for | (',' test)* [',']))
             */
            keys = [];
            values = [];
            ch = CHILD(n, 1);
            if (n.type === TOK.T_RBRACE) {
                //it's an empty dict
                return new Dict([], null, n.lineno, n.col_offset);
            } 
            else if (NCH(ch) === 1 || (NCH(ch) !== 0 && CHILD(ch, 1).type === TOK.T_COMMA)) {
                //it's a simple set
                elts = [];
                size = Math.floor((NCH(ch) + 1) / 2);
                for (i = 0; i < NCH(ch); i += 2) {
                    var expression = astForExpr(c, CHILD(ch, i));
                    elts[i / 2] = expression;
                }
                return new Set(elts, n.lineno, n.col_offset);
            } 
            else if (NCH(ch) !== 0 && CHILD(ch, 1).type == SYM.comp_for) {
                //it's a set comprehension
                return astForSetComp(c, ch);
            } 
            else if (NCH(ch) > 3 && CHILD(ch, 3).type === SYM.comp_for) {
                //it's a dict compr. I think.
                return astForDictComp(c, ch);
            } 
            else {
                size = Math.floor((NCH(ch) + 1) / 4); // + 1 for no trailing comma case
                for (i = 0; i < NCH(ch); i += 4) {
                    keys[i / 4] = astForExpr(c, CHILD(ch, i));
                    values[i / 4] = astForExpr(c, CHILD(ch, i + 2));
                }
                return new Dict(keys, values, n.lineno, n.col_offset);
            }
        case TOK.T_BACKQUOTE:
            //throw new Sk.builtin.SyntaxError("backquote not supported, use repr()", c.c_filename, n.lineno);
            return new Repr(astForTestlist(c, CHILD(n, 1)), n.lineno, n.col_offset);
        default:
            goog.asserts.fail("unhandled atom", ch.type);

    }
}

function astForPower (c, n) {
    /* power: atom trailer* ('**' factor)*
     */
    var f;
    var tmp;
    var ch;
    var i;
    var e;
    REQ(n, SYM.power);
    e = astForAtom(c, CHILD(n, 0));
    if (NCH(n) === 1) {
        return e;
    }
    for (i = 1; i < NCH(n); ++i) {
        ch = CHILD(n, i);
        if (ch.type !== SYM.trailer) {
            break;
        }
        tmp = astForTrailer(c, ch, e);
        tmp.lineno = e.lineno;
        tmp.col_offset = e.col_offset;
        e = tmp;
    }
    if (CHILD(n, NCH(n) - 1).type === SYM.factor) {
        f = astForExpr(c, CHILD(n, NCH(n) - 1));
        e = new BinOp(e, Pow, f, n.lineno, n.col_offset);
    }
    return e;
}

function astForExpr (c, n) {
    /* handle the full range of simple expressions
     test: or_test ['if' or_test 'else' test] | lambdef
     or_test: and_test ('or' and_test)*
     and_test: not_test ('and' not_test)*
     not_test: 'not' not_test | comparison
     comparison: expr (comp_op expr)*
     expr: xor_expr ('|' xor_expr)*
     xor_expr: and_expr ('^' and_expr)*
     and_expr: shift_expr ('&' shift_expr)*
     shift_expr: arith_expr (('<<'|'>>') arith_expr)*
     arith_expr: term (('+'|'-') term)*
     term: factor (('*'|'/'|'%'|'//') factor)*
     factor: ('+'|'-'|'~') factor | power
     power: atom trailer* ('**' factor)*

     As well as modified versions that exist for backward compatibility,
     to explicitly allow:
     [ x for x in lambda: 0, lambda: 1 ]
     (which would be ambiguous without these extra rules)

     old_test: or_test | old_lambdef
     old_lambdef: 'lambda' [vararglist] ':' old_test

     */

    var exp;
    var cmps;
    var ops;
    var i;
    var seq;
    LOOP: while (true) {
        switch (n.type) {
            case SYM.test:
            case SYM.old_test:
                if (CHILD(n, 0).type === SYM.lambdef || CHILD(n, 0).type === SYM.old_lambdef) {
                    return astForLambdef(c, CHILD(n, 0));
                }
                else if (NCH(n) > 1) {
                    return astForIfexpr(c, n);
                }
            // fallthrough
            case SYM.or_test:
            case SYM.and_test:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                seq = [];
                for (i = 0; i < NCH(n); i += 2) {
                    seq[i / 2] = astForExpr(c, CHILD(n, i));
                }
                if (CHILD(n, 1).value === "and") {
                    return new BoolOp(And, seq, n.lineno, n.col_offset);
                }
                goog.asserts.assert(CHILD(n, 1).value === "or");
                return new BoolOp(Or, seq, n.lineno, n.col_offset);
            case SYM.not_test:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else {
                    return new UnaryOp(Not, astForExpr(c, CHILD(n, 1)), n.lineno, n.col_offset);
                }
                break;
            case SYM.comparison:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else {
                    ops = [];
                    cmps = [];
                    for (i = 1; i < NCH(n); i += 2) {
                        ops[(i - 1) / 2] = astForCompOp(c, CHILD(n, i));
                        cmps[(i - 1) / 2] = astForExpr(c, CHILD(n, i + 1));
                    }
                    return new Compare(astForExpr(c, CHILD(n, 0)), ops, cmps, n.lineno, n.col_offset);
                }
                break;
            case SYM.expr:
            case SYM.xor_expr:
            case SYM.and_expr:
            case SYM.shift_expr:
            case SYM.arith_expr:
            case SYM.term:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForBinop(c, n);
            case SYM.yield_expr:
                exp = null;
                if (NCH(n) === 2) {
                    exp = astForTestlist(c, CHILD(n, 1));
                }
                return new Yield(exp, n.lineno, n.col_offset);
            case SYM.factor:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForFactor(c, n);
            case SYM.power:
                return astForPower(c, n);
            default:
                goog.asserts.fail("unhandled expr", "n.type: %d", n.type);
        }
        break;
    }
}

function astForPrintStmt (c, n) {
    /* print_stmt: 'print' ( [ test (',' test)* [','] ]
     | '>>' test [ (',' test)+ [','] ] )
     */
    var nl;
    var i, j;
    var seq;
    var start = 1;
    var dest = null;
    REQ(n, SYM.print_stmt);
    if (NCH(n) >= 2 && CHILD(n, 1).type === TOK.T_RIGHTSHIFT) {
        dest = astForExpr(c, CHILD(n, 2));
        start = 4;
    }
    seq = [];
    for (i = start, j = 0; i < NCH(n); i += 2, ++j) {
        seq[j] = astForExpr(c, CHILD(n, i));
    }
    nl = (CHILD(n, NCH(n) - 1)).type === TOK.T_COMMA ? false : true;
    return new Print(dest, seq, nl, n.lineno, n.col_offset);
}

function astForStmt (c, n) {
    var ch;
    if (n.type === SYM.stmt) {
        goog.asserts.assert(NCH(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.simple_stmt) {
        goog.asserts.assert(numStmts(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.small_stmt) {
        REQ(n, SYM.small_stmt);
        n = CHILD(n, 0);
        /* small_stmt: expr_stmt | print_stmt  | del_stmt | pass_stmt
         | flow_stmt | import_stmt | global_stmt | exec_stmt
         | assert_stmt
         */
        switch (n.type) {
            case SYM.expr_stmt:
                return astForExprStmt(c, n);
            case SYM.print_stmt:
                return astForPrintStmt(c, n);
            case SYM.del_stmt:
                return astForDelStmt(c, n);
            case SYM.pass_stmt:
                return new Pass(n.lineno, n.col_offset);
            case SYM.flow_stmt:
                return astForFlowStmt(c, n);
            case SYM.import_stmt:
                return astForImportStmt(c, n);
            case SYM.global_stmt:
                return astForGlobalStmt(c, n);
            case SYM.exec_stmt:
                return astForExecStmt(c, n);
            case SYM.assert_stmt:
                return astForAssertStmt(c, n);
            case SYM.debugger_stmt:
                return new Debugger_(n.lineno, n.col_offset);
            default:
                goog.asserts.fail("unhandled small_stmt");
        }
    }
    else {
        /* compound_stmt: if_stmt | while_stmt | for_stmt | try_stmt
         | funcdef | classdef | decorated
         */
        ch = CHILD(n, 0);
        REQ(n, SYM.compound_stmt);
        switch (ch.type) {
            case SYM.if_stmt:
                return astForIfStmt(c, ch);
            case SYM.while_stmt:
                return astForWhileStmt(c, ch);
            case SYM.for_stmt:
                return astForForStmt(c, ch);
            case SYM.try_stmt:
                return astForTryStmt(c, ch);
            case SYM.with_stmt:
                return astForWithStmt(c, ch);
            case SYM.funcdef:
                return astForFuncdef(c, ch, []);
            case SYM.classdef:
                return astForClassdef(c, ch, []);
            case SYM.decorated:
                return astForDecorated(c, ch);
            default:
                goog.asserts.assert("unhandled compound_stmt");
        }
    }
}

Sk.astFromParse = function (n, filename, c_flags) {
    var j;
    var num;
    var ch;
    var i;
    var c = new Compiling("utf-8", filename, c_flags);
    var stmts = [];
    var k = 0;
    switch (n.type) {
        case SYM.file_input:
            for (i = 0; i < NCH(n) - 1; ++i) {
                ch = CHILD(n, i);
                if (n.type === TOK.T_NEWLINE) {
                    continue;
                }
                REQ(ch, SYM.stmt);
                num = numStmts(ch);
                if (num === 1) {
                    stmts[k++] = astForStmt(c, ch);
                }
                else {
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.simple_stmt);
                    for (j = 0; j < num; ++j) {
                        stmts[k++] = astForStmt(c, CHILD(ch, j * 2));
                    }
                }
            }
            return new Module(stmts);
        case SYM.eval_input:
            goog.asserts.fail("todo;");
        case SYM.single_input:
            goog.asserts.fail("todo;");
        default:
            goog.asserts.fail("todo;");
    }
};

Sk.astDump = function (node) {
    var spaces = function (n) // todo; blurgh
    {
        var i;
        var ret = "";
        for (i = 0; i < n; ++i) {
            ret += " ";
        }
        return ret;
    };

    var _format = function (node, indent) {
        var ret;
        var elemsstr;
        var x;
        var elems;
        var fieldstr;
        var field;
        var attrs;
        var fieldlen;
        var b;
        var a;
        var i;
        var fields;
        var namelen;
        if (node === null) {
            return indent + "None";
        }
        else if (node.prototype && node.prototype._astname !== undefined && node.prototype._isenum) {
            return indent + node.prototype._astname + "()";
        }
        else if (node._astname !== undefined) {
            namelen = spaces(node._astname.length + 1);
            fields = [];
            for (i = 0; i < node._fields.length; i += 2) // iter_fields
            {
                a = node._fields[i]; // field name
                b = node._fields[i + 1](node); // field getter func
                fieldlen = spaces(a.length + 1);
                fields.push([a, _format(b, indent + namelen + fieldlen)]);
            }
            attrs = [];
            for (i = 0; i < fields.length; ++i) {
                field = fields[i];
                attrs.push(field[0] + "=" + field[1].replace(/^\s+/, ""));
            }
            fieldstr = attrs.join(",\n" + indent + namelen);
            return indent + node._astname + "(" + fieldstr + ")";
        }
        else if (goog.isArrayLike(node)) {
            //Sk.debugout("arr", node.length);
            elems = [];
            for (i = 0; i < node.length; ++i) {
                x = node[i];
                elems.push(_format(x, indent + " "));
            }
            elemsstr = elems.join(",\n");
            return indent + "[" + elemsstr.replace(/^\s+/, "") + "]";
        }
        else {
            if (node === true) {
                ret = "True";
            }
            else if (node === false) {
                ret = "False";
            }
            else if (node instanceof Sk.builtin.lng) {
                ret = node.tp$str().v;
            }
            else if (node instanceof Sk.builtin.str) {
                ret = node["$r"]().v;
            }
            else {
                ret = "" + node;
            }
            return indent + ret;
        }
    };

    return _format(node, "");
};

goog.exportSymbol("Sk.astFromParse", Sk.astFromParse);
goog.exportSymbol("Sk.astDump", Sk.astDump);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/symtable.js ---- */ 

/* Flags for def-use information */

var DEF_GLOBAL = 1;
/* global stmt */
var DEF_LOCAL = 2;
/* assignment in code block */
var DEF_PARAM = 2 << 1;
/* formal parameter */
var USE = 2 << 2;
/* name is used */
var DEF_STAR = 2 << 3;
/* parameter is star arg */
var DEF_DOUBLESTAR = 2 << 4;
/* parameter is star-star arg */
var DEF_INTUPLE = 2 << 5;
/* name defined in tuple in parameters */
var DEF_FREE = 2 << 6;
/* name used but not defined in nested block */
var DEF_FREE_GLOBAL = 2 << 7;
/* free variable is actually implicit global */
var DEF_FREE_CLASS = 2 << 8;
/* free variable from class's method */
var DEF_IMPORT = 2 << 9;
/* assignment occurred via import */

var DEF_BOUND = (DEF_LOCAL | DEF_PARAM | DEF_IMPORT);

/* GLOBAL_EXPLICIT and GLOBAL_IMPLICIT are used internally by the symbol
 table.  GLOBAL is returned from PyST_GetScope() for either of them.
 It is stored in ste_symbols at bits 12-14.
 */
var SCOPE_OFF = 11;
var SCOPE_MASK = 7;

var LOCAL = 1;
var GLOBAL_EXPLICIT = 2;
var GLOBAL_IMPLICIT = 3;
var FREE = 4;
var CELL = 5;

/* The following three names are used for the ste_unoptimized bit field */
var OPT_IMPORT_STAR = 1;
var OPT_EXEC = 2;
var OPT_BARE_EXEC = 4;
var OPT_TOPLEVEL = 8;
/* top-level names, including eval and exec */

var GENERATOR = 2;
var GENERATOR_EXPRESSION = 2;

var ModuleBlock = "module";
var FunctionBlock = "function";
var ClassBlock = "class";

/**
 * @constructor
 * @param {string} name
 * @param {number} flags
 * @param {Array.<SymbolTableScope>} namespaces
 */
function Symbol (name, flags, namespaces) {
    this.__name = name;
    this.__flags = flags;
    this.__scope = (flags >> SCOPE_OFF) & SCOPE_MASK;
    this.__namespaces = namespaces || [];
}
Symbol.prototype.get_name = function () {
    return this.__name;
};
Symbol.prototype.is_referenced = function () {
    return !!(this.__flags & USE);
};
Symbol.prototype.is_parameter = function () {
    return !!(this.__flags & DEF_PARAM);
};
Symbol.prototype.is_global = function () {
    return this.__scope === GLOBAL_IMPLICIT || this.__scope == GLOBAL_EXPLICIT;
};
Symbol.prototype.is_declared_global = function () {
    return this.__scope == GLOBAL_EXPLICIT;
};
Symbol.prototype.is_local = function () {
    return !!(this.__flags & DEF_BOUND);
};
Symbol.prototype.is_free = function () {
    return this.__scope == FREE;
};
Symbol.prototype.is_imported = function () {
    return !!(this.__flags & DEF_IMPORT);
};
Symbol.prototype.is_assigned = function () {
    return !!(this.__flags & DEF_LOCAL);
};
Symbol.prototype.is_namespace = function () {
    return this.__namespaces && this.__namespaces.length > 0;
};
Symbol.prototype.get_namespaces = function () {
    return this.__namespaces;
};

var astScopeCounter = 0;

/**
 * @constructor
 * @param {SymbolTable} table
 * @param {string} name
 * @param {string} type
 * @param {number} lineno
 */
function SymbolTableScope (table, name, type, ast, lineno) {
    this.symFlags = {};
    this.name = name;
    this.varnames = [];
    this.children = [];
    this.blockType = type;

    this.isNested = false;
    this.hasFree = false;
    this.childHasFree = false;  // true if child block has free vars including free refs to globals
    this.generator = false;
    this.varargs = false;
    this.varkeywords = false;
    this.returnsValue = false;

    this.lineno = lineno;

    this.table = table;

    if (table.cur && (table.cur.nested || table.cur.blockType === FunctionBlock)) {
        this.isNested = true;
    }

    ast.scopeId = astScopeCounter++;
    table.stss[ast.scopeId] = this;

    // cache of Symbols for returning to other parts of code
    this.symbols = {};
}
SymbolTableScope.prototype.get_type = function () {
    return this.blockType;
};
SymbolTableScope.prototype.get_name = function () {
    return this.name;
};
SymbolTableScope.prototype.get_lineno = function () {
    return this.lineno;
};
SymbolTableScope.prototype.is_nested = function () {
    return this.isNested;
};
SymbolTableScope.prototype.has_children = function () {
    return this.children.length > 0;
};
SymbolTableScope.prototype.get_identifiers = function () {
    return this._identsMatching(function () {
        return true;
    });
};
SymbolTableScope.prototype.lookup = function (name) {
    var namespaces;
    var flags;
    var sym;
    if (!this.symbols.hasOwnProperty(name)) {
        flags = this.symFlags[name];
        namespaces = this.__check_children(name);
        sym = this.symbols[name] = new Symbol(name, flags, namespaces);
    }
    else {
        sym = this.symbols[name];
    }
    return sym;
};
SymbolTableScope.prototype.__check_children = function (name) {
    //print("  check_children:", name);
    var child;
    var i;
    var ret = [];
    for (i = 0; i < this.children.length; ++i) {
        child = this.children[i];
        if (child.name === name) {
            ret.push(child);
        }
    }
    return ret;
};

SymbolTableScope.prototype._identsMatching = function (f) {
    var k;
    var ret = [];
    for (k in this.symFlags) {
        if (this.symFlags.hasOwnProperty(k)) {
            if (f(this.symFlags[k])) {
                ret.push(k);
            }
        }
    }
    ret.sort();
    return ret;
};
SymbolTableScope.prototype.get_parameters = function () {
    goog.asserts.assert(this.get_type() == "function", "get_parameters only valid for function scopes");
    if (!this._funcParams) {
        this._funcParams = this._identsMatching(function (x) {
            return x & DEF_PARAM;
        });
    }
    return this._funcParams;
};
SymbolTableScope.prototype.get_locals = function () {
    goog.asserts.assert(this.get_type() == "function", "get_locals only valid for function scopes");
    if (!this._funcLocals) {
        this._funcLocals = this._identsMatching(function (x) {
            return x & DEF_BOUND;
        });
    }
    return this._funcLocals;
};
SymbolTableScope.prototype.get_globals = function () {
    goog.asserts.assert(this.get_type() == "function", "get_globals only valid for function scopes");
    if (!this._funcGlobals) {
        this._funcGlobals = this._identsMatching(function (x) {
            var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
            return masked == GLOBAL_IMPLICIT || masked == GLOBAL_EXPLICIT;
        });
    }
    return this._funcGlobals;
};
SymbolTableScope.prototype.get_frees = function () {
    goog.asserts.assert(this.get_type() == "function", "get_frees only valid for function scopes");
    if (!this._funcFrees) {
        this._funcFrees = this._identsMatching(function (x) {
            var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
            return masked == FREE;
        });
    }
    return this._funcFrees;
};
SymbolTableScope.prototype.get_methods = function () {
    var i;
    var all;
    goog.asserts.assert(this.get_type() == "class", "get_methods only valid for class scopes");
    if (!this._classMethods) {
        // todo; uniq?
        all = [];
        for (i = 0; i < this.children.length; ++i) {
            all.push(this.children[i].name);
        }
        all.sort();
        this._classMethods = all;
    }
    return this._classMethods;
};
SymbolTableScope.prototype.getScope = function (name) {
    //print("getScope");
    //for (var k in this.symFlags) print(k);
    var v = this.symFlags[name];
    if (v === undefined) {
        return 0;
    }
    return (v >> SCOPE_OFF) & SCOPE_MASK;
};

/**
 * @constructor
 * @param {string} filename
 */
function SymbolTable (filename) {
    this.filename = filename;
    this.cur = null;
    this.top = null;
    this.stack = [];
    this.global = null; // points at top level module symFlags
    this.curClass = null; // current class or null
    this.tmpname = 0;

    // mapping from ast nodes to their scope if they have one. we add an
    // id to the ast node when a scope is created for it, and store it in
    // here for the compiler to lookup later.
    this.stss = {};
}
SymbolTable.prototype.getStsForAst = function (ast) {
    var v;
    goog.asserts.assert(ast.scopeId !== undefined, "ast wasn't added to st?");
    v = this.stss[ast.scopeId];
    goog.asserts.assert(v !== undefined, "unknown sym tab entry");
    return v;
};

SymbolTable.prototype.SEQStmt = function (nodes) {
    var val;
    var i;
    var len;
    goog.asserts.assert(goog.isArrayLike(nodes), "SEQ: nodes isn't array? got %s", nodes);
    len = nodes.length;
    for (i = 0; i < len; ++i) {
        val = nodes[i];
        if (val) {
            this.visitStmt(val);
        }
    }
};
SymbolTable.prototype.SEQExpr = function (nodes) {
    var val;
    var i;
    var len;
    goog.asserts.assert(goog.isArrayLike(nodes), "SEQ: nodes isn't array? got %s", nodes);
    len = nodes.length;
    for (i = 0; i < len; ++i) {
        val = nodes[i];
        if (val) {
            this.visitExpr(val);
        }
    }
};

SymbolTable.prototype.enterBlock = function (name, blockType, ast, lineno) {
    var prev;
    name = fixReservedNames(name);
    //print("enterBlock:", name);
    prev = null;
    if (this.cur) {
        prev = this.cur;
        this.stack.push(this.cur);
    }
    this.cur = new SymbolTableScope(this, name, blockType, ast, lineno);
    if (name === "top") {
        this.global = this.cur.symFlags;
    }
    if (prev) {
        //print("    adding", this.cur.name, "to", prev.name);
        prev.children.push(this.cur);
    }
};

SymbolTable.prototype.exitBlock = function () {
    //print("exitBlock");
    this.cur = null;
    if (this.stack.length > 0) {
        this.cur = this.stack.pop();
    }
};

SymbolTable.prototype.visitParams = function (args, toplevel) {
    var arg;
    var i;
    for (i = 0; i < args.length; ++i) {
        arg = args[i];
        if (arg.constructor === Name) {
            goog.asserts.assert(arg.ctx === Param || (arg.ctx === Store && !toplevel));
            this.addDef(arg.id, DEF_PARAM, arg.lineno);
        }
        else {
            // Tuple isn't supported
            throw new Sk.builtin.SyntaxError("invalid expression in parameter list", this.filename);
        }
    }
};

SymbolTable.prototype.visitArguments = function (a, lineno) {
    if (a.args) {
        this.visitParams(a.args, true);
    }
    if (a.vararg) {
        this.addDef(a.vararg, DEF_PARAM, lineno);
        this.cur.varargs = true;
    }
    if (a.kwarg) {
        this.addDef(a.kwarg, DEF_PARAM, lineno);
        this.cur.varkeywords = true;
    }
};

SymbolTable.prototype.newTmpname = function (lineno) {
    this.addDef(new Sk.builtin.str("_[" + (++this.tmpname) + "]"), DEF_LOCAL, lineno);
};

SymbolTable.prototype.addDef = function (name, flag, lineno) {
    var fromGlobal;
    var val;
    var mangled = mangleName(this.curClass, new Sk.builtin.str(name)).v;
    mangled = fixReservedNames(mangled);
    val = this.cur.symFlags[mangled];
    if (val !== undefined) {
        if ((flag & DEF_PARAM) && (val & DEF_PARAM)) {
            throw new Sk.builtin.SyntaxError("duplicate argument '" + name.v + "' in function definition", this.filename, lineno);
        }
        val |= flag;
    }
    else {
        val = flag;
    }
    this.cur.symFlags[mangled] = val;
    if (flag & DEF_PARAM) {
        this.cur.varnames.push(mangled);
    }
    else if (flag & DEF_GLOBAL) {
        val = flag;
        fromGlobal = this.global[mangled];
        if (fromGlobal !== undefined) {
            val |= fromGlobal;
        }
        this.global[mangled] = val;
    }
};

SymbolTable.prototype.visitSlice = function (s) {
    var i;
    switch (s.constructor) {
        case Slice:
            if (s.lower) {
                this.visitExpr(s.lower);
            }
            if (s.upper) {
                this.visitExpr(s.upper);
            }
            if (s.step) {
                this.visitExpr(s.step);
            }
            break;
        case ExtSlice:
            for (i = 0; i < s.dims.length; ++i) {
                this.visitSlice(s.dims[i]);
            }
            break;
        case Index:
            this.visitExpr(s.value);
            break;
        case Ellipsis:
            break;
    }
};

SymbolTable.prototype.visitStmt = function (s) {
    var cur;
    var name;
    var i;
    var nameslen;
    var tmp;
    goog.asserts.assert(s !== undefined, "visitStmt called with undefined");
    switch (s.constructor) {
        case FunctionDef:
            this.addDef(s.name, DEF_LOCAL, s.lineno);
            if (s.args.defaults) {
                this.SEQExpr(s.args.defaults);
            }
            if (s.decorator_list) {
                this.SEQExpr(s.decorator_list);
            }
            this.enterBlock(s.name.v, FunctionBlock, s, s.lineno);
            this.visitArguments(s.args, s.lineno);
            this.SEQStmt(s.body);
            this.exitBlock();
            break;
        case ClassDef:
            this.addDef(s.name, DEF_LOCAL, s.lineno);
            this.SEQExpr(s.bases);
            if (s.decorator_list) {
                this.SEQExpr(s.decorator_list);
            }
            this.enterBlock(s.name.v, ClassBlock, s, s.lineno);
            tmp = this.curClass;
            this.curClass = s.name;
            this.SEQStmt(s.body);
            this.exitBlock();
            break;
        case Return_:
            if (s.value) {
                this.visitExpr(s.value);
                this.cur.returnsValue = true;
                if (this.cur.generator) {
                    throw new Sk.builtin.SyntaxError("'return' with argument inside generator", this.filename);
                }
            }
            break;
        case Delete_:
            this.SEQExpr(s.targets);
            break;
        case Assign:
            this.SEQExpr(s.targets);
            this.visitExpr(s.value);
            break;
        case AugAssign:
            this.visitExpr(s.target);
            this.visitExpr(s.value);
            break;
        case Print:
            if (s.dest) {
                this.visitExpr(s.dest);
            }
            this.SEQExpr(s.values);
            break;
        case For_:
            this.visitExpr(s.target);
            this.visitExpr(s.iter);
            this.SEQStmt(s.body);
            if (s.orelse) {
                this.SEQStmt(s.orelse);
            }
            break;
        case While_:
            this.visitExpr(s.test);
            this.SEQStmt(s.body);
            if (s.orelse) {
                this.SEQStmt(s.orelse);
            }
            break;
        case If_:
            this.visitExpr(s.test);
            this.SEQStmt(s.body);
            if (s.orelse) {
                this.SEQStmt(s.orelse);
            }
            break;
        case Raise:
            if (s.type) {
                this.visitExpr(s.type);
                if (s.inst) {
                    this.visitExpr(s.inst);
                    if (s.tback) {
                        this.visitExpr(s.tback);
                    }
                }
            }
            break;
        case TryExcept:
            this.SEQStmt(s.body);
            this.SEQStmt(s.orelse);
            this.visitExcepthandlers(s.handlers);
            break;
        case TryFinally:
            this.SEQStmt(s.body);
            this.SEQStmt(s.finalbody);
            break;
        case Assert:
            this.visitExpr(s.test);
            if (s.msg) {
                this.visitExpr(s.msg);
            }
            break;
        case Import_:
        case ImportFrom:
            this.visitAlias(s.names, s.lineno);
            break;
        case Exec:
            this.visitExpr(s.body);
            if (s.globals) {
                this.visitExpr(s.globals);
                if (s.locals) {
                    this.visitExpr(s.locals);
                }
            }
            break;
        case Global:
            nameslen = s.names.length;
            for (i = 0; i < nameslen; ++i) {
                name = mangleName(this.curClass, s.names[i]).v;
                name = fixReservedNames(name);
                cur = this.cur.symFlags[name];
                if (cur & (DEF_LOCAL | USE)) {
                    if (cur & DEF_LOCAL) {
                        throw new Sk.builtin.SyntaxError("name '" + name + "' is assigned to before global declaration", this.filename, s.lineno);
                    }
                    else {
                        throw new Sk.builtin.SyntaxError("name '" + name + "' is used prior to global declaration", this.filename, s.lineno);
                    }
                }
                this.addDef(new Sk.builtin.str(name), DEF_GLOBAL, s.lineno);
            }
            break;
        case Expr:
            this.visitExpr(s.value);
            break;
        case Pass:
        case Break_:
        case Debugger_:
        case Continue_:
            // nothing
            break;
        case With_:
            this.newTmpname(s.lineno);
            this.visitExpr(s.context_expr);
            if (s.optional_vars) {
                this.newTmpname(s.lineno);
                this.visitExpr(s.optional_vars);
            }
            this.SEQStmt(s.body);
            break;

        default:
            goog.asserts.fail("Unhandled type " + s.constructor.name + " in visitStmt");
    }
};

SymbolTable.prototype.visitExpr = function (e) {
    var i;
    goog.asserts.assert(e !== undefined, "visitExpr called with undefined");
    //print("  e: ", e.constructor.name);
    switch (e.constructor) {
        case BoolOp:
            this.SEQExpr(e.values);
            break;
        case BinOp:
            this.visitExpr(e.left);
            this.visitExpr(e.right);
            break;
        case UnaryOp:
            this.visitExpr(e.operand);
            break;
        case Lambda:
            this.addDef(new Sk.builtin.str("lambda"), DEF_LOCAL, e.lineno);
            if (e.args.defaults) {
                this.SEQExpr(e.args.defaults);
            }
            this.enterBlock("lambda", FunctionBlock, e, e.lineno);
            this.visitArguments(e.args, e.lineno);
            this.visitExpr(e.body);
            this.exitBlock();
            break;
        case IfExp:
            this.visitExpr(e.test);
            this.visitExpr(e.body);
            this.visitExpr(e.orelse);
            break;
        case Dict:
            this.SEQExpr(e.keys);
            this.SEQExpr(e.values);
            break;
        case DictComp:
        case SetComp:    
            this.visitComprehension(e.generators, 0);
            break;
        case ListComp:
            this.newTmpname(e.lineno);
            this.visitExpr(e.elt);
            this.visitComprehension(e.generators, 0);
            break;
        case GeneratorExp:
            this.visitGenexp(e);
            break;
        case Yield:
            if (e.value) {
                this.visitExpr(e.value);
            }
            this.cur.generator = true;
            if (this.cur.returnsValue) {
                throw new Sk.builtin.SyntaxError("'return' with argument inside generator", this.filename);
            }
            break;
        case Compare:
            this.visitExpr(e.left);
            this.SEQExpr(e.comparators);
            break;
        case Call:
            this.visitExpr(e.func);
            this.SEQExpr(e.args);
            for (i = 0; i < e.keywords.length; ++i) {
                this.visitExpr(e.keywords[i].value);
            }
            //print(JSON.stringify(e.starargs, null, 2));
            //print(JSON.stringify(e.kwargs, null,2));
            if (e.starargs) {
                this.visitExpr(e.starargs);
            }
            if (e.kwargs) {
                this.visitExpr(e.kwargs);
            }
            break;
        case Num:
        case Str:
            break;
        case Attribute:
            this.visitExpr(e.value);
            break;
        case Subscript:
            this.visitExpr(e.value);
            this.visitSlice(e.slice);
            break;
        case Name:
            this.addDef(e.id, e.ctx === Load ? USE : DEF_LOCAL, e.lineno);
            break;
        case List:
        case Tuple:
        case Set:
            this.SEQExpr(e.elts);
            break;
        default:
            goog.asserts.fail("Unhandled type " + e.constructor.name + " in visitExpr");
    }
};

SymbolTable.prototype.visitComprehension = function (lcs, startAt) {
    var lc;
    var i;
    var len = lcs.length;
    for (i = startAt; i < len; ++i) {
        lc = lcs[i];
        this.visitExpr(lc.target);
        this.visitExpr(lc.iter);
        this.SEQExpr(lc.ifs);
    }
};

SymbolTable.prototype.visitAlias = function (names, lineno) {
    /* Compute store_name, the name actually bound by the import
     operation.  It is diferent than a->name when a->name is a
     dotted package name (e.g. spam.eggs)
     */
    var dot;
    var storename;
    var name;
    var a;
    var i;
    for (i = 0; i < names.length; ++i) {
        a = names[i];
        name = a.asname === null ? a.name.v : a.asname.v;
        storename = name;
        dot = name.indexOf(".");
        if (dot !== -1) {
            storename = name.substr(0, dot);
        }
        if (name !== "*") {
            this.addDef(new Sk.builtin.str(storename), DEF_IMPORT, lineno);
        }
        else {
            if (this.cur.blockType !== ModuleBlock) {
                throw new Sk.builtin.SyntaxError("import * only allowed at module level", this.filename);
            }
        }
    }
};

SymbolTable.prototype.visitGenexp = function (e) {
    var outermost = e.generators[0];
    // outermost is evaled in current scope
    this.visitExpr(outermost.iter);
    this.enterBlock("genexpr", FunctionBlock, e, e.lineno);
    this.cur.generator = true;
    this.addDef(new Sk.builtin.str(".0"), DEF_PARAM, e.lineno);
    this.visitExpr(outermost.target);
    this.SEQExpr(outermost.ifs);
    this.visitComprehension(e.generators, 1);
    this.visitExpr(e.elt);
    this.exitBlock();
};

SymbolTable.prototype.visitExcepthandlers = function (handlers) {
    var i, eh;
    for (i = 0; eh = handlers[i]; ++i) {
        if (eh.type) {
            this.visitExpr(eh.type);
        }
        if (eh.name) {
            this.visitExpr(eh.name);
        }
        this.SEQStmt(eh.body);
    }
};

function _dictUpdate (a, b) {
    var kb;
    for (kb in b) {
        a[kb] = b[kb];
    }
}

SymbolTable.prototype.analyzeBlock = function (ste, bound, free, global) {
    var c;
    var i;
    var childlen;
    var allfree;
    var flags;
    var name;
    var local = {};
    var scope = {};
    var newglobal = {};
    var newbound = {};
    var newfree = {};

    if (ste.blockType == ClassBlock) {
        _dictUpdate(newglobal, global);
        if (bound) {
            _dictUpdate(newbound, bound);
        }
    }

    for (name in ste.symFlags) {
        flags = ste.symFlags[name];
        this.analyzeName(ste, scope, name, flags, bound, local, free, global);
    }

    if (ste.blockType !== ClassBlock) {
        if (ste.blockType === FunctionBlock) {
            _dictUpdate(newbound, local);
        }
        if (bound) {
            _dictUpdate(newbound, bound);
        }
        _dictUpdate(newglobal, global);
    }

    allfree = {};
    childlen = ste.children.length;
    for (i = 0; i < childlen; ++i) {
        c = ste.children[i];
        this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
        if (c.hasFree || c.childHasFree) {
            ste.childHasFree = true;
        }
    }

    _dictUpdate(newfree, allfree);
    if (ste.blockType === FunctionBlock) {
        this.analyzeCells(scope, newfree);
    }
    this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === ClassBlock);

    _dictUpdate(free, newfree);
};

SymbolTable.prototype.analyzeChildBlock = function (entry, bound, free, global, childFree) {
    var tempGlobal;
    var tempFree;
    var tempBound = {};
    _dictUpdate(tempBound, bound);
    tempFree = {};
    _dictUpdate(tempFree, free);
    tempGlobal = {};
    _dictUpdate(tempGlobal, global);

    this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
    _dictUpdate(childFree, tempFree);
};

SymbolTable.prototype.analyzeCells = function (scope, free) {
    var flags;
    var name;
    for (name in scope) {
        flags = scope[name];
        if (flags !== LOCAL) {
            continue;
        }
        if (free[name] === undefined) {
            continue;
        }
        scope[name] = CELL;
        delete free[name];
    }
};

/**
 * store scope info back into the st symbols dict. symbols is modified,
 * others are not.
 */
SymbolTable.prototype.updateSymbols = function (symbols, scope, bound, free, classflag) {
    var i;
    var o;
    var pos;
    var freeValue;
    var w;
    var flags;
    var name;
    for (name in symbols) {
        flags = symbols[name];
        w = scope[name];
        flags |= w << SCOPE_OFF;
        symbols[name] = flags;
    }

    freeValue = FREE << SCOPE_OFF;
    pos = 0;
    for (name in free) {
        o = symbols[name];
        if (o !== undefined) {
            // it could be a free variable in a method of the class that has
            // the same name as a local or global in the class scope
            if (classflag && (o & (DEF_BOUND | DEF_GLOBAL))) {
                i = o | DEF_FREE_CLASS;
                symbols[name] = i;
            }
            // else it's not free, probably a cell
            continue;
        }
        if (bound[name] === undefined) {
            continue;
        }
        symbols[name] = freeValue;
    }
};

SymbolTable.prototype.analyzeName = function (ste, dict, name, flags, bound, local, free, global) {
    if (flags & DEF_GLOBAL) {
        if (flags & DEF_PARAM) {
            throw new Sk.builtin.SyntaxError("name '" + name + "' is local and global", this.filename, ste.lineno);
        }
        dict[name] = GLOBAL_EXPLICIT;
        global[name] = null;
        if (bound && bound[name] !== undefined) {
            delete bound[name];
        }
        return;
    }
    if (flags & DEF_BOUND) {
        dict[name] = LOCAL;
        local[name] = null;
        delete global[name];
        return;
    }

    if (bound && bound[name] !== undefined) {
        dict[name] = FREE;
        ste.hasFree = true;
        free[name] = null;
    }
    else if (global && global[name] !== undefined) {
        dict[name] = GLOBAL_IMPLICIT;
    }
    else {
        if (ste.isNested) {
            ste.hasFree = true;
        }
        dict[name] = GLOBAL_IMPLICIT;
    }
};

SymbolTable.prototype.analyze = function () {
    var free = {};
    var global = {};
    this.analyzeBlock(this.top, null, free, global);
};

/**
 * @param {Object} ast
 * @param {string} filename
 */
Sk.symboltable = function (ast, filename) {
    var i;
    var ret = new SymbolTable(filename);

    ret.enterBlock("top", ModuleBlock, ast, 0);
    ret.top = ret.cur;

    //print(Sk.astDump(ast));
    for (i = 0; i < ast.body.length; ++i) {
        ret.visitStmt(ast.body[i]);
    }

    ret.exitBlock();

    ret.analyze();

    return ret;
};

Sk.dumpSymtab = function (st) {
    var pyBoolStr = function (b) {
        return b ? "True" : "False";
    }
    var pyList = function (l) {
        var i;
        var ret = [];
        for (i = 0; i < l.length; ++i) {
            ret.push(new Sk.builtin.str(l[i])["$r"]().v);
        }
        return "[" + ret.join(", ") + "]";
    };
    var getIdents = function (obj, indent) {
        var ns;
        var j;
        var sub;
        var nsslen;
        var nss;
        var info;
        var i;
        var objidentslen;
        var objidents;
        var ret;
        if (indent === undefined) {
            indent = "";
        }
        ret = "";
        ret += indent + "Sym_type: " + obj.get_type() + "\n";
        ret += indent + "Sym_name: " + obj.get_name() + "\n";
        ret += indent + "Sym_lineno: " + obj.get_lineno() + "\n";
        ret += indent + "Sym_nested: " + pyBoolStr(obj.is_nested()) + "\n";
        ret += indent + "Sym_haschildren: " + pyBoolStr(obj.has_children()) + "\n";
        if (obj.get_type() === "class") {
            ret += indent + "Class_methods: " + pyList(obj.get_methods()) + "\n";
        }
        else if (obj.get_type() === "function") {
            ret += indent + "Func_params: " + pyList(obj.get_parameters()) + "\n";
            ret += indent + "Func_locals: " + pyList(obj.get_locals()) + "\n";
            ret += indent + "Func_globals: " + pyList(obj.get_globals()) + "\n";
            ret += indent + "Func_frees: " + pyList(obj.get_frees()) + "\n";
        }
        ret += indent + "-- Identifiers --\n";
        objidents = obj.get_identifiers();
        objidentslen = objidents.length;
        for (i = 0; i < objidentslen; ++i) {
            info = obj.lookup(objidents[i]);
            ret += indent + "name: " + info.get_name() + "\n";
            ret += indent + "  is_referenced: " + pyBoolStr(info.is_referenced()) + "\n";
            ret += indent + "  is_imported: " + pyBoolStr(info.is_imported()) + "\n";
            ret += indent + "  is_parameter: " + pyBoolStr(info.is_parameter()) + "\n";
            ret += indent + "  is_global: " + pyBoolStr(info.is_global()) + "\n";
            ret += indent + "  is_declared_global: " + pyBoolStr(info.is_declared_global()) + "\n";
            ret += indent + "  is_local: " + pyBoolStr(info.is_local()) + "\n";
            ret += indent + "  is_free: " + pyBoolStr(info.is_free()) + "\n";
            ret += indent + "  is_assigned: " + pyBoolStr(info.is_assigned()) + "\n";
            ret += indent + "  is_namespace: " + pyBoolStr(info.is_namespace()) + "\n";
            nss = info.get_namespaces();
            nsslen = nss.length;
            ret += indent + "  namespaces: [\n";
            sub = [];
            for (j = 0; j < nsslen; ++j) {
                ns = nss[j];
                sub.push(getIdents(ns, indent + "    "));
            }
            ret += sub.join("\n");
            ret += indent + "  ]\n";
        }
        return ret;
    };
    return getIdents(st.top, "");
};

goog.exportSymbol("Sk.symboltable", Sk.symboltable);
goog.exportSymbol("Sk.dumpSymtab", Sk.dumpSymtab);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/import.js ---- */ 

/**
 * @namespace Sk
 *
 */

// this is stored into sys specially, rather than created by sys
Sk.sysmodules = new Sk.builtin.dict([]);
Sk.realsyspath = undefined;
Sk.externalLibraryCache = {};

Sk.loadExternalLibraryInternal_ = function (path, inject) {
    var scriptElement;
    var request, result;

    if (path == null) {
        return void(0);
    }

    if (Sk.externalLibraryCache[path]) {
        return Sk.externalLibraryCache[path];
    }

    request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send();

    if (request.status !== 200) {
        return void(0);
    }

    result = request.responseText;

    if (inject) {
        scriptElement = document.createElement("script");
        scriptElement.type = "text/javascript";
        scriptElement.text = result;
        document.getElementsByTagName("head")[0].appendChild(scriptElement);
    }

    return result;
};

Sk.loadExternalLibrary = function (name) {
    var i;
    var externalLibraryInfo, path,  module,
        dependencies, dep, ext, extMatch, co;

    // check if the library has already been loaded and cached
    if (Sk.externalLibraryCache[name]) {
        return Sk.externalLibraryCache[name];
    }

    externalLibraryInfo = Sk.externalLibraries && Sk.externalLibraries[name];

    // if no external library info can be found, bail out
    if (!externalLibraryInfo) {
        return void(0);
    }

    // if the external library info is just a string, assume it is the path
    // otherwise dig into the info to find the path
    path = typeof externalLibraryInfo === "string" ?
        externalLibraryInfo :
        externalLibraryInfo.path;

    if (typeof path !== "string") {
        throw new Sk.builtin.ImportError("Invalid path specified for " + name);
    }

    // attempt to determine the type of the library (js or py)
    // which is either specified explicitly in the library info
    // or inferred from the file extension
    ext = externalLibraryInfo.type;
    if (!ext) {
        extMatch = path.match(/\.(js|py)$/);
        ext = extMatch && extMatch[1];
    }

    if (!ext) {
        throw new Sk.builtin.ImportError("Invalid file extension specified for " + name);
    }

    module = Sk.loadExternalLibraryInternal_(path, false);

    if (!module) {
        throw new Sk.builtin.ImportError("Failed to load remote module '" + name + "'");
    }

    // if the library has any js dependencies, load them in now
    dependencies = externalLibraryInfo.dependencies;
    if (dependencies && dependencies.length) {
        for (i = 0; i < dependencies.length; i++) {
            dep = Sk.loadExternalLibraryInternal_(dependencies[i], true);
            if (!dep) {
                throw new Sk.builtin.ImportError("Failed to load dependencies required for " + name);
            }
        }
    }

    if (ext === "js") {
        co = { funcname: "$builtinmodule", code: module };
    } else {
        co = Sk.compile(module, path, "exec", true);
    }

    Sk.externalLibraryCache[name] = co;

    return co;
};

/**
 * @param {string} name to look for
 * @param {string} ext extension to use (.py or .js)
 * @param {boolean=} failok will throw if not true
 * @param {boolean=} canSuspend can we suspend?
 * @param {string=} currentDir if any
 */
Sk.importSearchPathForName = function (name, ext, failok, canSuspend, currentDir) {
    var fn;
    var j;
    var fns = [];
    var nameAsPath = name.replace(/\./g, "/");
    var L = Sk.realsyspath;
    var it, i;

    for (it = L.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        fns.push(i.v + "/" + nameAsPath + ext);                 // module
        fns.push(i.v + "/" + nameAsPath + "/__init__" + ext);   // package
    }

    fns.push(currentDir + "/" + nameAsPath + ext);
    fns.push(currentDir + "/" + nameAsPath + "/__init__" + ext);

    j = 0;

    return (function tryNextPath() {
        var handleRead = function handleRead(s) {
            var ns;
            if (s instanceof Sk.misceval.Suspension) {
                ns = new Sk.misceval.Suspension(undefined, s);
                ns.resume = function() {
                    try {
                        return handleRead(s.resume());
                    } catch (e) {
                        j++;
                        return tryNextPath();
                    }
                };
                return ns;
            } else {
                return {filename: fns[j], code: s};
            }
        };
        var s;

        while (j < fns.length) {
            // Ew, this is the only way to check for existence.
            // Even worse, it reports non-existence through exceptions, so we have to
            // write a custom resume() function to catch downstream exceptions and interpret
            // them as "file not found, move on".
            try {
                s = Sk.read(fns[j]);

                if (!canSuspend) {
                    s = Sk.misceval.retryOptionalSuspensionOrThrow(s);
                }

                return handleRead(s);
            } catch (e) {
                j++;
            }
        }

        if (failok) {
            return null;
        } else {
            throw new Sk.builtin.ImportError("No module named " + name);
        }
    })();
};

/**
 * Complete any initialization of Python classes which relies on internal
 * dependencies.
 *
 * This includes making Python classes subclassable and ensuring that the
 * {@link Sk.builtin.object} magic methods are wrapped inside Python functions.
 *
 * @return {undefined}
 */
Sk.doOneTimeInitialization = function () {
    var proto, name, i, x, func;
    var builtins = [];

    // can't fill these out when making the type because tuple/dict aren't
    // defined yet.
    Sk.builtin.type.basesStr_ = new Sk.builtin.str("__bases__");
    Sk.builtin.type.mroStr_ = new Sk.builtin.str("__mro__");

    // Register a Python class with an internal dictionary, which allows it to
    // be subclassed
    var setUpClass = function (child) {
        var parent = child.tp$base;
        var bases = [];
        var base;

        for (base = parent; base !== undefined; base = base.tp$base) {
            bases.push(base);
        }

        child["$d"] = new Sk.builtin.dict([]);
        child["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple(bases));
        child["$d"].mp$ass_subscript(Sk.builtin.type.mroStr_, new Sk.builtin.tuple([child]));
    };

    for (x in Sk.builtin) {
        func = Sk.builtin[x];
        if ((func.prototype instanceof Sk.builtin.object ||
             func === Sk.builtin.object) && !func.sk$abstract) {
            setUpClass(func);
        }
    }

    // Wrap the inner Javascript code of Sk.builtin.object's Python methods inside
    // Sk.builtin.func, as that class was undefined when these functions were declared
    proto = Sk.builtin.object.prototype;

    for (i = 0; i < Sk.builtin.object.pythonFunctions.length; i++) {
        name = Sk.builtin.object.pythonFunctions[i];

        if (proto[name] instanceof Sk.builtin.func) {
            // If functions have already been initialized, do not wrap again.
            break;
        }

        proto[name] = new Sk.builtin.func(proto[name]);
    }
};

/**
 * currently only pull once from Sk.syspath. User might want to change
 * from js or from py.
 */
Sk.importSetUpPath = function () {
    var i;
    var paths;
    if (!Sk.realsyspath) {
        paths = [
            new Sk.builtin.str("src/builtin"),
            new Sk.builtin.str("src/lib"),
            new Sk.builtin.str(".")
        ];
        for (i = 0; i < Sk.syspath.length; ++i) {
            paths.push(new Sk.builtin.str(Sk.syspath[i]));
        }
        Sk.realsyspath = new Sk.builtin.list(paths);

        Sk.doOneTimeInitialization();
    }
};

if (COMPILED) {
    var js_beautify = function (x) {
        return x;
    };
}

/**
 * @param {string} name name of module to import
 * @param {boolean=} dumpJS whether to output the generated js code
 * @param {string=} modname what to call the module after it's imported if
 * it's to be renamed (i.e. __main__)
 * @param {string=} suppliedPyBody use as the body of the text for the module
 * rather than Sk.read'ing it.
 * @param {boolean=} canSuspend whether we may return a Suspension object
 * @param {string=} currentDir directory to import from
 */
Sk.importModuleInternal_ = function (name, dumpJS, modname, suppliedPyBody, canSuspend, currentDir) {
    //dumpJS = true;
    var parentModule;
    var modlocs;
    var namestr;
    var withLineNumbers;
    var finalcode;
    var result;
    var filename, codeAndPath, co, isPy, googClosure, external;
    var module;
    var prev;
    var parentModName;
    var modNameSplit;
    var toReturn;
    Sk.importSetUpPath();

    // if no module name override, supplied, use default name
    if (modname === undefined) {
        modname = name;
    }

    toReturn = null;
    modNameSplit = modname.split(".");

    // if leaf is already in sys.modules, early out
    try {
        prev = Sk.sysmodules.mp$subscript(modname);
        // if we're a dotted module, return the top level, otherwise ourselves
        if (modNameSplit.length > 1) {
            return Sk.sysmodules.mp$subscript(modNameSplit[0]);
        } else {
            return prev;
        }
    } catch (x) {
        // not in sys.modules, continue
    }

    if (modNameSplit.length > 1) {
        // if we're a module inside a package (i.e. a.b.c), then we'll need to return the
        // top-level package ('a'). recurse upwards on our parent, importing
        // all parent packages. so, here we're importing 'a.b', which will in
        // turn import 'a', and then return 'a' eventually.
        parentModName = modNameSplit.slice(0, modNameSplit.length - 1).join(".");
        toReturn = Sk.importModuleInternal_(parentModName, dumpJS, undefined, undefined, canSuspend, currentDir);

        // If this suspends, we suspend. When that suspension is done, we can just
        // repeat this whole function call
        if (toReturn instanceof Sk.misceval.Suspension) {
            // no canSuspend check here; we'll only get a Suspension out of importModuleInternal_ if
            // canSuspend is true anyway
            return (function waitForPreviousLoad(susp) {
                if (susp instanceof Sk.misceval.Suspension) {
                    // They're still going
                    return new Sk.misceval.Suspension(waitForPreviousLoad, susp);
                } else {
                    // They're done!
                    // Re-call ourselves, and this time "toReturn = Sk.importModuleInternal_(...)"
                    // will hit the cache and complete immediately.
                    return Sk.importModuleInternal_(name, dumpJS, modname, suppliedPyBody, canSuspend, currentDir);
                }
            })(toReturn);
        }
    }

    // otherwise:
    // - create module object
    // - add module object to sys.modules
    // - compile source to (function(){...});
    // - run module and set the module locals returned to the module __dict__
    module = new Sk.builtin.module();
    Sk.sysmodules.mp$ass_subscript(name, module);

    if (suppliedPyBody) {
        filename = name + ".py";
        co = Sk.compile(suppliedPyBody, filename, "exec", canSuspend);
    } else {
        // If an onBeforeImport method is supplied, call it and if
        // the result is false or a string, prevent the import.
        // This allows for a user to conditionally prevent the usage
        // of certain libraries.
        if (Sk.onBeforeImport && typeof Sk.onBeforeImport === "function") {
            result = Sk.onBeforeImport(name);
            if (result === false) {
                throw new Sk.builtin.ImportError("Importing " + name + " is not allowed");
            } else if (typeof result === "string") {
                throw new Sk.builtin.ImportError(result);
            }
        }

        // check first for an externally loaded library
        external = Sk.loadExternalLibrary(name);
        if (external) {
            co = external;
            if (Sk.externalLibraries) {
                filename = Sk.externalLibraries[name].path; // get path from config
            } else {
                filename = "unknown";
            }
            // ToDo: check if this is a dotted name or import from ...
        } else {
            // Try loading as a builtin (i.e. already in JS) module, then try .py files
            codeAndPath = Sk.importSearchPathForName(name, ".js", true, canSuspend, currentDir);

            co = (function compileReadCode(codeAndPath) {
                if (codeAndPath instanceof Sk.misceval.Suspension) {
                    return new Sk.misceval.Suspension(compileReadCode, codeAndPath);
                } else if (!codeAndPath) {
                    goog.asserts.assert(!isPy, "Sk.importReadFileFromPath did not throw when loading Python file failed");
                    isPy = true;
                    return compileReadCode(Sk.importSearchPathForName(name, ".py", false, canSuspend, currentDir));
                } else {
                    filename = codeAndPath.filename;
                    return isPy ? Sk.compile(codeAndPath.code, codeAndPath.filename, "exec", canSuspend)
                        : { funcname: "$builtinmodule", code: codeAndPath.code };
                }
            })(codeAndPath);
        }
    }

    return (function importCompiledCode(co) {

        if (co instanceof Sk.misceval.Suspension) {
            return canSuspend ? new Sk.misceval.Suspension(importCompiledCode, co) : Sk.misceval.retryOptionalSuspensionOrThrow(co);
        }

        module.$js = co.code; // todo; only in DEBUG?
        finalcode = co.code;

        if (filename == null) {
            filename = co.filename;
        }

        if (Sk.dateSet == null || !Sk.dateSet) {
            finalcode = "Sk.execStart = Sk.lastYield = new Date();\n" + co.code;
            Sk.dateSet = true;
        }

        // if (!COMPILED)
        // {
        if (dumpJS) {
            withLineNumbers = function (code) {
                var j;
                var pad;
                var width;
                var i;
                var beaut = js_beautify(code);
                var lines = beaut.split("\n");
                for (i = 1; i <= lines.length; ++i) {
                    width = ("" + i).length;
                    pad = "";
                    for (j = width; j < 5; ++j) {
                        pad += " ";
                    }
                    lines[i - 1] = "/* " + pad + i + " */ " + lines[i - 1];
                }
                return lines.join("\n");
            };
            finalcode = withLineNumbers(finalcode);
            Sk.debugout(finalcode);
        }
        // }

        namestr = "new Sk.builtin.str('" + modname + "')";
        finalcode += "\n" + co.funcname + "(" + namestr + ");";

        modlocs = goog.global["eval"](finalcode);

        return (function finishLoading(modlocs) {

            if (modlocs instanceof Sk.misceval.Suspension) {

                if (canSuspend) {
                    return new Sk.misceval.Suspension(finishLoading, modlocs);
                } else {
                    modlocs = Sk.misceval.retryOptionalSuspensionOrThrow(modlocs, "Module \""+modname+"\" suspended or blocked during load, and it was loaded somewhere that does not permit this");
                }
            }

            // pass in __name__ so the module can set it (so that the code can access
            // it), but also set it after we're done so that builtins don't have to
            // remember to do it.
            if (!modlocs["__name__"]) {
                modlocs["__name__"] = new Sk.builtin.str(modname);
            }

            modlocs["__path__"] = new Sk.builtin.str(filename);

            module["$d"] = modlocs;

            // doc string is None, when not present
            if (!modlocs["__doc__"]) {
                modlocs["__doc__"] = Sk.builtin.none.none$;
            }

            // If an onAfterImport method is defined on the global Sk
            // then call it now after a library has been successfully imported
            // and compiled.
            if (Sk.onAfterImport && typeof Sk.onAfterImport === "function") {
                try {
                    Sk.onAfterImport(name);
                } catch (e) {
                }
            }

            if (toReturn) {
                // if we were a dotted name, then we want to return the top-most
                // package. we store ourselves into our parent as an attribute
                parentModule = Sk.sysmodules.mp$subscript(parentModName);
                parentModule.tp$setattr(modNameSplit[modNameSplit.length - 1], module);
                //print("import returning parent module, modname", modname, "__name__", toReturn.tp$getattr("__name__").v);
                return toReturn;
            }

            //print("name", name, "modname", modname, "returning leaf");
            // otherwise we return the actual module that we just imported
            return module;
        })(modlocs);
    })(co);
};

/**
 * @param {string} name the module name
 * @param {boolean=} dumpJS print out the js code after compilation for debugging
 * @param {boolean=} canSuspend can this function suspend and return a Suspension object?
 */
Sk.importModule = function (name, dumpJS, canSuspend) {
    return Sk.importModuleInternal_(name, dumpJS, undefined, undefined, canSuspend);
};

Sk.importMain = function (name, dumpJS, canSuspend) {
    Sk.dateSet = false;
    Sk.filesLoaded = false;
    //	Added to reset imports
    Sk.sysmodules = new Sk.builtin.dict([]);
    Sk.realsyspath = undefined;

    Sk.resetCompiler();

    return Sk.importModuleInternal_(name, dumpJS, "__main__", undefined, canSuspend);
};

/**
 * **Run Python Code in Skulpt**
 *
 * When you want to hand Skulpt a string corresponding to a Python program this is the function.
 *
 * @param name {string}  File name to use for messages related to this run
 * @param dumpJS {boolean} print out the compiled javascript
 * @param body {string} Python Code
 * @param canSuspend {boolean}  Use Suspensions for async execution
 *
 */
Sk.importMainWithBody = function (name, dumpJS, body, canSuspend) {
    Sk.dateSet = false;
    Sk.filesLoaded = false;
    //	Added to reset imports
    Sk.sysmodules = new Sk.builtin.dict([]);
    Sk.realsyspath = undefined;

    Sk.resetCompiler();

    return Sk.importModuleInternal_(name, dumpJS, "__main__", body, canSuspend);
};

Sk.builtin.__import__ = function (name, globals, locals, fromlist) {
    // Save the Sk.globals variable importModuleInternal_ may replace it when it compiles
    // a Python language module.  for some reason, __name__ gets overwritten.
    var saveSk = Sk.globals;

    var currentDir =
        locals["__file__"] === undefined ?
            undefined :
            locals["__file__"].v.substring(0, locals["__file__"].v.lastIndexOf("/"));

    var ret = Sk.importModuleInternal_(name, undefined, undefined, undefined, true, currentDir);

    return (function finalizeImport(ret) {
        if (ret instanceof Sk.misceval.Suspension) {
            return new Sk.misceval.Suspension(finalizeImport, ret);
        }

        if (saveSk !== Sk.globals) {
            Sk.globals = saveSk;
        }

        // There is no fromlist, so we have reached the end of the lookup, return
        if (!fromlist || fromlist.length === 0) {
            return ret;
        } else {
            // try to load the module from the file system if it is not present on the module itself
            var i;
            var fromName; // name of current module for fromlist
            var fromImportName; // dotted name
            var dottedName = name.split("."); // get last module in dotted path
            var lastDottedName = dottedName[dottedName.length-1];
            
            var found; // Contains sysmodules the "name"
            var foundFromName; // Contains the sysmodules[name] the current item from the fromList

            for (i = 0; i < fromlist.length; i++) {
                fromName = fromlist[i];

                foundFromName = false;
                found = Sk.sysmodules.sq$contains(name); // Check if "name" is inside sysmodules
                if (found) {
                    // Check if the current fromName is already in the "name" module
                    foundFromName = Sk.sysmodules.mp$subscript(name)["$d"][fromName] != null;
                }

                // Only import from file system if we have not found the fromName in the current module
                if (!foundFromName && fromName != "*" && ret.$d[fromName] == null && (ret.$d[lastDottedName] != null || ret.$d.__name__.v == lastDottedName)) {
                    // add the module name to our requiredImport list
                    fromImportName = "" + name + "." + fromName;
                    Sk.importModuleInternal_(fromImportName, undefined, undefined, undefined, false, currentDir);
                }
            }
        }

        // if there's a fromlist we want to return the actual module, not the
        // toplevel namespace
        ret = Sk.sysmodules.mp$subscript(name);
        goog.asserts.assert(ret);
        return ret;
    })(ret);
};

Sk.importStar = function (module, loc, global) {
    // from the global scope, globals and locals can be the same.  So the loop below
    // could accidentally overwrite __name__, erasing __main__.
    var i;
    var nn = global["__name__"];
    var props = Object["getOwnPropertyNames"](module["$d"]);
    for (i in props) {
        loc[props[i]] = module["$d"][props[i]];
    }
    if (global["__name__"] !== nn) {
        global["__name__"] = nn;
    }
};

goog.exportSymbol("Sk.importMain", Sk.importMain);
goog.exportSymbol("Sk.importMainWithBody", Sk.importMainWithBody);
goog.exportSymbol("Sk.builtin.__import__", Sk.builtin.__import__);
goog.exportSymbol("Sk.importStar", Sk.importStar);



/* ---- /Users/rob/skulpty/lib/../node_modules/skulpt/src/builtindict.js ---- */ 

// Note: the hacky names on int, long, float have to correspond with the
// uniquization that the compiler does for words that are reserved in
// Javascript. This is a bit hokey.
Sk.builtins = {
    "range"     : Sk.builtin.range,
    "round"     : Sk.builtin.round,
    "len"       : Sk.builtin.len,
    "min"       : Sk.builtin.min,
    "max"       : Sk.builtin.max,
    "sum"       : Sk.builtin.sum,
    "zip"       : Sk.builtin.zip,
    "abs"       : Sk.builtin.abs,
    "fabs"      : Sk.builtin.abs,	//	Added by RNL
    "ord"       : Sk.builtin.ord,
    "chr"       : Sk.builtin.chr,
    "hex"       : Sk.builtin.hex,
    "oct"       : Sk.builtin.oct,
    "bin"       : Sk.builtin.bin,
    "dir"       : Sk.builtin.dir,
    "repr"      : Sk.builtin.repr,
    "open"      : Sk.builtin.open,
    "isinstance": Sk.builtin.isinstance,
    "hash"      : Sk.builtin.hash,
    "getattr"   : Sk.builtin.getattr,
    "float_$rw$": Sk.builtin.float_,
    "int_$rw$"  : Sk.builtin.int_,
    "hasattr"   : Sk.builtin.hasattr,

    "map"   : Sk.builtin.map,
    "filter": Sk.builtin.filter,
    "reduce": Sk.builtin.reduce,
    "sorted": Sk.builtin.sorted,

    "bool"     : Sk.builtin.bool,
    "any"      : Sk.builtin.any,
    "all"      : Sk.builtin.all,
    "enumerate": Sk.builtin.enumerate,

    "AttributeError"     : Sk.builtin.AttributeError,
    "ValueError"         : Sk.builtin.ValueError,
    "Exception"          : Sk.builtin.Exception,
    "ZeroDivisionError"  : Sk.builtin.ZeroDivisionError,
    "AssertionError"     : Sk.builtin.AssertionError,
    "ImportError"        : Sk.builtin.ImportError,
    "IndentationError"   : Sk.builtin.IndentationError,
    "IndexError"         : Sk.builtin.IndexError,
    "KeyError"           : Sk.builtin.KeyError,
    "TypeError"          : Sk.builtin.TypeError,
    "NameError"          : Sk.builtin.NameError,
    "IOError"            : Sk.builtin.IOError,
    "NotImplementedError": Sk.builtin.NotImplementedError,
    "StandardError"      : Sk.builtin.StandardError,
    "SystemExit"         : Sk.builtin.SystemExit,
    "OverflowError"      : Sk.builtin.OverflowError,
    "OperationError"     : Sk.builtin.OperationError,
    "RuntimeError"       : Sk.builtin.RuntimeError,
    "StopIteration"      : Sk.builtin.StopIteration,

    "dict"      : Sk.builtin.dict,
    "file"      : Sk.builtin.file,
    "function"  : Sk.builtin.func,
    "generator" : Sk.builtin.generator,
    "list"      : Sk.builtin.list,
    "long_$rw$" : Sk.builtin.lng,
    "method"    : Sk.builtin.method,
    "object"    : Sk.builtin.object,
    "slice"     : Sk.builtin.slice,
    "str"       : Sk.builtin.str,
    "set"       : Sk.builtin.set,
    "tuple"     : Sk.builtin.tuple,
    "type"      : Sk.builtin.type,
    "input"     : Sk.builtin.input,
    "raw_input" : Sk.builtin.raw_input,
    "setattr"   : Sk.builtin.setattr,
    /*'read': Sk.builtin.read,*/
    "jseval"    : Sk.builtin.jseval,
    "jsmillis"  : Sk.builtin.jsmillis,
    "quit"      : Sk.builtin.quit,
    "exit"      : Sk.builtin.quit,
    "print"     : Sk.builtin.print,
    "divmod"    : Sk.builtin.divmod,
    "format"    : Sk.builtin.format,
    "globals"   : Sk.builtin.globals,
    "issubclass": Sk.builtin.issubclass,
    "iter"      : Sk.builtin.iter,
    "complex"   : Sk.builtin.complex,

    // Functions below are not implemented
    "bytearray" : Sk.builtin.bytearray,
    "callable"  : Sk.builtin.callable,
    "delattr"   : Sk.builtin.delattr,
    "eval_$rn$" : Sk.builtin.eval_,
    "execfile"  : Sk.builtin.execfile,
    "frozenset" : Sk.builtin.frozenset,
    "help"      : Sk.builtin.help,
    "locals"    : Sk.builtin.locals,
    "memoryview": Sk.builtin.memoryview,
    "next"      : Sk.builtin.next_,
    "pow"       : Sk.builtin.pow,
    "property"  : Sk.builtin.property,
    "reload"    : Sk.builtin.reload,
    "reversed"  : Sk.builtin.reversed,
    "super"     : Sk.builtin.superbi,
    "unichr"    : Sk.builtin.unichr,
    "vars"      : Sk.builtin.vars,
    "xrange"    : Sk.builtin.xrange,
    "apply_$rn$": Sk.builtin.apply_,
    "buffer"    : Sk.builtin.buffer,
    "coerce"    : Sk.builtin.coerce,
    "intern"    : Sk.builtin.intern
};
goog.exportSymbol("Sk.builtins", Sk.builtins);



/* ---- /Users/rob/skulpty/lib/afterword.js ---- */ 

module.exports = Sk;