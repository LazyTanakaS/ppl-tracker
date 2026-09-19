import type { DayType, Schedule } from "@/types";

interface ScheduleEditorProps {
  schedule: Schedule;
  onSetDay: (weekday: number, day: DayType | null) => void;
}

const WEEKDAYS = [
  { num: 1, label: "MON", name: "Monday" },
  { num: 2, label: "TUE", name: "Tuesday" },
  { num: 3, label: "WED", name: "Wednesday" },
  { num: 4, label: "THU", name: "Thursday" },
  { num: 5, label: "FRI", name: "Friday" },
  { num: 6, label: "SAT", name: "Saturday" },
  { num: 0, label: "SUN", name: "Sunday" },
];

const DAY_OPTIONS: { day: DayType | null; label: string }[] = [
  { day: "push", label: "PUSH" },
  { day: "pull", label: "PULL" },
  { day: "legs", label: "LEGS" },
  { day: null, label: "REST" },
];

export default function ScheduleEditor({ schedule, onSetDay }: ScheduleEditorProps) {
  return (
    <div className="schedule-grid">
      {WEEKDAYS.map(({ num, label, name }) => (
        <div key={num} className="schedule-row" role="group" aria-label={name}>
          <span className="schedule-weekday" aria-hidden="true">
            {label}
          </span>
          <div className="schedule-options">
            {DAY_OPTIONS.map(({ day, label: optionLabel }) => {
              const active = (schedule[num] ?? null) === day;
              return (
                <button
                  key={optionLabel}
                  className={`schedule-btn ${day ?? "rest"} ${active ? "active" : ""}`}
                  aria-pressed={active}
                  onClick={() => onSetDay(num, day)}
                >
                  {optionLabel}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
