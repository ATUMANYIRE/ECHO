"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { TraceStep } from "@/lib/types";
import { extractVariableMutations } from "@/lib/timeline-analysis";

interface VariableHistoryProps {
  steps: TraceStep[];
  currentStepIndex: number;
  onJumpToStep: (stepIndex: number) => void;
}

/**
 * Shows how a single variable changed across the whole run, built only from
 * recorded mutations. Each value is a button that jumps the replay to that moment.
 */
export const VariableHistory: React.FC<VariableHistoryProps> = ({
  steps,
  currentStepIndex,
  onJumpToStep,
}) => {
  const mutations = useMemo(() => extractVariableMutations(steps), [steps]);
  const names = Object.keys(mutations);

  // Default to the variable with the richest history (usually the interesting one).
  const defaultVar = useMemo(() => {
    let best = names[0] ?? "";
    for (const n of names) {
      if (mutations[n].length > (mutations[best]?.length ?? 0)) best = n;
    }
    return best;
  }, [names, mutations]);

  const [selected, setSelected] = useState<string>("");
  const active = names.includes(selected) ? selected : defaultVar;

  if (names.length === 0) return null;

  const points = mutations[active] ?? [];
  const currentPoint = [...points].reverse().find((p) => p.step_index <= currentStepIndex);

  return (
    <section data-testid="variable-evolution-card" aria-labelledby="var-history-title">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 id="var-history-title" className="panel-title">
          How a variable changed
        </h3>
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="sr-only">Variable</span>
          <select
            data-testid="variable-evolution-select"
            value={active}
            onChange={(e) => setSelected(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2 font-mono text-[13px] text-text-primary cursor-pointer hover:border-[#d9dad6]"
          >
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {points.map((pt, idx) => {
          const isCurrent = currentPoint?.step_index === pt.step_index;
          return (
            <React.Fragment key={pt.step_index}>
              {idx > 0 && (
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary/60 flex-shrink-0" aria-hidden="true" />
              )}
              <button
                type="button"
                data-testid={`evolution-node-${pt.step_index}`}
                onClick={() => onJumpToStep(pt.step_index)}
                aria-current={isCurrent ? "step" : undefined}
                title={`Jump to step ${pt.step_index + 1} (line ${pt.line_number})`}
                className={`max-w-[200px] truncate rounded-md border px-2.5 h-8 font-mono text-[13px] transition-colors ${
                  isCurrent
                    ? "bg-brand-50 border-brand-600 text-brand-700 font-semibold"
                    : "bg-surface border-border text-text-primary hover:bg-surface-subtle"
                }`}
              >
                {pt.value}
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-text-secondary">
        Every value <code className="font-mono">{active}</code> held during the run. Select one to
        jump to that moment.
      </p>
    </section>
  );
};
