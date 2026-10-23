"use client";

import React from "react";
import { GitCompare } from "lucide-react";
import { ExecutionRunRecord } from "@/lib/types";
import { compareExecutions } from "@/lib/timeline-analysis";

interface ComparisonViewProps {
  /** The earlier run ("Before"). */
  runA: ExecutionRunRecord | null;
  /** The later run ("After"). */
  runB: ExecutionRunRecord | null;
  onSelectRun: (run: ExecutionRunRecord) => void;
}

const RunCard: React.FC<{
  title: string;
  run: ExecutionRunRecord;
  tone: "before" | "after";
  onOpen: () => void;
}> = ({ title, run, tone, onOpen }) => (
  <div
    data-testid={tone === "before" ? "run-card-run-a" : "run-card-run-b"}
    className="rounded-lg border border-border bg-surface p-3.5 flex flex-col"
  >
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-semibold text-text-primary">{title}</span>
      <span
        className={`chip ${
          run.response.status === "completed" ? "chip-verified" : "chip-error"
        }`}
      >
        {run.response.status === "completed" ? "Ran cleanly" : "Failed"}
      </span>
    </div>
    <p className="mt-0.5 text-xs text-text-secondary">{run.response.total_steps} steps recorded</p>
    <pre className="code-block mt-2.5 flex-1 whitespace-pre-wrap break-words">
      {run.response.stdout.trim() || run.response.error_message || "(no output)"}
    </pre>
    <button
      type="button"
      onClick={onOpen}
      className="mt-2.5 self-start text-xs font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2"
    >
      Replay this run
    </button>
  </div>
);

/** Before / After: output and variable trajectory differences, side by side. */
export const ComparisonView: React.FC<ComparisonViewProps> = ({ runA, runB, onSelectRun }) => {
  if (!runA || !runB) {
    return (
      <div className="px-6 py-12 max-w-[460px] mx-auto text-center">
        <GitCompare className="w-6 h-6 mx-auto text-brand-600" aria-hidden="true" />
        <h2 className="mt-4 text-[15px] font-semibold text-text-primary">Nothing to compare yet</h2>
        <p className="mt-1.5 text-[13px] leading-5 text-text-secondary">
          Run your code, change it, then run again. ECHO will show what changed between the two runs.
        </p>
      </div>
    );
  }

  const comparison = compareExecutions(runA, runB);

  return (
    <div data-testid="comparison-view" className="fade-in px-4 sm:px-5 py-5 space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold text-text-primary">Before and after</h2>
        <p className="mt-0.5 text-[13px] text-text-secondary">{comparison.explanation}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RunCard title="Before" run={runA} tone="before" onOpen={() => onSelectRun(runA)} />
        <RunCard title="After" run={runB} tone="after" onOpen={() => onSelectRun(runB)} />
      </div>

      {comparison.divergenceStepA !== undefined && (
        <p className="text-[13px] text-text-secondary">
          The two runs first behave differently around step{" "}
          <span className="font-medium text-text-primary">{comparison.divergenceStepA + 1}</span>.
        </p>
      )}

      <section aria-labelledby="trajectory-heading">
        <h3 id="trajectory-heading" className="panel-title mb-2">
          How each variable changed
        </h3>
        <ul className="rounded-lg border border-border divide-y divide-border bg-surface">
          {comparison.variableDiffs.map((diff) => (
            <li
              key={diff.variableName}
              data-testid={`diff-row-${diff.variableName}`}
              className="px-3.5 py-3 text-[13px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold text-text-primary">{diff.variableName}</span>
                <span className={`chip ${diff.isDifferent ? "chip-warn" : "chip-neutral"}`}>
                  {diff.isDifferent ? "Changed" : "Same"}
                </span>
              </div>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
                <dt className="text-text-secondary">Before</dt>
                <dd className="text-text-primary break-words">{diff.historyA.join(" → ") || "—"}</dd>
                <dt className="text-text-secondary">After</dt>
                <dd className="text-text-primary break-words">
                  {diff.historyB.join(" → ") || "—"}
                </dd>
              </dl>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
