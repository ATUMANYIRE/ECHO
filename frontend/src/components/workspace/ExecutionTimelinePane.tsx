"use client";

import React, { useState } from "react";
import {
  Clock,
  GitCommit,
  GitCompare,
  HelpCircle,
  Terminal,
  ShieldCheck,
  Info,
  AlertOctagon,
  AlertTriangle,
  Loader2,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  TraceStep,
  ExecutionResponse,
  SampleTraceData,
  ExecutionRunRecord,
  InvestigationResponse,
} from "@/lib/types";
import { ReplayControls } from "./ReplayControls";
import { VariableEvolutionCard } from "./VariableEvolutionCard";
import { ComparisonView } from "./ComparisonView";
import { PredictionChallengeCard } from "./PredictionChallengeCard";
import { CallStackView } from "./CallStackView";
import { InvestigationPane } from "./InvestigationPane";
import { generatePredictionChallenges } from "@/lib/timeline-analysis";

interface ExecutionTimelinePaneProps {
  realExecution: ExecutionResponse | null;
  sampleTrace: SampleTraceData | null;
  isSampleMode: boolean;
  isLoading: boolean;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  onSwitchToReal: () => void;
  runA?: ExecutionRunRecord | null;
  runB?: ExecutionRunRecord | null;
  onSelectRun?: (run: ExecutionRunRecord) => void;
  investigation?: InvestigationResponse | null;
  isInvestigating?: boolean;
  onApplyFix?: (newCode: string) => void;
  originalCode?: string;
  activeTab?: TimelineTab;
  onChangeTab?: (tab: TimelineTab) => void;
}

export type TimelineTab = "timeline" | "evolution" | "compare" | "predict" | "investigate" | "output";

