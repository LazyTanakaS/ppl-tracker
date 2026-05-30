"use client";
import { useState } from "react";
import type { DayType, Exercise } from "@/types";

interface PlanModalProps {
  day: DayType;
  exercises: Exercise[];
  onAdd: (day: DayType, exercise: Exercise) => void;
  onRemove: (day: DayType, idx: number) => void;
  onUpdate: (day: DayType, idx: number, exercise: Exercise) => void;
  onReset: (day: DayType) => void;
  onClose: () => void;
}

const EMPTY: Exercise = { name: "", sets: 3, reps: "10-12" };

export default function PlanModal({
  day,
  exercises,
  onAdd,
  onRemove,
  onReset,
  onClose,
  onUpdate,
}: PlanModalProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Exercise>(EMPTY);
  const [adding, setAdding] = useState(false);

  function startEdit(idx: number) {
    setEditIdx(idx);
    setForm(exercises[idx]);
    setAdding(false);
  }

  function startAdd() {
    setAdding(true);
    setEditIdx(null);
    setForm(EMPTY);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (adding) {
      onAdd(day, form);
    } else if (editIdx !== null) {
      onUpdate(day, editIdx, form);
    }
    setAdding(false);
    setEditIdx(null);
    setForm(EMPTY);
  }

  function handleCancel() {
    setAdding(false);
    setEditIdx(null);
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
          {exercises.map((ex, i) => (
            <div key={i} className="plan-exercise-row">
              {editIdx === i ? (
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
                    onClick={() => startEdit(i)}
                  >
                    ✎
                  </button>
                  <button
                    className="plan-remove-btn"
                    onClick={() => onRemove(day, i)}
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
