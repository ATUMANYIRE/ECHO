"use client";

import React, { useState } from "react";
import { HelpCircle, CheckCircle, XCircle, ArrowRight, Lightbulb } from "lucide-react";
import { PredictionChallenge } from "@/lib/types";

interface PredictionChallengeCardProps {
  challenges: PredictionChallenge[];
  onJumpToStep: (stepIndex: number) => void;
}

export const PredictionChallengeCard: React.FC<PredictionChallengeCardProps> = ({
  challenges,
  onJumpToStep,
}) => {
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (challenges.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 bg-white rounded-lg border border-zinc-200">
        <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-zinc-700">Educational Prediction Mode</h4>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
          Run your code to automatically extract evidence-grounded prediction challenges
          derived from recorded variable mutations and loop decisions.
        </p>
      </div>
    );
  }

  const currentChallenge = challenges[activeChallengeIdx];
  const isCorrect = selectedOption === currentChallenge.correct_option_index;

  const handleOptionSelect = (idx: number) => {
    if (!isSubmitted) {
      setSelectedOption(idx);
    }
  };

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setIsSubmitted(true);
    }
  };

  const handleNextChallenge = () => {
    if (activeChallengeIdx < challenges.length - 1) {
      setActiveChallengeIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  };

  return (
    <div
      data-testid="prediction-challenge-card"
      className="flex flex-col h-full bg-white rounded-lg border border-zinc-200/90 shadow-card overflow-hidden"
    >
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200/80 bg-zinc-50/70 text-xs">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-brand-600" />
          <span className="font-semibold text-zinc-800">Prediction Challenge</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          Challenge {activeChallengeIdx + 1} of {challenges.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FCFCFA] text-xs">
        {/* Context Prompt */}
        <div className="p-3 bg-zinc-100/70 border border-zinc-200 rounded-lg">
          <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
            Execution Checkpoint
          </span>
          <p className="text-zinc-800 font-medium text-xs mt-0.5">
            {currentChallenge.prompt}
          </p>
          <div className="mt-2 text-sm font-semibold text-zinc-900 leading-snug">
            {currentChallenge.question}
          </div>
        </div>

        {/* Multiple Choice Options */}
        <div className="space-y-2">
          {currentChallenge.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            let optionStyle = "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800";

            if (isSubmitted) {
              if (idx === currentChallenge.correct_option_index) {
                optionStyle = "border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold";
              } else if (isSelected) {
                optionStyle = "border-rose-400 bg-rose-50 text-rose-950";
              } else {
                optionStyle = "border-zinc-200 bg-zinc-50 text-zinc-400 opacity-60";
              }
            } else if (isSelected) {
              optionStyle = "border-brand-500 bg-brand-50/60 text-brand-950 ring-1 ring-brand-500";
            }

            return (
              <button
                key={idx}
                data-testid={`prediction-option-${idx}`}
                onClick={() => handleOptionSelect(idx)}
                disabled={isSubmitted}
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between text-xs ${optionStyle}`}
              >
                <span>{option}</span>
                {isSubmitted && idx === currentChallenge.correct_option_index && (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
                {isSubmitted && isSelected && idx !== currentChallenge.correct_option_index && (
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Submit or Next Controls */}
        <div className="flex items-center justify-between pt-1">
          {!isSubmitted ? (
            <button
              data-testid="submit-prediction-button"
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-zinc-200 text-white disabled:text-zinc-400 font-medium rounded-md text-xs transition-colors"
            >
              Verify Prediction
            </button>
          ) : (
            <div className="w-full space-y-3">
              {/* Evidence Feedback */}
              <div
                data-testid="prediction-feedback"
                className={`p-3 rounded-lg border text-xs leading-relaxed ${
                  isCorrect
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}
              >
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>
                    {isCorrect ? "Prediction Confirmed by Trace Evidence!" : "Divergence from Recorded Evidence"}
                  </span>
                </div>
                <p className="text-[11px]">{currentChallenge.explanation}</p>
                <button
                  onClick={() => onJumpToStep(currentChallenge.step_index)}
                  className="mt-1 text-[10px] underline font-medium text-brand-700 hover:text-brand-900 block"
                >
                  Jump to Step #{currentChallenge.step_index + 1} in Timeline
                </button>
              </div>

              {activeChallengeIdx < challenges.length - 1 && (
                <button
                  onClick={handleNextChallenge}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white font-medium rounded-md text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Next Challenge</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pedagogical disclaimer */}
        <div className="pt-2 border-t border-zinc-200 text-[10px] text-zinc-400 leading-normal">
          <strong>Pedagogical note:</strong> Prediction checkpoints test mental model alignment against
          authoritative runtime evidence at specific steps. Single answers do not measure overall programming aptitude.
        </div>
      </div>
    </div>
  );
};
