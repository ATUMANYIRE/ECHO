import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendHealth, executeCode, ApiError } from "../lib/api-client";
import { HealthResponse, ExecutionResponse } from "../lib/types";

describe("Typed ApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getBackendHealth fetches and parses health status successfully", async () => {
    const mockHealth: HealthResponse = {
      status: "healthy",
      app: "ECHO API",
      version: "0.1.0",
      environment: "test",
      uptime_seconds: 42.5,
      timestamp: new Date().toISOString(),
      sandbox_available: true,
      execution_enabled: true,
      milestone: "Milestone 2: Secure Execution & Real-Time Code Tracing",
      message: "API operational",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    });

    const data = await getBackendHealth();
    expect(data.status).toBe("healthy");
    expect(data.execution_enabled).toBe(true);
    expect(data.version).toBe("0.1.0");
  });

  it("getBackendHealth throws ApiError when backend returns 500 error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    await expect(getBackendHealth()).rejects.toThrow(ApiError);
  });

  it("executeCode successfully returns typed ExecutionResponse from backend", async () => {
    const mockResult: ExecutionResponse = {
      execution_id: "test-run-123",
      status: "completed",
      total_steps: 12,
      duration_ms: 15.2,
      stdout: "33.333333333333336\n",
      stderr: "",
      steps: [
        {
          step_index: 0,
          line_number: 1,
          event_type: "line",
          function_name: "<module>",
          locals_snapshot: {},
          stdout_delta: "",
          exception: null,
        },
      ],
      is_authoritative: true,
      executed_at: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    });

    const response = await executeCode({
      code: "print('hello')",
      expected_behavior: "prints hello",
    });

    expect(response.status).toBe("completed");
    expect(response.total_steps).toBe(12);
    expect(response.is_authoritative).toBe(true);
    expect(response.stdout).toContain("33.333333333333336");
  });

  it("executeCode handles error response gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: "Code is required",
      }),
    });

    await expect(
      executeCode({ code: "", expected_behavior: "" })
    ).rejects.toThrow(/Code is required/);
  });
});
