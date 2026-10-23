"use client";

import React from "react";
import { Check } from "lucide-react";

export type Stage = "write" | "run" | "explore" | "understand" | "fix" | "learn";

const STAGES: { id: Stage; label: string }[] = [
  { id: "write", label: "Write" },
  { id: "run", label: "Run" },
  { id: "explore", label: "Explore" },
  { id: "understand", label: "Understand" },
  { id: "fix", label: "Fix" },
  { id: "learn", label: "Learn" },
];

interface JourneyStepperProps {
  current: Stage;
  /** Stages the student has already reached (and may revisit). */
  reached: Record<Stage, boolean>;
  onNavigate: (stage: Stage) => void;
}

/**
 * A quiet progress trail, not a tab bar. Only stages already reached are
 * clickable, so students are never shown controls they cannot use yet.
 */
export const JourneyStepper: React.FC<JourneyStepperProps> = ({ current, reached, onNavigate }) => {
  return (
    <nav aria-label="Your progress" data-testid="journey-stepper" className="min-w-0">
      <ol className="flex items-center gap-1 sm:gap-1.5">
        {STAGES.map((stage, i) => {
          const isCurrent = stage.id === current;
          const isDone = reached[stage.id] && !isCurrent;
          const canVisit = reached[stage.id] && !isCurrent;

          const dot = (
            <span
              aria-hidden="true"
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-medium flex-shrink-0 transition-colors ${
                isCurrent
                  ? "bg-brand-600 text-white"
                  : isDone
                  ? "bg-brand-50 text-brand-700 border border-brand-200"
                  : "bg-surface-muted text-text-secondary/70"
              }`}
            >
              {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
            </span>
          );

          const label = (
            <span
              className={`text-[12.5px] ${
                isCurrent
                  ? "font-semibold text-text-primary"
                  : isDone
                  ? "hidden sm:inline text-text-secondary"
                  : "hidden sm:inline text-text-secondary/60"
              }`}
            >
              {stage.label}
            </span>
          );

          return (
            <li key={stage.id} className="flex items-center gap-1 sm:gap-1.5">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`hidden sm:block w-3 h-px ${
                    reached[stage.id] ? "bg-brand-200" : "bg-border"
                  }`}
                />
              )}
              {canVisit ? (
                <button
                  type="button"
                  data-testid={`stage-${stage.id}`}
                  onClick={() => onNavigate(stage.id)}
                  className="flex items-center gap-1.5 rounded-md px-1 py-1 -mx-1 hover:bg-surface-muted"
                  aria-label={`Go back to ${stage.label}`}
                >
                  {dot}
                  {label}
                </button>
              ) : (
                <span
                  data-testid={`stage-${stage.id}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className="flex items-center gap-1.5 px-1"
                >
                  {dot}
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
