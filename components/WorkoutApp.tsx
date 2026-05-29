"use client";

import { useEffect, useState } from "react";
import { useWorkoutState } from "../hooks/useWorkoutState";
import { PLAN } from "@/data/plan";
import type { DayType } from "../types";
type ActiveTab = DayType | "history";
import { useHistory } from "@/hooks/useHistory";
import Header from "./Header";
import DayTabs from "./DayTabs";
import DayPanel from "./DayPanel";
import HistoryPanel from "./HistoryPanel";

export default function WorkoutApp() {
  const { workout, toggleDone, updateSet, updateNotes, resetDay } =
    useWorkoutState();
  const { history, saveSession } = useHistory();
  const [mounted, setMounted] = useState(false);

  const [activeDay, setActiveDay] = useState<ActiveTab>("push");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <main>
        <Header />
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
      <Header />
      <DayTabs activeDay={activeDay} onSwitch={setActiveDay} />
      {activeDay === "history" ? (
        <HistoryPanel history={history} />
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
