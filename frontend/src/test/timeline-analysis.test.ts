import { describe, it, expect } from "vitest";
import {
  extractVariableHistories,
  extractVariableMutations,
  compareExecutions,
  generatePredictionChallenges,
} from "../lib/timeline-analysis";
import { TraceStep, ExecutionResponse, ExecutionRunRecord } from "../lib/types";

describe("Timeline Analysis & Causal Evolution Engine", () => {
  const sampleSteps: TraceStep[] = [
    {
      step_index: 0,
      line_number: 1,
      event_type: "line",
      function_name: "<module>",
      locals_snapshot: {},
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 1,
      line_number: 2,
      event_type: "line",
      function_name: "<module>",
      locals_snapshot: {
        total: { name: "total", type_name: "int", repr_value: "0", is_changed: true },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 2,
      line_number: 3,
      event_type: "line",
      function_name: "<module>",
      locals_snapshot: {
        total: { name: "total", type_name: "int", repr_value: "60", is_changed: true },
        score: { name: "score", type_name: "int", repr_value: "60", is_changed: true },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 3,
      line_number: 3,
      event_type: "line",
      function_name: "<module>",
      locals_snapshot: {
        total: { name: "total", type_name: "int", repr_value: "80", is_changed: true },
        score: { name: "score", type_name: "int", repr_value: "80", is_changed: true },
      },
      stdout_delta: "",
      exception: null,
    },
  ];

  it("extractVariableHistories extracts points for all variables in scope", () => {
    const histories = extractVariableHistories(sampleSteps);
    expect(histories["total"]).toBeDefined();
    expect(histories["total"].length).toBe(3);
    expect(histories["total"][0].value).toBe("0");
    expect(histories["total"][1].value).toBe("60");
    expect(histories["total"][2].value).toBe("80");
  });

  it("extractVariableMutations filters and deduplicates consecutive values", () => {
    const mutations = extractVariableMutations(sampleSteps);
    expect(mutations["total"]).toBeDefined();
    expect(mutations["total"].map((m) => m.value)).toEqual(["0", "60", "80"]);
  });

  it("compareExecutions detects variable divergence and stdout diff without index coupling", () => {
    const runA: ExecutionRunRecord = {
      id: "run-a",
      label: "Run A (Buggy)",
      code: "total = 60; total = 80",
      timestamp: "12:00",
      response: {
        execution_id: "exec-a",
        status: "completed",
        total_steps: 4,
        duration_ms: 10,
        stdout: "33.33\n",
        stderr: "",
        steps: sampleSteps,
        is_authoritative: true,
        executed_at: new Date().toISOString(),
      },
    };

    const correctedSteps: TraceStep[] = [
      ...sampleSteps.slice(0, 2),
      {
        step_index: 2,
        line_number: 3,
        event_type: "line",
        function_name: "<module>",
        locals_snapshot: {
          total: { name: "total", type_name: "int", repr_value: "60", is_changed: true },
        },
        stdout_delta: "",
        exception: null,
      },
      {
        step_index: 3,
        line_number: 3,
        event_type: "line",
        function_name: "<module>",
        locals_snapshot: {
          total: { name: "total", type_name: "int", repr_value: "140", is_changed: true },
        },
        stdout_delta: "",
        exception: null,
      },
    ];

    const runB: ExecutionRunRecord = {
      id: "run-b",
      label: "Run B (Corrected)",
      code: "total = 60; total += 80",
      timestamp: "12:01",
      response: {
        execution_id: "exec-b",
        status: "completed",
        total_steps: 4,
        duration_ms: 10,
        stdout: "80.0\n",
        stderr: "",
        steps: correctedSteps,
        is_authoritative: true,
        executed_at: new Date().toISOString(),
      },
    };

    const diff = compareExecutions(runA, runB);
    expect(diff.stdoutDiff.match).toBe(false);
    expect(diff.stdoutDiff.stdoutA).toContain("33.33");
    expect(diff.stdoutDiff.stdoutB).toContain("80.0");

    const totalDiff = diff.variableDiffs.find((d) => d.variableName === "total");
    expect(totalDiff).toBeDefined();
    expect(totalDiff?.isDifferent).toBe(true);
    expect(totalDiff?.historyA).toEqual(["0", "60", "80"]);
    expect(totalDiff?.historyB).toEqual(["0", "60", "140"]);
    expect(diff.divergenceStepA).toBeDefined();
  });

  it("generatePredictionChallenges derives evidence-based questions from trace", () => {
    const execution: ExecutionResponse = {
      execution_id: "exec-pred",
      status: "completed",
      total_steps: 4,
      duration_ms: 10,
      stdout: "33.33\n",
      stderr: "",
      steps: sampleSteps,
      is_authoritative: true,
      executed_at: new Date().toISOString(),
    };

    const challenges = generatePredictionChallenges(execution);
    expect(challenges.length).toBeGreaterThan(0);
    // Should have a mutation prediction and an output prediction
    const varChallenge = challenges.find((c) => c.target_variable === "total");
    expect(varChallenge).toBeDefined();
    expect(varChallenge?.options).toContain("80");
    expect(varChallenge?.correct_option_index).toBe(0);
  });
});
