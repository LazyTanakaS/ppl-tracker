import { DayType } from "../types";

interface DayTabsProps {
  activeDay: DayType | "history" | "stats";
  onSwitch: (day: DayType | "history" | "stats") => void;
}

const TABS: {
  day: DayType | "history" | "stats";
  label: string;
  sub: string;
}[] = [
  { day: "push", label: "PUSH", sub: "Chest · Shoulders · Triceps" },
  { day: "pull", label: "PULL", sub: "Back · Biceps" },
  { day: "legs", label: "LEGS", sub: "Legs · Abs" },
  { day: "stats" as const, label: "STATS", sub: "Progress" },
  { day: "history" as const, label: "HIST", sub: "History" },
];

export default function DayTabs({ activeDay, onSwitch }: DayTabsProps) {
  return (
    <div className="tabs">
      {TABS.map(({ day, label, sub }) => (
        <div
          key={day}
          className={`tab ${day} ${day === activeDay ? "active" : ""}`}
          onClick={() => onSwitch(day)}
        >
          {label} <span className="tab-sub">{sub}</span>
        </div>
      ))}
    </div>
  );
}
