'use strict';

var List = require("bs-platform/lib/js/list.js");
var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var Caml_obj = require("bs-platform/lib/js/caml_obj.js");

function pure(p) {
  return {
          run: (function (tokens, param) {
              return /* Success */Block.__(0, [
                        /* parsed */p,
                        /* remaining */tokens
                      ]);
            }),
          label: "Pure " + (String(p) + "")
        };
}

function drop(_n, _list) {
  while(true) {
    var list = _list;
    var n = _n;
    if (list) {
      if (n === 0) {
        return list;
      } else {
        _list = list[1];
        _n = n - 1 | 0;
        continue ;
      }
    } else {
      return /* [] */0;
    }
  };
}

function success(p) {
  return {
          run: (function (tokens, param) {
              return /* Success */Block.__(0, [
                        /* parsed */p,
                        /* remaining */drop(1, tokens)
                      ]);
            }),
          label: "Pure " + (String(p) + "")
        };
}

function pureRes(res) {
  return {
          run: (function (param, param$1) {
              return res;
            }),
          label: "Pure res " + (String(res) + "")
        };
}

function label(label$1, parser) {
  return {
          run: parser.run,
          label: label$1
        };
}

function parse(parser, tokens) {
  return Curry._2(parser.run, tokens, parser.label);
}

function test(label, p) {
  var run = function (tokens, label) {
    if (tokens) {
      var head = tokens[0];
      if (Curry._1(p, head)) {
        return /* Success */Block.__(0, [
                  /* parsed */head,
                  /* remaining */tokens[1]
                ]);
      } else {
        return /* Failure */Block.__(1, [
                  /* description */"Predicate `" + (String(label) + ("` not true for `" + (String(head) + "`"))),
                  /* remaining */tokens
                ]);
      }
    } else {
      return /* Failure */Block.__(1, [
                /* description */"Unknown error occurred involving " + (String(tokens) + (", " + (String(p) + ""))),
                /* remaining */tokens
              ]);
    }
  };
  return {
          run: run,
          label: label
        };
}

function $$const(c) {
  return test(String(c), (function (token) {
                return Caml_obj.caml_equal(token, c);
              }));
}

function flatMap(fab, parserA) {
  var run = function (tokens, param) {
    var match = parse(parserA, tokens);
    if (match.tag) {
      return /* Failure */Block.__(1, [
                /* description */match[/* description */0],
                /* remaining */match[/* remaining */1]
              ]);
    } else {
      var partial_arg = Curry._1(fab, match[/* parsed */0]);
      var param$1 = match[/* remaining */1];
      return parse(partial_arg, param$1);
    }
  };
  return {
          run: run,
          label: undefined
        };
}

function flatten(wrapped) {
  return flatMap((function (x) {
                return x;
              }), wrapped);
}

function map(fab, parserA) {
  var run = function (tokens, param) {
    var match = parse(parserA, tokens);
    if (match.tag) {
      return /* Failure */Block.__(1, [
                /* description */match[/* description */0],
                /* remaining */match[/* remaining */1]
              ]);
    } else {
      return /* Success */Block.__(0, [
                /* parsed */Curry._1(fab, match[/* parsed */0]),
                /* remaining */match[/* remaining */1]
              ]);
    }
  };
  return {
          run: run,
          label: undefined
        };
}

function flatMapCase(fab, parserA) {
  var run = function (tokens, param) {
    var res = parse(parserA, tokens);
    var parser2 = Curry._1(fab, res);
    return parse(parser2, res[/* remaining */1]);
  };
  return {
          run: run,
          label: parserA.label
        };
}

function repeatStar(parser) {
  return flatMapCase((function (x) {
                console.log("flatmapcase: " + (String(x) + ""));
                if (x.tag) {
                  return pure(/* [] */0);
                } else {
                  var parsed = x[/* parsed */0];
                  return map((function (rest) {
                                return List.cons(parsed, rest);
                              }), repeatStar(parser));
                }
              }), parser);
}

function repeat(n, parser) {
  if (n !== 0) {
    return flatMap((function (first) {
                  return map((function (rest) {
                                return List.cons(first, rest);
                              }), repeat(n - 1 | 0, parser));
                }), parser);
  } else {
    return pure(/* [] */0);
  }
}

exports.pure = pure;
exports.drop = drop;
exports.success = success;
exports.pureRes = pureRes;
exports.label = label;
exports.parse = parse;
exports.test = test;
exports.$$const = $$const;
exports.flatMap = flatMap;
exports.flatten = flatten;
exports.map = map;
exports.flatMapCase = flatMapCase;
exports.repeatStar = repeatStar;
exports.repeat = repeat;
/* No side effect */
