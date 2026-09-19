"use client";

import { useState } from "react";
import type { DayType, Exercise } from "@/types";
import { LIMITS } from "@/lib/normalize";
import Modal from "./Modal";

interface PlanModalProps {
  day: DayType;
  exercises: Exercise[];
  onAdd: (day: DayType, exercise: Omit<Exercise, "id">) => void;
  onRemove: (day: DayType, id: string) => void;
  onUpdate: (day: DayType, id: string, exercise: Exercise) => void;
  onReset: (day: DayType) => void;
  onClose: () => void;
}

type FormValues = { name: string; sets: string; reps: string };
type Mode = { type: "idle" } | { type: "add" } | { type: "edit"; id: string };

const EMPTY: FormValues = { name: "", sets: "3", reps: "10-12" };

function validate(values: FormValues): { exercise: Omit<Exercise, "id"> } | { error: string } {
  const name = values.name.trim();
  if (!name) return { error: "Enter an exercise name." };
  const sets = Number(values.sets);
  if (!Number.isInteger(sets) || sets < 1 || sets > LIMITS.maxSets) {
    return { error: `Sets must be a whole number from 1 to ${LIMITS.maxSets}.` };
  }
  const reps = values.reps.trim();
  if (!reps) return { error: "Enter a rep range, for example 8-12." };
  return { exercise: { name, sets, reps } };
}

interface ExerciseFormProps {
  values: FormValues;
  submitLabel: string;
  onChange: (values: FormValues) => void;
  onSubmit: (exercise: Omit<Exercise, "id">) => void;
  onCancel: () => void;
}

function ExerciseForm({ values, submitLabel, onChange, onSubmit, onCancel }: ExerciseFormProps) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validate(values);
    if ("error" in result) setError(result.error);
    else onSubmit(result.exercise);
  }

  return (
    <form className="plan-form" onSubmit={handleSubmit} noValidate>
      <label className="plan-field">
        <span>Name</span>
        <input
          className="plan-input"
          value={values.name}
          maxLength={LIMITS.maxName}
          autoComplete="off"
          autoFocus
          onChange={(e) => onChange({ ...values, name: e.target.value })}
        />
      </label>
      <div className="plan-form-row">
        <label className="plan-field">
          <span>Sets (1-{LIMITS.maxSets})</span>
          <input
            className="plan-input-small"
            type="number"
            inputMode="numeric"
            min={1}
            max={LIMITS.maxSets}
            value={values.sets}
            onChange={(e) => onChange({ ...values, sets: e.target.value })}
          />
        </label>
        <label className="plan-field">
          <span>Reps</span>
          <input
            className="plan-input-small"
            placeholder="e.g. 8-12"
            value={values.reps}
            maxLength={LIMITS.maxReps}
            autoComplete="off"
            onChange={(e) => onChange({ ...values, reps: e.target.value })}
          />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="plan-form-actions">
        <button type="submit" className="plan-save-btn">
          {submitLabel}
        </button>
        <button type="button" className="plan-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function PlanModal({
  day,
  exercises,
  onAdd,
  onRemove,
  onReset,
  onClose,
  onUpdate,
}: PlanModalProps) {
  const [mode, setMode] = useState<Mode>({ type: "idle" });
  const [form, setForm] = useState<FormValues>(EMPTY);

  function startEdit(exercise: Exercise) {
    setMode({ type: "edit", id: exercise.id });
    setForm({ name: exercise.name, sets: String(exercise.sets), reps: exercise.reps });
  }

  function startAdd() {
    setMode({ type: "add" });
    setForm(EMPTY);
  }

  function finish() {
    setMode({ type: "idle" });
    setForm(EMPTY);
  }

  function handleRemove(exercise: Exercise) {
    if (
      window.confirm(
        `Remove "${exercise.name}" from the ${day.toUpperCase()} plan? Saved sessions keep it.`,
      )
    ) {
      onRemove(day, exercise.id);
    }
  }

  function handleReset() {
    if (
      window.confirm(
        `Replace the ${day.toUpperCase()} plan with the default exercises? Your custom exercises will be removed from the plan (saved sessions keep them).`,
      )
    ) {
      onReset(day);
      onClose();
    }
  }

  return (
    <Modal title={`${day.toUpperCase()} - PLAN`} onClose={onClose} guardBackdrop={mode.type !== "idle"}>
      <ul className="plan-list">
        {exercises.length === 0 && mode.type !== "add" && (
          <li className="plan-empty">No exercises yet. Add the first one below.</li>
        )}
        {exercises.map((exercise) => (
          <li key={exercise.id} className="plan-exercise-row">
            {mode.type === "edit" && mode.id === exercise.id ? (
              <ExerciseForm
                values={form}
                submitLabel="Save"
                onChange={setForm}
                onSubmit={(values) => {
                  onUpdate(day, exercise.id, { ...values, id: exercise.id });
                  finish();
                }}
                onCancel={finish}
              />
            ) : (
              <>
                <span className="plan-ex-name">{exercise.name}</span>
                <span className="plan-ex-meta">
                  {exercise.sets}×{exercise.reps}
                </span>
                <button
                  className="plan-edit-btn"
                  aria-label={`Edit ${exercise.name}`}
                  onClick={() => startEdit(exercise)}
                >
                  ✎
                </button>
                <button
                  className="plan-remove-btn"
                  aria-label={`Remove ${exercise.name}`}
                  onClick={() => handleRemove(exercise)}
                >
                  ✕
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {mode.type === "add" ? (
        <ExerciseForm
          values={form}
          submitLabel="Add"
          onChange={setForm}
          onSubmit={(values) => {
            onAdd(day, values);
            finish();
          }}
          onCancel={finish}
        />
      ) : (
        <button className="plan-add-btn" onClick={startAdd}>
          + Add exercise
        </button>
      )}

      <button className="plan-reset-btn" onClick={handleReset}>
        ↺ Reset to default
      </button>
    </Modal>
  );
}
