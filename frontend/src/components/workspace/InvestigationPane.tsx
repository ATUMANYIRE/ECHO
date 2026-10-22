"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code2,
  Play,
  Loader2,
  ArrowRight,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  InvestigationResponse,
  FixVerificationResponse,
  LearningChallenge,
} from "@/lib/types";
import { verifyFix } from "@/lib/api-client";

interface InvestigationPaneProps {
  investigation: InvestigationResponse | null;
  isLoading: boolean;
  onSelectStep: (stepIndex: number) => void;
  onApplyFix: (newCode: string) => void;
  originalCode: string;
}

export const InvestigationPane: React.FC<InvestigationPaneProps> = ({
  investigation,
  isLoading,
  onSelectStep,
  onApplyFix,
  originalCode,
}) => {
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] =
    useState<FixVerificationResponse | null>(null);
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number>(0);
  const [selectedChallengeOption, setSelectedChallengeOption] = useState<
    string | null
  >(null);
  const [codingAnswer, setCodingAnswer] = useState<string>("");
  const [challengeSubmitted, setChallengeSubmitted] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div
        data-testid="investigation-loading-state"
        className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-zinc-200 h-full"
      >
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-zinc-900">
          AI Investigator Analyzing Runtime Trace...
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
          Correlating student intent with verified container execution events to
          isolate the exact moment of divergence.
        </p>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div
        data-testid="investigation-empty-state"
        className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-zinc-200 h-full"
      >
        <Sparkles className="w-8 h-8 text-violet-400 mb-2" />
        <h4 className="text-xs font-semibold text-zinc-800">
          Evidence-Grounded AI Investigator
        </h4>
        <p className="text-[11px] text-zinc-400 max-w-sm mt-1 leading-relaxed">
          Click <strong>&quot;Investigate with AI&quot;</strong> in the control bar to analyze your
          program&apos;s runtime trace and discover why and when it diverged from intent.
        </p>
      </div>
    );
  }

  const handleVerifyFix = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await verifyFix({
        original_code: originalCode,
        suggested_code: investigation.suggested_correction,
        expected_behavior: investigation.expected_behavior,
      });
      setVerificationResult(res);
    } catch (err) {
      console.error("Fix verification failed:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const challenges = investigation.learning_challenges || [];
  const activeChallenge: LearningChallenge | undefined =
    challenges[activeChallengeIdx];

  return (
    <div
      data-testid="investigation-pane"
      className="flex flex-col h-full bg-white rounded-lg border border-zinc-200/90 shadow-card overflow-hidden"
    >
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200/80 bg-zinc-50/70 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="font-semibold text-zinc-800">
            AI Diagnosis & Evidence Trace
          </span>
          <span
            data-testid="investigation-model-badge"
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border ${
              investigation.is_live_ai
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-zinc-100 text-zinc-600 border-zinc-200"
            }`}
          >
            {investigation.is_live_ai
              ? `Gemini (${investigation.model_identifier})`
              : "Deterministic Engine (Verified Trace)"}
          </span>
        </div>

        {/* Sufficiency Badge */}
        <span
          data-testid="evidence-sufficiency-badge"
          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
            investigation.evidence_sufficiency === "sufficient"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : investigation.evidence_sufficiency === "ambiguous"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {investigation.evidence_sufficiency} Evidence
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FCFCFA] text-xs">
        {/* Validation Warnings (if any filtered citations) */}
        {investigation.validation_warnings.length > 0 && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-950">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Evidence Validation Notices</span>
            </div>
            {investigation.validation_warnings.map((warn, i) => (
              <p key={i} className="text-[10px] leading-relaxed">
                • {warn}
              </p>
            ))}
          </div>
        )}

        {/* Root-Cause Hypothesis Card */}
        <div
          data-testid="root-cause-hypothesis-card"
          className="p-3.5 bg-white border border-violet-200 rounded-lg shadow-subtle space-y-2.5"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-violet-100">
            <span className="font-semibold text-violet-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Root-Cause Hypothesis</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Hypothesis (Evidence-Grounded)
            </span>
          </div>

          <p className="text-zinc-900 font-medium text-xs leading-relaxed bg-violet-50/50 p-2.5 rounded border border-violet-100">
            {investigation.root_cause_hypothesis}
          </p>

          <p className="text-zinc-600 leading-relaxed text-[11px]">
            {investigation.explanation}
          </p>

          {/* Observed vs Expected Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="p-2 bg-zinc-50 border border-zinc-200 rounded">
              <span className="font-semibold text-zinc-500 block mb-0.5 text-[10px] uppercase">
                Observed Runtime Behavior
              </span>
              <span className="font-mono text-zinc-800">
                {investigation.observed_behavior}
              </span>
            </div>
            <div className="p-2 bg-emerald-50/50 border border-emerald-200 rounded">
              <span className="font-semibold text-emerald-700 block mb-0.5 text-[10px] uppercase">
                Expected Intent
              </span>
              <span className="font-mono text-emerald-900">
                {investigation.expected_behavior || "(Unspecified)"}
              </span>
            </div>
          </div>
        </div>

        {/* Supporting Evidence Citations (Clickable Step & Line Pills) */}
        <div
          data-testid="evidence-citations-card"
          className="p-3 bg-white border border-zinc-200 rounded-lg space-y-2"
        >
          <div className="font-semibold text-zinc-800 text-[11px] flex items-center justify-between">
            <span>Supporting Trace Evidence</span>
            <span className="text-[10px] text-zinc-400">
              Click a pill to jump directly to that moment
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {investigation.supporting_step_indices.map((idx) => (
              <button
                key={idx}
                data-testid={`citation-step-${idx}`}
                onClick={() => onSelectStep(idx)}
                className="px-2 py-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 text-[11px] font-mono font-medium flex items-center gap-1 transition-colors"
                title={`Jump timeline to Step #${idx + 1}`}
              >
                <span>Step #{idx + 1}</span>
                <ArrowRight className="w-3 h-3 text-brand-500" />
              </button>
            ))}

            {investigation.relevant_lines.map((lineNo) => (
              <span
                key={lineNo}
                data-testid={`citation-line-${lineNo}`}
                className="px-2 py-1 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-mono font-medium"
              >
                Line {lineNo}
              </span>
            ))}
          </div>

          <p className="text-[10px] text-zinc-500 italic mt-1">
            {investigation.confidence_assessment}
          </p>
        </div>

        {/* Proposed Code Correction & Safe Verification */}
        <div
          data-testid="proposed-correction-card"
          className="p-3.5 bg-white border border-zinc-200 rounded-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Proposed Correction</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Untrusted AI Code
            </span>
          </div>

          <p className="text-[11px] text-zinc-600 leading-relaxed">
            {investigation.correction_rationale}
          </p>

          {/* Code preview box */}
          <div className="bg-zinc-900 text-zinc-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto border border-zinc-800">
            <pre>{investigation.suggested_correction}</pre>
          </div>

          {/* Verification Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              data-testid="verify-fix-button"
              onClick={handleVerifyFix}
              disabled={isVerifying}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="Execute proposed code in isolated sandbox to verify behavior"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Testing in Sandbox...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-white" />
                  <span>Verify Fix in Sandbox</span>
                </>
              )}
            </button>

            <button
              data-testid="apply-fix-button"
              onClick={() => onApplyFix(investigation.suggested_correction)}
              className="px-3 py-1.5 rounded border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-medium text-xs transition-colors"
              title="Apply this corrected code into the editor"
            >
              Apply to Editor
            </button>
          </div>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div
              data-testid="fix-verification-result"
              className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                verificationResult.is_verified
                  ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                  : "bg-rose-50 border-rose-200 text-rose-950"
              }`}
            >
              <div data-testid="sandbox-verified-banner" className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-1.5">
                  {verificationResult.is_verified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>
                    {verificationResult.is_verified
                      ? "Correction Verified in Sandbox"
                      : "Correction Did Not Pass Sandbox Checks"}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase">
                  {verificationResult.status}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed">
                {verificationResult.verification_summary}
              </p>

              <div className="font-mono text-[11px] bg-white/80 p-1.5 rounded border border-emerald-200">
                Output: <code>{verificationResult.verified_output}</code>
              </div>

              <p className="text-[10px] text-zinc-500 italic pt-1">
                Notice: {verificationResult.disclaimer}
              </p>
            </div>
          )}
        </div>

        {/* AI Learning Challenges Card */}
        {challenges.length > 0 && activeChallenge && (
          <div
            data-testid="learning-challenges-card"
            className="p-3.5 bg-white border border-zinc-200 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/80">
              <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
                <span>Concept Check: Solidify Understanding</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Challenge {activeChallengeIdx + 1} of {challenges.length}
              </span>
            </div>

            {/* Challenge Type Selector Tabs */}
            <div className="flex items-center gap-1 border-b border-zinc-100 pb-1.5">
              {challenges.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveChallengeIdx(i);
                    setSelectedChallengeOption(null);
                    setChallengeSubmitted(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors uppercase ${
                    i === activeChallengeIdx
                      ? "bg-brand-50 text-brand-700 border border-brand-200"
                      : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {c.challenge_type}
                </button>
              ))}
            </div>

            {/* Question */}
            <div className="space-y-1">
              <p className="text-zinc-900 font-medium text-xs leading-relaxed">
                {activeChallenge.question}
              </p>
              {activeChallenge.code_context && (
                <div className="bg-zinc-900 text-zinc-100 p-2 rounded font-mono text-[11px]">
                  <pre>{activeChallenge.code_context}</pre>
                </div>
              )}
            </div>

            {/* Multiple Choice Options if present */}
            {activeChallenge.options && activeChallenge.options.length > 0 ? (
              <div className="space-y-1.5">
                {activeChallenge.options.map((opt, optIdx) => {
                  const isSelected = selectedChallengeOption === opt;
                  return (
                    <button
                      key={optIdx}
                      data-testid={`challenge-option-${optIdx}`}
                      onClick={() =>
                        !challengeSubmitted && setSelectedChallengeOption(opt)
                      }
                      disabled={challengeSubmitted}
                      className={`w-full p-2.5 rounded border text-left text-xs transition-all ${
                        challengeSubmitted && opt === activeChallenge.correct_answer
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-medium"
                          : challengeSubmitted &&
                            isSelected &&
                            opt !== activeChallenge.correct_answer
                          ? "bg-rose-50 border-rose-300 text-rose-950"
                          : isSelected
                          ? "bg-brand-50 border-brand-300 text-brand-950 font-medium"
                          : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Coding Exercise Textarea */
              <div className="space-y-1.5">
                <textarea
                  data-testid="challenge-coding-input"
                  value={codingAnswer}
                  onChange={(e) => setCodingAnswer(e.target.value)}
                  placeholder="Enter Python statement here..."
                  className="w-full h-16 p-2 font-mono text-xs border border-zinc-200 rounded focus:border-brand-500 outline-none"
                />
              </div>
            )}

            {/* Challenge Controls & Feedback */}
            <div className="pt-1">
              {!challengeSubmitted ? (
                <button
                  data-testid="submit-challenge-button"
                  onClick={() => setChallengeSubmitted(true)}
                  disabled={
                    activeChallenge.options
                      ? !selectedChallengeOption
                      : !codingAnswer.trim()
                  }
                  className="px-3 py-1 bg-brand-600 hover:bg-brand-700 disabled:bg-zinc-200 text-white disabled:text-zinc-400 font-medium rounded text-xs transition-colors"
                >
                  Check Answer
                </button>
              ) : (
                <div
                  data-testid="challenge-feedback-card"
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    (activeChallenge.options
                      ? selectedChallengeOption === activeChallenge.correct_answer
                      : codingAnswer.trim() === activeChallenge.correct_answer.trim())
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-amber-50 border-amber-200 text-amber-950"
                  }`}
                >
                  <p className="font-semibold">
                    {(activeChallenge.options
                      ? selectedChallengeOption === activeChallenge.correct_answer
                      : codingAnswer.trim() === activeChallenge.correct_answer.trim())
                      ? "✓ Correct!"
                      : "Divergence from Expected Concept"}
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    {activeChallenge.explanation}
                  </p>
                  {activeChallengeIdx < challenges.length - 1 && (
                    <button
                      onClick={() => {
                        setActiveChallengeIdx((prev) => prev + 1);
                        setSelectedChallengeOption(null);
                        setChallengeSubmitted(false);
                      }}
                      className="mt-1 text-[11px] underline font-medium text-brand-700 hover:text-brand-900 block"
                    >
                      Next Challenge →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
