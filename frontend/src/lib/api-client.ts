/**
 * Typed API Client for ECHO backend services.
 */

import { HealthResponse, ExecutionRequest, ExecutionResponse } from "./types";

const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8005";
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Retrieve backend health, uptime, and execution sandbox readiness.
 */
export async function getBackendHealth(): Promise<HealthResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/health`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Health check failed with status ${response.status}`, response.status, errorText);
    }

    const data: HealthResponse = await response.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : "Network error contacting backend";
    throw new ApiError(`Failed to reach backend at ${url}: ${msg}`, 0);
  }
}

/**
 * Submits Python code for isolated execution.
 * NOTE: In Milestone 1, this returns 501 Not Implemented from the backend.
 */
export async function executeCode(request: ExecutionRequest): Promise<ExecutionResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/execution/run`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorDetail = `Execution request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && typeof body.detail === "string") {
        errorDetail = body.detail;
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}
