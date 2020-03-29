
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

let rec repeatStar: parser('token, 'a) => parser('token, list('a)) =
  parser => {
    let basdf =
      flatMapCase(
        x => {
          Js.Console.log({j|flatmapcase: $x|j});
          switch (x) {
          | Failure(_) => pure([])
          | Success({parsed, _}) =>
            map(rest => List.cons(parsed, rest), repeatStar(parser))
          };
        },
        parser,
      );

    basdf;
  };

let rec repeat: (int, parser('token, 'a)) => parser('token, list('a)) =
  (n, parser) =>
    switch (n) {
    | 0 => pure([])
    | n =>
      flatMap(
        first => map(rest => List.cons(first, rest), repeat(n - 1, parser)),
        parser,
      )
    } /*   }*/ /*   parser => */ /* let rec repeatStar: parser('token,'a) => parser('token,list('a)) */;