import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendHealth, executeCode, ApiError } from "../lib/api-client";
import { HealthResponse } from "../lib/types";

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
      execution_enabled: false,
      milestone: "Milestone 1: Production-Quality Foundation",
      message: "API operational",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    });

    const data = await getBackendHealth();
    expect(data.status).toBe("healthy");
    expect(data.execution_enabled).toBe(false);
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

  it("executeCode throws ApiError when endpoint returns 501 Not Implemented", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 501,
      json: async () => ({
        detail: "Untrusted code execution is disabled in Milestone 1. Isolated Docker sandbox runner will be introduced in Milestone 2.",
      }),
    });

    await expect(
      executeCode({ code: "print('hello')", expected_behavior: "prints hello" })
    ).rejects.toThrow(/Milestone 1/);
  });
});
