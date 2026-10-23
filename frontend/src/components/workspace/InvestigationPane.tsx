"use client";

import React, { useMemo, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  GitCompare,
  RefreshCw,
} from "lucide-react";
import { InvestigationResponse, FixVerificationResponse, TraceStep } from "@/lib/types";
import { verifyFix } from "@/lib/api-client";
import { diffLines, hasChanges } from "@/lib/code-diff";

interface InvestigationPaneProps {
  investigation: InvestigationResponse | null;
  isLoading: boolean;
  onSelectStep: (stepIndex: number) => void;
  onApplyFix: (newCode: string) => void;
  originalCode: string;
  /** Recorded steps, used to describe each citation in plain words. */
  steps?: TraceStep[];
  /** Request failure message (shown with a retry action). */
  error?: string | null;
  onRetry?: () => void;
  /** Controlled verification result (kept by the workspace for the Compare stage). */
  verification?: FixVerificationResponse | null;
  onVerified?: (result: FixVerificationResponse) => void;
  onCompare?: () => void;
}

const SectionHeading: React.FC<{
  n: number;
  title: string;
  children?: React.ReactNode;
}> = ({ n, title, children }) => (
  <div className="flex items-center justify-between gap-3 mb-2.5">
    <h3 className="flex items-center gap-2 panel-title">
      <span
        aria-hidden="true"
        className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-muted text-[11px] font-medium text-text-secondary"
      >
        {n}
      </span>
      {title}
    </h3>
    {children}
  </div>
);

