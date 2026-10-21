import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import { CodeEditorPane } from "../components/workspace/CodeEditorPane";
import { ExpectedBehaviorPane } from "../components/workspace/ExpectedBehaviorPane";
import { ControlBar } from "../components/workspace/ControlBar";
import { ExecutionTimelinePane } from "../components/workspace/ExecutionTimelinePane";
import { SAMPLE_TRACE } from "../lib/sample-data";

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
          execution_enabled: false,
          milestone: "Milestone 1",
        }}
        isLoadingHealth={false}
        healthError={null}
      />
    );

    expect(screen.getByText("ECHO")).toBeInTheDocument();
    expect(screen.getByText("GLITCHATHON 2026")).toBeInTheDocument();
    expect(screen.getByText(/API Online/i)).toBeInTheDocument();
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

  it("ControlBar has disabled action buttons with Milestone 2 badge", () => {
    render(<ControlBar />);

    const runBtn = screen.getByTestId("run-code-button");
    const investigateBtn = screen.getByTestId("investigate-button");

    expect(runBtn).toBeDisabled();
    expect(investigateBtn).toBeDisabled();
    expect(screen.getByText("Milestone 1 Preview")).toBeInTheDocument();
  });

  it("ExecutionTimelinePane explicitly displays the illustrative preview badge and scrubs steps", () => {
    const handleSelectStep = vi.fn();
    render(
      <ExecutionTimelinePane
        traceData={SAMPLE_TRACE}
        activeStepIndex={0}
        onSelectStep={handleSelectStep}
      />
    );

    // Verifies illustrative badge is visible to prevent misleading users
    expect(screen.getByTestId("illustrative-trace-badge")).toBeInTheDocument();
    expect(screen.getByText(/Illustrative Preview Only/i)).toBeInTheDocument();

    // Verify next button triggers step change
    const nextBtn = screen.getByTestId("step-next-button");
    fireEvent.click(nextBtn);
    expect(handleSelectStep).toHaveBeenCalledWith(1);
  });
});
