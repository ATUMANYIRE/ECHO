"use client";

import React from "react";
import { GitCompare, CheckCircle2, XCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { ExecutionRunRecord } from "@/lib/types";
import { compareExecutions } from "@/lib/timeline-analysis";

interface ComparisonViewProps {
  runA: ExecutionRunRecord | null;
  runB: ExecutionRunRecord | null;
  onSelectRun: (run: ExecutionRunRecord) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  runA,
  runB,
  onSelectRun,
}) => {
  if (!runA || !runB) {
    return (
      <div className="p-8 text-center text-zinc-500 bg-white rounded-lg border border-zinc-200">
        <GitCompare className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-zinc-700">Before-and-After Comparison</h4>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
          Execute two distinct runs (e.g., your initial code vs. modified code) to compare execution
          trajectories, variable histories, and outputs side-by-side.
        </p>
      </div>
    );
  }

  const comparison = compareExecutions(runA, runB);

  return (
    <div
      data-testid="comparison-view"
      className="flex flex-col h-full bg-white rounded-lg border border-zinc-200/90 shadow-card overflow-hidden"
    >
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200/80 bg-zinc-50/70 text-xs">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-brand-600" />
          <span className="font-semibold text-zinc-800">Side-by-Side Execution Comparison</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          Alignment: Variable Trajectory & Outcome Match
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FCFCFA] text-xs">
        {/* Outcome Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Run A Summary */}
          <div
            data-testid="run-card-run-a"
            className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-zinc-900">{runA.label}</span>
                <span className="font-mono text-[10px] text-zinc-400">
                  {runA.response.total_steps} steps
                </span>
              </div>
              <div className="text-[11px] text-zinc-600 mb-2">
                Status: <strong className="font-mono uppercase">{runA.response.status}</strong>
              </div>
              <div className="bg-white p-2 border border-zinc-200 rounded font-mono text-[11px] text-zinc-800 overflow-x-auto">
                {runA.response.stdout.trim() || runA.response.error_message || "(no output)"}
              </div>
            </div>
            <button
              onClick={() => onSelectRun(runA)}
              className="mt-2 text-[10px] text-brand-600 hover:text-brand-800 font-medium underline text-left"
            >
              Load into Timeline
            </button>
          </div>

          {/* Run B Summary */}
          <div
            data-testid="run-card-run-b"
            className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-emerald-950">{runB.label}</span>
                <span className="font-mono text-[10px] text-emerald-700">
                  {runB.response.total_steps} steps
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 mb-2">
                Status: <strong className="font-mono uppercase">{runB.response.status}</strong>
              </div>
              <div className="bg-white p-2 border border-emerald-200 rounded font-mono text-[11px] text-emerald-900 overflow-x-auto">
                {runB.response.stdout.trim() || runB.response.error_message || "(no output)"}
              </div>
            </div>
            <button
              onClick={() => onSelectRun(runB)}
              className="mt-2 text-[10px] text-emerald-700 hover:text-emerald-900 font-medium underline text-left"
            >
              Load into Timeline
            </button>
          </div>
        </div>

        {/* Alignment Explanation & Divergence Callout */}
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-amber-900 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-950">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Alignment & Divergence Analysis</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {comparison.explanation}
          </p>
          {comparison.divergenceStepA !== undefined && (
            <p className="text-[10px] text-amber-800 font-mono mt-1">
              Earliest variable mutation divergence detected around Step #{comparison.divergenceStepA + 1}.
            </p>
          )}
        </div>

        {/* Variable Evolution Comparison Table */}
        <div>
          <h4 className="font-semibold text-zinc-800 mb-2 text-xs">
            Variable Trajectory Comparison
          </h4>

          <div className="border border-zinc-200 rounded-lg overflow-x-auto bg-white">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-12 px-3 py-2 bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-600">
                <span className="col-span-3">Variable</span>
                <span className="col-span-4">{runA.label} Trajectory</span>
                <span className="col-span-4">{runB.label} Trajectory</span>
                <span className="col-span-1 text-right">Diff</span>
              </div>

              <div className="divide-y divide-zinc-100">
                {comparison.variableDiffs.map((diff) => (
                  <div
                    key={diff.variableName}
                    data-testid={`diff-row-${diff.variableName}`}
                    className={`grid grid-cols-12 px-3 py-2 items-center text-xs ${
                      diff.isDifferent ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <div className="col-span-3 font-mono font-semibold text-zinc-800">
                      {diff.variableName}
                    </div>
                    <div className="col-span-4 font-mono text-[11px] text-zinc-600 truncate">
                      {diff.historyA.join(" → ") || "<none>"}
                    </div>
                    <div className="col-span-4 font-mono text-[11px] text-emerald-800 font-medium truncate">
                      {diff.historyB.join(" → ") || "<none>"}
                    </div>
                    <div className="col-span-1 text-right">
                      {diff.isDifferent ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title="Different trajectories" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Identical trajectories" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