export const InvestigationPane: React.FC<InvestigationPaneProps> = ({
  investigation,
  isLoading,
  onSelectStep,
  onApplyFix,
  originalCode,
  steps = [],
  error = null,
  onRetry,
  verification,
  onVerified,
  onCompare,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [localVerification, setLocalVerification] = useState<FixVerificationResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const result = verification ?? localVerification;
  const diff = useMemo(
    () => (investigation ? diffLines(originalCode, investigation.suggested_correction) : []),
    [originalCode, investigation]
  );

  if (isLoading) {
    return (
      <div
        data-testid="investigation-loading-state"
        role="status"
        aria-live="polite"
        className="fade-in px-6 py-12 max-w-[460px] mx-auto text-center"
      >
        <Loader2 className="w-6 h-6 mx-auto text-brand-600 animate-spin" aria-hidden="true" />
        <h2 className="mt-4 text-[15px] font-semibold text-text-primary">
          Reading the recording…
        </h2>
        <p className="mt-1.5 text-[13px] leading-5 text-text-secondary">
          Gemini is comparing what you expected with what actually happened, using the exact steps
          ECHO recorded.
        </p>
        <div className="mt-6 space-y-2.5" aria-hidden="true">
          <div className="h-3 rounded bg-surface-muted animate-pulse w-11/12 mx-auto" />
          <div className="h-3 rounded bg-surface-muted animate-pulse w-9/12 mx-auto" />
          <div className="h-3 rounded bg-surface-muted animate-pulse w-10/12 mx-auto" />
        </div>
      </div>
    );
  }

  if (!investigation) {
    if (error) {
      return (
        <div
          data-testid="investigation-error-state"
          role="alert"
          className="fade-in px-6 py-12 max-w-[460px] mx-auto text-center"
        >
          <AlertTriangle className="w-6 h-6 mx-auto text-error" aria-hidden="true" />
          <h2 className="mt-4 text-[15px] font-semibold text-text-primary">
            The explanation couldn&apos;t be created
          </h2>
          <p className="mt-1.5 text-[13px] leading-5 text-text-secondary break-words">{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn btn-secondary mt-5">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      );
    }
    return (
      <div
        data-testid="investigation-empty-state"
        className="px-6 py-12 max-w-[460px] mx-auto text-center"
      >
        <Sparkles className="w-6 h-6 mx-auto text-brand-600" aria-hidden="true" />
        <h2 className="mt-4 text-[15px] font-semibold text-text-primary">No explanation yet</h2>
        <p className="mt-1.5 text-[13px] leading-5 text-text-secondary">
          Run your code, explore the replay, then choose “Explain with AI” to see why the result
          differs from what you expected.
        </p>
      </div>
    );
  }

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await verifyFix({
        original_code: originalCode,
        suggested_code: investigation.suggested_correction,
        expected_behavior: investigation.expected_behavior,
      });
      setLocalVerification(res);
      onVerified?.(res);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification could not be completed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApply = () => {
    onApplyFix(investigation.suggested_correction);
    setApplied(true);
  };

  const sufficiencyLabel = {
    sufficient: "Enough evidence",
    ambiguous: "Evidence is ambiguous",
    insufficient: "Not enough evidence",
  }[investigation.evidence_sufficiency];

  const codeLines = originalCode.split("\n");
  const showDiff = hasChanges(diff);

  return (
    <div data-testid="investigation-pane" className="fade-in px-4 sm:px-5 py-5 space-y-7">
      {/* Provenance */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          data-testid="investigation-model-badge"
          className={`chip ${investigation.is_live_ai ? "chip-ai" : "chip-neutral"}`}
          title={
            investigation.is_live_ai
              ? "Generated live by the Gemini API"
              : "Generated by ECHO's built-in rule-based fallback — not an AI model"
          }
        >
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          {investigation.is_live_ai
            ? `Gemini · ${investigation.model_identifier}`
            : "Built-in fallback (not AI)"}
        </span>
        <span
          data-testid="evidence-sufficiency-badge"
          className={`chip ${
            investigation.evidence_sufficiency === "sufficient"
              ? "chip-verified"
              : investigation.evidence_sufficiency === "ambiguous"
              ? "chip-warn"
              : "chip-error"
          }`}
        >
          {sufficiencyLabel}
          <span className="sr-only"> ({investigation.evidence_sufficiency})</span>
        </span>
      </div>

      {investigation.validation_warnings.length > 0 && (
        <div role="note" className="rounded-lg border border-[#F3DDB0] bg-[#FFF8EB] px-3.5 py-2.5 text-[13px]">
          <p className="font-medium text-[#9A5B00] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            {investigation.is_live_ai ? "Some AI claims were removed" : "Gemini wasn’t available, so this is a rule-based explanation"}
          </p>
          <ul className="mt-1 space-y-0.5 text-text-secondary">
            {investigation.validation_warnings.map((w, i) => (
              <li key={i}>{w.replace(/\s*\(Gemini API call failed[^)]*\)\.?/, "").replace(/\s+\./g, ".")}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. What happened */}
      <section aria-label="What happened">
        <SectionHeading n={1} title="What happened">
          <span className="chip chip-verified">
            <ShieldCheck className="w-3 h-3" aria-hidden="true" />
            Verified from the run
          </span>
        </SectionHeading>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-subtle border border-border px-3 py-2.5 min-w-0">
            <p className="eyebrow mb-1">Actual behavior</p>
            <p className="font-mono text-[12.5px] leading-5 break-words text-text-primary">
              {investigation.observed_behavior}
            </p>
          </div>
          <div className="rounded-lg bg-brand-50 border border-brand-200 px-3 py-2.5 min-w-0">
            <p className="eyebrow mb-1">You expected</p>
            <p className="text-[13px] leading-5 break-words text-text-primary">
              {investigation.expected_behavior || "(not specified)"}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Why it happened */}
      <section aria-label="Why it happened" data-testid="root-cause-hypothesis-card">
        <SectionHeading n={2} title="Why it happened">
          <span className={`chip ${investigation.is_live_ai ? "chip-ai" : "chip-neutral"}`}>
            {investigation.is_live_ai ? "AI hypothesis" : "Rule-based hypothesis"}
          </span>
        </SectionHeading>
        <p className="text-[14.5px] leading-6 font-medium text-text-primary">
          {investigation.root_cause_hypothesis}
        </p>
        <p className="mt-2 text-[13.5px] leading-6 text-text-secondary">{investigation.explanation}</p>
        <p className="mt-2 text-xs leading-5 text-text-secondary">
          {investigation.confidence_assessment} A hypothesis is only as good as the evidence below —
          check it against the replay.
        </p>
      </section>

      {/* 3. Evidence */}
      <section aria-label="Evidence from execution" data-testid="evidence-citations-card">
        <SectionHeading n={3} title="Evidence from the run">
          <span className="chip chip-verified">
            <ShieldCheck className="w-3 h-3" aria-hidden="true" />
            Recorded steps
          </span>
        </SectionHeading>

        {investigation.supporting_step_indices.length === 0 && investigation.relevant_lines.length === 0 ? (
          <p className="text-[13px] text-text-secondary">No specific steps were cited.</p>
        ) : (
          <ul className="space-y-1.5">
            {investigation.supporting_step_indices.map((idx) => {
              const step = steps[idx];
              const src = step ? codeLines[step.line_number - 1]?.trim() : null;
              return (
                <li key={idx}>
                  <button
                    type="button"
                    data-testid={`citation-step-${idx}`}
                    onClick={() => onSelectStep(idx)}
                    title={`Jump to step ${idx + 1} in the replay`}
                    className="w-full flex items-center gap-3 rounded-lg border border-border bg-surface px-3 min-h-[40px] py-1.5 text-left hover:bg-brand-50 hover:border-brand-200 transition-colors"
                  >
                    <span className="font-medium text-[13px] text-brand-700 flex-shrink-0">
                      Step {idx + 1}
                    </span>
                    {step && (
                      <span className="text-xs text-text-secondary flex-shrink-0">
                        line {step.line_number}
                      </span>
                    )}
                    {src && (
                      <code className="font-mono text-[12.5px] text-text-primary truncate min-w-0">
                        {src}
                      </code>
                    )}
                    <ArrowRight
                      className="w-3.5 h-3.5 ml-auto text-text-secondary flex-shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {investigation.relevant_lines.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-text-secondary">
            <span>Relevant lines:</span>
            {investigation.relevant_lines.map((lineNo) => (
              <span
                key={lineNo}
                data-testid={`citation-line-${lineNo}`}
                className="chip chip-neutral font-mono"
              >
                Line {lineNo}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 4. Suggested correction */}
      <section aria-label="Suggested correction" data-testid="proposed-correction-card">
        <SectionHeading n={4} title="Suggested fix">
          {result?.is_verified ? (
            <span className="chip chip-verified">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              Passed sandbox run
            </span>
          ) : (
            <span className="chip chip-neutral">Not verified yet</span>
          )}
        </SectionHeading>

        <p className="text-[13.5px] leading-6 text-text-secondary">{investigation.correction_rationale}</p>

        <div
          className="mt-3 rounded-lg border border-border overflow-hidden"
          role="group"
          aria-label="Suggested code"
        >
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface-subtle text-xs text-text-secondary">
            <span>{showDiff ? "Changes to your code" : "Suggested code"}</span>
            <span>Review before running</span>
          </div>
          <pre className="font-mono text-[12.5px] leading-6 overflow-x-auto py-1.5 bg-surface">
            {(showDiff ? diff : investigation.suggested_correction.split("\n").map((t) => ({ kind: "same" as const, text: t }))).map(
              (d, i) => (
                <div
                  key={i}
                  className={`px-3 whitespace-pre ${
                    d.kind === "added"
                      ? "bg-success-50 text-success"
                      : d.kind === "removed"
                      ? "bg-error-50 text-error line-through decoration-error/40"
                      : "text-text-primary"
                  }`}
                >
                  <span aria-hidden="true" className="inline-block w-4 select-none opacity-70">
                    {d.kind === "added" ? "+" : d.kind === "removed" ? "−" : " "}
                  </span>
                  <span className="sr-only">
                    {d.kind === "added" ? "Added: " : d.kind === "removed" ? "Removed: " : ""}
                  </span>
                  {d.text || " "}
                </div>
              )
            )}
          </pre>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="verify-fix-button"
            onClick={handleVerify}
            disabled={isVerifying}
            className="btn btn-primary"
            title="Run the suggested code in the isolated sandbox to see what it really does"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Testing in sandbox…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                {result ? "Verify again" : "Verify suggested fix"}
              </>
            )}
          </button>
          <button
            type="button"
            data-testid="apply-fix-button"
            onClick={handleApply}
            className="btn btn-secondary"
            title="Copy the suggested code into the editor. Nothing runs until you press Run."
          >
            Apply to editor
          </button>
        </div>

        <p aria-live="polite" className="mt-2 text-xs text-text-secondary min-h-[16px]">
          {applied ? "Applied to the editor. Press Run code to try it yourself." : ""}
        </p>

        {verifyError && (
          <div role="alert" className="mt-2 rounded-lg border border-[#F3C9C9] bg-error-50 px-3 py-2 text-[13px] text-text-primary">
            <span className="font-medium text-error">Verification failed: </span>
            {verifyError}
          </div>
        )}
      </section>

      {/* 5. Sandbox verification result */}
      {result && (
        <section aria-label="Verification result" data-testid="fix-verification-result" className="fade-in">
          <SectionHeading n={5} title="Verification">
            <span className="chip chip-verified">
              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
              Sandbox result
            </span>
          </SectionHeading>
          <div
            role="status"
            className={`rounded-lg border px-3.5 py-3 ${
              result.is_verified
                ? "bg-success-50 border-[#bfe5d4]"
                : "bg-error-50 border-[#F3C9C9]"
            }`}
          >
            <div data-testid="sandbox-verified-banner" className="flex items-center gap-2 font-semibold text-[13.5px]">
              {result.is_verified ? (
                <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
              ) : (
                <XCircle className="w-4 h-4 text-error" aria-hidden="true" />
              )}
              <span className={result.is_verified ? "text-success" : "text-error"}>
                {result.is_verified
                  ? "Correction Verified in Sandbox"
                  : "Correction did not pass the sandbox check"}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-5 text-text-primary">{result.verification_summary}</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]">
              <span className="text-text-secondary">Output:</span>
              <code className="font-mono text-[12.5px] bg-surface rounded px-1.5 py-0.5 border border-border break-all">
                {result.verified_output || "(none)"}
              </code>
            </div>
            <p className="mt-2 text-xs leading-5 text-text-secondary">{result.disclaimer}</p>
          </div>

          {result.is_verified && onCompare && (
            <button
              type="button"
              data-testid="compare-button"
              onClick={onCompare}
              className="btn btn-primary mt-4"
            >
              <GitCompare className="w-4 h-4" aria-hidden="true" />
              Compare before and after
            </button>
          )}
        </section>
      )}
    </div>
  );
};
