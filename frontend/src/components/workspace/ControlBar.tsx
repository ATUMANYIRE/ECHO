"use client";

import React, { useState } from "react";
import { Play, Sparkles, AlertTriangle, Info, ShieldAlert } from "lucide-react";

interface ControlBarProps {
  onActionAttempt?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({ onActionAttempt }) => {
  const [showNotification, setShowNotification] = useState(false);

  const handleDisabledClick = () => {
    setShowNotification(true);
    if (onActionAttempt) onActionAttempt();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border border-zinc-200/90 shadow-subtle">
        <div className="flex items-center gap-2">
          {/* Run button - clearly labeled as disabled in Milestone 1 */}
          <div className="relative group">
            <button
              data-testid="run-code-button"
              onClick={handleDisabledClick}
              disabled
              className="px-3.5 py-1.5 rounded-md bg-zinc-100 text-zinc-400 font-medium text-xs flex items-center gap-2 cursor-not-allowed border border-zinc-200"
              title="Execution engine disabled in Milestone 1. Scheduled for Milestone 2."
            >
              <Play className="w-3.5 h-3.5 text-zinc-400" />
              <span>Run Code</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-200 text-zinc-600 font-mono">
                M2
              </span>
            </button>
          </div>

          {/* Investigate AI button - clearly labeled as disabled in Milestone 1 */}
          <div className="relative group">
            <button
              data-testid="investigate-button"
              onClick={handleDisabledClick}
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

        {/* Milestone 1 Status Notice */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 pr-1">
          <span className="inline-flex items-center gap-1 text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60 font-medium">
            <Info className="w-3 h-3 text-brand-600" />
            Milestone 1 Preview
          </span>
          <span className="hidden md:inline text-zinc-400">|</span>
          <span className="hidden md:inline text-zinc-500">
            Timeline currently demonstrating pre-recorded illustrative trace
          </span>
        </div>
      </div>

      {/* Explanatory banner if user clicked a disabled control */}
      {showNotification && (
        <div
          data-testid="milestone-boundary-banner"
          className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Untrusted execution sandbox arriving in Milestone 2
              </p>
              <p className="mt-0.5 text-amber-700 leading-relaxed text-[11px]">
                To guarantee security and academic integrity, ECHO executes code strictly within
                isolated, disposable Docker containers. In this Milestone 1 foundation, live execution is
                intentionally disabled. You can inspect the pre-recorded illustrative trace on the right.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="text-amber-600 hover:text-amber-900 text-xs font-semibold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
