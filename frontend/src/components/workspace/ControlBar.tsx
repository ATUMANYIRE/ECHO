"use client";

import React, { useState } from "react";
import { Play, Sparkles, Loader2, ShieldCheck, Info } from "lucide-react";

interface ControlBarProps {
  onRun: () => void;
  isRunning: boolean;
  canRun: boolean;
  executionStatus?: string | null;
  onInvestigate?: () => void;
  isInvestigating?: boolean;
  canInvestigate?: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onRun,
  isRunning,
  canRun,
  executionStatus,
  onInvestigate,
  isInvestigating = false,
  canInvestigate = false,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 p-2 bg-white rounded-lg border border-zinc-200/90 shadow-subtle">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Run Code Button - ACTIVE */}
          <button
            data-testid="run-code-button"
            onClick={onRun}
            disabled={isRunning || !canRun}
            className={`px-3.5 py-1.5 rounded-md font-medium text-xs flex items-center gap-2 transition-all ${
              isRunning
                ? "bg-brand-500 text-white cursor-wait shadow-sm"
                : canRun
                ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow active:scale-[0.98]"
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
            }`}
            title="Execute Python code inside disposable Docker container"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Running in Sandbox...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-white" />
                <span>Run in Sandbox</span>
              </>
            )}
          </button>

          {/* Investigate with AI Button - ACTIVE in Milestone 4 */}
          <div className="relative group">
            <button
              data-testid="investigate-button"
              onClick={onInvestigate}
              disabled={isInvestigating || !canInvestigate}
              className={`px-3.5 py-1.5 rounded-md font-medium text-xs flex items-center gap-2 transition-all ${
                isInvestigating
                  ? "bg-violet-100 text-violet-800 border border-violet-300 cursor-wait"
                  : canInvestigate
                  ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm hover:shadow active:scale-[0.98]"
                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
              }`}
              title={
                canInvestigate
                  ? "Generate evidence-grounded AI root-cause analysis based on recorded runtime trace"
                  : "Run your code first to record authoritative trace evidence for the AI to analyze"
              }
            >
              {isInvestigating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-700" />
                  <span>Analyzing Evidence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-current" />
                  <span>Investigate with AI</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-violet-500/30 text-current font-mono">
                    AI
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 pr-1">
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Isolated Sandbox Active
          </span>
        </div>
      </div>
    </div>
  );
};
