"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Sparkles,
  AlertOctagon,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { ExecutionResponse } from "@/lib/types";
import { explainStep } from "@/lib/step-explainer";
import { generatePredictionChallenges } from "@/lib/timeline-analysis";
import { VariableHistory } from "./VariableHistory";
import { PredictionChallengeCard } from "./PredictionChallengeCard";

interface ReplayPanelProps {
  execution: ExecutionResponse;
  code: string;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  onExplain: () => void;
  isInvestigating: boolean;
  hasInvestigation: boolean;
}

const SPEEDS = [0.5, 1, 2, 4];

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  return (
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement
  );
}

export const ReplayPanel: React.FC<ReplayPanelProps> = ({
  execution,
  code,
  activeStepIndex,
  onSelectStep,
  onExplain,
  isInvestigating,
  hasInvestigation,
}) => {
  const steps = execution.steps;
  const total = steps.length;
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const codeLines = useMemo(() => code.split("\n"), [code]);
  const safeIndex = Math.min(Math.max(activeStepIndex, 0), Math.max(total - 1, 0));
  const step = steps[safeIndex];
  const previous = safeIndex > 0 ? steps[safeIndex - 1] : undefined;
  const explanation = useMemo(
    () => (step ? explainStep(step, previous, codeLines) : null),
    [step, previous, codeLines]
  );
  const challenges = useMemo(() => generatePredictionChallenges(execution), [execution]);

  const exceptionIndex = steps.findIndex((s) => s.event_type === "exception");
  const hasException = exceptionIndex !== -1;
  const canBack = safeIndex > 0;
  const canNext = safeIndex < total - 1;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const goNext = useCallback(() => {
    if (safeIndex < total - 1) onSelectStep(safeIndex + 1);
    else stop();
  }, [safeIndex, total, onSelectStep, stop]);

  const goBack = useCallback(() => {
    if (safeIndex > 0) onSelectStep(safeIndex - 1);
  }, [safeIndex, onSelectStep]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const ms = Math.max(120, Math.round(900 / speed));
    timerRef.current = setInterval(goNext, ms);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isPlaying, speed, goNext]);

  useEffect(() => {
    if (isPlaying && safeIndex >= total - 1) stop();
  }, [isPlaying, safeIndex, total, stop]);

  // Keyboard shortcuts (active only while the replay is on screen)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (isTypingTarget(active)) return;
      if (e.code === "Space") {
        // A focused button handles Space itself
        if (active instanceof HTMLButtonElement) return;
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        goBack();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.code === "Home") {
        e.preventDefault();
        onSelectStep(0);
      } else if (e.code === "End") {
        e.preventDefault();
        onSelectStep(Math.max(0, total - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack, goNext, onSelectStep, total]);

  if (!step || !explanation) {
    return (
      <div className="p-6 text-center text-[13px] text-text-secondary">
        No steps were recorded for this run, so there is nothing to replay.
      </div>
    );
  }

  const variables = Object.values(step.locals_snapshot);
  // Steps where a variable changed: shown as quiet ticks so the timeline has shape.
  const changeMarks =
    total > 1 && total <= 400
      ? steps.reduce<number[]>((acc, st, i) => {
          if (Object.values(st.locals_snapshot ?? {}).some((v) => v.is_changed)) acc.push(i);
          return acc;
        }, [])
      : [];
  const progress = total > 1 ? (safeIndex / (total - 1)) * 100 : 100;
  const where =
    step.function_name === "<module>" ? "Main program" : `Inside ${step.function_name}()`;
  const isException = step.event_type === "exception";

  return (
    <div className="flex flex-col lg:h-full lg:min-h-0">
      <div
        data-testid="replay-scroll"
        className="lg:flex-1 lg:overflow-y-auto px-4 sm:px-5 pt-4 pb-5 space-y-5"
      >
        {/* Where are we? */}
        <section
          key={step.step_index}
          data-testid="active-step-card"
          aria-live="polite"
          className="fade-in space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span data-testid="step-counter" className="text-xs font-medium text-text-secondary">
                Step {safeIndex + 1} of {total}
              </span>
              <span className="chip chip-neutral">{where}</span>
            </div>
            {hasException && (
              <button
                type="button"
                data-testid="jump-to-error-button"
                onClick={() => onSelectStep(exceptionIndex)}
                className="btn btn-ghost btn-sm text-error hover:text-error"
              >
                <AlertOctagon className="w-3.5 h-3.5" aria-hidden="true" />
                Jump to the error
              </button>
            )}
          </div>

          <h3 className="text-[15px] leading-6 font-semibold text-text-primary">
            {explanation.headline}
          </h3>

          {explanation.sourceLine && (
            <div
              data-testid="current-source-line"
              className={`flex items-start gap-3 rounded-lg border px-3 py-2 font-mono text-[12.5px] leading-6 ${
                isException
                  ? "bg-error-50 border-[#F3C9C9]"
                  : "bg-brand-50 border-brand-200"
              }`}
            >
              <span className="text-text-secondary select-none w-5 text-right flex-shrink-0">
                {step.line_number}
              </span>
              <code className="whitespace-pre-wrap break-words text-text-primary min-w-0">
                {explanation.sourceLine}
              </code>
            </div>
          )}

          {explanation.exception && (
            <div
              role="alert"
              className="rounded-lg border border-[#F3C9C9] bg-error-50 px-3 py-2 text-[13px] text-text-primary"
            >
              <span className="font-medium text-error">Error: </span>
              <code className="font-mono text-[12.5px]">{explanation.exception}</code>
            </div>
          )}

          {/* What changed */}
          {explanation.changes.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[13px] text-text-secondary">
                {explanation.previousLine !== null ? (
                  <>
                    Since line {explanation.previousLine}
                    {explanation.previousSource && (
                      <>
                        {" "}
                        (<code className="font-mono text-[12.5px] text-text-primary">{explanation.previousSource}</code>)
                      </>
                    )}{" "}
                    ran:
                  </>
                ) : (
                  "Starting values:"
                )}
              </p>
              <ul className="space-y-1">
                {explanation.changes.map((c) => (
                  <li
                    key={`${step.step_index}-${c.name}`}
                    className="var-changed flex flex-wrap items-center gap-x-2 rounded-lg bg-brand-50 px-3 py-1.5 text-[13px]"
                  >
                    <code className="font-mono font-semibold text-brand-700">{c.name}</code>
                    {c.from !== null ? (
                      <>
                        <span className="text-text-secondary">changed from</span>
                        <code className="font-mono text-text-secondary">{c.from}</code>
                        <span className="text-text-secondary">to</span>
                      </>
                    ) : (
                      <span className="text-text-secondary">is now</span>
                    )}
                    <code className="font-mono font-semibold text-text-primary">{c.to}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[13px] text-text-secondary">
              No variables changed since the previous step.
            </p>
          )}

          {explanation.printed && (
            <p className="text-[13px] text-text-secondary">
              Printed to output:{" "}
              <code className="font-mono text-[12.5px] text-text-primary">{explanation.printed}</code>
            </p>
          )}
          {explanation.eventNote && (
            <p className="text-[13px] text-text-secondary">{explanation.eventNote}</p>
          )}
        </section>

        {/* All variables right now */}
        <section aria-labelledby="vars-title">
          <h3 id="vars-title" className="panel-title mb-2">
            Variables right now
          </h3>
          {variables.length === 0 ? (
            <p className="text-[13px] text-text-secondary">No variables exist yet.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
              {variables.map((v) => {
                const from = previous?.locals_snapshot[v.name]?.repr_value;
                return (
                  <div
                    key={`${step.step_index}-${v.name}`}
                    data-testid={`variable-row-${v.name}`}
                    className={`flex items-center justify-between gap-3 px-3 py-2 ${
                      v.is_changed ? "var-changed bg-brand-50" : "bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="font-mono text-[13px] font-semibold text-text-primary">
                        {v.name}
                      </code>
                      <span className="text-xs text-text-secondary">{v.type_name}</span>
                      {v.is_changed && <span className="chip chip-ai">changed</span>}
                    </div>
                    <code className="font-mono text-[13px] text-text-primary text-right break-all">
                      {v.is_changed && from !== undefined && (
                        <span className="text-text-secondary">{from} → </span>
                      )}
                      <span className="font-semibold">{v.repr_value}</span>
                    </code>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <VariableHistory steps={steps} currentStepIndex={safeIndex} onJumpToStep={onSelectStep} />

        {/* Advanced information, collapsed by default */}
        <details className="group rounded-lg border border-border" data-testid="technical-details">
          <summary className="flex items-center justify-between cursor-pointer list-none px-3 py-2.5 text-[13px] font-medium text-text-primary">
            Technical details
            <ChevronDown
              className="w-4 h-4 text-text-secondary transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <dl className="px-3 pb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
            <dt className="text-text-secondary">Event</dt>
            <dd className="font-mono">{step.event_type}</dd>
            <dt className="text-text-secondary">Frame</dt>
            <dd data-testid="call-stack-view" className="font-mono">
              {step.function_name === "<module>" ? "<module>" : `${step.function_name}()`} · line{" "}
              {step.line_number}
            </dd>
            <dt className="text-text-secondary">Trace step</dt>
            <dd className="font-mono">#{step.step_index + 1}</dd>
            <dt className="text-text-secondary">Run status</dt>
            <dd className="font-mono">{execution.status}</dd>
            <dt className="text-text-secondary">Run time</dt>
            <dd className="font-mono">{execution.duration_ms} ms</dd>
            {execution.termination_reason && (
              <>
                <dt className="text-text-secondary">Ended because</dt>
                <dd className="font-mono">{execution.termination_reason}</dd>
              </>
            )}
          </dl>
        </details>

        <details className="group rounded-lg border border-border" data-testid="predict-section">
          <summary
            data-testid="predict-toggle"
            className="flex items-center justify-between cursor-pointer list-none px-3 py-2.5 text-[13px] font-medium text-text-primary"
          >
            Test your prediction
            <ChevronDown
              className="w-4 h-4 text-text-secondary transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="px-3 pb-3">
            <PredictionChallengeCard challenges={challenges} onJumpToStep={onSelectStep} />
          </div>
        </details>
      </div>

      {/* Replay controls */}
      <div
        data-testid="replay-controls"
        className="sticky bottom-0 border-t border-border bg-surface px-4 sm:px-5 pt-3 pb-3.5 space-y-3"
      >
        <div className="relative pb-2">
          <input
            type="range"
            data-testid="replay-scrubber"
            aria-label={`Timeline. Step ${safeIndex + 1} of ${total}`}
            min={0}
            max={Math.max(total - 1, 0)}
            value={safeIndex}
            disabled={total <= 1}
            onChange={(e) => onSelectStep(parseInt(e.target.value, 10))}
            className="scrubber"
            style={{ ["--progress" as string]: `${progress}%` }}
          />
          {changeMarks.map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className="absolute top-[15px] w-px h-2 bg-brand-200 pointer-events-none"
              style={{ left: `calc(9px + (100% - 18px) * ${i / (total - 1)})` }}
            />
          ))}
          {hasException && total > 1 && (
            <span
              aria-hidden="true"
              title="Where the error happens"
              className="absolute top-[17px] w-1.5 h-1.5 rounded-full bg-error -translate-x-1/2 pointer-events-none"
              style={{ left: `calc(9px + (100% - 18px) * ${exceptionIndex / (total - 1)})` }}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => onSelectStep(0)}
            disabled={!canBack}
            className="btn btn-ghost btn-sm w-9 px-0"
            aria-label="Jump to the first step"
            title="First step (Home)"
          >
            <SkipBack className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-testid="step-prev-button"
            onClick={goBack}
            disabled={!canBack}
            className="btn btn-secondary btn-sm flex-1 sm:flex-none sm:min-w-[84px]"
            title="Back one step (←)"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>
          <button
            type="button"
            data-testid="replay-play-pause-button"
            onClick={() => setIsPlaying((p) => !p)}
            disabled={total <= 1}
            className="btn btn-primary btn-sm flex-1 sm:flex-none sm:min-w-[96px]"
            title="Play or pause (Space)"
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                Play
              </>
            )}
          </button>
          <button
            type="button"
            data-testid="step-next-button"
            onClick={goNext}
            disabled={!canNext}
            className="btn btn-secondary btn-sm flex-1 sm:flex-none sm:min-w-[84px]"
            title="Forward one step (→)"
          >
            Next
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onSelectStep(Math.max(0, total - 1))}
            disabled={!canNext}
            className="btn btn-ghost btn-sm w-9 px-0"
            aria-label="Jump to the last step"
            title="Last step (End)"
          >
            <SkipForward className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            Speed
            <select
              data-testid="replay-speed-select"
              aria-label="Playback speed"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="h-8 rounded-md border border-border bg-surface px-2 text-[13px] text-text-primary cursor-pointer"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
          </label>

          {hasInvestigation ? (
            <button
              type="button"
              data-testid="view-explanation-button"
              onClick={onExplain}
              className="btn btn-primary"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              View AI explanation
            </button>
          ) : (
            <button
              type="button"
              data-testid="investigate-button"
              onClick={onExplain}
              disabled={isInvestigating}
              className="btn btn-primary"
              title="Ask Gemini to explain the cause, citing the steps you just replayed"
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
        </div>
      </div>
    </div>
  );
};
