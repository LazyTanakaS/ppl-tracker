import type { DayType, Schedule } from "@/types";

interface ScheduleModalProps {
  schedule: Schedule;
  onSetDay: (weekday: number, day: DayType | null) => void;
  onClose: () => void;
}

const WEEKDAYS = [
  { num: 1, label: "MON" },
  { num: 2, label: "TUE" },
  { num: 3, label: "WED" },
  { num: 4, label: "THU" },
  { num: 5, label: "FRI" },
  { num: 6, label: "SAT" },
  { num: 0, label: "SUN" },
];

const DAY_OPTIONS: (DayType | null)[] = ["push", "pull", "legs", null];

const DAY_LABELS: Record<string, string> = {
  push: "PUSH",
  pull: "PULL",
  legs: "LEGS",
  rest: "REST",
};

export default function ScheduleModal({
  schedule,
  onSetDay,
  onClose,
}: ScheduleModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">SCHEDULE</span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="schedule-grid">
          {WEEKDAYS.map(({ num, label }) => (
            <div key={num} className="schedule-row">
              <span className="schedule-weekday">{label}</span>
              <div className="schedule-options">
                {DAY_OPTIONS.map((day) => (
                  <button
                    key={day ?? "rest"}
                    className={`schedule-btn ${day ?? "rest"} ${(schedule[num] ?? null) === day ? "active" : ""}`}
                    onClick={() => onSetDay(num, day)}
                  >
                    {DAY_LABELS[day ?? "rest"]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
