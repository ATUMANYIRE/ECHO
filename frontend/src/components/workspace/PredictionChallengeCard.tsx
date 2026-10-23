"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { PredictionChallenge } from "@/lib/types";

interface PredictionChallengeCardProps {
  challenges: PredictionChallenge[];
  onJumpToStep: (stepIndex: number) => void;
}

/** One focused prediction question at a time, grounded in recorded execution. */
export const PredictionChallengeCard: React.FC<PredictionChallengeCardProps> = ({
  challenges,
  onJumpToStep,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (challenges.length === 0) {
    return (
      <p className="text-[13px] text-text-secondary">
        Run a program with a few variable changes to get prediction questions.
      </p>
    );
  }

  const challenge = challenges[activeIdx];
  const isCorrect = selected === challenge.correct_option_index;

  const next = () => {
    setActiveIdx((i) => Math.min(i + 1, challenges.length - 1));
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <div data-testid="prediction-challenge-card" className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="panel-title">Prediction challenge</h4>
        <span className="text-xs text-text-secondary">
          {activeIdx + 1} of {challenges.length}
        </span>
      </div>

      <div>
        <p className="text-xs text-text-secondary">{challenge.prompt}</p>
        <p className="text-[13.5px] font-medium text-text-primary mt-0.5">{challenge.question}</p>
      </div>

      <div role="radiogroup" aria-label="Answer options" className="space-y-1.5">
        {challenge.options.map((option, idx) => {
          const isSelected = selected === idx;
          const isAnswer = idx === challenge.correct_option_index;
          let style = "border-border bg-surface hover:bg-surface-subtle";
          if (submitted && isAnswer) style = "border-success bg-success-50 text-success font-medium";
          else if (submitted && isSelected) style = "border-error bg-error-50 text-error";
          else if (submitted) style = "border-border bg-surface-subtle text-text-secondary opacity-70";
          else if (isSelected) style = "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600";

          return (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={`prediction-option-${idx}`}
              onClick={() => !submitted && setSelected(idx)}
              disabled={submitted}
              className={`w-full min-h-[40px] px-3 py-2 rounded-lg border text-left font-mono text-[13px] flex items-center justify-between gap-2 transition-colors ${style}`}
            >
              <span className="break-all">{option}</span>
              {submitted && isAnswer && <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
              {submitted && isSelected && !isAnswer && (
                <XCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          data-testid="submit-prediction-button"
          onClick={() => selected !== null && setSubmitted(true)}
          disabled={selected === null}
          className="btn btn-primary btn-sm"
        >
          Check my prediction
        </button>
      ) : (
        <div
          data-testid="prediction-feedback"
          role="status"
          className={`rounded-lg border px-3 py-2.5 text-[13px] ${
            isCorrect
              ? "bg-success-50 border-[#bfe5d4] text-text-primary"
              : "bg-[#FFF8EB] border-[#F3DDB0] text-text-primary"
          }`}
        >
          <p className="font-medium">
            {isCorrect ? "Right — the recording agrees." : "Not quite — here is what the recording shows."}
          </p>
          <p className="text-text-secondary mt-0.5">{challenge.explanation}</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onJumpToStep(challenge.step_index)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2"
            >
              Show me step {challenge.step_index + 1}
            </button>
            {activeIdx < challenges.length - 1 && (
              <button type="button" onClick={next} className="btn btn-secondary btn-sm">
                Next question <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
