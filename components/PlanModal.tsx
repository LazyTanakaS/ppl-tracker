"use client";
import { useState } from "react";
import type { DayType, Exercise } from "@/types";

interface PlanModalProps {
  day: DayType;
  exercises: Exercise[];
  onAdd: (day: DayType, exercise: Omit<Exercise, "id">) => void;
  onRemove: (day: DayType, id: string) => void;
  onUpdate: (day: DayType, id: string, exercise: Exercise) => void;
  onReset: (day: DayType) => void;
  onClose: () => void;
}

type ExerciseForm = Omit<Exercise, "id">;

const EMPTY: ExerciseForm = { name: "", sets: 3, reps: "10-12" };

export default function PlanModal({
  day,
  exercises,
  onAdd,
  onRemove,
  onReset,
  onClose,
  onUpdate,
}: PlanModalProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ExerciseForm>(EMPTY);
  const [adding, setAdding] = useState(false);

  function startEdit(ex: Exercise) {
    setEditId(ex.id);
    setForm({ name: ex.name, sets: ex.sets, reps: ex.reps });
    setAdding(false);
  }

  function startAdd() {
    setAdding(true);
    setEditId(null);
    setForm(EMPTY);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (adding) {
      onAdd(day, form);
    } else if (editId !== null) {
      onUpdate(day, editId, { ...form, id: editId });
    }
    setAdding(false);
    setEditId(null);
    setForm(EMPTY);
  }

  function handleCancel() {
    setAdding(false);
    setEditId(null);
    setForm(EMPTY);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{day.toUpperCase()} - PLAN</span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="plan-list">
          {exercises.map((ex) => (
            <div key={ex.id} className="plan-exercise-row">
              {editId === ex.id ? (
                <div className="plan-form">
                  <input
                    className="plan-input"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <div className="plan-form-row">
                    <input
                      className="plan-input-small"
                      type="number"
                      placeholder="Sets"
                      value={form.sets}
                      onChange={(e) =>
                        setForm({ ...form, sets: +e.target.value })
                      }
                    />
                    <input
                      className="plan-input-small"
                      placeholder="Reps"
                      value={form.reps}
                      onChange={(e) =>
                        setForm({ ...form, reps: e.target.value })
                      }
                    />
                  </div>
                  <div className="plan-form-actions">
                    <button className="plan-save-btn" onClick={handleSave}>
                      Save
                    </button>
                    <button className="plan-cancel-btn" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="plan-ex-name">{ex.name}</span>
                  <span className="plan-ex-meta">
                    {ex.sets}×{ex.reps}
                  </span>
                  <button
                    className="plan-edit-btn"
                    onClick={() => startEdit(ex)}
                  >
                    ✎
                  </button>
                  <button
                    className="plan-remove-btn"
                    onClick={() => onRemove(day, ex.id)}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {adding ? (
          <div className="plan-form">
            <input
              className="plan-input"
              placeholder="Exercise name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="plan-form-row">
              <input
                className="plan-input-small"
                type="number"
                placeholder="Sets"
                value={form.sets}
                onChange={(e) => setForm({ ...form, sets: +e.target.value })}
              />
              <input
                className="plan-input-small"
                placeholder="Reps (e.g. 10-12)"
                value={form.reps}
                onChange={(e) => setForm({ ...form, reps: e.target.value })}
              />
            </div>

            <div className="plan-form-actions">
              <button className="plan-save-btn" onClick={handleSave}>
                Add
              </button>
              <button className="plan-cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="plan-add-btn" onClick={startAdd}>
            + Add exercise
          </button>
        )}

        <button
          className="plan-reset-btn"
          onClick={() => {
            onReset(day);
            onClose();
          }}
        >
          ↺ Reset to default
        </button>
      </div>
    </div>
  );
}
