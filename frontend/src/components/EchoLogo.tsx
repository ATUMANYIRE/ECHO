import React from "react";

/** ECHO mark: a source dot whose signal fades outward in three repeats. */
export const EchoMark: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
    <rect width="32" height="32" rx="8" fill="#4F46E5" />
    <circle cx="10" cy="16" r="3" fill="#fff" />
    <path d="M15.2 11.2a6.4 6.4 0 0 1 0 9.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.4 7.8a11.4 11.4 0 0 1 0 16.4" fill="none" stroke="#fff" strokeOpacity=".62" strokeWidth="2" strokeLinecap="round" />
    <path d="M23.6 4.6a16 16 0 0 1 0 22.8" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const EchoLogo: React.FC<{ showTagline?: boolean }> = ({ showTagline = true }) => (
  <div className="flex items-center gap-2.5 min-w-0" data-testid="echo-logo">
    <EchoMark />
    <span className="font-semibold text-[16px] tracking-[0.14em] text-text-primary">ECHO</span>
    {showTagline && (
      <span className="hidden md:block pl-3 ml-0.5 border-l border-border text-[13px] text-text-secondary truncate">
        Replay your code. Understand the bug.
      </span>
    )}
  </div>
);
