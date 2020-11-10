import { Filer } from "./utils";

export const Entry = (directory, language) =>
  new Filer(`./${directory}`)
    .local()
    .join(`index.${language}`)
    .read()
    .ignoreError()
    .unlessEmpty((f) =>
      f.run((self) => self.log.cmd(`Using existing migrations index`))
    )
    .ifEmpty((f) =>
      f
        .set(`./${directory}`)
        .dir()
        .ignoreError()
        .internal()
        .join(`../stubs/migrate/init.${language}`)
        .read()
        .local()
        .join(`index.${language}`)
        .write()
        .ifError((ff) => ff.run(() => ff.log.error(ff.error)))
        .ifSuccess((ff) =>
          ff.run(() =>
            ff.log.log.success(`Created migration index '${self.current}'`)
          )
        )
    )
    .ignoreError();
