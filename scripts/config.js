import { Filer } from "./utils";

export const Config = () =>
  new Filer("./capsular.json")
    .read()
    .unlessEmpty()
    .fromJson()
    .ifEmpty()
    .internal()
    .join("../stubs/config.json")
    .read()
    .local()
    .write()
    .fromJson()
    .ifSuccess()
    .run((self) => self.log.success(`Generated config file capsular.json`));
