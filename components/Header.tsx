"use client";

import { useRef, useState } from "react";
import { downloadBackup, importBackup } from "@/lib/storage";
interface HeaderProps {
  onScheduleOpen: () => void;
}

export default function Header({ onScheduleOpen }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "error">("idle");

  const now = new Date();
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const month = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const dayName = days[now.getDay()];
  const date = now.getDate();
  const monthName = month[now.getMonth()];
  const year = now.getFullYear();

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const ok = typeof text === "string" && importBackup(text);
      if (ok) {
        window.location.reload();
      } else {
        setImportStatus("error");
        setTimeout(() => setImportStatus("idle"), 3000);
      }
    };

    reader.onerror = () => {
      setImportStatus("error");
      setTimeout(() => setImportStatus("idle"), 3000);
    };
    reader.readAsText(file);
  }

  return (
    <header style={{ position: "relative" }}>
      <div className="logo">
        PPL<span>.</span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
        <button
          className="schedule-open-btn"
          onClick={downloadBackup}
          title="Export backup JSON"
        >
          ⬇
        </button>

        <button
          className="schedule-open-btn"
          onClick={handleImportClick}
          title="Import backup (JSON)"
        >
          ⬆
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <button className="schedule-open-btn" onClick={onScheduleOpen}>
          ☰
        </button>

        <div className="date-display">
          {dayName} <br />
          {date} {monthName} {year}
        </div>
      </div>

      {importStatus === "error" && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            fontSize: "11px",
            color: "#e05555",
            marginTop: "4px",
          }}
        >
          Import failed — file is not a valid backup
        </div>
      )}
    </header>
  );
}
