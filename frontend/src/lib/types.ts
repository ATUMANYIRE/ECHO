/**
 * Typed contracts for ECHO frontend and backend communication.
 * Synchronized with backend Pydantic schemas.
 */

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  app: string;
  version: string;
  environment: string;
  uptime_seconds: number;
  timestamp: string;
  sandbox_available: boolean;
  execution_enabled: boolean;
  milestone: string;
  message?: string;
}

export type ExecutionStatus =
  | "completed"
  | "timeout"
  | "error"
  | "trace_limit_exceeded"
  | "sandbox_unavailable"
  | "oom_killed";

export interface VariableSnapshot {
  name: string;
  type_name: string;
  repr_value: string;
  is_changed: boolean;
}

export interface TraceStep {
  step_index: number;
  line_number: number;
  event_type: "line" | "call" | "return" | "exception";
  function_name: string;
  locals_snapshot: Record<string, VariableSnapshot>;
  stdout_delta: string;
  exception?: string | null;
}

export interface ExecutionRequest {
  code: string;
  expected_behavior?: string;
}

export interface ExecutionResponse {
  execution_id: string;
  status: ExecutionStatus;
  total_steps: number;
  duration_ms: number;
  stdout: string;
  stderr: string;
  steps: TraceStep[];
  error_message?: string | null;
  error_type?: string | null;
  error_line?: number | null;
  error_offset?: number | null;
  termination_reason?: string | null;
  is_authoritative: boolean;
  executed_at: string;
}

export interface SampleTraceData {
  title: string;
  code: string;
  expected_behavior: string;
  description: string;
  steps: TraceStep[];
  error_message: string;
  is_authoritative: false;
  disclaimer: string;
}
