"use client";

import React from "react";
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  Search,
  Sparkles,
  Loader2,
  GitCompare,
} from "lucide-react";
import { ExecutionResponse } from "@/lib/types";
import { describeStatus } from "@/lib/step-explainer";

interface ResultSummaryProps {
  execution: ExecutionResponse;
  expectedBehavior: string;
  onExplore: () => void;
  onExplain: () => void;
  isInvestigating: boolean;
  hasInvestigation: boolean;
  canComparePrevious: boolean;
  onComparePrevious: () => void;
}

function pickErrorText(execution: ExecutionResponse): string | null {
  const exc = execution.steps.find((s) => s.event_type === "exception")?.exception;
  if (exc) return exc;
  if (execution.error_message) {
    return execution.error_type
      ? `${execution.error_type}: ${execution.error_message}`
      : execution.error_message;
  }
  const lastLine = execution.stderr.trim().split("\n").filter(Boolean).pop();
  return lastLine ?? null;
}

/** First screen after a run: what happened vs what was expected, plus the next action. */
export const ResultSummary: React.FC<ResultSummaryProps> = ({
  execution,
  expectedBehavior,
  onExplore,
  onExplain,
  isInvestigating,
  hasInvestigation,
  canComparePrevious,
  onComparePrevious,
}) => {
  const status = describeStatus(execution.status, execution.error_type);
  const isSyntaxError = execution.status === "error" && execution.error_type === "SyntaxError";
  const hasSteps = execution.steps.length > 0;
  const errorText = pickErrorText(execution);
  const hasOutput = execution.stdout.trim().length > 0;

  const tone = {
    success: { icon: CheckCircle2, cls: "text-success" },
    error: { icon: AlertOctagon, cls: "text-error" },
    warn: { icon: AlertTriangle, cls: "text-[#9A5B00]" },
  }[status.tone];
  const StatusIcon = tone.icon;

  return (
    <div className="fade-in px-4 sm:px-5 py-5 space-y-5" data-testid="result-summary">
      {/* Status */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2" role="status">
          <StatusIcon className={`w-5 h-5 flex-shrink-0 ${tone.cls}`} aria-hidden="true" />
          <h2 data-testid="run-status" className="text-[15px] font-semibold text-text-primary">
            {status.label}
          </h2>
        </div>
        <span className="text-xs text-text-secondary">
          {execution.total_steps} steps recorded · {Math.round(execution.duration_ms)} ms
        </span>
      </div>

      {isSyntaxError ? (
        <div
          data-testid="syntax-error-card"
          role="alert"
          className="rounded-lg border border-[#F3C9C9] bg-error-50 px-3.5 py-3 text-[13px]"
        >
          <p className="font-medium text-error">
            Python couldn&apos;t understand line {execution.error_line ?? 1}
          </p>
          <code className="mt-1 block font-mono text-[12.5px] text-text-primary break-words">
            {execution.error_message}
          </code>
          <p className="mt-2 text-text-secondary">
            Fix the highlighted line in the editor, then run again.
          </p>
        </div>
      ) : (
        <>
          {execution.status === "trace_limit_exceeded" && (
            <p className="rounded-lg border border-[#F3DDB0] bg-[#FFF8EB] px-3.5 py-2.5 text-[13px] text-text-primary">
              This program ran for a long time, so ECHO only recorded the first steps. The replay
              covers just that part.
            </p>
          )}
          {execution.status === "timeout" && (
            <p className="rounded-lg border border-[#F3DDB0] bg-[#FFF8EB] px-3.5 py-2.5 text-[13px] text-text-primary">
              The program exceeded its execution time limit after the isolated runner started.
            </p>
          )}
          {execution.status === "oom_killed" && (
            <p className="rounded-lg border border-[#F3DDB0] bg-[#FFF8EB] px-3.5 py-2.5 text-[13px] text-text-primary">
              The program was stopped for using more memory than the sandbox allows.
            </p>
          )}
          {execution.status === "sandbox_unavailable" && (
            <p className="rounded-lg border border-[#F3DDB0] bg-[#FFF8EB] px-3.5 py-2.5 text-[13px] text-text-primary">
              ECHO only runs code in its isolated container, and it isn&apos;t reachable right now. Your code was not
              executed anywhere else.
            </p>
          )}

          {/* Actual vs expected */}
          <div className="grid gap-3 sm:grid-cols-2">
            <section aria-labelledby="actual-title" className="min-w-0">
              <h3 id="actual-title" className="eyebrow mb-1.5">
                Your program produced
              </h3>
              <div
                data-testid="terminal-output-content"
                className="code-block min-h-[64px] whitespace-pre-wrap break-words"
              >
                {hasOutput ? (
                  execution.stdout.trimEnd()
                ) : errorText ? (
                  <span className="text-text-secondary italic">(no output before the error)</span>
                ) : (
                  <span className="text-text-secondary italic">(no output)</span>
                )}
              </div>
              {errorText && (
                <div
                  role="alert"
                  className="mt-2 rounded-lg border border-[#F3C9C9] bg-error-50 px-3 py-2 text-[13px]"
                >
                  <span className="font-medium text-error">Error: </span>
                  <code className="font-mono text-[12.5px] break-words">{errorText}</code>
                </div>
              )}
            </section>

            <section aria-labelledby="expected-title" className="min-w-0">
              <h3 id="expected-title" className="eyebrow mb-1.5">
                You expected
              </h3>
              <div
                data-testid="result-expected"
                className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-[13px] leading-5 min-h-[64px] break-words"
              >
                {expectedBehavior.trim() ? (
                  expectedBehavior
                ) : (
                  <span className="text-text-secondary italic">
                    You haven&apos;t described the expected result yet.
                  </span>
                )}
              </div>
            </section>
          </div>

          <p className="text-[13px] text-text-secondary">
            Does the result match what you expected? If not, replaying the run will show you where
            it went off track.
          </p>
        </>
      )}

      {execution.is_authoritative && (
        <p
          data-testid="authoritative-trace-badge"
          className="flex items-center gap-1.5 text-xs text-text-secondary"
          title="Recorded from a real run inside an isolated Docker container"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          Verified container trace — recorded from a real run, not simulated
        </p>
      )}

      {/* Next action */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {hasSteps ? (
          <button
            type="button"
            data-testid="explore-button"
            onClick={onExplore}
            className="btn btn-primary"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            Explore execution
          </button>
        ) : hasInvestigation ? null : (
          <button
            type="button"
            data-testid="investigate-button"
            onClick={onExplain}
            disabled={isInvestigating}
            className="btn btn-primary"
          >
            {isInvestigating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Explain with AI
              </>
            )}
          </button>
        )}

        {!hasSteps && hasInvestigation && (
          <button type="button" data-testid="view-explanation-button" onClick={onExplain} className="btn btn-primary">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            View AI explanation
          </button>
        )}

        {canComparePrevious && (
          <button
            type="button"
            data-testid="compare-previous-button"
            onClick={onComparePrevious}
            className="btn btn-secondary"
          >
            <GitCompare className="w-4 h-4" aria-hidden="true" />
            Compare with your previous run
          </button>
        )}
      </div>
    </div>
  );
};
