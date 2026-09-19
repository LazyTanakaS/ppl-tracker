import type { Schedule } from "@/types";
import type { Adherence, WeekCount } from "@/lib/progress";
import { formatShortDate, plural } from "@/lib/format";
import type { ActivityCalendar } from "@/lib/stats";

interface ConsistencySectionProps {
  schedule: Schedule;
  adherence: Adherence;
  weeks: WeekCount[];
  daysSince: number | null;
  streak: number;
  calendar: ActivityCalendar;
  onOpenSettings: () => void;
}

const STALE_DAYS = 7;

export default function ConsistencySection({
  schedule,
  adherence,
  weeks,
  daysSince,
  streak,
  calendar,
  onOpenSettings,
}: ConsistencySectionProps) {
  const hasSchedule = Object.keys(schedule).length > 0;
  const max = Math.max(3, ...weeks.map((w) => w.count));
  const stale = daysSince !== null && daysSince >= STALE_DAYS;

  return (
    <section className="stats-section" aria-labelledby="consistency-heading">
      <h3 className="stats-heading" id="consistency-heading">
        Consistency
      </h3>

      <dl className="fact-grid">
        <div className="fact">
          <dt>This week</dt>
          <dd>
            <strong>{adherence.thisWeekDone}</strong>
            <small>{hasSchedule ? `of ${adherence.thisWeekPlanned} planned` : plural(adherence.thisWeekDone, "workout")}</small>
          </dd>
        </div>
        <div className="fact">
          <dt>Last 4 weeks</dt>
          <dd>
            {adherence.pct === null ? (
              <>
                <strong>-</strong>
                <small>
                  <button type="button" className="link-btn" onClick={onOpenSettings}>
                    Set a schedule
                  </button>{" "}
                  to track it
                </small>
              </>
            ) : (
              <>
                <strong>{adherence.pct}%</strong>
                <small>
                  {adherence.done} of {adherence.planned} planned
                </small>
              </>
            )}
          </dd>
        </div>
        <div className={`fact ${stale ? "warn" : ""}`}>
          <dt>Last workout</dt>
          <dd>
            <strong>{daysSince === null ? "-" : daysSince === 0 ? "Today" : daysSince}</strong>
            <small>{daysSince === null || daysSince === 0 ? "" : `${daysSince === 1 ? "day" : "days"} ago${stale ? " - time to get back" : ""}`}</small>
          </dd>
        </div>
        <div className="fact">
          <dt>Streak</dt>
          <dd>
            <strong>{streak}</strong>
            <small>{streak === 1 ? "week" : "weeks"} in a row</small>
          </dd>
        </div>
      </dl>

      <h4 className="stats-subheading">Workouts per week</h4>
      <ol
        className="week-bars"
        role="img"
        aria-label={`Workouts per week over the last ${weeks.length} weeks, oldest first: ${weeks.map((w) => w.count).join(", ")}`}
      >
        {weeks.map((week, i) => (
          <li key={week.weekStart} title={`Week of ${formatShortDate(`${week.weekStart}T12:00:00`)}: ${plural(week.count, "workout")}`}>
            <span className={`week-bar ${i === weeks.length - 1 ? "current" : ""}`} style={{ height: `${Math.max(week.count > 0 ? 12 : 3, (week.count / max) * 100)}%` }} />
            <span className="week-count">{week.count}</span>
          </li>
        ))}
      </ol>
      <p className="stats-note">Each bar is one week (Mon-Sun); the right-most is the current week.</p>

      <h4 className="stats-subheading">Last 12 weeks</h4>
      <div className="stats-calendar" role="img" aria-label={`${plural(calendar.activeDays, "training day")} in the last 12 weeks`}>
        {calendar.cells.map((cell) => (
          <span
            key={cell.key}
            className={cell.future ? "future" : cell.count > 0 ? "active" : ""}
            title={cell.future ? undefined : `${cell.key}${cell.count > 0 ? `: ${plural(cell.count, "workout")}` : ""}`}
          />
        ))}
      </div>
      <p className="stats-note">Each column is a week, oldest on the left.</p>
    </section>
  );
}
