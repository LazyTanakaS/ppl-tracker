"use client";

import { useEffect, useState } from "react";
import { useWorkoutState } from "../hooks/useWorkoutState";
import { PLAN } from "@/data/plan";
import type { DayType } from "../types";
import { useHistory } from "@/hooks/useHistory";
import Header from "./Header";
import DayTabs from "./DayTabs";
import DayPanel from "./DayPanel";
import HistoryPanel from "./HistoryPanel";
import { useSchedule } from "@/hooks/useSchedule";
import ScheduleModal from "./ScheduleModal";

type ActiveTab = DayType | "history";

export default function WorkoutApp() {
  const { workout, toggleDone, updateSet, updateNotes, resetDay } =
    useWorkoutState();
  const { history, saveSession, deleteSession } = useHistory();
  const [mounted, setMounted] = useState(false);
  const { schedule, setDay, getTodayTab } = useSchedule();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const [activeDay, setActiveDay] = useState<ActiveTab>(() => getTodayTab());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <main>
        <Header onScheduleOpen={() => {}} />
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            letterSpacing: "2px",
          }}
        >
          ЗАГРУЗКА...
        </div>
      </main>
    );

  return (
    <main>
      <Header onScheduleOpen={() => setScheduleOpen(true)} />

      {scheduleOpen && (
        <ScheduleModal
          schedule={schedule}
          onSetDay={setDay}
          onClose={() => setScheduleOpen(false)}
        />
      )}

      <DayTabs activeDay={activeDay} onSwitch={setActiveDay} />
      {activeDay === "history" ? (
        <HistoryPanel history={history} onDelete={deleteSession} />
      ) : (
        (["push", "pull", "legs"] as DayType[]).map((day) => (
          <DayPanel
            key={day}
            day={day}
            isActive={day === activeDay}
            exercises={PLAN[day]}
            workout={workout[day]}
            onToggleDone={toggleDone}
            onUpdateSet={updateSet}
            onUpdateNotes={updateNotes}
            onReset={resetDay}
            onSave={() => saveSession(day, workout[day])}
          />
        ))
      )}
    </main>
  );
}
