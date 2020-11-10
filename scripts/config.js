import { Filer } from "./utils";

export const Config = () =>
  new Filer("./capsular.json")
    .local()
    .read()
    .ignoreError()
    .unlessEmpty()
    .fromJson()
    .ifEmpty()
    .internal()
    .set("./stubs/config.json")
    .read()
    .local()
    .set("./capsular.json")
    .write()
    .run((self) => self.log.success(`Generated config file capsular.json`))
    .fromJson()
    .ignoreError();
