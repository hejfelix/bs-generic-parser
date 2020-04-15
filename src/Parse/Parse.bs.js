'use strict';

var List = require("bs-platform/lib/js/list.js");
var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var Caml_obj = require("bs-platform/lib/js/caml_obj.js");
var Belt_Option = require("bs-platform/lib/js/belt_Option.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");

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

function fail(description) {
  return {
          run: (function (remaining, param) {
              return /* Failure */Block.__(1, [
                        /* description */description,
                        /* remaining */remaining
                      ]);
            }),
          label: "Fail " + (String(description) + "")
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

function mapCase(f, parser) {
  return flatMapCase((function (r) {
                return pureRes(Curry._1(f, r));
              }), parser);
}

function keep(parser) {
  var run = parser.run;
  return {
          run: (function (tokens, label) {
              var match = Curry._2(run, tokens, label);
              if (match.tag) {
                return /* Failure */Block.__(1, [
                          /* description */match[/* description */0],
                          /* remaining */tokens
                        ]);
              } else {
                return /* Success */Block.__(0, [
                          /* parsed */match[/* parsed */0],
                          /* remaining */tokens
                        ]);
              }
            }),
          label: "keep"
        };
}

function sequence(param) {
  if (param) {
    var tail = sequence(param[1]);
    return flatMap((function (a) {
                  return map((function (aas) {
                                return List.cons(a, aas);
                              }), tail);
                }), param[0]);
  } else {
    return pure(/* [] */0);
  }
}

function opt(parser) {
  return mapCase((function (param) {
                if (param.tag) {
                  return /* Success */Block.__(0, [
                            /* parsed */undefined,
                            /* remaining */param[/* remaining */1]
                          ]);
                } else {
                  return /* Success */Block.__(0, [
                            /* parsed */Caml_option.some(param[/* parsed */0]),
                            /* remaining */param[/* remaining */1]
                          ]);
                }
              }), parser);
}

function repeatStar(parser) {
  return flatMapCase((function (param) {
                if (param.tag) {
                  return pure(/* [] */0);
                } else {
                  var parsed = param[/* parsed */0];
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

function choice(parserA, parserB) {
  var p = function (tokens, param) {
    var resA = parse(parserA, tokens);
    var resB = parse(parserB, tokens);
    if (resA.tag) {
      if (resB.tag) {
        return /* Failure */Block.__(1, [
                  /* description */resA[/* description */0] + (" AND " + resB[/* description */0]),
                  /* remaining */tokens
                ]);
      } else {
        return resB;
      }
    } else {
      return resA;
    }
  };
  var labelA = Belt_Option.getWithDefault(parserA.label, "");
  var labelB = Belt_Option.getWithDefault(parserB.label, "");
  return {
          run: p,
          label: labelA + (" | " + labelB)
        };
}

exports.pure = pure;
exports.drop = drop;
exports.success = success;
exports.fail = fail;
exports.pureRes = pureRes;
exports.label = label;
exports.parse = parse;
exports.test = test;
exports.$$const = $$const;
exports.flatMap = flatMap;
exports.flatten = flatten;
exports.map = map;
exports.flatMapCase = flatMapCase;
exports.mapCase = mapCase;
exports.keep = keep;
exports.sequence = sequence;
exports.opt = opt;
exports.repeatStar = repeatStar;
exports.repeat = repeat;
exports.choice = choice;
/* No side effect */
