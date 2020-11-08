import { IDBPDatabase, IDBPTransaction, StoreNames } from "idb";

export enum TransactionType {
  Read = "readonly",
  ReadWrite = "readwrite",
  Version = "versionchange",
}

export interface TransactionOperation<Schema, Result = any> {
  (tx: IDBPTransaction<Schema>): Promise<Result>;
}

export interface TransactionInstance<Schema> {
  name: string;
  type?: TransactionType;
  run: (transaction: TransactionOperation<Schema>) => Promise<void>;
}

export function bindTransactions<Schema = any>(db: IDBPDatabase<Schema>) {
  return (
    name: string,
    type?: TransactionType
  ): TransactionInstance<Schema> => {
    const tx = db.transaction([name] as StoreNames<Schema>[], type);

    return {
      name,
      type,
      async run(transaction) {
        await Promise.all([
          transaction(tx as IDBPTransaction<Schema>),
          tx.done,
        ]);
      },
    };
  };
}
