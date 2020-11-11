import { Migration, DBSchema } from "capsular";

export const version = "_VERSION_";

export interface Schema extends DBSchema {
  //collection: {
  //  key: string;
  //  value: any;
  //}
}

export const migration: Migration<Schema> = (db, oldVersion) => {
  // db.createObjectStore('collection')
};
