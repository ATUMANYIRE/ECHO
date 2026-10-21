"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { CodeEditorPane } from "./CodeEditorPane";
import { ExpectedBehaviorPane } from "./ExpectedBehaviorPane";
import { ControlBar } from "./ControlBar";
import { ExecutionTimelinePane } from "./ExecutionTimelinePane";
import { getBackendHealth } from "@/lib/api-client";
import { HealthResponse } from "@/lib/types";
import { SAMPLE_TRACE } from "@/lib/sample-data";

export const WorkspaceShell: React.FC = () => {
  // Backend connectivity state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Editor and Intent state
  const [code, setCode] = useState<string>(SAMPLE_TRACE.code);
  const [expectedBehavior, setExpectedBehavior] = useState<string>(SAMPLE_TRACE.expected_behavior);

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
    // Poll every 15 seconds
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Derive active line from active step
  const activeStep = SAMPLE_TRACE.steps[activeStepIndex];
  const activeLine = activeStep ? activeStep.line_number : null;

  // Locate line of exception if present
  const exceptionStep = SAMPLE_TRACE.steps.find((s) => s.event_type === "exception");
  const errorLine = exceptionStep ? exceptionStep.line_number : null;

  const handleResetToSample = () => {
    setCode(SAMPLE_TRACE.code);
    setExpectedBehavior(SAMPLE_TRACE.expected_behavior);
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
                onResetToSample={handleResetToSample}
              />
            </div>

            <div className="flex-shrink-0">
              <ExpectedBehaviorPane
                value={expectedBehavior}
                onChange={setExpectedBehavior}
                onResetToSample={handleResetToSample}
              />
            </div>
          </div>

          {/* Right Column: Action Controls & Execution Timeline (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3 h-full">
            <div className="flex-shrink-0">
              <ControlBar />
            </div>

            <div className="flex-1 min-h-[420px] lg:min-h-0">
              <ExecutionTimelinePane
                traceData={SAMPLE_TRACE}
                activeStepIndex={activeStepIndex}
                onSelectStep={setActiveStepIndex}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
