import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InvestigationPane } from "../components/workspace/InvestigationPane";
import { InvestigationResponse } from "../lib/types";
import * as apiClient from "../lib/api-client";

describe("InvestigationPane Component", () => {
  const mockInvestigation: InvestigationResponse = {
    investigation_id: "inv-test-1",
    observed_behavior: "Calculated average 33.33",
    expected_behavior: "Expected average 80.0",
    root_cause_hypothesis: "Accumulator overwrite: total = score instead of total += score",
    explanation: "At Step #4, total was overwritten with the current element.",
    supporting_step_indices: [3],
    relevant_lines: [4],
    suggested_correction: "total += score",
    correction_rationale: "Augmented addition preserves running sum.",
    confidence_assessment: "High confidence based on verified trace mutation.",
    evidence_sufficiency: "sufficient",
    learning_challenges: [
      {
        id: "ch-1",
        challenge_type: "conceptual",
        question: "What is the difference between = and += in Python?",
        options: [
          "= replaces the value, while += accumulates into the existing value",
          "= is for strings, += is for integers",
        ],
        correct_answer: "= replaces the value, while += accumulates into the existing value",
        explanation: "Assignment overwrites previous binding; += adds to it.",
        hint: "Think about running totals.",
      },
    ],
    is_live_ai: false,
    model_identifier: "deterministic-evidence-engine-v1",
    latency_ms: 15.0,
    validation_warnings: [],
  };

  it("renders diagnosis, root-cause hypothesis, and sufficiency badge", () => {
    render(
      <InvestigationPane
        investigation={mockInvestigation}
        isLoading={false}
        onSelectStep={() => {}}
        onApplyFix={() => {}}
        originalCode="total = score"
      />
    );

    expect(screen.getByTestId("investigation-pane")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-sufficiency-badge")).toHaveTextContent(/sufficient/i);
    expect(screen.getByText(/Accumulator overwrite/i)).toBeInTheDocument();
    expect(screen.getByText("Calculated average 33.33")).toBeInTheDocument();
    expect(screen.getByText("Expected average 80.0")).toBeInTheDocument();
  });

  it("clickable evidence citations trigger onSelectStep", () => {
    const handleSelectStep = vi.fn();
    render(
      <InvestigationPane
        investigation={mockInvestigation}
        isLoading={false}
        onSelectStep={handleSelectStep}
        onApplyFix={() => {}}
        originalCode="total = score"
      />
    );

    const stepPill = screen.getByTestId("citation-step-3");
    expect(stepPill).toBeInTheDocument();
    fireEvent.click(stepPill);
    expect(handleSelectStep).toHaveBeenCalledWith(3);
  });

  it("verify fix button calls verifyFix and displays verification disclaimer", async () => {
    vi.spyOn(apiClient, "verifyFix").mockResolvedValue({
      is_verified: true,
      status: "completed",
      original_output: "33.33",
      verified_output: "80.0",
      matches_expectation: true,
      verification_summary: "Suggested code executed cleanly with output: '80.0'.",
      execution: {
        execution_id: "exec-verified",
        status: "completed",
        total_steps: 4,
        duration_ms: 10,
        stdout: "80.0",
        stderr: "",
        steps: [],
        is_authoritative: true,
        executed_at: new Date().toISOString(),
      },
      disclaimer: "Passing observed checks verifies behavior for tested inputs but does not prove universal algorithm correctness.",
    });

    render(
      <InvestigationPane
        investigation={mockInvestigation}
        isLoading={false}
        onSelectStep={() => {}}
        onApplyFix={() => {}}
        originalCode="total = score"
      />
    );

    const verifyBtn = screen.getByTestId("verify-fix-button");
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-verification-result")).toBeInTheDocument();
    });

    expect(screen.getByText(/Correction Verified in Sandbox/i)).toBeInTheDocument();
    expect(screen.getByText(/Passing observed checks verifies behavior/i)).toBeInTheDocument();
  });

  it("apply fix button triggers onApplyFix with suggested code", () => {
    const handleApplyFix = vi.fn();
    render(
      <InvestigationPane
        investigation={mockInvestigation}
        isLoading={false}
        onSelectStep={() => {}}
        onApplyFix={handleApplyFix}
        originalCode="total = score"
      />
    );

    const applyBtn = screen.getByTestId("apply-fix-button");
    fireEvent.click(applyBtn);
    expect(handleApplyFix).toHaveBeenCalledWith("total += score");
  });

  it("displays loading and empty states", () => {
    const { rerender } = render(
      <InvestigationPane
        investigation={null}
        isLoading={true}
        onSelectStep={() => {}}
        onApplyFix={() => {}}
        originalCode=""
      />
    );

    expect(screen.getByTestId("investigation-loading-state")).toBeInTheDocument();

    rerender(
      <InvestigationPane
        investigation={null}
        isLoading={false}
        onSelectStep={() => {}}
        onApplyFix={() => {}}
        originalCode=""
      />
    );

    expect(screen.getByTestId("investigation-empty-state")).toBeInTheDocument();
  });
});
