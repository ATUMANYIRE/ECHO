"use client";

import React, { useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { TraceStep, ExecutionResponse, SampleTraceData } from "@/lib/types";

interface ExecutionTimelinePaneProps {
  realExecution: ExecutionResponse | null;
  sampleTrace: SampleTraceData | null;
  isSampleMode: boolean;
  isLoading: boolean;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  onSwitchToReal: () => void;
}

export const ExecutionTimelinePane: React.FC<ExecutionTimelinePaneProps> = ({
  realExecution,
  sampleTrace,
  isSampleMode,
  isLoading,
  activeStepIndex,
  onSelectStep,
  onSwitchToReal,
}) => {
  const [activeTab, setActiveTab] = useState<"timeline" | "output">("timeline");

  // Determine current steps and metadata
  const steps: TraceStep[] = isSampleMode
    ? sampleTrace?.steps || []
    : realExecution?.steps || [];

  const currentStep: TraceStep | undefined = steps[activeStepIndex];
  const totalSteps = steps.length;
  const isAuthoritative = !isSampleMode && !!realExecution?.is_authoritative;

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

  // Status flags
  const status = realExecution?.status;
  const isTimeout = status === "timeout";
  const isSyntaxError = status === "error" && realExecution?.error_type === "SyntaxError";
  const isRuntimeError = status === "error" && !isSyntaxError;
  const isSandboxUnavailable = status === "sandbox_unavailable";
  const isTraceLimitExceeded = status === "trace_limit_exceeded";
  const isOomKilled = status === "oom_killed";

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-zinc-200/90 shadow-card overflow-hidden">
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200/80 bg-zinc-50/70 text-xs">
        <div className="flex items-center gap-2 font-medium text-zinc-700">
          <Clock className="w-4 h-4 text-brand-600" />
          <span>Execution Engine</span>
          {totalSteps > 0 && (
            <span className="text-[10px] text-zinc-400 font-mono">
              Step {activeStepIndex + 1}/{totalSteps}
            </span>
          )}
        </div>

        {/* Tab switch between Timeline & Terminal Output */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === "timeline"
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Trace Steps
          </button>
          <button
            data-testid="output-tab-button"
            onClick={() => setActiveTab("output")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              activeTab === "output"
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Output</span>
            {realExecution?.stdout && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Mode Badge */}
          {isAuthoritative ? (
            <div
              data-testid="authoritative-trace-badge"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium ml-1"
              title="Authoritative trace captured from isolated Docker container execution."
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified Container Trace</span>
            </div>
          ) : (
            <div
              data-testid="illustrative-trace-badge"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-medium ml-1"
              title="This trace is illustrative demonstration data."
            >
              <Info className="w-3 h-3 text-amber-600" />
              <span>Sample Demo</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FCFCFA]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
          <h4 className="text-sm font-semibold text-zinc-800">
            Running in isolated sandbox...
          </h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
            Executing code inside disposable Docker container with sys.settrace step recording.
          </p>
        </div>
      ) : activeTab === "output" ? (
        /* Standard Output Panel */
        <div className="flex-1 flex flex-col bg-[#18181B] text-zinc-200 font-mono text-xs overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400">
            <span>Standard Output / Error</span>
            <div className="flex items-center gap-3">
              {realExecution && (
                <span>Duration: {realExecution.duration_ms}ms</span>
              )}
              {realExecution && (
                <span
                  className={
                    realExecution.status === "completed"
                      ? "text-emerald-400 font-semibold"
                      : "text-rose-400 font-semibold"
                  }
                >
                  Exit: {realExecution.status}
                </span>
              )}
            </div>
          </div>

          <div
            data-testid="terminal-output-content"
            className="flex-1 p-3.5 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-mono text-xs text-zinc-100"
          >
            {realExecution?.stdout ? (
              realExecution.stdout
            ) : realExecution?.stderr ? (
              <span className="text-rose-300">{realExecution.stderr}</span>
            ) : realExecution?.error_message ? (
              <span className="text-amber-300">{realExecution.error_message}</span>
            ) : isSampleMode ? (
              <span className="text-zinc-500">
                # Sample trace output:
                IndexError: list index out of range at line 5
              </span>
            ) : (
              <span className="text-zinc-500 italic">
                No program output emitted yet. Click &quot;Run in Sandbox&quot; to execute.
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Status Banners */}
          {isTimeout && (
            <div className="px-3.5 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>Execution Timed Out:</strong> Program exceeded execution timeout. Check for infinite loops.
              </span>
            </div>
          )}

          {isOomKilled && (
            <div className="px-3.5 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>Out of Memory:</strong> Container was terminated because it exceeded the 128 MB RAM limit.
              </span>
            </div>
          )}

          {isTraceLimitExceeded && (
            <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Trace Limit Reached:</strong> Stopped after 500 execution events to protect memory bounds.
              </span>
            </div>
          )}

          {isSandboxUnavailable && (
            <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Sandbox Unavailable:</strong> Docker daemon unreachable. Untrusted host execution is blocked.
              </span>
            </div>
          )}

          {isSampleMode && (
            <div className="px-3.5 py-2 bg-amber-50/50 border-b border-amber-200/60 text-[11px] text-amber-800 flex items-center justify-between">
              <p className="leading-snug">
                <strong className="font-semibold">Sample Mode:</strong> Viewing pre-recorded bug demo. Click &quot;Run in Sandbox&quot; to run your code!
              </p>
              {steps.some((s) => s.event_type === "exception") && (
                <button
                  onClick={handleJumpToException}
                  className="flex-shrink-0 text-[10px] text-rose-700 font-medium hover:underline flex items-center gap-1 ml-2"
                >
                  <AlertOctagon className="w-3 h-3 text-rose-600" />
                  Jump to Error
                </button>
              )}
            </div>
          )}

          {/* Scrubber Controls */}
          {totalSteps > 0 && (
            <div className="p-3 border-b border-zinc-200/70 bg-[#FAFAF8] flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    data-testid="step-prev-button"
                    className="px-2 py-1 text-xs font-medium rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    title="Previous Step"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    data-testid="step-next-button"
                    className="px-2 py-1 text-xs font-medium rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    title="Next Step"
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

                {/* Jump to exception button if present in real trace */}
                {steps.some((s) => s.event_type === "exception") && !isSampleMode && (
                  <button
                    onClick={handleJumpToException}
                    className="text-[10px] text-rose-700 font-medium hover:underline flex items-center gap-1"
                  >
                    <AlertOctagon className="w-3 h-3 text-rose-600" />
                    Jump to Error
                  </button>
                )}
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
          )}

          {/* Main Timeline Card Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FCFCFA]">
            {isSyntaxError ? (
              /* Syntax Error Card */
              <div
                data-testid="syntax-error-card"
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-950"
              >
                <div className="flex items-center gap-2 font-semibold text-rose-900 mb-1">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Syntax Error (Before Execution)</span>
                </div>
                <p className="font-mono text-[11px] text-rose-800 mt-1">
                  Line {realExecution?.error_line || 1}: {realExecution?.error_message}
                </p>
                <p className="text-[11px] text-rose-700 mt-2">
                  Python could not compile this code. Fix syntax at the indicated line and run again.
                </p>
              </div>
            ) : totalSteps === 0 && !isLoading ? (
              /* Empty Ready State */
              <div className="p-8 text-center text-zinc-500">
                <Layers className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-zinc-700">Ready to execute</h4>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                  Click &quot;Run in Sandbox&quot; to execute your Python code and view real-time traces.
                </p>
              </div>
            ) : currentStep ? (
              /* Active Step Card */
              <div
                data-testid="active-step-card"
                className={`p-3 rounded-lg border text-xs transition-all ${
                  currentStep.event_type === "exception"
                    ? "bg-rose-50/80 border-rose-200 text-rose-950"
                    : "bg-white border-zinc-200/90 text-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    {currentStep.event_type === "exception" ? (
                      <>
                        <AlertOctagon className="w-4 h-4 text-rose-600" />
                        <span className="text-rose-700 font-medium">Exception Raised</span>
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
                    <strong>Exception:</strong> {currentStep.exception}
                  </div>
                )}

                {/* Variable State Inspector */}
                <div>
                  <div className="text-[11px] font-semibold text-zinc-600 mb-1.5 flex items-center justify-between">
                    <span>Variables in Scope</span>
                    <span className="text-[10px] text-zinc-400">Green = changed at this step</span>
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
            ) : null}

            {/* AI Hypothesis Card */}
            <div className="p-3 bg-violet-50/50 rounded-lg border border-violet-200/60 text-xs text-violet-900">
              <div className="flex items-center gap-1.5 font-semibold text-violet-950 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>AI Diagnostic Hypothesis (Milestone 4 Preview)</span>
              </div>
              <p className="text-[11px] text-violet-800 leading-relaxed">
                In Milestone 4, Google Gemini will analyze this verified execution trace against your
                expected program behavior to identify the exact moment mental models diverged.
              </p>
            </div>
          </div>

          {/* Pane Footer */}
          <div className="px-3.5 py-1.5 border-t border-zinc-200/70 bg-zinc-50/50 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Scrubbing updates code line indicator</span>
            <span className="font-mono">
              {totalSteps} total events {realExecution?.duration_ms ? `(${realExecution.duration_ms}ms)` : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
