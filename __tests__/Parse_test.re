open Jest;

let () =
  describe("Parse", () => {
    open Expect;

    test("pure always parses", () => {
      open Parse;

      let result = ["whatever"] |> parse(pure([1, 2, 3]));
      let expected = Success({parsed: [1, 2, 3], remaining: ["whatever"]});
      expect(result) |> toEqual(expected);
    });

    test("modify label", () => {
      open Parse;

      let error =
        Parse.Failure({
          description: "Predicate `MY LABEL` not true for `42`",
          remaining: [42],
        });

      let labelled = const(1337) |> label("MY LABEL");

      expect([42] |> parse(labelled)) |> toEqual(error);
    });

    test("show label in error", () => {
      open Parse;

      let error =
        Parse.Failure({
          description: "Predicate `1337` not true for `42`",
          remaining: [42],
        });

      expect([42] |> parse(const(1337))) |> toEqual(error);
    });

    test("const", () => {
      open Parse;
      let parser = const(42);
      let expected = Success({parsed: 42, remaining: []});

      expect([42] |> parse(parser)) |> toEqual(expected);
    });
    test("const fail", () => {
      open Parse;
      let parser = const(0);
      let expected =
        Parse.Failure({
          description: "Predicate `0` not true for `1`",
          remaining: [1],
        });

      expect([1] |> parse(parser)) |> toEqual(expected);
    });

    test("map", () => {
      open Parse;
      let parser = const(42);
      let mapped = map(i => i * 2, parser);
      let expected = Success({parsed: 84, remaining: []});

      expect([42] |> parse(mapped)) |> toEqual(expected);
    });

    test("flatMap", () => {
      open Parse;

      let parser = flatMap(i => const(i * 2), const(42));
      let expected = Success({parsed: 84, remaining: []});

      expect([42, 84] |> parse(parser)) |> toEqual(expected);
    });

    test("flatten", () => {
      open Parse;
      let wrapped = const(42) |> map(i => pure(i));

      expect([42] |> (wrapped |> flatten |> parse))
      |> toEqual(Success({parsed: 42, remaining: []}));
    });

    test("repeat", () => {
      open Parse;
      let parser = const(42) |> repeat(3);

      expect([42, 42, 42] |> parse(parser))
      |> toEqual(Success({parsed: [42, 42, 42], remaining: []}));
    });

    test("flatMapCase", () => {
      open Parse;

      let parser =
        flatMapCase(
          fun
          | Success(_) => pure("YES")
          | Parse.Failure(_) => pure("NO"),
          repeat(3, const(42)),
        );

      let _ =
        expect([42, 42, 42] |> parse(parser))
        |> toEqual(Success({parsed: "YES", remaining: []}));

      expect([1337] |> parse(parser))
      |> toEqual(Success({parsed: "NO", remaining: [1337]}));
    });

    test("repeatStar", () => {
      open Parse;
      let parser = const(42) |> repeatStar;
      let actual = [42, 42, 1337, 42, 1337] |> parse(parser);
      Js.Console.log({j|actual: $actual|j});
      expect(actual)
      |> toEqual(Success({parsed: [42, 42], remaining: [1337, 42, 1337]}));
    });

    test("choice", () => {
      open Parse;
      let parser = const(42) |> choice(const(1337));

      expect([
        [42] |> parse(parser),
        [1337] |> parse(parser),
        [1] |> parse(parser),
      ])
      |> toEqual([
           Success({parsed: 42, remaining: []}),
           Success({parsed: 1337, remaining: []}),
           Parse.Failure({
             description: "Predicate `1337` not true for `1` AND Predicate `42` not true for `1`",
             remaining: [1],
           }),
         ]);
    });

    test("sequence", () => {
      open Parse;
      let parser = [const(1), const(2), const(3)] |> sequence;
      expect([1, 2, 3] |> parse(parser))
      |> toEqual(Success({parsed: [1, 2, 3], remaining: []}));
    });

    test("keep", () => {
      open Parse;
      let parser = [const(42) |> keep, const(42), const(100)] |> sequence;
      expect([42, 100] |> parse(parser))
      |> toEqual(Success({parsed: [42, 42, 100], remaining: []}));
    });

    test("opt none", () => {
      open Parse;
      let parser = const(42) |> opt;
      expect([1337] |> parse(parser))
      |> toEqual(Success({parsed: None, remaining: [1337]}));
    });

    test("opt some", () => {
      open Parse;
      let parser = const(42) |> opt;
      expect([42, 100] |> parse(parser))
      |> toEqual(Success({parsed: Some(42), remaining: [100]}));
    });
  });