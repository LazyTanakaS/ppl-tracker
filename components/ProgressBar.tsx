import type { DayType } from "../types";

interface ProgressBarProps {
  day: DayType;
  done: number;
  total: number;
}

export default function ProgressBar({ day, done, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={`progress-wrap ${day}`}>
      <div className="progress-info">
        <span>PROGRESS</span>{" "}
        <span>
          {done} / {total}
        </span>
      </div>

      <div
        className="progress-bar"
        role="progressbar"
        aria-label={`${day} exercises done`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}
