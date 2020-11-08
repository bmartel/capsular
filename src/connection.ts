import { openDB } from "idb";
import { migrate, Migration } from "./migration";
import { bindTransactions } from "./transaction";

export async function open<Schema = any>(
  name: string,
  version: number = 1,
  upgrade: Migration = migrate
) {
  const db = await openDB<Schema>(name, version, { upgrade });
  const transaction = bindTransactions<Schema>(db);

  return new Proxy(db, {
    get(target, key) {
      switch (key) {
        case "transaction":
          return transaction;
        default:
          return target[key];
      }
    },
  });
}
