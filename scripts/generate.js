export const command = "generate <type> [name]";

export const aliases = ["g", "gen"];

export const describe = "generate capsular files such as migrations";

export const builder = (yargs) =>
  yargs.default("type", "migration").default("name", Date.now());

export const handler = function (argv) {
  const { type, name } = argv;
  console.log({ type, name });
};
