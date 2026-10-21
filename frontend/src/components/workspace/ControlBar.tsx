"use client";

import React, { useState } from "react";
import { Play, Sparkles, Loader2, ShieldCheck, Info } from "lucide-react";

interface ControlBarProps {
  onRun: () => void;
  isRunning: boolean;
  canRun: boolean;
  executionStatus?: string | null;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onRun,
  isRunning,
  canRun,
  executionStatus,
}) => {
  const [showAiNotice, setShowAiNotice] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border border-zinc-200/90 shadow-subtle">
        <div className="flex items-center gap-2">
          {/* Run Code Button - ACTIVE in Milestone 2 */}
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

          {/* Investigate AI button - clearly labeled for Milestone 4 */}
          <div className="relative group">
            <button
              data-testid="investigate-button"
              onClick={() => setShowAiNotice(true)}
              disabled
              className="px-3.5 py-1.5 rounded-md bg-zinc-100 text-zinc-400 font-medium text-xs flex items-center gap-2 cursor-not-allowed border border-zinc-200"
              title="AI root-cause diagnostics will be enabled in Milestone 4."
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Investigate Divergence</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-200 text-zinc-600 font-mono">
                M4
              </span>
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

      {/* Notice if user clicked AI button */}
      {showAiNotice && (
        <div
          data-testid="ai-milestone-banner"
          className="p-3 bg-violet-50/90 border border-violet-200 rounded-lg text-xs text-violet-900 flex items-start justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-violet-950">
                AI Diagnostic Engine arriving in Milestone 4
              </p>
              <p className="mt-0.5 text-violet-800 leading-relaxed text-[11px]">
                In Milestone 2, you have live execution and real-time execution tracing.
                Google Gemini root-cause analysis linking intent to authoritative traces
                will be integrated in Milestone 4.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAiNotice(false)}
            className="text-violet-600 hover:text-violet-950 text-xs font-semibold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
