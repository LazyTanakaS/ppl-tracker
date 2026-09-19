"use client";

import { useRef } from "react";
import type { DayType } from "@/types";
import { DAYS } from "@/lib/days";

interface DaySwitcherProps {
  day: DayType;
  onSwitch: (day: DayType) => void;
}

export const dayTabId = (day: DayType) => `day-tab-${day}`;
export const dayPanelId = (day: DayType) => `day-panel-${day}`;

const NAMES: Record<DayType, string> = { push: "Push", pull: "Pull", legs: "Legs" };
const SUBS: Record<DayType, string> = { push: "Chest · Shoulders · Triceps", pull: "Back · Biceps", legs: "Legs · Abs" };

export default function DaySwitcher({ day, onSwitch }: DaySwitcherProps) {
  const refs = useRef<Partial<Record<DayType, HTMLButtonElement | null>>>({});

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const target =
      event.key === "ArrowRight" ? (index + 1) % DAYS.length
      : event.key === "ArrowLeft" ? (index + DAYS.length - 1) % DAYS.length
      : null;
    if (target === null) return;
    event.preventDefault();
    onSwitch(DAYS[target]);
    refs.current[DAYS[target]]?.focus();
  }

  return (
    <div className="day-switcher" role="tablist" aria-label="Workout type">
      {DAYS.map((d, index) => {
        const active = d === day;
        return (
          <button
            key={d}
            ref={(el) => {
              refs.current[d] = el;
            }}
            id={dayTabId(d)}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={active ? dayPanelId(d) : undefined}
            tabIndex={active ? 0 : -1}
            className={`day-tab ${d} ${active ? "active" : ""}`}
            onClick={() => onSwitch(d)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span className="day-tab-name">{NAMES[d].toUpperCase()}</span>
            <span className="day-tab-sub">{SUBS[d]}</span>
          </button>
        );
      })}
    </div>
  );
}
