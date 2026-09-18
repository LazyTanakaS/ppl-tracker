import type { History } from "@/types";

export type PersonalRecord = {
  exerciseId: string;
  kg: number;
  reps: string;
  date: string;
};

export function findPersonalRecord(
  history: History,
  exerciseId: string,
): PersonalRecord | null {
  let best: PersonalRecord | null = null;

  for (const session of history) {
    const exState = session.workout[exerciseId];
    if (!exState) continue;

    for (const set of exState.sets) {
      const kg = parseFloat(set.kg);
      if (isNaN(kg) || kg <= 0) continue;

      if (!best || kg > best.kg) {
        best = { exerciseId, kg, reps: set.reps, date: session.date };
      }
    }
  }

  return best;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export type WeeklyVolume = { weekStart: string; volume: number };

export function calculateWeeklyVolume(history: History): WeeklyVolume[] {
  const volumeByWeek = new Map<string, number>();

  for (const session of history) {
    const weekStart = getWeekStart(new Date(session.date));
    let sessionVolume = 0;

    for (const exState of Object.values(session.workout)) {
      for (const set of exState.sets) {
        const kg = parseFloat(set.kg);
        const reps = parseInt(set.reps, 10);
        if (isNaN(kg) || isNaN(reps)) continue;

        sessionVolume += kg * reps;
      }
    }

    volumeByWeek.set(
      weekStart,
      (volumeByWeek.get(weekStart) ?? 0) + sessionVolume,
    );
  }

  return Array.from(volumeByWeek.entries())
    .map(([weekStart, volume]) => ({ weekStart, volume }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export type ExerciseProgressPoint = {
  date: string;
  maxKg: number;
  estimated1RM: number;
};

export function getExerciseProgress(
  history: History,
  exerciseId: string,
): ExerciseProgressPoint[] {
  const points: ExerciseProgressPoint[] = [];
  const chronological = [...history].reverse();

  for (const session of chronological) {
    const exState = session.workout[exerciseId];
    if (!exState) continue;

    let maxKg = 0;
    let best1RM = 0;

    for (const set of exState.sets) {
      const kg = parseFloat(set.kg);
      const reps = parseInt(set.reps, 10);
      if (isNaN(kg) || isNaN(reps) || kg <= 0 || reps <= 0) continue;

      if (kg > maxKg) maxKg = kg;

      const estimated1RM = kg * (1 + reps / 30);
      if (estimated1RM > best1RM) best1RM = estimated1RM;
    }

    if (maxKg > 0) {
      points.push({
        date: session.date,
        maxKg,
        estimated1RM: Math.round(best1RM * 10) / 10,
      });
    }
  }

  return points;
}
