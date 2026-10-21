"use client";

import React from "react";
import { Compass, HelpCircle } from "lucide-react";

interface ExpectedBehaviorPaneProps {
  value: string;
  onChange: (value: string) => void;
  onResetToSample?: () => void;
}

export const ExpectedBehaviorPane: React.FC<ExpectedBehaviorPaneProps> = ({
  value,
  onChange,
  onResetToSample,
}) => {
  return (
    <div className="flex flex-col bg-white rounded-lg border border-zinc-200/90 shadow-card overflow-hidden">
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200/80 bg-zinc-50/70 text-xs">
        <div className="flex items-center gap-2 font-medium text-zinc-700">
          <Compass className="w-4 h-4 text-accent-600" />
          <span>Expected Program Behavior</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400">Student Intent</span>
          {onResetToSample && (
            <button
              onClick={onResetToSample}
              className="text-[10px] text-zinc-500 hover:text-zinc-800 underline underline-offset-2"
            >
              Reset to sample
            </button>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#FCFCFA]">
        <textarea
          data-testid="expected-behavior-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full text-xs text-zinc-800 bg-white border border-zinc-200/90 rounded-md p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none leading-relaxed placeholder:text-zinc-400"
          placeholder="Describe what this code is supposed to calculate or produce (e.g., 'Given scores [85, 92, 78], should compute average: 85.0')..."
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <HelpCircle className="w-3 h-3 text-zinc-400" />
            <span>AI compares runtime evidence against this intent to locate divergence.</span>
          </div>
          <span>{value.length}/1000</span>
        </div>
      </div>
    </div>
  );
};
