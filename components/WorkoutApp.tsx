"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useWorkoutState } from "../hooks/useWorkoutState";
import { usePlan } from "@/hooks/usePlan";
import type { DayType, Plan, Schedule } from "../types";
import { useHistory } from "@/hooks/useHistory";
import { useRestTimer } from "@/hooks/useRestTimer";
import { useSchedule } from "@/hooks/useSchedule";
import { SettingsProvider, useSettings } from "@/hooks/useSettings";
import Header from "./Header";
import MainNav, { sectionPanelId, sectionTabId } from "./MainNav";
import DaySwitcher from "./DaySwitcher";
import ProgressBar from "./ProgressBar";
import DayPanel, { type SaveResult } from "./DayPanel";
import HistoryPanel from "./HistoryPanel";
import StatsPanel from "@/components/StatsPanel";
import SettingsModal from "./SettingsModal";
import PlanModal from "./PlanModal";
import RestBanner from "./RestBanner";
import Onboarding from "./Onboarding";
import BackupReminder from "./BackupReminder";
import { DAYS } from "@/lib/days";
import { buildSession, hasSessionData, lastPerformance } from "@/lib/session";
import { pickInitialView, type Section, type View } from "@/lib/schedule";
import { downloadBackup, STORAGE_ERROR_EVENT } from "@/lib/storage";
import { shouldRemindBackup, type Unit } from "@/lib/settings";
import { runAutoBackup } from "@/lib/autobackup";
import { requestPersistentStorage } from "@/lib/pwa";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function WorkoutApp() {
  return (
    <SettingsProvider>
      <App />
    </SettingsProvider>
  );
}

function App() {
  const { settings, update } = useSettings();
  const {
    workout,
    setStatus,
    updateSet,
    toggleSet,
    stepKg,
    updateNotes,
    resetDay,
  } = useWorkoutState();
  const { history, saveSession, deleteSession } = useHistory();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { schedule, setDay, replaceSchedule } = useSchedule();
  const {
    plan,
    addExercise,
    removeExercise,
    updateExercise,
    resetDay: resetPlanDay,
    replacePlan,
  } = usePlan();
  const rest = useRestTimer();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [planModalDay, setPlanModalDay] = useState<DayType | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [now] = useState(() => Date.now());
  const [view, setView] = useState<View>(() =>
    pickInitialView(schedule, history, new Date().getDay()),
  );

  useEffect(() => {
    const onError = () => setStorageError(true);
    window.addEventListener(STORAGE_ERROR_EVENT, onError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onError);
  }, []);

  const sessionCount = history.length;
  useEffect(() => {
    if (mounted && sessionCount > 0) void runAutoBackup();
  }, [mounted, sessionCount]);

  const lastSets = useMemo(() => lastPerformance(history), [history]);
  const unit: Unit = settings.unit;

  function handleSave(day: DayType): SaveResult {
    const session = buildSession(day, plan[day], workout[day]);
    if (!hasSessionData(session)) return "empty";
    if (!saveSession(session)) return "error";
    resetDay(day);
    if (!settings.persistAsked) {
      update({ persistAsked: true });
      void requestPersistentStorage();
    }
    return "ok";
  }

  function handleToggleSet(
    day: DayType,
    exercise: { id: string; name: string; sets: number; reps: string },
    index: number,
  ) {
    const outcome = toggleSet(day, exercise, index, lastSets.get(exercise.id));
    if (outcome === "done" && settings.autoRest)
      rest.start(exercise.name, settings.restSeconds);
    return outcome;
  }

  function finishOnboarding(choice: {
    plan: Plan | null;
    schedule: Schedule | null;
    unit: Unit;
  }) {
    const nextSchedule = choice.schedule ?? schedule;
    if (choice.plan) replacePlan(choice.plan);
    if (choice.schedule) replaceSchedule(choice.schedule);
    update({ onboarded: true, unit: choice.unit });
    setView(pickInitialView(nextSchedule, history, new Date().getDay()));
  }

  const switchSection = (section: Section) =>
    setView((prev) => ({ ...prev, section }));
  const openWorkout = () => switchSection("workout");

  if (!mounted)
    return (
      <main>
        <Header onSettingsOpen={() => {}} />
        <div className="skeleton" role="status" aria-label="Loading">
          <div className="skeleton-bar wide" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </main>
    );

  const day = view.day;
  const doneCount = plan[day].filter(
    (ex) => workout[day][ex.id]?.status === "done",
  ).length;

  return (
    <main>
      <Header onSettingsOpen={() => setSettingsOpen(true)} />

      {storageError && (
        <div className="storage-alert" role="alert">
          <span>
            Could not save to this device&apos;s storage - recent changes may be
            lost after a reload. Open Settings → Backup &amp; data and export a
            file, then free up space.
          </span>
          <button
            type="button"
            onClick={() => setStorageError(false)}
            aria-label="Dismiss warning"
          >
            ✕
          </button>
        </div>
      )}

      {settings.onboarded && shouldRemindBackup(settings, history, now) && (
        <BackupReminder
          onExport={() => {
            downloadBackup();
            update({
              lastExportAt: new Date().toISOString(),
              backupSnoozedUntil: null,
            });
          }}
          onSnooze={() =>
            update({
              backupSnoozedUntil: new Date(Date.now() + WEEK_MS).toISOString(),
            })
          }
        />
      )}

      <MainNav section={view.section} onSwitch={switchSection} />

      <div
        id={sectionPanelId("workout")}
        role="tabpanel"
        aria-labelledby={sectionTabId("workout")}
        hidden={view.section !== "workout"}
      >
        <div className="workout-bar">
          <DaySwitcher
            day={day}
            onSwitch={(next) => setView((prev) => ({ ...prev, day: next }))}
          />
          <ProgressBar day={day} done={doneCount} total={plan[day].length} />
        </div>
        {DAYS.map((d) => (
          <DayPanel
            key={d}
            day={d}
            isActive={d === day}
            exercises={plan[d]}
            workout={workout[d]}
            lastSets={lastSets}
            unit={unit}
            onSetStatus={setStatus}
            onUpdateSet={updateSet}
            onToggleSet={handleToggleSet}
            onStepKg={(dayType, exercise, index, delta) =>
              stepKg(dayType, exercise, index, delta, lastSets.get(exercise.id))
            }
            onUpdateNotes={updateNotes}
            onStartRest={(name) => rest.start(name, settings.restSeconds)}
            onReset={resetDay}
            onSave={() => handleSave(d)}
            onEditPlan={() => setPlanModalDay(d)}
          />
        ))}
      </div>

      {view.section === "history" && (
        <HistoryPanel
          history={history}
          unit={unit}
          onDelete={deleteSession}
          onStartWorkout={openWorkout}
        />
      )}
      {view.section === "stats" && (
        <StatsPanel
          plan={plan}
          history={history}
          schedule={schedule}
          unit={unit}
          onStartWorkout={openWorkout}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      <RestBanner
        rest={rest.rest}
        finished={rest.finished}
        onStop={rest.stop}
      />

      {settingsOpen && (
        <SettingsModal
          schedule={schedule}
          onSetDay={setDay}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {planModalDay && (
        <PlanModal
          day={planModalDay}
          exercises={plan[planModalDay]}
          onAdd={addExercise}
          onRemove={removeExercise}
          onUpdate={updateExercise}
          onReset={resetPlanDay}
          onClose={() => setPlanModalDay(null)}
        />
      )}

      {!settings.onboarded && <Onboarding onFinish={finishOnboarding} />}
    </main>
  );
}
