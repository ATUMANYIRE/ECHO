"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { CodeEditorPane } from "./CodeEditorPane";
import { ExpectedBehaviorPane } from "./ExpectedBehaviorPane";
import { ControlBar } from "./ControlBar";
import { ExecutionTimelinePane } from "./ExecutionTimelinePane";
import { getBackendHealth, executeCode } from "@/lib/api-client";
import { HealthResponse, ExecutionResponse } from "@/lib/types";
import { SAMPLE_TRACE } from "@/lib/sample-data";

const DEFAULT_ACCEPTANCE_CODE = `scores = [60, 80, 100]
total = 0
for score in scores:
    total = score
average = total / len(scores)
print(average)`;

const DEFAULT_EXPECTED_BEHAVIOR = "Iterate through scores [60, 80, 100], sum all values, and calculate average: 80.0";

export const WorkspaceShell: React.FC = () => {
  // Backend connectivity state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Editor and Intent state
  const [code, setCode] = useState<string>(DEFAULT_ACCEPTANCE_CODE);
  const [expectedBehavior, setExpectedBehavior] = useState<string>(DEFAULT_EXPECTED_BEHAVIOR);

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [realExecution, setRealExecution] = useState<ExecutionResponse | null>(null);
  const [isSampleMode, setIsSampleMode] = useState<boolean>(false);

  // Timeline scrubber state
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Check health on mount
  const checkHealth = useCallback(async () => {
    try {
      setIsLoadingHealth(true);
      const data = await getBackendHealth();
      setHealth(data);
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

  // Execute Code in secure sandbox
  const handleRunCode = async () => {
    if (!code.trim() || isRunning) return;

    try {
      setIsRunning(true);
      const result = await executeCode({
        code,
        expected_behavior: expectedBehavior,
      });

      setRealExecution(result);
      setIsSampleMode(false);
      setActiveStepIndex(0);
    } catch (err: unknown) {
      // In case of network error or client timeout
      setRealExecution({
        execution_id: "err-fallback",
        status: "error",
        total_steps: 0,
        duration_ms: 0,
        stdout: "",
        stderr: err instanceof Error ? err.message : "Execution failed",
        steps: [],
        error_message: err instanceof Error ? err.message : "Execution failed",
        is_authoritative: false,
        executed_at: new Date().toISOString(),
      });
      setIsSampleMode(false);
      setActiveStepIndex(0);
    } finally {
      setIsRunning(false);
    }
  };

  // Derive active steps list
  const activeSteps = isSampleMode
    ? SAMPLE_TRACE.steps
    : realExecution?.steps || [];

  const activeStep = activeSteps[activeStepIndex];
  const activeLine = activeStep ? activeStep.line_number : null;

  // Locate line of exception or syntax error
  let errorLine: number | null = null;
  if (!isSampleMode && realExecution) {
    if (realExecution.error_line) {
      errorLine = realExecution.error_line;
    } else {
      const excStep = realExecution.steps.find((s) => s.event_type === "exception");
      if (excStep) errorLine = excStep.line_number;
    }
  } else if (isSampleMode) {
    const excStep = SAMPLE_TRACE.steps.find((s) => s.event_type === "exception");
    if (excStep) errorLine = excStep.line_number;
  }

  const handleResetToAcceptanceBug = () => {
    setCode(DEFAULT_ACCEPTANCE_CODE);
    setExpectedBehavior(DEFAULT_EXPECTED_BEHAVIOR);
    setRealExecution(null);
    setIsSampleMode(false);
    setActiveStepIndex(0);
  };

  const handleApplyFix = () => {
    const fixedCode = code.replace("total = score", "total += score");
    setCode(fixedCode);
  };

  const handleLoadSampleMode = () => {
    setCode(SAMPLE_TRACE.code);
    setExpectedBehavior(SAMPLE_TRACE.expected_behavior);
    setIsSampleMode(true);
    setActiveStepIndex(0);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-canvas-50 text-zinc-900 select-none">
      {/* Top Navigation & Status Bar */}
      <WorkspaceHeader
        health={health}
        isLoadingHealth={isLoadingHealth}
        healthError={healthError}
      />

      {/* Main Debugging Workbench (Desktop Split Grid) */}
      <main className="flex-1 p-3 lg:p-4 overflow-y-auto lg:overflow-hidden">
        <div className="h-full max-w-[1680px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Left Column: Code Editor & Expected Behavior (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3 h-full">
            <div className="flex-1 min-h-[360px] lg:min-h-0">
              <CodeEditorPane
                code={code}
                onChange={setCode}
                activeLine={activeLine}
                errorLine={errorLine}
                onResetToSample={handleResetToAcceptanceBug}
              />
            </div>

            <div className="flex-shrink-0 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={handleResetToAcceptanceBug}
                  className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                  title="Load acceptance bug: total = score"
                >
                  Load Buggy Program
                </button>
                <button
                  onClick={handleApplyFix}
                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors font-medium"
                  title="Apply fix: change total = score to total += score"
                >
                  Apply Fix (total += score)
                </button>
                <button
                  onClick={handleLoadSampleMode}
                  className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition-colors"
                  title="Load illustrative off-by-one demo"
                >
                  Load Sample Demo
                </button>
              </div>
            </div>

            <div className="flex-shrink-0">
              <ExpectedBehaviorPane
                value={expectedBehavior}
                onChange={setExpectedBehavior}
                onResetToSample={handleResetToAcceptanceBug}
              />
            </div>
          </div>

          {/* Right Column: Action Controls & Execution Timeline (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3 h-full">
            <div className="flex-shrink-0">
              <ControlBar
                onRun={handleRunCode}
                isRunning={isRunning}
                canRun={code.trim().length > 0}
                executionStatus={realExecution?.status}
              />
            </div>

            <div className="flex-1 min-h-[420px] lg:min-h-0">
              <ExecutionTimelinePane
                realExecution={realExecution}
                sampleTrace={SAMPLE_TRACE}
                isSampleMode={isSampleMode}
                isLoading={isRunning}
                activeStepIndex={activeStepIndex}
                onSelectStep={setActiveStepIndex}
                onSwitchToReal={() => setIsSampleMode(false)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
