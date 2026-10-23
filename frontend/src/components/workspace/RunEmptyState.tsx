"use client";

import React from "react";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { EXAMPLES } from "@/lib/examples";

interface RunEmptyStateProps {
  onSelectExample?: (id: string) => void;
  currentExampleId?: string;
}

/** A static picture of the replay, so students know what they are about to get. */
const ReplayIllustration: React.FC = () => (
  <figure
    aria-label="Illustration of the replay view"
    className="rounded-xl border border-border bg-surface-subtle p-4"
  >
    <div className="rounded-lg border border-border bg-surface p-3.5 shadow-sm">
      <div className="flex items-center justify-between text-[11px] text-text-secondary">
        <span>Step 4 of 12</span>
        <span className="chip chip-neutral">Main program</span>
      </div>
      <p className="mt-1.5 text-[13px] font-semibold text-text-primary">Python is about to run line 4</p>
      <div className="mt-2 rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1.5 font-mono text-[12px] text-text-primary">
        <span className="text-text-secondary mr-2">4</span>total = score
      </div>
      <div className="mt-3 flex items-center gap-1.5 font-mono text-[12px]">
        <span className="text-text-secondary mr-1">total</span>
        {["0", "60", "80", "100"].map((v, i) => (
          <React.Fragment key={v}>
            {i > 0 && <span className="text-text-muted">→</span>}
            <span
              className={`px-1.5 py-0.5 rounded border ${
                i === 1 ? "border-brand-600 bg-brand-50 text-brand-700" : "border-border bg-surface"
              }`}
            >
              {v}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
    <div className="mt-4 px-1" aria-hidden="true">
      <div className="relative h-1.5 rounded-full bg-[#E6E7E3]">
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand-600" />
        <span className="absolute -top-[3px] left-1/3 w-3 h-3 -ml-1.5 rounded-full bg-surface border-2 border-brand-600" />
        {[8, 22, 36, 50, 64, 78, 92].map((x) => (
          <span key={x} className="absolute top-3 w-px h-1.5 bg-[#CFD1CC]" style={{ left: `${x}%` }} />
        ))}
      </div>
    </div>
    <figcaption className="mt-5 text-[11px] text-text-secondary">
      Illustration — your own run will appear here with its real recorded steps.
    </figcaption>
  </figure>
);

/** Shown before the first run: what the replay looks like, and quick ways to start. */
export const RunEmptyState: React.FC<RunEmptyStateProps> = ({ onSelectExample, currentExampleId }) => {
  return (
    <div data-testid="timeline-empty-state" className="fade-in px-5 sm:px-8 py-7 max-w-[560px] mx-auto">
      <h2 className="text-[20px] font-semibold tracking-tight text-text-primary">
        Watch your code run, one step at a time
      </h2>
      <p className="mt-2 text-[14px] leading-6 text-text-secondary">
        Press <span className="font-medium text-text-primary">Run code</span>. ECHO records every line and
        variable change, so you can rewind to the exact moment a bug appears.
      </p>

      <div className="mt-6">
        <ReplayIllustration />
      </div>

      {onSelectExample && (
        <div className="mt-6">
          <h3 className="text-[13px] font-semibold text-text-primary">Or start from an example</h3>
          <ul className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {EXAMPLES.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => onSelectExample(ex.id)}
                  aria-pressed={currentExampleId === ex.id}
                  className={`group w-full h-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                    currentExampleId === ex.id
                      ? "border-brand-600 bg-brand-50"
                      : "border-border bg-surface hover:border-brand-200 hover:bg-surface-subtle"
                  }`}
                >
                  <span className="flex items-center justify-between text-[13px] font-medium text-text-primary">
                    {ex.title}
                    <ArrowUpRight className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-600" aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-text-secondary">{ex.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-text-secondary">
        <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
        Your code runs in an isolated container with no network access.
      </p>
    </div>
  );
};
