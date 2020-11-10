import { Filer, VERSION } from "../utils";
import { Config } from "../config";

export const command = "initiliaze [name] [lang]";

export const aliases = ["init", "initialise"];

export const describe =
  "Initialize a capsular.json config file and migrations directory with [name] using [lang]";

export const builder = (yargs) =>
  yargs.default("name", "migrations").default("lang", "ts");

export const handler = function (argv) {
  let { name, lang } = argv;
  let version = Date.now();

  const config = Config();

  if (name && name !== "migrations") {
    config
      .contents((content) => {
        content.directory = name;
        return content;
      })
      .local()
      .toJson()
      .write()
      .fromJson()
      .ifError()
      .run((self) => self.log.error(self.error))
      .ifSuccess()
      .run((self) =>
        self.log.success(`Updated directory field in capsular.json`)
      );
  }

  if (lang && lang !== "ts") {
    config
      .contents((content) => {
        content.language = lang;
        return content;
      })
      .local()
      .toJson()
      .write()
      .fromJson()
      .ifError()
      .run((self) => self.log.error(self.error))
      .ifSuccess()
      .run((self) =>
        self.log.success(`Updated language field in capsular.json`)
      );
  }

  const { directory, language } = config.data;

  new Filer(`./${directory}`)
    .dir()
    .internal()
    .join(`../stubs/migrate/init.${language}`)
    .read()
    .contents((content) => content.replace(VERSION, version))
    .local()
    .join(`index.${language}`)
    .write()
    .ifError()
    .run((self) => self.log.error(self.error.toString()))
    .ifSuccess()
    .run((self) =>
      self.log.success(`Created migration index '${self.current}'`)
    );
};
