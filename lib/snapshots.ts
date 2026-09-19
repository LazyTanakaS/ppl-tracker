import { localDateKey } from "./stats.ts";

export const MAX_SNAPSHOTS = 7;

export type SnapshotMeta = {
  id: number;
  createdAt: string;
  sessions: number;
  bytes: number;
};
type SnapshotRecord = SnapshotMeta & { json: string };

export function shouldSnapshot(
  lastCreatedAt: string | null,
  now: number,
): boolean {
  if (!lastCreatedAt) return true;
  return localDateKey(Date.parse(lastCreatedAt)) !== localDateKey(now);
}

export function snapshotsToDelete(
  ids: number[],
  max = MAX_SNAPSHOTS,
): number[] {
  return [...ids].sort((a, b) => b - a).slice(max);
}

const DB_NAME = "ppl-tracker";
const STORE = "snapshots";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined")
      return reject(new Error("IndexedDB is unavailable"));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export async function listSnapshots(): Promise<SnapshotMeta[]> {
  const records = await run<SnapshotRecord[]>("readonly", (s) => s.getAll());
  return records
    .map(({ id, createdAt, sessions, bytes }) => ({
      id,
      createdAt,
      sessions,
      bytes,
    }))
    .sort((a, b) => b.id - a.id);
}

export async function getSnapshotJson(id: number): Promise<string | null> {
  const record = await run<SnapshotRecord | undefined>("readonly", (s) =>
    s.get(id),
  );
  return record?.json ?? null;
}

export async function addSnapshot(
  json: string,
  sessions: number,
  now: number,
): Promise<void> {
  const record: SnapshotRecord = {
    id: now,
    createdAt: new Date(now).toISOString(),
    sessions,
    bytes: json.length,
    json,
  };
  await run("readwrite", (s) => s.put(record));
  const ids = (await listSnapshots()).map((m) => m.id);
  for (const id of snapshotsToDelete(ids))
    await run("readwrite", (s) => s.delete(id));
}
