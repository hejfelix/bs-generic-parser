'use strict';

var Jest = require("@glennsl/bs-jest/src/jest.js");
var Block = require("bs-platform/lib/js/block.js");
var Parse$BsGenericParser = require("../src/Parse/Parse.bs.js");

Jest.describe("Parse", (function (param) {
        Jest.test("pure always parses", (function (param) {
                var result = Parse$BsGenericParser.parse(Parse$BsGenericParser.pure(/* :: */[
                          1,
                          /* :: */[
                            2,
                            /* :: */[
                              3,
                              /* [] */0
                            ]
                          ]
                        ]), /* :: */[
                      "whatever",
                      /* [] */0
                    ]);
                return Jest.Expect.toEqual(/* Success */Block.__(0, [
                              /* parsed : :: */[
                                1,
                                /* :: */[
                                  2,
                                  /* :: */[
                                    3,
                                    /* [] */0
                                  ]
                                ]
                              ],
                              /* remaining : :: */[
                                "whatever",
                                /* [] */0
                              ]
                            ]), Jest.Expect.expect(result));
              }));
        Jest.test("modify label", (function (param) {
                var labelled = Parse$BsGenericParser.label("MY LABEL", Parse$BsGenericParser.$$const(1337));
                return Jest.Expect.toEqual(/* Failure */Block.__(1, [
                              /* description */"Predicate `MY LABEL` not true for `42`",
                              /* remaining : :: */[
                                42,
                                /* [] */0
                              ]
                            ]), Jest.Expect.expect(Parse$BsGenericParser.parse(labelled, /* :: */[
                                    42,
                                    /* [] */0
                                  ])));
              }));
        Jest.test("show label in error", (function (param) {
                return Jest.Expect.toEqual(/* Failure */Block.__(1, [
                              /* description */"Predicate `1337` not true for `42`",
                              /* remaining : :: */[
                                42,
                                /* [] */0
                              ]
                            ]), Jest.Expect.expect(Parse$BsGenericParser.parse(Parse$BsGenericParser.$$const(1337), /* :: */[
                                    42,
                                    /* [] */0
                                  ])));
              }));
        Jest.test("const", (function (param) {
                var parser = Parse$BsGenericParser.$$const(42);
                return Jest.Expect.toEqual(/* Success */Block.__(0, [
                              /* parsed */42,
                              /* remaining : [] */0
                            ]), Jest.Expect.expect(Parse$BsGenericParser.parse(parser, /* :: */[
                                    42,
                                    /* [] */0
                                  ])));
              }));
        Jest.test("map", (function (param) {
                var parser = Parse$BsGenericParser.$$const(42);
                var mapped = Parse$BsGenericParser.map((function (i) {
                        return (i << 1);
                      }), parser);
                return Jest.Expect.toEqual(/* Success */Block.__(0, [
                              /* parsed */84,
                              /* remaining : [] */0
                            ]), Jest.Expect.expect(Parse$BsGenericParser.parse(mapped, /* :: */[
                                    42,
                                    /* [] */0
                                  ])));
              }));
        Jest.test("flatMap", (function (param) {
                var parser = Parse$BsGenericParser.flatMap((function (i) {
                        return Parse$BsGenericParser.$$const((i << 1));
                      }), Parse$BsGenericParser.$$const(42));
                return Jest.Expect.toEqual(/* Success */Block.__(0, [
                              /* parsed */84,
                              /* remaining : [] */0
                            ]), Jest.Expect.expect(Parse$BsGenericParser.parse(parser, /* :: */[
                                    42,
                                    /* :: */[
                                      84,
                                      /* [] */0
                                    ]
                                  ])));
              }));
        Jest.test("flatten", (function (param) {
                var wrapped = Parse$BsGenericParser.map(Parse$BsGenericParser.pure, Parse$BsGenericParser.$$const(42));
                return Jest.Expect.toEqual(/* Success */Block.__(0, [
                              /* parsed */42,
                              /* remaining : [] */0
                            ]), Jest.Expect.expect(Parse$BsGenericParser.parse(Parse$BsGenericParser.flatten(wrapped), /* :: */[
                                    42,
                                    /* [] */0
                                  ])));
              }));
        Jest.test("repeat", (function (param) {
                var parser = Parse$BsGenericParser.repeat(3, Parse$BsGenericParser.$$const(42));
                return Jest.Expect.toEqual(/* Success */Block.__(0, [
                              /* parsed : :: */[
                                42,
                                /* :: */[
                                  42,
                                  /* :: */[
                                    42,
                                    /* [] */0
                                  ]
                                ]
                              ],
                              /* remaining : [] */0
                            ]), Jest.Expect.expect(Parse$BsGenericParser.parse(parser, /* :: */[
                                    42,
                                    /* :: */[
                                      42,
                                      /* :: */[
                                        42,
                                        /* [] */0
                                      ]
                                    ]
                                  ])));
              }));
        Jest.test("flatMapCase", (function (param) {
                var parser = Parse$BsGenericParser.flatMapCase((function (param) {
                        if (param.tag) {
                          return Parse$BsGenericParser.pure("NO");
                        } else {
                          return Parse$BsGenericParser.pure("YES");
                        }
                      }), Parse$BsGenericParser.repeat(3, Parse$BsGenericParser.$$const(42)));
                Jest.Expect.toEqual(/* Success */Block.__(0, [
                        /* parsed */"YES",
                        /* remaining : [] */0
                      ]), Jest.Expect.expect(Parse$BsGenericParser.parse(parser, /* :: */[
                              42,
                              /* :: */[
                                42,
                                /* :: */[
                                  42,
                                  /* [] */0
                                ]
                              ]
                            ])));
                return Jest.Expect.toEqual(/* Success */Block.__(0, [
                              /* parsed */"NO",
                              /* remaining : :: */[
                                1337,
                                /* [] */0
                              ]
                            ]), Jest.Expect.expect(Parse$BsGenericParser.parse(parser, /* :: */[
                                    1337,
                                    /* [] */0
                                  ])));
              }));
        return Jest.test("repeatStar", (function (param) {
                      var parser = Parse$BsGenericParser.repeatStar(Parse$BsGenericParser.$$const(42));
                      var actual = Parse$BsGenericParser.parse(parser, /* :: */[
                            42,
                            /* :: */[
                              42,
                              /* :: */[
                                1337,
                                /* :: */[
                                  42,
                                  /* :: */[
                                    1337,
                                    /* [] */0
                                  ]
                                ]
                              ]
                            ]
                          ]);
                      console.log("actual: " + (String(actual) + ""));
                      return Jest.Expect.toEqual(/* Success */Block.__(0, [
                                    /* parsed : :: */[
                                      42,
                                      /* :: */[
                                        42,
                                        /* [] */0
                                      ]
                                    ],
                                    /* remaining : :: */[
                                      1337,
                                      /* :: */[
                                        42,
                                        /* :: */[
                                          1337,
                                          /* [] */0
                                        ]
                                      ]
                                    ]
                                  ]), Jest.Expect.expect(actual));
                    }));
      }));

/*  Not a pure module */
