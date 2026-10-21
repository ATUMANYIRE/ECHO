import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import { CodeEditorPane } from "../components/workspace/CodeEditorPane";
import { ExpectedBehaviorPane } from "../components/workspace/ExpectedBehaviorPane";
import { ControlBar } from "../components/workspace/ControlBar";
import { ExecutionTimelinePane } from "../components/workspace/ExecutionTimelinePane";
import { ExecutionResponse } from "../lib/types";

describe("Workspace Components", () => {
  it("WorkspaceHeader displays title, tagline, and health state", () => {
    render(
      <WorkspaceHeader
        health={{
          status: "healthy",
          app: "ECHO API",
          version: "0.1.0",
          environment: "development",
          uptime_seconds: 10,
          timestamp: new Date().toISOString(),
          sandbox_available: true,
          execution_enabled: true,
          milestone: "Milestone 2",
        }}
        isLoadingHealth={false}
        healthError={null}
      />
    );

    expect(screen.getByText("ECHO")).toBeInTheDocument();
    expect(screen.getByText("GLITCHATHON 2026")).toBeInTheDocument();
    expect(screen.getByText(/API Online/i)).toBeInTheDocument();
    expect(screen.getByText(/Sandbox: Active/i)).toBeInTheDocument();
  });

  it("CodeEditorPane renders code lines and reacts to input changes", () => {
    const handleChange = vi.fn();
    render(
      <CodeEditorPane
        code="def hello():\n    return 'world'"
        onChange={handleChange}
        activeLine={2}
      />
    );

    const textarea = screen.getByTestId("code-editor-textarea") as HTMLTextAreaElement;
    expect(textarea.value).toContain("def hello():");

    fireEvent.change(textarea, { target: { value: "def modified():\n    pass" } });
    expect(handleChange).toHaveBeenCalledWith("def modified():\n    pass");
  });

  it("ExpectedBehaviorPane accepts student intent descriptions", () => {
    const handleChange = vi.fn();
    render(
      <ExpectedBehaviorPane
        value="Should calculate average"
        onChange={handleChange}
      />
    );

    const textarea = screen.getByTestId("expected-behavior-textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Should calculate average");

    fireEvent.change(textarea, { target: { value: "Updated expectation" } });
    expect(handleChange).toHaveBeenCalledWith("Updated expectation");
  });

  it("ControlBar has enabled Run button in Milestone 2", () => {
    const handleRun = vi.fn();
    render(
      <ControlBar
        onRun={handleRun}
        isRunning={false}
        canRun={true}
      />
    );

    const runBtn = screen.getByTestId("run-code-button");
    const investigateBtn = screen.getByTestId("investigate-button");

    expect(runBtn).toBeEnabled();
    expect(investigateBtn).toBeDisabled();
    expect(screen.getByText("Isolated Sandbox Active")).toBeInTheDocument();

    fireEvent.click(runBtn);
    expect(handleRun).toHaveBeenCalledTimes(1);
  });

  it("ControlBar enables Investigate button when canInvestigate is true", () => {
    const handleInvestigate = vi.fn();
    render(
      <ControlBar
        onRun={() => {}}
        isRunning={false}
        canRun={true}
        canInvestigate={true}
        onInvestigate={handleInvestigate}
      />
    );

    const investigateBtn = screen.getByTestId("investigate-button");
    expect(investigateBtn).toBeEnabled();

    fireEvent.click(investigateBtn);
    expect(handleInvestigate).toHaveBeenCalledTimes(1);
  });

  it("ExecutionTimelinePane displays authoritative trace and allows stepping", () => {
    const handleSelectStep = vi.fn();
    const mockExecution: ExecutionResponse = {
      execution_id: "exec-test-1",
      status: "completed",
      total_steps: 2,
      duration_ms: 12.0,
      stdout: "output test",
      stderr: "",
      is_authoritative: true,
      executed_at: new Date().toISOString(),
      steps: [
        {
          step_index: 0,
          line_number: 1,
          event_type: "line",
          function_name: "<module>",
          locals_snapshot: {
            x: { name: "x", type_name: "int", repr_value: "10", is_changed: true },
          },
          stdout_delta: "",
          exception: null,
        },
        {
          step_index: 1,
          line_number: 2,
          event_type: "line",
          function_name: "<module>",
          locals_snapshot: {
            x: { name: "x", type_name: "int", repr_value: "10", is_changed: false },
            y: { name: "y", type_name: "int", repr_value: "20", is_changed: true },
          },
          stdout_delta: "",
          exception: null,
        },
      ],
    };

    render(
      <ExecutionTimelinePane
        realExecution={mockExecution}
        sampleTrace={null}
        isSampleMode={false}
        isLoading={false}
        activeStepIndex={0}
        onSelectStep={handleSelectStep}
        onSwitchToReal={() => {}}
      />
    );

    // Verify authoritative badge
    expect(screen.getByTestId("authoritative-trace-badge")).toBeInTheDocument();
    expect(screen.getByText(/Verified Container Trace/i)).toBeInTheDocument();

    // Verify next step button
    const nextBtn = screen.getByTestId("step-next-button");
    fireEvent.click(nextBtn);
    expect(handleSelectStep).toHaveBeenCalledWith(1);

    // Verify terminal output tab
    const outputTab = screen.getByTestId("output-tab-button");
    fireEvent.click(outputTab);
    expect(screen.getByText("output test")).toBeInTheDocument();
  });
});
