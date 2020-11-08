import { IDBPDatabase } from "idb";

export interface Migration<Schema = any> {
  (db: IDBPDatabase<Schema>, oldVersion: number): void;
}

const migrations: Record<string, Array<Migration>> = {};
export function useMigrations(
  dbname: string,
  _migrations: Array<Migration> = []
) {
  migrations[dbname] = _migrations;
}

export function migrate(db: IDBPDatabase, oldVersion: number) {
  const _dbmigrations = migrations[db.name];
  if (_dbmigrations && _dbmigrations.length) {
    _dbmigrations.forEach((migration) => {
      migration(db, oldVersion);
    });
  }
}

