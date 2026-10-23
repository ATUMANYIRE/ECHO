"use client";

import React from "react";

interface ExpectedBehaviorPaneProps {
  value: string;
  onChange: (value: string) => void;
  onResetToSample?: () => void;
  bare?: boolean;
}

/** What the student expects the program to do — used to compare against the real result. */
export const ExpectedBehaviorPane: React.FC<ExpectedBehaviorPaneProps> = ({ value, onChange, bare = false }) => {
  return (
    <div className={bare ? "px-4 pt-3 pb-3 border-t border-border" : "card px-3.5 pt-2.5 pb-3"}>
      <label
        htmlFor="expected-behavior"
        className="flex items-baseline justify-between gap-2 mb-1.5"
      >
        <span className="panel-title">What should it do?</span>
        <span className="text-xs text-text-secondary">Used to spot where reality differs</span>
      </label>
      <textarea
        id="expected-behavior"
        data-testid="expected-behavior-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        maxLength={1000}
        className="w-full resize-none rounded-lg border border-border bg-surface-subtle px-3 py-2 text-[13px] leading-5 text-text-primary placeholder:text-text-muted hover:border-[#d9dad6] focus:bg-surface focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15"
        placeholder="Describe the result you expect, e.g. “The average of 60, 80 and 100 should be 80.0”"
      />
    </div>
  );
};
