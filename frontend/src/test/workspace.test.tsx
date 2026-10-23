import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import { CodeEditorPane } from "../components/workspace/CodeEditorPane";
import { ExpectedBehaviorPane } from "../components/workspace/ExpectedBehaviorPane";
import { ReplayPanel } from "../components/workspace/ReplayPanel";
import { JourneyStepper } from "../components/workspace/JourneyStepper";
import { LearnPanel } from "../components/workspace/LearnPanel";
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
    expect(screen.getByTestId("backend-status-indicator")).toHaveTextContent("Connected");
    expect(screen.queryByText(/GLITCHATHON|Milestone/i)).not.toBeInTheDocument();
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
      <ReplayPanel
        execution={mockExecution}
        code="x = 10
y = 20"
        activeStepIndex={0}
        onSelectStep={handleSelectStep}
        onExplain={() => {}}
        isInvestigating={false}
        hasInvestigation={false}
      />
    );

    fireEvent.click(screen.getByTestId("step-next-button"));
    expect(handleSelectStep).toHaveBeenCalledWith(1);
    expect(screen.getByTestId("step-counter")).toBeInTheDocument();
  });

  it("JourneyStepper only lets students revisit stages they have reached", () => {
    const onNavigate = vi.fn();
    render(
      <JourneyStepper
        current="explore"
        reached={{ write: true, run: true, explore: true, understand: false, fix: false, learn: false }}
        onNavigate={onNavigate}
      />
    );
    fireEvent.click(screen.getByTestId("stage-run"));
    expect(onNavigate).toHaveBeenCalledWith("run");
    expect(screen.getByTestId("stage-understand").tagName).toBe("SPAN");
  });

  it("LearnPanel shows one question at a time with feedback", () => {
    render(
      <LearnPanel
        isVerified
        onBackToReplay={() => {}}
        challenges={[
          {
            id: "c1",
            challenge_type: "conceptual",
            question: "Which operator accumulates?",
            options: ["=", "+="],
            correct_answer: "+=",
            explanation: "+= adds to the existing value.",
            hint: "Think about keeping the old value.",
          },
        ]}
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: "=" }));
    fireEvent.click(screen.getByText("Check my answer"));
    expect(screen.getByTestId("learn-feedback")).toHaveTextContent(/not quite/i);
    fireEvent.click(screen.getByText("Finish"));
    expect(screen.getByTestId("learn-complete")).toBeInTheDocument();
  });
});
