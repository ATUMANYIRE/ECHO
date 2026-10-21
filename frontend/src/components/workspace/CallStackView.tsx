"use client";

import React from "react";
import { Layers } from "lucide-react";
import { TraceStep } from "@/lib/types";

interface CallStackViewProps {
  currentStep?: TraceStep;
}

export const CallStackView: React.FC<CallStackViewProps> = ({ currentStep }) => {
  if (!currentStep) return null;

  const isModule = currentStep.function_name === "<module>";

  return (
    <div
      data-testid="call-stack-view"
      className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded bg-zinc-100 border border-zinc-200/80 text-zinc-600"
    >
      <Layers className="w-3 h-3 text-zinc-400" />
      <span className="text-zinc-400">Frame:</span>
      <span className="font-semibold text-zinc-800">
        {isModule ? "<module>" : `${currentStep.function_name}()`}
      </span>
      <span className="text-zinc-400">•</span>
      <span>Line {currentStep.line_number}</span>
    </div>
  );
};
