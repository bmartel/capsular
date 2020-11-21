import { IDBPDatabase } from "idb";
import { open } from "./connection";

export type CacheKey = Array<string | number>;

export type CachedRequestInit = RequestInit & {
  cacheFor?: number;
  refetchInterval?: number;
};

export interface StoreConnection {
  db: string;
  version: number;
}

export interface OfflineStore {
  store: StoreConnection;
  key: Array<string | number>;
  collection?: string | "offline";
}

export interface StoreSubscription {
  resolve: (params: any) => any;
  reject: (params: any) => any;
  persist?: boolean;
}

const subs = new Map();
const worker = new Worker("worker.js");

export const createIdFromKey = (key: CacheKey) =>
  key.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0)).join(":");

export class Store {
  private _workerFile: string;
  private _worker: Worker | null;
  private _channels: Map<string, Array<StoreSubscription>>;
  private _connections: WeakMap<StoreConnection, IDBPDatabase>;

  constructor(workerFile = "worker.js") {
    this._workerFile = workerFile;
    this._worker = null;
    this._channels = new Map();
    this._connections = new WeakMap();
  }

  async connect(info: OfflineStore): Promise<IDBPDatabase> {
    const connection = this._connections.get(info.store);
    if (!connection) {
      const { db } = await open(info.store.db, info.store.version);
      this._connections.set(info.store, connection);
      return db;
    }
    return connection;
  }

  get worker(): Worker {
    if (!this._worker) {
      this._worker = new Worker(this._workerFile);
      this._worker.onmessage = (ev: MessageEvent) => {
        const { id, error, success } = ev.data;
        const channel = this._channels.get(id);
        if (channel && channel.length) {
          const remainingChannels = channel.filter((sub) => {
            if (error) {
              sub.reject(error);
            }
            sub.resolve(success);
            return !!sub.persist;
          });
          // remove channel subs
          subs.set(id, remainingChannels);
        }
      };
    }
    return this._worker;
  }

  subscribe(
    id: string,
    resolve: (params: any) => any,
    reject: (params: any) => any,
    persist?: boolean
  ) {
    let channel = this._channels.get(id);
    if (!channel) {
      channel = [];
    }
    const subscription = { resolve, reject, persist };
    channel.push(subscription);
    this._channels.set(id, channel);

    // unsubscribe
    return () => {
      const channel = this._channels.get(id);
      if (channel) {
        this._channels.set(
          id,
          channel.filter((sub) => sub !== subscription)
        );
      }
    };
  }

  waitFor(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.subscribe(id, resolve, reject);
    });
  }

  async createFetch(info: OfflineStore) {
    const id = createIdFromKey(info.key);
    return {
      id,
      get: async () =>
        (await this.connect(info)).get(info.collection || "offline", id),
    };
  }

  backgroundFetch(
    info: OfflineStore,
    input: RequestInfo,
    init?: CachedRequestInit
  ) {
    (worker as any).postMessage({ info, input, init });
  }

  async offlineFetch(
    info: OfflineStore,
    input: RequestInfo,
    init?: CachedRequestInit
  ) {
    const { cacheFor = 0 } = init || {};
    const { id, get: fetchFromStore } = await this.createFetch(info);
    const results = await fetchFromStore();

    // check if result
    if (results) {
      // if there was a cacheFor param, that the fetchedAt time is past the cache period and refetch if it is
      if (Date.now() - cacheFor * 1000 > results.fetchedAt) {
        (worker as any).postMessage({ info, input, init });
      }

      return results;
    }

    // otherwise get it in a worker

    (this.worker as any).postMessage({ info, input, init });
    await this.waitFor(id);

    // otherwise recheck indexeddb for the updated result

    return await fetchFromStore();
  }
}
