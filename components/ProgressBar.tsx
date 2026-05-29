import type { DayType } from "../types";

interface ProgressBarProps {
  day: DayType;
  done: number;
  total: number;
}

export default function ProgressBar({ day, done, total }: ProgressBarProps) {
  const pct = Math.round((done / total) * 100);

  return (
    <div className={`progress-wrap ${day}`}>
      <div className="progress-info">
        <span>ПРОГРЕСС</span>{" "}
        <span>
          {done} / {total}
        </span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}
