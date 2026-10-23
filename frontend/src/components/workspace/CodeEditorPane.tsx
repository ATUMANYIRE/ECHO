"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check, RotateCcw, AlertCircle } from "lucide-react";
import { highlightPython } from "@/lib/syntax";
import { EXAMPLES } from "@/lib/examples";

interface CodeEditorPaneProps {
  code: string;
  onChange: (newCode: string) => void;
  /** Line currently highlighted by the replay (1-based). */
  activeLine?: number | null;
  /** Line where a runtime or syntax error occurred (1-based). */
  errorLine?: number | null;
  /** Short description of the error, shown in the footer. */
  errorSummary?: string | null;
  /** Reset the editor (and expected behavior) to the loaded example. */
  onResetToSample?: () => void;
  /** Currently selected example id, or "custom" once the student edits. */
  exampleId?: string;
  onSelectExample?: (id: string) => void;
  /** Ctrl/Cmd + Enter runs the code. */
  onRun?: () => void;
  /** Render without its own card chrome (when hosted inside a parent card). */
  bare?: boolean;
}

const LINE_HEIGHT = 24;
const PAD_Y = 12;

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  code,
  onChange,
  activeLine = null,
  errorLine = null,
  errorSummary = null,
  onResetToSample,
  exampleId,
  onSelectExample,
  onRun,
  bare = false,
}) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => highlightPython(code), [code]);
  const lineCount = lines.length;

  const syncScroll = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = ta.scrollTop;
      highlightRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  };

  // Keep the replayed line visible inside the editor viewport.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || !activeLine) return;
    const top = PAD_Y + (activeLine - 1) * LINE_HEIGHT;
    const bottom = top + LINE_HEIGHT;
    if (top < ta.scrollTop + 8) {
      ta.scrollTop = Math.max(0, top - 40);
    } else if (bottom > ta.scrollTop + ta.clientHeight - 8) {
      ta.scrollTop = bottom - ta.clientHeight + 40;
    }
    syncScroll();
  }, [activeLine]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable (insecure context); fail silently.
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun?.();
      return;
    }

    // Tab inserts four spaces instead of moving focus
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      onChange(code.substring(0, start) + "    " + code.substring(end));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  return (
    <section
      aria-label="Code editor"
      className={`flex flex-col h-full min-h-[300px] overflow-hidden ${bare ? "" : "card"}`}
    >
      {/* Header: title, example picker, copy + reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="panel-title">Your code</h2>
          <span className="chip chip-neutral font-mono">Python</span>
          {onSelectExample && (
            <label className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              <span className="sr-only sm:not-sr-only">Example</span>
              <select
                data-testid="preset-benchmark-select"
                aria-label="Load an example program"
                value={exampleId ?? "custom"}
                onChange={(e) => onSelectExample(e.target.value)}
                className="h-8 max-w-[190px] rounded-md border border-border bg-surface px-2 text-[13px] text-text-primary cursor-pointer hover:border-[#d9dad6]"
              >
                {EXAMPLES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
                {(exampleId ?? "custom") === "custom" && (
                  <option value="custom" disabled>
                    Your own code
                  </option>
                )}
              </select>
            </label>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onResetToSample && (
            <button
              type="button"
              onClick={onResetToSample}
              className="btn btn-ghost btn-sm"
              title="Restore the original example code"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-ghost btn-sm"
            title="Copy code to clipboard"
            aria-live="polite"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                <span className="text-success">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor body: gutter + highlighted layer + transparent textarea */}
      <div className="relative flex-1 min-h-0 flex bg-surface">
        <div
          ref={gutterRef}
          data-testid="editor-gutter"
          aria-hidden="true"
          className="w-12 flex-shrink-0 overflow-hidden select-none bg-surface-subtle border-r border-border editor-text text-right text-text-secondary"
          style={{ paddingTop: PAD_Y }}
        >
          {lines.map((_, idx) => {
            const n = idx + 1;
            const isError = errorLine === n;
            const isActive = activeLine === n;
            return (
              <div
                key={n}
                style={{ height: LINE_HEIGHT }}
                className={`pr-3 pl-1 text-[12px] ${
                  isError
                    ? "bg-error-50 text-error font-semibold"
                    : isActive
                    ? "bg-brand-50 text-brand-600 font-semibold"
                    : ""
                }`}
              >
                {n}
              </div>
            );
          })}
          <div style={{ height: 24 }} />
        </div>

        <div className="relative flex-1 min-w-0">
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none"
          >
            <div className="min-w-full w-max" style={{ paddingTop: PAD_Y }}>
              {lines.map((tokens, idx) => {
                const n = idx + 1;
                const isError = errorLine === n;
                const isActive = activeLine === n;
                return (
                  <div
                    key={n}
                    data-testid={isActive ? "editor-active-line" : undefined}
                    style={{
                      height: LINE_HEIGHT,
                      boxShadow: isError
                        ? "inset 3px 0 0 #D34A4A"
                        : isActive
                        ? "inset 3px 0 0 #4F46E5"
                        : undefined,
                    }}
                    className={`editor-text px-4 whitespace-pre transition-colors duration-150 ${
                      isError ? "bg-error-50" : isActive ? "bg-brand-50" : ""
                    }`}
                  >
                    {tokens.length === 0
                      ? "\u00A0"
                      : tokens.map((t, i) => (
                          <span key={i} className={t.kind === "plain" ? undefined : `tok-${t.kind}`}>
                            {t.text}
                          </span>
                        ))}
                  </div>
                );
              })}
              <div style={{ height: 40 }} />
            </div>
          </div>

          <textarea
            ref={textareaRef}
            data-testid="code-editor-textarea"
            aria-label="Python code editor"
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            className="editor-input editor-text absolute inset-0 w-full h-full px-4 bg-transparent text-transparent caret-[#20252D] resize-none outline-none border-none whitespace-pre overflow-auto focus-visible:outline-none"
            style={{ paddingTop: PAD_Y, paddingBottom: PAD_Y }}
            placeholder="# Write or paste Python code here…"
          />
        </div>
      </div>

      {/* Footer: size on the left, replay / error context on the right */}
      <div className="flex items-center justify-between gap-3 px-3.5 h-8 border-t border-border text-xs text-text-secondary">
        <span className="font-mono">{lineCount} {lineCount === 1 ? "line" : "lines"}</span>
        <div className="flex items-center gap-3 min-w-0">
          {activeLine && (
            <span className="flex items-center gap-1.5 text-brand-700 font-medium">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-brand-600" />
              Replaying line {activeLine}
            </span>
          )}
          {errorLine && (
            <span className="flex items-center gap-1.5 text-error font-medium truncate">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">
                {errorSummary ? `${errorSummary} · ` : ""}line {errorLine}
              </span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
