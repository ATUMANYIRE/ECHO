"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { CodeEditorPane } from "./CodeEditorPane";
import { ExpectedBehaviorPane } from "./ExpectedBehaviorPane";
import { ControlBar } from "./ControlBar";
import { ExecutionTimelinePane, TimelineTab } from "./ExecutionTimelinePane";
import { getBackendHealth, executeCode, analyzeInvestigation } from "@/lib/api-client";
import {
  HealthResponse,
  ExecutionResponse,
  ExecutionRunRecord,
  InvestigationResponse,
} from "@/lib/types";
import { SAMPLE_TRACE } from "@/lib/sample-data";

// 3 Distinct Educational Benchmark Programs
const PROGRAM_ACCUMULATOR_BUG = `scores = [60, 80, 100]
total = 0
for score in scores:
    total = score
average = total / len(scores)
print(average)`;

const PROGRAM_OFF_BY_ONE = `items = ["alpha", "beta", "gamma"]
# Bug: range(len + 1) indexes past list bounds
for i in range(len(items) + 1):
    print(f"Item {i}: {items[i]}")`;

const PROGRAM_RECURSIVE_FACTORIAL = `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(4)
print(f"4! = {result}")`;

export const WorkspaceShell: React.FC = () => {
  // Backend connectivity state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Editor and Intent state
  const [code, setCode] = useState<string>(PROGRAM_ACCUMULATOR_BUG);
  const [expectedBehavior, setExpectedBehavior] = useState<string>(
    "Iterate through scores [60, 80, 100], sum all values, and calculate average: 80.0"
  );

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [realExecution, setRealExecution] = useState<ExecutionResponse | null>(null);
  const [isSampleMode, setIsSampleMode] = useState<boolean>(false);

  // Run History Comparison state (Before and After)
  const [runA, setRunA] = useState<ExecutionRunRecord | null>(null);
  const [runB, setRunB] = useState<ExecutionRunRecord | null>(null);

  // Timeline scrubber state
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // AI Investigation state (Milestone 4)
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(null);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [activeTimelineTab, setActiveTimelineTab] = useState<TimelineTab>("timeline");

  const handleInvestigate = async () => {
    if (!realExecution || isInvestigating) return;

    try {
      setIsInvestigating(true);
      setActiveTimelineTab("investigate");
      const res = await analyzeInvestigation({
        code,
        expected_behavior: expectedBehavior,
        execution: realExecution,
        comparison_execution: runB?.response || null,
      });
      setInvestigation(res);
    } catch (err) {
      console.error("AI Investigation failed:", err);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleApplySuggestedFix = (newCode: string) => {
    setCode(newCode);
  };

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

      // Track into Run A or Run B comparison history
      const record: ExecutionRunRecord = {
        id: result.execution_id,
        label: runA ? "Run B (Modified)" : "Run A (Initial)",
        code,
        response: result,
        timestamp: new Date().toLocaleTimeString(),
      };

      if (!runA) {
        setRunA(record);
      } else {
        setRunB(record);
      }
    } catch (err: unknown) {
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

  // Presets
  const handleLoadAccumulatorBug = () => {
    setCode(PROGRAM_ACCUMULATOR_BUG);
    setExpectedBehavior("Iterate through scores [60, 80, 100], sum all values, and calculate average: 80.0");
    setRealExecution(null);
    setIsSampleMode(false);
    setActiveStepIndex(0);
  };

  const handleApplyFix = () => {
    const fixedCode = code.replace("total = score", "total += score");
    setCode(fixedCode);
  };

  const handleLoadOffByOne = () => {
    setCode(PROGRAM_OFF_BY_ONE);
    setExpectedBehavior("Iterate through items ['alpha', 'beta', 'gamma'] and print item 0, 1, 2 without IndexError.");
    setRealExecution(null);
    setIsSampleMode(false);
    setActiveStepIndex(0);
  };

  const handleLoadRecursion = () => {
    setCode(PROGRAM_RECURSIVE_FACTORIAL);
    setExpectedBehavior("Recursively compute factorial of 4, returning 24.");
    setRealExecution(null);
    setIsSampleMode(false);
    setActiveStepIndex(0);
  };

  const handleSelectRun = (record: ExecutionRunRecord) => {
    setCode(record.code);
    setRealExecution(record.response);
    setIsSampleMode(false);
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
                onResetToSample={handleLoadAccumulatorBug}
              />
            </div>

            {/* Quick Benchmark Presets Bar */}
            <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-400 font-medium">Benchmarks:</span>
                <select
                  data-testid="preset-benchmark-select"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "accumulator") handleLoadAccumulatorBug();
                    else if (val === "off_by_one") handleLoadOffByOne();
                    else if (val === "recursion") handleLoadRecursion();
                  }}
                  className="px-2 py-0.5 text-xs rounded border border-zinc-200 bg-white text-zinc-700 outline-none cursor-pointer"
                  aria-label="Benchmark preset selector"
                >
                  <option value="accumulator">Accumulator Bug</option>
                  <option value="off_by_one">Off-By-One Bug</option>
                  <option value="recursion">Recursion Frame</option>
                </select>
                <button
                  onClick={handleApplyFix}
                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors font-medium"
                  title="Apply fix: total += score"
                >
                  Apply Fix (+=)
                </button>
              </div>

              {/* Tag as Run A or Run B */}
              {realExecution && (
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    onClick={() =>
                      setRunA({
                        id: realExecution.execution_id,
                        label: "Run A (Baseline)",
                        code,
                        response: realExecution,
                        timestamp: new Date().toLocaleTimeString(),
                      })
                    }
                    className="px-1.5 py-0.5 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                    title="Pin current execution as Run A"
                  >
                    Set as Run A
                  </button>
                  <button
                    onClick={() =>
                      setRunB({
                        id: realExecution.execution_id,
                        label: "Run B (Comparison)",
                        code,
                        response: realExecution,
                        timestamp: new Date().toLocaleTimeString(),
                      })
                    }
                    className="px-1.5 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium"
                    title="Pin current execution as Run B"
                  >
                    Set as Run B
                  </button>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <ExpectedBehaviorPane
                value={expectedBehavior}
                onChange={setExpectedBehavior}
                onResetToSample={handleLoadAccumulatorBug}
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
                onInvestigate={handleInvestigate}
                isInvestigating={isInvestigating}
                canInvestigate={!!realExecution}
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
                runA={runA}
                runB={runB}
                onSelectRun={handleSelectRun}
                investigation={investigation}
                isInvestigating={isInvestigating}
                onApplyFix={handleApplySuggestedFix}
                originalCode={code}
                activeTab={activeTimelineTab}
                onChangeTab={setActiveTimelineTab}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
