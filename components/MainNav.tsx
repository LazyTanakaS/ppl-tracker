"use client";

import { useRef } from "react";
import type { Section } from "@/lib/schedule";

interface MainNavProps {
  section: Section;
  onSwitch: (section: Section) => void;
}

export const sectionTabId = (section: Section) => `tab-${section}`;
export const sectionPanelId = (section: Section) => `panel-${section}`;

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg
    className="nav-icon"
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: "workout",
    label: "Workout",
    icon: (
      <Icon>
        <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
      </Icon>
    ),
  },
  {
    id: "stats",
    label: "Progress",
    icon: (
      <Icon>
        <path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6" />
      </Icon>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </Icon>
    ),
  },
];

export default function MainNav({ section, onSwitch }: MainNavProps) {
  const refs = useRef<Partial<Record<Section, HTMLButtonElement | null>>>({});

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = SECTIONS.length - 1;
    const target =
      event.key === "ArrowRight"
        ? (index + 1) % SECTIONS.length
        : event.key === "ArrowLeft"
          ? (index + last) % SECTIONS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (target === null) return;
    event.preventDefault();
    onSwitch(SECTIONS[target].id);
    refs.current[SECTIONS[target].id]?.focus();
  }

  return (
    <nav className="main-nav" aria-label="Sections">
      <div className="main-nav-inner" role="tablist" aria-label="Sections">
        {SECTIONS.map(({ id, label, icon }, index) => {
          const active = id === section;
          return (
            <button
              key={id}
              ref={(el) => {
                refs.current[id] = el;
              }}
              id={sectionTabId(id)}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={active ? sectionPanelId(id) : undefined}
              tabIndex={active ? 0 : -1}
              className={`tab ${id} ${active ? "active" : ""}`}
              onClick={() => onSwitch(id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {icon}
              <span className="tab-label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
