"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Play, Loader2, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { CodeEditorPane } from "./CodeEditorPane";
import { ExpectedBehaviorPane } from "./ExpectedBehaviorPane";
import { JourneyStepper, Stage } from "./JourneyStepper";
import { RunEmptyState } from "./RunEmptyState";
import { ResultSummary } from "./ResultSummary";
import { ReplayPanel } from "./ReplayPanel";
import { InvestigationPane } from "./InvestigationPane";
import { ComparisonView } from "./ComparisonView";
import { LearnPanel } from "./LearnPanel";
import { getBackendHealth, executeCode, analyzeInvestigation } from "@/lib/api-client";
import {
  HealthResponse,
  ExecutionResponse,
  ExecutionRunRecord,
  InvestigationResponse,
  FixVerificationResponse,
} from "@/lib/types";
import { EXAMPLES, DEFAULT_EXAMPLE } from "@/lib/examples";

type View = "empty" | "summary" | "replay" | "explain" | "compare" | "learn";

function errorFromExecution(exec: ExecutionResponse | null): { line: number | null; summary: string | null } {
  if (!exec) return { line: null, summary: null };
  const exc = exec.steps.find((s) => s.event_type === "exception");
  const line = exec.error_line ?? exc?.line_number ?? null;
  const summary = exec.error_type ?? exc?.exception?.split(":")[0] ?? null;
  return { line, summary: line ? summary : null };
}

