/**
 * Turns a raw trace step into a plain-language description for students.
 *
 * Everything here is derived directly from recorded trace data (line numbers,
 * variable snapshots, stdout deltas, exception text). Nothing is invented:
 * if the trace does not contain a fact, it is not stated.
 */

import { TraceStep } from "./types";

export interface VariableChange {
  name: string;
  from: string | null;
  to: string;
}

export interface StepExplanation {
  /** One-sentence summary of where execution is. */
  headline: string;
  /** Source text of the line about to run (trimmed), if known. */
  sourceLine: string | null;
  /** Line that just ran before this step (from trace order), if any. */
  previousLine: number | null;
  previousSource: string | null;
  changes: VariableChange[];
  printed: string | null;
  exception: string | null;
  /** Friendly sentence describing the kind of event. */
  eventNote: string | null;
}

export function explainStep(
  step: TraceStep,
  previous: TraceStep | undefined,
  codeLines: string[]
): StepExplanation {
  const sourceLine = codeLines[step.line_number - 1]?.trim() || null;
  const previousSource = previous
    ? codeLines[previous.line_number - 1]?.trim() || null
    : null;

  const changes: VariableChange[] = Object.values(step.locals_snapshot)
    .filter((v) => v.is_changed)
    .map((v) => ({
      name: v.name,
      from: previous?.locals_snapshot[v.name]?.repr_value ?? null,
      to: v.repr_value,
    }));

  const inFunction = step.function_name !== "<module>";
  let headline = `Python is at line ${step.line_number}`;
  let eventNote: string | null = null;

  switch (step.event_type) {
    case "call":
      headline = `Python is entering ${step.function_name}()`;
      eventNote = "A function was called, so Python jumps into it. Its variables start fresh.";
      break;
    case "return":
      headline = inFunction
        ? `${step.function_name}() is finishing`
        : "The program is finishing";
      eventNote = inFunction
        ? "The function is done and hands control back to the line that called it."
        : null;
      break;
    case "exception":
      headline = `Python stopped with an error on line ${step.line_number}`;
      eventNote = "An uncaught error ends the program at this point.";
      break;
    default:
      headline = `Python is about to run line ${step.line_number}`;
  }

  return {
    headline,
    sourceLine,
    previousLine: previous ? previous.line_number : null,
    previousSource,
    changes,
    printed: step.stdout_delta?.trim() ? step.stdout_delta.trim() : null,
    exception: step.exception ?? null,
    eventNote,
  };
}

/** Friendly status wording for an execution status. */
export function describeStatus(
  status: string,
  errorType?: string | null
): { label: string; tone: "success" | "error" | "warn" } {
  switch (status) {
    case "completed":
      return { label: "Finished without errors", tone: "success" };
    case "error":
      return {
        label: errorType === "SyntaxError" ? "Python can't read this code" : "Stopped by an error",
        tone: "error",
      };
    case "timeout":
      return { label: "Took too long and was stopped", tone: "warn" };
    case "oom_killed":
      return { label: "Used too much memory and was stopped", tone: "warn" };
    case "trace_limit_exceeded":
      return { label: "Ran, but only the first steps were recorded", tone: "warn" };
    case "sandbox_unavailable":
      return { label: "The safe runner is offline", tone: "warn" };
    default:
      return { label: status, tone: "warn" };
  }
}
