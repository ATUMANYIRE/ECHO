/**
 * Typed API Client for ECHO backend services.
 */

import {
  HealthResponse,
  ExecutionRequest,
  ExecutionResponse,
  InvestigationRequest,
  InvestigationResponse,
  FixVerificationRequest,
  FixVerificationResponse,
  AIProviderStatus,
} from "./types";

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
 * Submits Python code to the isolated Docker sandbox runner.
 * Returns authoritative execution trace events and variable mutations.
 */
export async function executeCode(request: ExecutionRequest): Promise<ExecutionResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/execution/run`;

  const controller = new AbortController();
  // 30s client timeout to accommodate container creation & execution
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `Execution request failed (${response.status})`;
      try {
        const body = await response.json();
        if (body && typeof body.detail === "string") {
          errorDetail = body.detail;
        } else if (body && typeof body.error_message === "string") {
          errorDetail = body.error_message;
        }
      } catch {
        // ignore json parse error
      }
      throw new ApiError(errorDetail, response.status);
    }

    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : "Network error executing code";
    throw new ApiError(`Execution request failed: ${msg}`, 0);
  }
}

/**
 * Request an evidence-grounded diagnosis from the AI investigator.
 */
export async function analyzeInvestigation(request: InvestigationRequest): Promise<InvestigationResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/investigation/analyze`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `Investigation failed (${response.status})`;
      try {
        const body = await response.json();
        if (body?.detail) errorDetail = body.detail;
      } catch {
        // ignore
      }
      throw new ApiError(errorDetail, response.status);
    }

    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : "Network error generating diagnosis";
    throw new ApiError(`Investigation request failed: ${msg}`, 0);
  }
}

/**
 * Safely verify an AI-suggested fix inside the disposable sandbox runner.
 */
export async function verifyFix(request: FixVerificationRequest): Promise<FixVerificationResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/investigation/verify-fix`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `Fix verification failed (${response.status})`;
      try {
        const body = await response.json();
        if (body?.detail) errorDetail = body.detail;
      } catch {
        // ignore
      }
      throw new ApiError(errorDetail, response.status);
    }

    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : "Network error verifying fix";
    throw new ApiError(`Fix verification failed: ${msg}`, 0);
  }
}

/**
 * Retrieve current AI provider configuration and readiness.
 */
export async function getAIStatus(): Promise<AIProviderStatus> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/investigation/status`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ApiError(`Failed to fetch AI status (${response.status})`, response.status);
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : "Network error fetching AI status";
    throw new ApiError(msg, 0);
  }
}