export const ExecutionTimelinePane: React.FC<ExecutionTimelinePaneProps> = ({
  realExecution,
  sampleTrace,
  isSampleMode,
  isLoading,
  activeStepIndex,
  onSelectStep,
  onSwitchToReal,
  runA = null,
  runB = null,
  onSelectRun,
  investigation = null,
  isInvestigating = false,
  onApplyFix = () => {},
  originalCode = "",
  activeTab: controlledTab,
  onChangeTab,
}) => {
  const [internalTab, setInternalTab] = useState<TimelineTab>("timeline");
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: TimelineTab) => {
    setInternalTab(tab);
    onChangeTab?.(tab);
  };

  // Determine current steps and metadata
  const steps: TraceStep[] = isSampleMode
    ? sampleTrace?.steps || []
    : realExecution?.steps || [];

  const currentStep: TraceStep | undefined = steps[activeStepIndex];
  const totalSteps = steps.length;
  const isAuthoritative = !isSampleMode && !!realExecution?.is_authoritative;

  // Find exception step if present
  const excStepIndex = steps.findIndex((s) => s.event_type === "exception");
  const hasException = excStepIndex !== -1;

  // Status flags
  const status = realExecution?.status;
  const isTimeout = status === "timeout";
  const isSyntaxError = status === "error" && realExecution?.error_type === "SyntaxError";
  const isTraceLimitExceeded = status === "trace_limit_exceeded";
  const isSandboxUnavailable = status === "sandbox_unavailable";
  const isOomKilled = status === "oom_killed";

  // Generate deterministic prediction challenges from trace
  const challenges = realExecution
    ? generatePredictionChallenges(realExecution)
    : [];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-zinc-200/90 shadow-card overflow-hidden">
      {/* Pane Header with Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-zinc-200/80 bg-zinc-50/70 text-xs gap-2">
        <div className="flex items-center gap-2 font-medium text-zinc-700">
          <Clock className="w-4 h-4 text-brand-600" />
          <span className="font-semibold">Workbench</span>
          {totalSteps > 0 && activeTab === "timeline" && (
            <span className="text-[10px] text-zinc-400 font-mono">
              Step {activeStepIndex + 1}/{totalSteps}
            </span>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            data-testid="tab-timeline-button"
            onClick={() => setActiveTab("timeline")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === "timeline"
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Trace
          </button>

          <button
            data-testid="tab-evolution-button"
            onClick={() => setActiveTab("evolution")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              activeTab === "evolution"
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <GitCommit className="w-3 h-3" />
            <span>Evolution</span>
          </button>

          <button
            data-testid="tab-compare-button"
            onClick={() => setActiveTab("compare")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              activeTab === "compare"
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <GitCompare className="w-3 h-3" />
            <span>Compare</span>
            {runA && runB && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            data-testid="tab-predict-button"
            onClick={() => setActiveTab("predict")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              activeTab === "predict"
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Predict</span>
            {challenges.length > 0 && (
              <span className="text-[9px] bg-brand-200 text-brand-800 px-1 rounded-full font-bold">
                {challenges.length}
              </span>
            )}
          </button>

          <button
            data-testid="tab-investigate-button"
            onClick={() => setActiveTab("investigate")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              activeTab === "investigate"
                ? "bg-violet-100 text-violet-800 border border-violet-300 font-semibold"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Sparkles className="w-3 h-3 text-violet-600" />
            <span>AI Diagnosis</span>
            {investigation && (
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 inline-block" />
            )}
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
        </div>

        {/* Verification Status Chip */}
        {isAuthoritative ? (
          <div
            data-testid="authoritative-trace-badge"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium"
            title="Authoritative trace captured from isolated Docker container execution."
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Verified Container Trace</span>
          </div>
        ) : (
          <div
            data-testid="illustrative-trace-badge"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-medium"
            title="This trace is illustrative demonstration data."
          >
            <Info className="w-3 h-3 text-amber-600" />
            <span>Sample Demo</span>
          </div>
        )}
      </div>

      {/* Main Tab Body */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FCFCFA]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
          <h4 className="text-sm font-semibold text-zinc-800">
            Running in isolated sandbox...
          </h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
            Executing code inside disposable Docker container with sys.settrace recording.
          </p>
        </div>
      ) : activeTab === "evolution" ? (
        <VariableEvolutionCard
          steps={steps}
          currentStepIndex={activeStepIndex}
          onJumpToStep={(idx) => {
            onSelectStep(idx);
            setActiveTab("timeline");
          }}
          comparisonSteps={runB?.response.steps}
        />
      ) : activeTab === "compare" ? (
        <ComparisonView
          runA={runA}
          runB={runB}
          onSelectRun={(run) => {
            onSelectRun?.(run);
            setActiveTab("timeline");
          }}
        />
      ) : activeTab === "predict" ? (
        <PredictionChallengeCard
          challenges={challenges}
          onJumpToStep={(idx) => {
            onSelectStep(idx);
            setActiveTab("timeline");
          }}
        />
      ) : activeTab === "investigate" ? (
        <InvestigationPane
          investigation={investigation}
          isLoading={isInvestigating}
          onSelectStep={(idx) => {
            onSelectStep(idx);
          }}
          onApplyFix={onApplyFix}
          originalCode={originalCode}
        />
      ) : activeTab === "output" ? (
        /* Terminal Output Tab */
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
        /* Main Timeline Trace View */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Status Alerts */}
          {isTimeout && (
            <div className="px-3.5 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>Execution Timed Out:</strong> Process exceeded timeout limit. Check for infinite loops.
              </span>
            </div>
          )}

          {isOomKilled && (
            <div className="px-3.5 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>Out of Memory:</strong> Container exceeded the 128 MB RAM limit.
              </span>
            </div>
          )}

          {isTraceLimitExceeded && (
            <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Trace Limit Reached:</strong> Truncated at 500 execution events to protect memory bounds.
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

          {/* Replay Controls (Play, Pause, Step Next/Prev, Speed, Jump) */}
          {totalSteps > 0 && (
            <div className="p-2 border-b border-zinc-200/70 bg-[#FAFAF8]">
              <div className="flex items-center justify-between mb-1">
                <CallStackView currentStep={currentStep} />
                <span className="text-[10px] text-zinc-400 font-mono">
                  [Space] Play/Pause • [←/→] Steps
                </span>
              </div>
              <ReplayControls
                totalSteps={totalSteps}
                currentStepIndex={activeStepIndex}
                onSelectStep={onSelectStep}
                hasException={hasException}
                exceptionStepIndex={excStepIndex}
              />
            </div>
          )}

          {/* Step Detail Card */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FCFCFA]">
            {isSyntaxError ? (
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
              </div>
            ) : totalSteps === 0 && !isLoading ? (
              <div className="p-8 text-center text-zinc-500">
                <Layers className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-zinc-700">Ready to execute</h4>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                  Click &quot;Run in Sandbox&quot; to execute your Python code and view real-time traces.
                </p>
              </div>
            ) : currentStep ? (
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

                {/* Variable State Table */}
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
          </div>

          {/* Footer */}
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
