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

/** Milestone 3 Causal Investigation Models */

export interface VariableHistoryPoint {
  step_index: number;
  line_number: number;
  value: string;
  type_name: string;
  is_changed: boolean;
  function_name: string;
}

export interface ExecutionRunRecord {
  id: string;
  label: string;
  code: string;
  response: ExecutionResponse;
  timestamp: string;
}

export interface ComparisonDiff {
  variableName: string;
  historyA: string[];
  historyB: string[];
  isDifferent: boolean;
}

export interface RunComparisonResult {
  runA: ExecutionRunRecord;
  runB: ExecutionRunRecord;
  stdoutDiff: {
    match: boolean;
    stdoutA: string;
    stdoutB: string;
  };
  statusDiff: {
    match: boolean;
    statusA: ExecutionStatus;
    statusB: ExecutionStatus;
  };
  variableDiffs: ComparisonDiff[];
  divergenceStepA?: number;
  divergenceStepB?: number;
  explanation: string;
}

export interface PredictionChallenge {
  id: string;
  step_index: number;
  line_number: number;
  prompt: string;
  question: string;
  target_variable: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}
