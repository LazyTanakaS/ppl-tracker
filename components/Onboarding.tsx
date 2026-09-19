"use client";

import { useState } from "react";
import type { Plan, Schedule } from "@/types";
import type { Unit } from "@/lib/settings";
import { SCHEDULE_PRESETS, TEMPLATES } from "@/data/templates";
import { usePwa } from "@/hooks/usePwa";
import { promptInstall } from "@/lib/pwa";
import Modal from "./Modal";

interface OnboardingProps {
  onFinish: (choice: {
    plan: Plan | null;
    schedule: Schedule | null;
    unit: Unit;
  }) => void;
}

function ChoiceGroup({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  value: string;
  options: { id: string; label: string; detail: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="choice-group">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <label
          key={option.id}
          className={`choice ${value === option.id ? "selected" : ""}`}
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            data-autofocus={value === option.id ? "" : undefined}
            onChange={() => onChange(option.id)}
          />
          <span className="choice-label">{option.label}</span>
          <span className="choice-detail">{option.detail}</span>
        </label>
      ))}
    </fieldset>
  );
}

const STEPS = ["Plan", "Schedule", "Finish"] as const;

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [presetId, setPresetId] = useState(SCHEDULE_PRESETS[0].id);
  const [unit, setUnit] = useState<Unit>("kg");
  const { canInstall, standalone, ios } = usePwa();

  const finish = () =>
    onFinish({
      plan: TEMPLATES.find((t) => t.id === templateId)?.plan ?? null,
      schedule:
        SCHEDULE_PRESETS.find((p) => p.id === presetId)?.schedule ?? null,
      unit,
    });

  return (
    <Modal
      title="WELCOME"
      onClose={() => onFinish({ plan: null, schedule: null, unit: "kg" })}
      guardBackdrop
    >
      <p className="onboarding-step" aria-live="polite">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      {step === 0 && (
        <>
          <p className="settings-hint">
            Pick a starting plan. You can edit every exercise later.
          </p>
          <ChoiceGroup
            name="template"
            legend="Starting plan"
            value={templateId}
            onChange={setTemplateId}
            options={TEMPLATES.map((t) => ({
              id: t.id,
              label: t.label,
              detail: t.description,
            }))}
          />
        </>
      )}

      {step === 1 && (
        <>
          <p className="settings-hint">
            When do you train? The app opens the right workout for the day. You
            can fine-tune this in Settings.
          </p>
          <ChoiceGroup
            name="schedule"
            legend="Training days"
            value={presetId}
            onChange={setPresetId}
            options={SCHEDULE_PRESETS}
          />
        </>
      )}

      {step === 2 && (
        <>
          <p className="settings-hint">
            Last thing: the weight unit. It only changes the label.
          </p>
          <div className="segmented" role="group" aria-label="Weight unit">
            {(["kg", "lb"] as const).map((u) => (
              <button
                key={u}
                type="button"
                className={`segmented-btn ${unit === u ? "active" : ""}`}
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
              >
                {u}
              </button>
            ))}
          </div>
          <div className="onboarding-tip">
            <strong>Tip: log in one tap.</strong> Tap ✓ next to a set to repeat
            what you lifted last time; type only when something changes.
          </div>
          {!standalone && (
            <div className="onboarding-tip">
              <strong>Install it.</strong>{" "}
              {canInstall ? (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => promptInstall()}
                >
                  Add to home screen
                </button>
              ) : ios ? (
                "Tap Share, then Add to Home Screen, to use it offline in the gym."
              ) : (
                "Use your browser menu → Install app to use it offline in the gym."
              )}
            </div>
          )}
        </>
      )}

      <div className="onboarding-actions">
        {step > 0 && (
          <button
            type="button"
            className="plan-cancel-btn"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="primary-btn"
            onClick={() => setStep(step + 1)}
          >
            Next
          </button>
        ) : (
          <button type="button" className="primary-btn" onClick={finish}>
            Start training
          </button>
        )}
      </div>
    </Modal>
  );
}
