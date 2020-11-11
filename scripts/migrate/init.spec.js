import path from "path";
import test from "ava";
//import { stub } from "sinon";

import * as init from "./init";

test.before((t) => {
  t.context = {};
  t.context.handler = (argv) => {
    t.context.handlerReturn = init.handler(argv);
    return t.context.handlerReturn;
  };
});

test.after((t) => {
  t.context.handlerReturn.config.delete();
  t.context.handlerReturn.entry.delete();
});

test("init default creates a capsular.json file and migrations directory in the root directory for typescript projects", (t) => {
  const name = "migrations";
  const language = "ts";

  const { config, entry } = t.context.handler({ name, language });

  t.is(config.local().toString(), path.resolve(process.cwd(), "capsular.json"));
  t.is(
    entry.local().toString(),
    path.resolve(process.cwd(), "migrations/index.ts")
  );
});
