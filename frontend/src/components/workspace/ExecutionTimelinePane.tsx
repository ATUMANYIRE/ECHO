"use client";

import React from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { TraceStep, SampleTraceData } from "@/lib/types";

interface ExecutionTimelinePaneProps {
  traceData: SampleTraceData;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
}

export const ExecutionTimelinePane: React.FC<ExecutionTimelinePaneProps> = ({
  traceData,
  activeStepIndex,
  onSelectStep,
}) => {
  const steps = traceData.steps;
  const currentStep: TraceStep | undefined = steps[activeStepIndex];
  const totalSteps = steps.length;

  const canGoPrevious = activeStepIndex > 0;
  const canGoNext = activeStepIndex < totalSteps - 1;

  const handlePrevious = () => {
    if (canGoPrevious) onSelectStep(activeStepIndex - 1);
  };

  const handleNext = () => {
    if (canGoNext) onSelectStep(activeStepIndex + 1);
  };

  const handleJumpToException = () => {
    const excIndex = steps.findIndex((s) => s.event_type === "exception");
    if (excIndex !== -1) {
      onSelectStep(excIndex);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-zinc-200/90 shadow-card overflow-hidden">
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200/80 bg-zinc-50/70 text-xs">
        <div className="flex items-center gap-2 font-medium text-zinc-700">
          <Clock className="w-4 h-4 text-brand-600" />
          <span>Execution Timeline</span>
          <span className="text-[10px] text-zinc-400 font-mono">
            Step {activeStepIndex + 1}/{totalSteps}
          </span>
        </div>

        {/* Explicit Illustrative Badge */}
        <div
          data-testid="illustrative-trace-badge"
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-medium"
          title="This trace is illustrative demonstration data. No untrusted code was executed."
        >
          <Info className="w-3 h-3 text-amber-600" />
          <span>Illustrative Preview Only</span>
        </div>
      </div>

      {/* Prominent Warning Callout */}
      <div className="px-3.5 py-2 bg-amber-50/50 border-b border-amber-200/60 text-[11px] text-amber-800 flex items-center justify-between">
        <p className="leading-snug">
          <strong className="font-semibold">Note:</strong> Visualizing pre-recorded trace (
          <em>{traceData.title}</em>). Authoritative container execution will arrive in Milestone 2.
        </p>
        <button
          onClick={handleJumpToException}
          className="flex-shrink-0 text-[10px] text-rose-700 font-medium hover:underline flex items-center gap-1 ml-2"
        >
          <AlertOctagon className="w-3 h-3 text-rose-600" />
          Jump to Error
        </button>
      </div>

      {/* Scrubber & Playback Controls */}
      <div className="p-3 border-b border-zinc-200/70 bg-[#FAFAF8] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              data-testid="step-prev-button"
              className="px-2 py-1 text-xs font-medium rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              title="Previous Step (Left Arrow)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              data-testid="step-next-button"
              className="px-2 py-1 text-xs font-medium rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              title="Next Step (Right Arrow)"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="text-[11px] font-mono text-zinc-500">
            {currentStep && (
              <span>
                Line <strong className="text-zinc-800 font-semibold">{currentStep.line_number}</strong>
                {" in "}
                <code className="text-zinc-700 font-mono bg-zinc-100 px-1 py-0.5 rounded">
                  {currentStep.function_name}()
                </code>
              </span>
            )}
          </div>
        </div>

        {/* Range Slider for timeline scrubbing */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={activeStepIndex}
            onChange={(e) => onSelectStep(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            aria-label="Execution timeline scrubber"
          />
        </div>
      </div>

      {/* Main Timeline Details Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FCFCFA]">
        {/* Step Event Card */}
        {currentStep && (
          <div
            data-testid="active-step-card"
            className={`p-3 rounded-lg border text-xs transition-all ${
              currentStep.event_type === "exception"
                ? "bg-rose-50/70 border-rose-200 text-rose-950"
                : "bg-white border-zinc-200/90 text-zinc-800"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 mb-2">
              <span className="font-semibold flex items-center gap-1.5">
                {currentStep.event_type === "exception" ? (
                  <>
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span className="text-rose-700 font-medium">Exception Divergence Point</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 text-brand-600" />
                    <span>Step #{currentStep.step_index + 1} Event</span>
                  </>
                )}
              </span>
              <span className="font-mono text-[11px] text-zinc-500 uppercase px-1.5 py-0.5 bg-zinc-100 rounded">
                {currentStep.event_type}
              </span>
            </div>

            {currentStep.exception && (
              <div className="p-2 mb-2 bg-rose-100/70 border border-rose-200 rounded text-rose-900 font-mono text-[11px] leading-relaxed">
                <strong>Exception Raised:</strong> {currentStep.exception}
              </div>
            )}

            {/* Variable State Inspector */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-600 mb-1.5 flex items-center justify-between">
                <span>Variables in Scope</span>
                <span className="text-[10px] text-zinc-400">Green = modified at this step</span>
              </div>

              {Object.keys(currentStep.locals_snapshot).length === 0 ? (
                <div className="text-zinc-400 italic text-[11px]">No local variables in scope</div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(currentStep.locals_snapshot).map(([varName, varState]) => (
                    <div
                      key={varName}
                      data-testid={`variable-row-${varName}`}
                      className={`flex items-center justify-between px-2 py-1.5 rounded font-mono text-[11px] border ${
                        varState.is_changed
                          ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-950"
                          : "bg-zinc-50 border-zinc-200/60 text-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{varName}</span>
                        <span className="text-[10px] text-zinc-400">({varState.type_name})</span>
                        {varState.is_changed && (
                          <span className="text-[9px] bg-emerald-200/80 text-emerald-800 px-1 rounded uppercase font-sans font-bold">
                            delta
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-900 font-medium">
                        <code>{varState.repr_value}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Hypothesis Preview Card (Clarifying that AI is active in M4) */}
        <div className="p-3 bg-violet-50/50 rounded-lg border border-violet-200/60 text-xs text-violet-900">
          <div className="flex items-center gap-1.5 font-semibold text-violet-950 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>AI Diagnostic Hypothesis (Milestone 4 Preview)</span>
          </div>
          <p className="text-[11px] text-violet-800 leading-relaxed">
            In Milestone 4, Google Gemini will analyze the authoritative execution trace against your
            expected behavior to identify the exact moment mental models diverged without guessing.
          </p>
        </div>
      </div>

      {/* Pane Footer */}
      <div className="px-3.5 py-1.5 border-t border-zinc-200/70 bg-zinc-50/50 text-[11px] text-zinc-500 flex items-center justify-between">
        <span>Scrubbing updates code line indicator</span>
        <span className="font-mono">{traceData.steps.length} total events</span>
      </div>
    </div>
  );
};