export const WorkspaceShell: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [code, setCode] = useState(DEFAULT_EXAMPLE.code);
  const [expectedBehavior, setExpectedBehavior] = useState(DEFAULT_EXAMPLE.expected);
  const [exampleId, setExampleId] = useState(DEFAULT_EXAMPLE.id);

  const [isRunning, setIsRunning] = useState(false);
  const [execution, setExecution] = useState<ExecutionResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [view, setView] = useState<View>("empty");
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // "Before" is the earlier run, "After" the most recent one.
  const [before, setBefore] = useState<ExecutionRunRecord | null>(null);
  const [after, setAfter] = useState<ExecutionRunRecord | null>(null);

  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [verification, setVerification] = useState<FixVerificationResponse | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      setIsLoadingHealth(true);
      setHealth(await getBackendHealth());
      setHealthError(null);
    } catch (err: unknown) {
      setHealth(null);
      setHealthError(err instanceof Error ? err.message : "Unable to reach backend");
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const resetResults = () => {
    setExecution(null);
    setView("empty");
    setActiveStepIndex(0);
    setBefore(null);
    setAfter(null);
    setInvestigation(null);
    setInvestigationError(null);
    setVerification(null);
    setRunError(null);
  };

  const loadExample = (id: string) => {
    const example = EXAMPLES.find((e) => e.id === id);
    if (!example) return;
    setCode(example.code);
    setExpectedBehavior(example.expected);
    setExampleId(example.id);
    resetResults();
  };

  const handleCodeChange = (next: string) => {
    setCode(next);
    const match = EXAMPLES.find((e) => e.code === next);
    setExampleId(match ? match.id : "custom");
  };

  const handleRun = async () => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setRunError(null);
    try {
      const result = await executeCode({ code, expected_behavior: expectedBehavior });
      const record: ExecutionRunRecord = {
        id: result.execution_id,
        label: "",
        code,
        response: result,
        timestamp: new Date().toLocaleTimeString(),
      };
      setBefore(after);
      setAfter(record);
      setExecution(result);
      setActiveStepIndex(0);
      setView("summary");
    } catch (err: unknown) {
      // A failed request is not a program result: never present it as an execution.
      setRunError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleInvestigate = async () => {
    if (!execution || isInvestigating) return;
    setView("explain");
    setIsInvestigating(true);
    setInvestigationError(null);
    try {
      const res = await analyzeInvestigation({
        code,
        expected_behavior: expectedBehavior,
        execution,
        comparison_execution: before && before.response !== execution ? before.response : null,
      });
      setInvestigation(res);
    } catch (err) {
      setInvestigationError(err instanceof Error ? err.message : "Gemini could not be reached.");
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleVerified = (result: FixVerificationResponse) => setVerification(result);

  // Compare the run the student started from with the verified correction.
  const handleCompareVerification = () => {
    if (!verification || !investigation || !execution) return;
    setBefore({
      id: execution.execution_id,
      label: "",
      code,
      response: execution,
      timestamp: new Date().toLocaleTimeString(),
    });
    setAfter({
      id: verification.execution.execution_id,
      label: "",
      code: investigation.suggested_correction,
      response: verification.execution,
      timestamp: new Date().toLocaleTimeString(),
    });
    setView("compare");
  };

  const openRun = (record: ExecutionRunRecord) => {
    setCode(record.code);
    setExecution(record.response);
    setActiveStepIndex(0);
    setView("replay");
  };

  const { line: errorLine, summary: errorSummary } = useMemo(() => errorFromExecution(execution), [execution]);
  const activeStep = execution?.steps[activeStepIndex];
  const activeLine = view === "replay" && activeStep ? activeStep.line_number : null;

  const hasInvestigation = !!investigation;
  const isVerified = !!verification?.is_verified;
  const canCompare = !!(before && after && before.id !== after.id);

  const stage: Stage = {
    empty: isRunning ? "run" : "write",
    summary: "run",
    replay: "explore",
    explain: isVerified ? "fix" : "understand",
    compare: "fix",
    learn: "learn",
  }[view] as Stage;

  const reached: Record<Stage, boolean> = {
    write: true,
    run: !!execution,
    explore: !!execution,
    understand: hasInvestigation,
    fix: hasInvestigation,
    learn: hasInvestigation,
  };

  const navigate = (target: Stage) => {
    if (target === "write") {
      document.querySelector<HTMLTextAreaElement>("[data-testid='code-editor-textarea']")?.focus();
      return;
    }
    const map: Record<Exclude<Stage, "write">, View> = {
      run: "summary",
      explore: "replay",
      understand: "explain",
      fix: "explain",
      learn: "learn",
    };
    setView(map[target]);
  };

  const nextHint = !execution
    ? "Run your code to record it."
    : view === "summary"
    ? "Step through the recording to see where it went wrong."
    : view === "replay" && !hasInvestigation
    ? "Ask Gemini to explain what happened."
    : hasInvestigation && !isVerified
    ? "Check the suggested fix before you apply it."
    : isVerified && view !== "learn"
    ? "Fix confirmed. Test your understanding."
    : "";

  return (
    <div className="flex flex-col min-h-screen lg:h-screen w-full bg-background text-text-primary">
      <WorkspaceHeader health={health} isLoadingHealth={isLoadingHealth} healthError={healthError}>
        <JourneyStepper current={stage} reached={reached} onNavigate={navigate} />
      </WorkspaceHeader>

      <main className="flex-1 min-h-0 p-3 lg:p-4">
        <div className="h-full max-w-[1680px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-3 lg:gap-4">
          {/* Left: write */}
          <section aria-label="Your code" className="card flex flex-col min-h-0 overflow-hidden">
            <div className="h-[340px] lg:h-auto lg:flex-1 min-h-0">
              <CodeEditorPane
                bare
                code={code}
                onChange={handleCodeChange}
                activeLine={activeLine}
                errorLine={errorLine}
                errorSummary={errorSummary}
                onResetToSample={() => loadExample(exampleId === "custom" ? DEFAULT_EXAMPLE.id : exampleId)}
                exampleId={exampleId}
                onSelectExample={loadExample}
                onRun={handleRun}
              />
            </div>
            <ExpectedBehaviorPane bare value={expectedBehavior} onChange={setExpectedBehavior} />
            <div className="px-4 py-3 border-t border-border bg-surface-subtle">
              <button
                type="button"
                data-testid="run-code-button"
                onClick={handleRun}
                disabled={isRunning || !code.trim()}
                className="btn btn-primary h-11 w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Running in sandbox…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" aria-hidden="true" /> {execution ? "Run again" : "Run code"}
                    <span className="hidden sm:inline text-[11px] font-normal text-white/70 ml-1">Ctrl + Enter</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Right: investigate */}
          <section
            aria-label="Debugging workspace"
            className="card flex flex-col min-h-[420px] lg:min-h-0 overflow-hidden"
          >
            {nextHint && (
              <p
                data-testid="next-step-hint"
                className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-brand-50 border-b border-brand-100 text-[13px] text-brand-800"
              >
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-brand-600" aria-hidden="true" />
                <span className="font-medium">Next:</span>
                <span className="min-w-0">{nextHint}</span>
              </p>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto" data-testid="workspace-panel">
              {isRunning && (!execution || view === "empty") ? (
                <div role="status" className="px-6 py-16 text-center">
                  <Loader2 className="w-6 h-6 mx-auto text-brand-600 animate-spin" aria-hidden="true" />
                  <p className="mt-3 text-[13px] text-text-secondary">Running your code in an isolated container…</p>
                </div>
              ) : runError ? (
                <div data-testid="run-error-state" role="alert" className="px-6 py-16 max-w-[460px] mx-auto text-center">
                  <AlertTriangle className="w-6 h-6 mx-auto text-error" aria-hidden="true" />
                  <h2 className="mt-4 text-[15px] font-semibold text-text-primary">Your code couldn&apos;t be run</h2>
                  <p className="mt-1.5 text-[13px] leading-5 text-text-secondary break-words">
                    {runError} Nothing was executed, so there is no recording to replay.
                  </p>
                  <button type="button" onClick={handleRun} className="btn btn-secondary mt-5">
                    Try again
                  </button>
                </div>
              ) : view === "empty" || !execution ? (
                <RunEmptyState onSelectExample={loadExample} currentExampleId={exampleId} />
              ) : view === "summary" ? (
                <ResultSummary
                  execution={execution}
                  expectedBehavior={expectedBehavior}
                  onExplore={() => setView("replay")}
                  onExplain={hasInvestigation ? () => setView("explain") : handleInvestigate}
                  isInvestigating={isInvestigating}
                  hasInvestigation={hasInvestigation}
                  canComparePrevious={canCompare}
                  onComparePrevious={() => setView("compare")}
                />
              ) : view === "replay" ? (
                <ReplayPanel
                  execution={execution}
                  code={code}
                  activeStepIndex={activeStepIndex}
                  onSelectStep={setActiveStepIndex}
                  onExplain={hasInvestigation ? () => setView("explain") : handleInvestigate}
                  isInvestigating={isInvestigating}
                  hasInvestigation={hasInvestigation}
                />
              ) : view === "explain" ? (
                <>
                  <InvestigationPane
                    investigation={investigation}
                    isLoading={isInvestigating}
                    error={investigationError}
                    onRetry={handleInvestigate}
                    onSelectStep={(i) => {
                      setActiveStepIndex(i);
                      setView("replay");
                    }}
                    onApplyFix={setCode}
                    originalCode={code}
                    steps={execution.steps}
                    verification={verification}
                    onVerified={handleVerified}
                    onCompare={handleCompareVerification}
                  />
                  {isVerified && (
                    <div className="px-4 sm:px-5 pb-5">
                      <button
                        type="button"
                        data-testid="go-to-learn-button"
                        onClick={() => setView("learn")}
                        className="btn btn-secondary w-full"
                      >
                        <Sparkles className="w-4 h-4 text-brand-600" aria-hidden="true" />
                        Test what you learned
                      </button>
                    </div>
                  )}
                </>
              ) : view === "compare" ? (
                <ComparisonView runA={before} runB={after} onSelectRun={openRun} />
              ) : (
                <LearnPanel
                  challenges={investigation?.learning_challenges ?? []}
                  isVerified={isVerified}
                  onBackToReplay={() => setView("replay")}
                />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
