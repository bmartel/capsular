import { open } from "./connection";
import { CachedRequestInit, StoreRecord } from "./types";

const background = new Map();

async function store(info: StoreRecord, data: any) {
  const { db } = await open(info.store.db, info.store.version);
  try {
    const id = info.key.id;
    await db.put(
      info.collection || "offline",
      { id, data, fetchedAt: Date.now() },
      id
    );
  } finally {
    db.close();
  }
}

async function remoteFetch(
  info: StoreRecord,
  input: RequestInfo,
  init?: CachedRequestInit
) {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw res.body;
  }
  const data = await res.json();
  await store(info, data);
}

async function processFetch(
  info: StoreRecord,
  input: RequestInfo,
  init?: CachedRequestInit
) {
  const id = info.key.id;
  background.set(id, { info, input, init, processedAt: Infinity });
  try {
    if (info && input) {
      await remoteFetch(info, input, init);
    }
    (postMessage as any)({ id, success: true });
  } catch (err) {
    (postMessage as any)({ id, error: err });
  } finally {
    background.set(id, { info, input, init, processedAt: Date.now() });
  }
}

onmessage = async (ev: MessageEvent) => {
  const { info, input, init } = ev.data;

  const id = info.key.id;

  // unsub or sub and fetch
  switch (init.refetchInterval) {
    case 0:
      background.delete(id);
      break;
    default:
      if (init.refetchInterval) {
        background.set(id, { info, input, init, processedAt: 0 });
      }
      await processFetch(info, input, init);
      break;
  }
};

setInterval(() => {
  const now = Date.now();
  background.forEach(({ info, input, init, processedAt }) => {
    if (now - init.refetchInterval * 1000 > processedAt) {
      processFetch(info, input, init);
    }
  });
}, 1000);
