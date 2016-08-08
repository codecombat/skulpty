'use strict';

const fs = require('fs');
const path = require('path');

let files = [
        //'src/env.js',
        'src/type.js',
        'src/abstract.js',
        'src/object.js',
        'src/function.js',
        //'src/builtin.js',
        //'src/fromcodepoint.js',
        //'src/errors.js',
        //'src/native.js',
        //'src/method.js',
        //'src/misceval.js',
        'src/seqtype.js',
        //'src/list.js',
        'src/str.js',
        //'src/formatting.js',
        //'src/tuple.js',
        //'src/dict.js',
        //'src/numtype.js',
        //'src/biginteger.js',
        //'src/int.js',
        //'src/bool.js',
        //'src/float.js',
        //'src/number.js',
        //'src/long.js',
        //'src/complex.js',
        //'src/slice.js',
        //'src/set.js',
        //'src/print.js',
        //'src/module.js',
        //'src/structseq.js',
        //'src/generator.js',
        //'src/file.js',
        //'src/ffi.js',
        //'src/iterator.js',
        //'src/enumerate.js',
        'src/tokenize.js',
        'gen/parse_tables.js',
        'src/parser.js',
        'gen/astnodes.js',
        'src/ast.js',
        //'src/symtable.js',
        //'src/compile.js',
        //'src/import.js',
        //'src/timsort.js',
        //'src/sorted.js',
        //'src/builtindict.js',
        //'src/constants.js',
];

files = files.map((f) => __dirname + '/../node_modules/skulpt/' + f);
files.unshift(__dirname + '/preamble.js');
files.push(__dirname + '/afterword.js');

let data = files.map((f) => {
        return `\n/* ---- ${f} ---- */ \n\n` + fs.readFileSync(f, 'utf8');
}).join('\n\n');

fs.writeFileSync(__dirname + '/skulpt.js', data, 'utf8')



