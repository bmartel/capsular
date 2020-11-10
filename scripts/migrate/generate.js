import snake from "lodash/snakeCase";
import { Filer, VERSION } from "../utils";
import { Config } from "../config";
import { Entry } from "../entry";

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

  const config = Config();

  const { directory, language } = config.data;

  const fileName = `${
    name !== version ? `${version}_${name}` : name
  }.${language}`;

  new Filer(`./${directory}/${db}`)
    .dir()
    .ignoreError()
    .internal()
    .join(`../../stubs/migrate/new.${language}`)
    .read()
    .contents((content) => content.replace(VERSION, version))
    .local()
    .join(fileName)
    .write()
    .ifError((f) => f.run(() => f.log.error(f.error)))
    .ifSuccess((f) => {
      f.log.success(`Created new migration ${f.current}`);

      config
        .contents((content) => {
          content.data.version = version;
          return content;
        })
        .ifError((ff) => ff.run(() => ff.log.error(ff.error)))
        .toJson()
        .local()
        .write()
        .ifSuccess((ff) =>
          ff.run(() =>
            ff.log.success(`Updated migration version to ${version}`)
          )
        );

      Entry(directory, language)
        .contents((content) =>
          content
            .find(new RegExp(`\nuseMigrations<?(.*)>?\\('${db}', {`))
            .from()
            .find(`\n});`)
            .to()
            .cut()
            .modify((tmp) => {
              tmp
                .find(` {`)
                .from()
                .find(`\n}`)
                .to()
                .cut()
                .modify((cc) => {
                  const existing = cc
                    .replace(/(.*)\{\n?\n?/g)
                    .replace("\n}")
                    .toString();
                  cc.set(
                    `
import * as m_${version} from './${db}/${fileName.replace(/\.[jt]s$/, "")}';

useMigrations<m_${version}.Schema>('${db}', {
${existing}
  [m_${version}.version]: m_${version}.migration,
});
`
                  );
                  return cc;
                })
                .paste();

              return tmp;
            })
            .paste(false)
        )
        .ifSuccess((ff) => ff.local().write());

      return f;
    });
};
