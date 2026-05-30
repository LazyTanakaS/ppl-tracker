import type { History, DayType } from "@/types";
import { PLAN } from "@/data/plan";

interface HistoryPanelProps {
  history: History;
  onDelete: (index: number) => void;
}

const DAY_COLORS: Record<DayType, string> = {
  push: "var(--accent-push)",
  pull: "var(--accent-pull)",
  legs: "var(--accent-legs)",
};

export default function HistoryPanel({ history, onDelete }: HistoryPanelProps) {
  if (history.length === 0) {
    return <div className="history-empty">Нет сохранённых сессий</div>;
  }

  return (
    <div className="history-list">
      {history.map((session, i) => {
        const date = new Date(session.date);
        const exercises = PLAN[session.day];
        const doneCount = exercises.filter(
          (_, idx) => session.workout[idx]?.done,
        ).length;

        return (
          <div key={i} className="history-card">
            <div className="history-card-header">
              <span
                className="history-day"
                style={{ color: DAY_COLORS[session.day] }}
              >
                {session.day.toUpperCase()}
              </span>

              <span className="history-date">
                {date.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>

              <span className="history-progress">
                {doneCount}/{exercises.length}
              </span>

              <button
                className="history-delete-btn"
                onClick={() => onDelete(i)}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
