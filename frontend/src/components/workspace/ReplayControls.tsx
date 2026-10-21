"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertOctagon,
  FastForward,
} from "lucide-react";

interface ReplayControlsProps {
  totalSteps: number;
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  hasException?: boolean;
  exceptionStepIndex?: number;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  totalSteps,
  currentStepIndex,
  onSelectStep,
  hasException = false,
  exceptionStepIndex = -1,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0); // 0.5x, 1x, 2x, 4x
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer safely on unmount or pause
  const stopPlaying = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Step advancement
  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      onSelectStep(currentStepIndex + 1);
    } else {
      stopPlaying();
    }
  }, [currentStepIndex, totalSteps, onSelectStep, stopPlaying]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      onSelectStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, onSelectStep]);

  // Handle Play/Pause timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, Math.round(800 / speed));
      timerRef.current = setInterval(handleNext, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, speed, handleNext]);

  // Stop playing if execution changes or reaches end
  useEffect(() => {
    if (currentStepIndex >= totalSteps - 1 && isPlaying) {
      stopPlaying();
    }
  }, [currentStepIndex, totalSteps, isPlaying, stopPlaying]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when user is typing in textarea or input
      if (
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLInputElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "Home") {
        e.preventDefault();
        onSelectStep(0);
      } else if (e.code === "End") {
        e.preventDefault();
        onSelectStep(Math.max(0, totalSteps - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, onSelectStep, totalSteps]);

  const canGoPrevious = currentStepIndex > 0;
  const canGoNext = currentStepIndex < totalSteps - 1;

  return (
    <div className="flex flex-col gap-2 p-2.5 bg-zinc-50/90 border border-zinc-200/80 rounded-lg">
      <div className="flex items-center justify-between gap-2">
        {/* Playback action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelectStep(0)}
            disabled={!canGoPrevious}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded border border-transparent hover:border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Jump to Start (Home)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            data-testid="step-prev-button"
            onClick={handlePrev}
            disabled={!canGoPrevious}
            className="px-2 py-1 text-xs font-medium rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            title="Step Back (Left Arrow)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <button
            data-testid="replay-play-pause-button"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={totalSteps === 0}
            className={`px-3 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-all shadow-subtle ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-brand-600 hover:bg-brand-700 text-white"
            }`}
            title="Play/Pause (Space)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            data-testid="step-next-button"
            onClick={handleNext}
            disabled={!canGoNext}
            className="px-2 py-1 text-xs font-medium rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            title="Step Next (Right Arrow)"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Controls & Error Jump */}
        <div className="flex items-center gap-2 text-xs">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[11px] font-mono">
            <FastForward className="w-3 h-3 text-zinc-400" />
            <select
              data-testid="replay-speed-select"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="bg-transparent text-zinc-700 font-medium outline-none cursor-pointer text-[11px]"
              aria-label="Replay speed"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1.0x</option>
              <option value="2">2.0x</option>
              <option value="4">4.0x</option>
            </select>
          </div>

          {hasException && exceptionStepIndex !== -1 && (
            <button
              onClick={() => onSelectStep(exceptionStepIndex)}
              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
              title="Jump directly to the line that raised an exception"
            >
              <AlertOctagon className="w-3 h-3 text-rose-600" />
              <span>Jump to Error</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="flex items-center gap-2 px-1">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={(e) => onSelectStep(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          aria-label="Interactive execution timeline scrubber"
        />
      </div>
    </div>
  );
};
