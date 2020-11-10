import snake from "lodash/snakeCase";
import { Filer, VERSION } from "../utils";
import { Config } from "../config";

export const command = "generate <db> [name]";

export const aliases = ["g", "gen"];

export const describe = "Generate a migration file for <db> with [name]";

export const builder = (yargs) =>
  yargs.default("name", `${VERSION}${Date.now()}`);

export const handler = function (argv) {
  let { db, name } = argv;
  let version = Date.now();
  if (name.startsWith(VERSION)) {
    version = name = name.replace(VERSION, "");
  } else {
    name = snake(name);
  }

  version = +version;

  const config = Config();

  const { directory, language } = config.data;

  new Filer(`./${directory}/${db}`)
    .dir()
    .internal()
    .join(`../../stubs/migrate/new.${language}`)
    .read()
    .contents((content) => content.replace(VERSION, version))
    .local()
    .join(`${name}.${language}`)
    .write()
    .ifError()
    .run((self) => self.log.error(self.error))
    .ifSuccess()
    .run((self) => {
      self.log.success(`Created new migration ${self.current}`);
      config
        .contents((content) => {
          content.version = version;
          return content;
        })
        .toJson()
        .local()
        .write()
        .ifSuccess()
        .run((self) =>
          self.log.success(`Updated migration version to ${version}`)
        );
    });
};
