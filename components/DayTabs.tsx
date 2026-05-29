import { DayType } from "../types";

interface DayTabsProps {
  activeDay: DayType;
  onSwitch: (day: DayType) => void;
}

const TABS: { day: DayType; label: string; sub: string }[] = [
  { day: "push", label: "PUSH", sub: "Грудь · Плечи · Трицепс" },
  { day: "pull", label: "PULL", sub: "Спина · Бицепс" },
  { day: "legs", label: "LEGS", sub: "Ноги · Пресс" },
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
