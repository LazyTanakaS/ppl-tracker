"use client";

import { useSyncExternalStore } from "react";
import { usePwa } from "@/hooks/usePwa";

interface HeaderProps {
  onSettingsOpen: () => void;
}

const DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const MONTHS = [
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

function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function todayLabel(): string {
  const now = new Date();
  return `${DAYS[now.getDay()]}|${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export default function Header({ onSettingsOpen }: HeaderProps) {
  const today = useSyncExternalStore(subscribeToClock, todayLabel, () => "");
  const [dayName, dateText] = today.split("|");
  const { online } = usePwa();

  return (
    <header>
      <div className="logo">
        PPL<span>.</span>
      </div>

      <div className="header-actions">
        {!online && (
          <span className="offline-pill" role="status">
            Offline · saved on this device
          </span>
        )}
        <button
          className="icon-btn"
          onClick={onSettingsOpen}
          aria-label="Settings"
          title="Settings"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      </div>

      <div className="date-display">
        {dayName || " "} <br />
        {dateText || " "}
      </div>
    </header>
  );
}
