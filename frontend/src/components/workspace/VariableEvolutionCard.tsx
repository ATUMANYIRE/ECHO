"use client";

import React, { useState } from "react";
import { GitCommit, ArrowRight, Eye, Layers } from "lucide-react";
import { TraceStep } from "@/lib/types";
import { extractVariableMutations } from "@/lib/timeline-analysis";

interface VariableEvolutionCardProps {
  steps: TraceStep[];
  currentStepIndex: number;
  onJumpToStep: (stepIndex: number) => void;
  comparisonSteps?: TraceStep[];
}

export const VariableEvolutionCard: React.FC<VariableEvolutionCardProps> = ({
  steps,
  currentStepIndex,
  onJumpToStep,
  comparisonSteps,
}) => {
  const mutations = extractVariableMutations(steps);
  const compMutations = comparisonSteps ? extractVariableMutations(comparisonSteps) : null;

  const varNames = Object.keys(mutations);
  // Default selected variable (prefer 'total' if present, or first variable)
  const defaultVar = varNames.includes("total")
    ? "total"
    : varNames.length > 0
    ? varNames[0]
    : "";

  const [selectedVar, setSelectedVar] = useState<string>(defaultVar);

  const activeVarName = varNames.includes(selectedVar) ? selectedVar : varNames[0] || "";
  const points = mutations[activeVarName] || [];
  const compPoints = compMutations ? compMutations[activeVarName] || [] : null;

  if (varNames.length === 0) {
    return (
      <div className="p-6 text-center text-zinc-400 bg-white rounded-lg border border-zinc-200">
        <Layers className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
        <p className="text-xs">No variables recorded in this execution trace.</p>
      </div>
    );
  }

  return (
    <div
      data-testid="variable-evolution-card"
      className="flex flex-col h-full bg-white rounded-lg border border-zinc-200/90 shadow-card overflow-hidden"
    >
      {/* Header & Variable Selector */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200/80 bg-zinc-50/70 text-xs">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-brand-600" />
          <span className="font-semibold text-zinc-800">Causal Variable Evolution</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-500 font-medium">Variable:</span>
          <select
            data-testid="variable-evolution-select"
            value={activeVarName}
            onChange={(e) => setSelectedVar(e.target.value)}
            className="px-2 py-0.5 rounded border border-zinc-200 bg-white text-zinc-800 font-mono text-xs font-semibold outline-none focus:border-brand-500"
          >
            {varNames.map((v) => (
              <option key={v} value={v}>
                {v} ({mutations[v].length} states)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Trajectory Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FCFCFA]">
        {/* Active Run Progression Chain */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <span>Recorded Mutation Trajectory for</span>
              <code className="text-brand-700 font-mono bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                {activeVarName}
              </code>
            </span>
            <span className="text-[10px] text-zinc-400">Click a node to jump to that step</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-zinc-200/80 rounded-lg shadow-subtle">
            {points.map((pt, idx) => {
              const isCurrent = pt.step_index === currentStepIndex;
              return (
                <React.Fragment key={pt.step_index}>
                  {idx > 0 && <ArrowRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />}

                  <button
                    data-testid={`evolution-node-${pt.step_index}`}
                    onClick={() => onJumpToStep(pt.step_index)}
                    className={`flex flex-col items-start px-2.5 py-1.5 rounded border text-left transition-all ${
                      isCurrent
                        ? "bg-brand-50 border-brand-500 text-brand-950 ring-1 ring-brand-500"
                        : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200/90 text-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                      <span>Step #{pt.step_index + 1}</span>
                      <span>•</span>
                      <span>Line {pt.line_number}</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-zinc-900 mt-0.5">
                      {pt.value}
                    </div>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Comparison with Another Run (if provided) */}
        {compPoints && compPoints.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 pt-2 border-t border-zinc-200/70">
              <span className="text-xs font-semibold text-zinc-700">
                Comparison Run Trajectory (Run B)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-lg">
              {compPoints.map((pt, idx) => (
                <React.Fragment key={pt.step_index}>
                  {idx > 0 && <ArrowRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  <div className="flex flex-col items-start px-2.5 py-1.5 rounded border border-emerald-200 bg-white text-emerald-950">
                    <span className="text-[10px] text-emerald-600 font-mono">
                      Step #{pt.step_index + 1} (Line {pt.line_number})
                    </span>
                    <span className="font-mono text-xs font-bold">{pt.value}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Causal Explanation Card */}
        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-600 space-y-1">
          <p className="font-semibold text-zinc-800 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-brand-600" />
            <span>Why State Evolution Matters</span>
          </p>
          <p className="text-[11px] leading-relaxed">
            By observing how <code>{activeVarName}</code> transitions across iterations, students can identify
            the exact line where values deviate from their expected mental model (e.g. an overwrite instead of an accumulation).
          </p>
        </div>
      </div>
    </div>
  );
};
