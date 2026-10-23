"use client";

import React, { useState } from "react";
import { CheckCircle2, Lightbulb, ArrowRight, RotateCcw } from "lucide-react";
import { LearningChallenge } from "@/lib/types";

interface LearnPanelProps {
  challenges: LearningChallenge[];
  /** Whether the student has already seen the corrected program run. */
  isVerified: boolean;
  onBackToReplay: () => void;
}

const TYPE_LABEL: Record<LearningChallenge["challenge_type"], string> = {
  prediction: "Predict",
  conceptual: "Concept",
  coding: "Code",
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** One focused question at a time, with gentle feedback. */
export const LearnPanel: React.FC<LearnPanelProps> = ({ challenges, isVerified, onBackToReplay }) => {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (challenges.length === 0) {
    return (
      <div data-testid="learn-empty" className="px-6 py-12 max-w-[460px] mx-auto text-center">
        <Lightbulb className="w-6 h-6 mx-auto text-brand-600" aria-hidden="true" />
        <h2 className="mt-4 text-[15px] font-semibold text-text-primary">No questions this time</h2>
        <p className="mt-1.5 text-[13px] leading-5 text-text-secondary">
          Ask for an AI explanation first and ECHO will turn the bug into a short practice question.
        </p>
        <button type="button" onClick={onBackToReplay} className="btn btn-secondary mt-5">
          Back to the replay
        </button>
      </div>
    );
  }

  const done = idx >= challenges.length;
  if (done) {
    return (
      <div data-testid="learn-complete" className="fade-in px-6 py-12 max-w-[460px] mx-auto text-center">
        <CheckCircle2 className="w-6 h-6 mx-auto text-success" aria-hidden="true" />
        <h2 className="mt-4 text-[15px] font-semibold text-text-primary">Nice work</h2>
        <p className="mt-1.5 text-[13px] leading-5 text-text-secondary">
          You answered {correctCount} of {challenges.length} correctly. Try another example, or edit the
          code and run it again to keep experimenting.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIdx(0);
              setCorrectCount(0);
              setSelected(null);
              setTyped("");
              setSubmitted(false);
              setShowHint(false);
            }}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Practice again
          </button>
        </div>
      </div>
    );
  }

  const challenge = challenges[idx];
  const hasOptions = !!challenge.options && challenge.options.length > 0;
  const answer = hasOptions ? selected : typed.trim() || null;
  const isCorrect =
    answer !== null && normalize(answer) === normalize(challenge.correct_answer);

  const submit = () => {
    if (answer === null) return;
    setSubmitted(true);
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const next = () => {
    setIdx((i) => i + 1);
    setSelected(null);
    setTyped("");
    setSubmitted(false);
    setShowHint(false);
  };

  return (
    <div data-testid="learn-panel" className="fade-in px-4 sm:px-5 py-5 space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold text-text-primary">
          {isVerified ? "Now test your understanding" : "Test your understanding"}
        </h2>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Question {idx + 1} of {challenges.length} ·{" "}
          <span className="chip chip-neutral">{TYPE_LABEL[challenge.challenge_type]}</span>
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-[14px] leading-6 text-text-primary">{challenge.question}</p>
        {challenge.code_context && <pre className="code-block">{challenge.code_context}</pre>}

        {hasOptions ? (
          <div role="radiogroup" aria-label="Answer options" className="space-y-1.5">
            {challenge.options!.map((option) => {
              const isSelected = selected === option;
              const isAnswer = normalize(option) === normalize(challenge.correct_answer);
              let style = "border-border bg-surface hover:bg-surface-subtle";
              if (submitted && isAnswer) style = "border-success bg-success-50 text-success font-medium";
              else if (submitted && isSelected) style = "border-error bg-error-50 text-error";
              else if (submitted) style = "border-border bg-surface-subtle text-text-secondary opacity-70";
              else if (isSelected) style = "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600";
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={submitted}
                  onClick={() => setSelected(option)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-lg border text-left text-[13px] transition-colors ${style}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type="text"
            value={typed}
            disabled={submitted}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            aria-label="Your answer"
            placeholder="Type your answer"
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-[13px] font-mono outline-none focus:border-brand-600"
          />
        )}
      </div>

      {!submitted ? (
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={answer === null} onClick={submit}>
            Check my answer
          </button>
          <button
            type="button"
            className="text-[13px] text-text-secondary hover:text-text-primary underline underline-offset-2"
            onClick={() => setShowHint(true)}
          >
            Need a hint?
          </button>
        </div>
      ) : (
        <div
          role="status"
          data-testid="learn-feedback"
          className={`rounded-lg border px-3.5 py-3 text-[13px] ${
            isCorrect ? "bg-success-50 border-[#bfe5d4]" : "bg-[#FFF8EB] border-[#F3DDB0]"
          }`}
        >
          <p className="font-medium text-text-primary">
            {isCorrect ? "That's right." : "Not quite — that's a common slip."}
          </p>
          <p className="mt-1 leading-5 text-text-secondary">{challenge.explanation}</p>
          {!isCorrect && (
            <p className="mt-1 text-text-secondary">
              Answer: <span className="font-mono text-text-primary">{challenge.correct_answer}</span>
            </p>
          )}
          <button type="button" onClick={next} className="btn btn-secondary btn-sm mt-3">
            {idx < challenges.length - 1 ? "Next question" : "Finish"}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {showHint && !submitted && (
        <p className="text-[13px] leading-5 text-text-secondary rounded-lg bg-surface-subtle border border-border px-3 py-2">
          <Lightbulb className="inline w-3.5 h-3.5 mr-1 -mt-0.5 text-brand-600" aria-hidden="true" />
          {challenge.hint}
        </p>
      )}
    </div>
  );
};
