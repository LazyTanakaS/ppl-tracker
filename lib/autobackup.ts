import { collectBackup, importBackup, type ImportResult } from "./storage.ts";
import {
  addSnapshot,
  getSnapshotJson,
  listSnapshots,
  shouldSnapshot,
} from "./snapshots.ts";

export async function runAutoBackup(now = Date.now()): Promise<void> {
  try {
    const backup = collectBackup();
    if (backup.history.length === 0) return;
    const [latest] = await listSnapshots();
    if (!shouldSnapshot(latest?.createdAt ?? null, now)) return;
    await addSnapshot(JSON.stringify(backup), backup.history.length, now);
  } catch (err) {
    console.warn("[backup] Automatic backup skipped", err);
  }
}

export async function restoreSnapshot(id: number): Promise<ImportResult> {
  const json = await getSnapshotJson(id);
  if (json === null)
    return { ok: false, reason: "That backup no longer exists." };
  try {
    const current = collectBackup();
    await addSnapshot(
      JSON.stringify(current),
      current.history.length,
      Date.now(),
    );
  } catch {}
  return importBackup(json);
}
