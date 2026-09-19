"use client";

import { useEffect, useRef, useState } from "react";
import type { DayType, Schedule } from "@/types";
import { useSettings } from "@/hooks/useSettings";
import { usePwa } from "@/hooks/usePwa";
import { REST_OPTIONS, type ThemePref, type Unit } from "@/lib/settings";
import { downloadBackup, importBackup, MAX_IMPORT_BYTES } from "@/lib/storage";
import { listSnapshots, type SnapshotMeta } from "@/lib/snapshots";
import { restoreSnapshot } from "@/lib/autobackup";
import { isStoragePersisted, promptInstall, requestPersistentStorage } from "@/lib/pwa";
import { formatFullDate } from "@/lib/format";
import Modal from "./Modal";
import ScheduleEditor from "./ScheduleEditor";

interface SettingsModalProps {
  schedule: Schedule;
  onSetDay: (weekday: number, day: DayType | null) => void;
  onClose: () => void;
}

type Notice = { kind: "error" | "info"; text: string } | null;

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segmented-btn ${value === option.value ? "active" : ""}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsModal({ schedule, onSetDay, onClose }: SettingsModalProps) {
  const { settings, update } = useSettings();
  const { canInstall, standalone, ios } = usePwa();
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[] | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    listSnapshots()
      .then((list) => active && setSnapshots(list))
      .catch(() => active && setSnapshots([]));
    isStoragePersisted().then((value) => active && setPersisted(value));
    return () => {
      active = false;
    };
  }, []);

  function exportFile() {
    downloadBackup();
    update({ lastExportAt: new Date().toISOString(), backupSnoozedUntil: null });
    setNotice({ kind: "info", text: "Backup file downloaded. Keep it somewhere outside this browser (cloud drive, email to yourself)." });
  }

  function finishRestore(result: ReturnType<typeof importBackup>) {
    if (!result.ok) {
      setNotice({ kind: "error", text: `Restore failed - ${result.reason}` });
      return;
    }
    if (result.dropped > 0) window.alert(`Done. ${result.dropped} damaged workout(s) in the backup were skipped.`);
    window.location.reload();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setNotice(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setNotice({ kind: "error", text: "Import failed - the file is too large to be a backup." });
      return;
    }
    if (!window.confirm("Importing replaces your current plan, history and schedule with the contents of this file. Export a backup first if you are unsure. Continue?")) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setNotice({ kind: "error", text: "Import failed - the file could not be read." });
        return;
      }
      finishRestore(importBackup(reader.result));
    };
    reader.onerror = () => setNotice({ kind: "error", text: "Import failed - the file could not be read." });
    reader.readAsText(file);
  }

  async function restore(meta: SnapshotMeta) {
    if (!window.confirm(`Restore the automatic backup from ${formatFullDate(meta.createdAt)} (${meta.sessions} workouts)? Your current data is saved as a new backup first.`)) {
      return;
    }
    finishRestore(await restoreSnapshot(meta.id));
  }

  async function protectStorage() {
    const granted = await requestPersistentStorage();
    update({ persistAsked: true });
    setPersisted(granted);
    setNotice({
      kind: granted ? "info" : "error",
      text: granted ? "Storage is now protected from automatic cleanup." : "The browser did not grant protection. Installing the app to your home screen usually helps.",
    });
  }

  return (
    <Modal title="SETTINGS" onClose={onClose}>
      <section className="settings-section" aria-labelledby="set-schedule">
        <h3 id="set-schedule">Weekly schedule</h3>
        <p className="settings-hint">Opens the right workout on the right day and powers the consistency stats.</p>
        <ScheduleEditor schedule={schedule} onSetDay={onSetDay} />
      </section>

      <section className="settings-section" aria-labelledby="set-workout">
        <h3 id="set-workout">Workout</h3>
        <div className="settings-row">
          <span id="unit-label">Weight unit</span>
          <Segmented<Unit>
            label="Weight unit"
            value={settings.unit}
            options={[{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]}
            onChange={(unit) => update({ unit })}
          />
        </div>
        <p className="settings-hint">Only changes the label. Existing numbers are not converted.</p>
        <label className="settings-row">
          <span>Start rest timer when I log a set</span>
          <input type="checkbox" className="switch" checked={settings.autoRest} onChange={(e) => update({ autoRest: e.target.checked })} />
        </label>
        <label className="settings-row">
          <span>Rest length</span>
          <select className="settings-select" value={settings.restSeconds} onChange={(e) => update({ restSeconds: Number(e.target.value) })}>
            {REST_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s < 120 ? `${s} sec` : `${s / 60} min`}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="settings-section" aria-labelledby="set-look">
        <h3 id="set-look">Appearance</h3>
        <Segmented<ThemePref>
          label="Theme"
          value={settings.theme}
          options={[{ value: "system", label: "System" }, { value: "dark", label: "Dark" }, { value: "light", label: "Light" }]}
          onChange={(theme) => update({ theme })}
        />
      </section>

      <section className="settings-section" aria-labelledby="set-backup">
        <h3 id="set-backup">Backup &amp; data</h3>
        <p className="settings-hint">
          Your data lives only on this device. Export a file now and then - that is the copy that survives clearing browser data or losing the phone.
        </p>
        <div className="settings-buttons">
          <button type="button" className="rest-btn" onClick={exportFile}>
            ⬇ EXPORT FILE
          </button>
          <button type="button" className="rest-btn" onClick={() => fileInput.current?.click()}>
            ⬆ IMPORT FILE
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden tabIndex={-1} aria-hidden="true" onChange={onFileChange} />
        </div>
        {notice && (
          <p className={`settings-notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
            {notice.text}
          </p>
        )}

        <h4>Automatic backups</h4>
        <p className="settings-hint">A copy is saved once a day and the last {7} are kept. They guard against mistakes, not against clearing site data.</p>
        {snapshots === null ? (
          <p className="settings-hint">Loading…</p>
        ) : snapshots.length === 0 ? (
          <p className="settings-hint">None yet. The first one appears after your first saved workout.</p>
        ) : (
          <ul className="snapshot-list">
            {snapshots.map((meta) => (
              <li key={meta.id}>
                <span>
                  {formatFullDate(meta.createdAt)} · {meta.sessions} workouts
                </span>
                <button type="button" className="link-btn" onClick={() => restore(meta)}>
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="settings-row">
          <span>Protected from browser cleanup</span>
          {persisted ? (
            <strong className="ok-text">Yes</strong>
          ) : (
            <button type="button" className="link-btn" onClick={protectStorage} disabled={persisted === null}>
              Protect
            </button>
          )}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="set-install">
        <h3 id="set-install">Install</h3>
        {standalone ? (
          <p className="settings-hint">Installed - the app opens from your home screen and works offline.</p>
        ) : canInstall ? (
          <button type="button" className="primary-btn" onClick={() => promptInstall()}>
            Install the app
          </button>
        ) : ios ? (
          <p className="settings-hint">On iPhone or iPad: tap Share, then &quot;Add to Home Screen&quot;. It then works offline.</p>
        ) : (
          <p className="settings-hint">Your browser&apos;s menu has an &quot;Install app&quot; or &quot;Add to Home screen&quot; option. The app already works offline once loaded.</p>
        )}
      </section>
    </Modal>
  );
}
