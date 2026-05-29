"use client";

import { useState } from "react";
import { useWorkoutState } from "../hooks/useWorkoutState";
import { PLAN } from "@/data/plan";
import type { DayType } from "../types";
import Header from "./Header";
import DayTabs from "./DayTabs";
import DayPanel from "./DayPanel";

export default function WorkoutApp() {
  const [activeDay, setActiveDay] = useState<DayType>("push");
  const { workout, toggleDone, updateSet, updateNotes, resetDay } =
    useWorkoutState();

  return (
    <main>
      <Header />
      <DayTabs activeDay={activeDay} onSwitch={setActiveDay} />
      {(["push", "pull", "legs"] as DayType[]).map((day) => (
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
        />
      ))}
    </main>
  );
}
