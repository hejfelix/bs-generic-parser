type parseResult('a, 'token) =
  | Success({
      parsed: 'a,
      remaining: list('token),
    })
  | Failure({
      description: string,
      remaining: list('token),
    });

type parser('token, 'a) = {
  run: (list('token), option(string)) => parseResult('a, 'token),
  label: option(string),
};

let pure: 'a => parser('token, 'a) =
  p => {
    {
      run: (tokens, _) => Success({parsed: p, remaining: tokens}),
      label: Some({j|Pure $p|j}),
    };
  };

let rec drop = (n, list) =>
  switch (list) {
  | [] => []
  | [_, ...xs] as z => n == 0 ? z : drop(n - 1, xs)
  };

let success: 'a => parser('token, 'a) =
  p => {
    {
      run: (tokens, _) => Success({parsed: p, remaining: drop(1, tokens)}),
      label: Some({j|Pure $p|j}),
    };
  };

let fail: string => parser('token, 'a) =
  description => {
    {
      run: (remaining, _) => Failure({description, remaining}),
      label: Some({j|Fail $description|j}),
    };
  };

let pureRes: parseResult('a, 'token) => parser('token, 'a) =
  res => {
    {run: (_, _) => res, label: Some({j|Pure res $res|j})};
  };

let label: (string, parser('token, 'a)) => parser('token, 'a) =
  (label, parser) => {run: parser.run, label: Some(label)};

let parse: (parser('token, 'a), list('token)) => parseResult('a, 'token) =
  (parser, tokens) =>
    switch (parser) {
    | {run, label} => run(tokens, label)
    };

let test: (~label: string=?, 'token => bool) => parser('token, 'token) =
  (~label: option(string)=?, p) => {
    let run = (tokens, label) =>
      switch (tokens) {
      | [head, ...rest] when p(head) =>
        Success({parsed: head, remaining: rest})
      | [head, ..._] =>
        Failure({
          description: {j|Predicate `$label` not true for `$head`|j},
          remaining: tokens,
        })
      | x =>
        Failure({
          description: {j|Unknown error occurred involving $x, $p|j},
          remaining: tokens,
        })
      };

    {run, label};
  };

let const: 'token => parser('token, 'token) =
  c => test(~label=Js.String.make(c), token =>
         token == c
       );

let flatMap:
  ('a => parser('token, 'b), parser('token, 'a)) => parser('token, 'b) =
  (fab, parserA) => {
    let run = (tokens, _) =>
      switch (tokens |> parse(parserA)) {
      | Success({parsed, remaining}) =>
        let next = parsed |> fab |> parse;
        remaining |> next;
      | Failure({description, remaining}) =>
        Failure({description, remaining}) //It's necessary to reconstruct the error to allow the typechecker to assign a new type parameter
      };
    {run, label: None};
  };

let flatten: parser('token, parser('token, 'a)) => parser('token, 'a) =
  wrapped => flatMap(x => x, wrapped);

let map: ('a => 'b, parser('token, 'a)) => parser('token, 'b) =
  (fab, parserA) => {
    let run = (tokens, _) =>
      switch (tokens |> parse(parserA)) {
      | Success({parsed, remaining}) =>
        Success({parsed: fab(parsed), remaining})
      | Failure({description, remaining}) =>
        Failure({description, remaining})
      };

    {run, label: None};
  };

let flatMapCase:
  (parseResult('a, 'token) => parser('token, 'b), parser('token, 'a)) =>
  parser('token, 'b) =
  (fab, parserA) => {
    let run = (tokens, _: option(string)) => {
      let res = parse(parserA, tokens);
      switch (res) {
      | Success({parsed: _, remaining}) =>
        let parser2 = fab(res);
        remaining |> parse(parser2);
      | Failure({description: _, remaining}) =>
        let parser2 = fab(res);
        remaining |> parse(parser2);
      };
    };
    {run, label: parserA.label};
  };

let mapCase:
  (
    parseResult('a, 'token) => parseResult('b, 'token),
    parser('token, 'a)
  ) =>
  parser('token, 'b) =
  (f, parser) => flatMapCase(r => pureRes(f(r)), parser);

let keep: parser('token, 'a) => parser('token, 'a) =
  parser =>
    switch (parser) {
    | {run, _} => {
        run: (tokens, label) => {
          switch (run(tokens, label)) {
          | Success({parsed, remaining: _}) =>
            Success({parsed, remaining: tokens})
          | Failure({description, remaining: _}) =>
            Failure({description, remaining: tokens})
          };
        },
        label: Some("keep"),
      }
    };

let rec sequence: list(parser('token, 'a)) => parser('token, list('a)) =
  fun
  | [] => pure([])
  | [parser, ...rest] => {
      let tail = sequence(rest);
      parser |> flatMap(a => tail |> map(aas => List.cons(a, aas)));
    };

let opt: parser('token, 'a) => parser('token, option('a)) =
  parser => {
    parser
    |> mapCase(
         fun
         | Success({parsed, remaining}) =>
           Success({parsed: Some(parsed), remaining})
         | Failure({description: _, remaining}) =>
           Success({parsed: None, remaining}),
       );
  };

let rec repeatStar: parser('token, 'a) => parser('token, list('a)) =
  parser =>
    flatMapCase(
      fun
      | Failure(_) => pure([])
      | Success({parsed, _}) =>
        map(rest => List.cons(parsed, rest), repeatStar(parser)),
      parser,
    );

let rec repeat: (int, parser('token, 'a)) => parser('token, list('a)) =
  (n, parser) =>
    switch (n) {
    | 0 => pure([])
    | n =>
      flatMap(
        first => map(rest => List.cons(first, rest), repeat(n - 1, parser)),
        parser,
      )
    };

let choice: (parser('token, 'a), parser('token, 'a)) => parser('token, 'a) =
  (parserA, parserB) => {
    let p = (tokens, _) => {
      let resA = tokens |> (parserA |> parse);
      let resB = tokens |> (parserB |> parse);
      switch (resA, resB) {
      | (Success(_), _) => resA
      | (Failure(_), Success(_)) => resB
      | (
          Failure({description: descriptionA, remaining: _}),
          Failure({description: descriptionB, remaining: _}),
        ) =>
        Failure({
          description: descriptionA ++ " AND " ++ descriptionB,
          remaining: tokens,
        })
      };
    };
    open Belt;
    let labelA = parserA.label->Option.getWithDefault("");
    let labelB = parserB.label->Option.getWithDefault("");
    {run: p, label: Some(labelA ++ " | " ++ labelB)};
  };