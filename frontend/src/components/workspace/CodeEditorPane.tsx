"use client";

import React, { useState, useRef } from "react";
import { Code2, Copy, Check, RotateCcw, AlertCircle } from "lucide-react";

interface CodeEditorPaneProps {
  code: string;
  onChange: (newCode: string) => void;
  activeLine?: number | null;
  errorLine?: number | null;
  onResetToSample?: () => void;
}

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  code,
  onChange,
  activeLine = null,
  errorLine = null,
  onResetToSample,
}) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = code.split("\n");
  const lineCount = lines.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Support Tab key indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + "    " + code.substring(end);
      onChange(newCode);

      // Restore cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-zinc-200/90 shadow-card overflow-hidden">
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200/80 bg-zinc-50/70 text-xs">
        <div className="flex items-center gap-2 font-medium text-zinc-700">
          <Code2 className="w-4 h-4 text-brand-600" />
          <span>Python Source Code</span>
          <span className="text-[10px] text-zinc-400 font-mono">python3.11</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onResetToSample && (
            <button
              onClick={onResetToSample}
              className="px-2 py-1 text-[11px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors flex items-center gap-1"
              title="Reset code to default buggy example"
            >
              <RotateCcw className="w-3 h-3 text-zinc-400" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-2 py-1 text-[11px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors flex items-center gap-1"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body with Gutter */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-[13px] leading-6 bg-[#FCFCFA]">
        {/* Line Numbers Gutter */}
        <div
          data-testid="editor-gutter"
          className="select-none py-3 px-2 bg-zinc-50/60 border-r border-zinc-200/70 text-right text-zinc-400 font-mono text-[11px] leading-6 w-11 flex-shrink-0"
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isActive = activeLine === lineNum;
            const isError = errorLine === lineNum;

            return (
              <div
                key={lineNum}
                className={`transition-colors ${
                  isError
                    ? "text-rose-600 font-bold bg-rose-50 -mr-2 pr-2"
                    : isActive
                    ? "text-brand-600 font-bold bg-brand-50 -mr-2 pr-2"
                    : "text-zinc-400"
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea Code Input */}
        <div className="relative flex-1 h-full overflow-auto">
          {/* Active / Error line background indicator overlay */}
          {activeLine && activeLine <= lineCount && (
            <div
              className="absolute left-0 right-0 pointer-events-none transition-all duration-150"
              style={{
                top: `${(activeLine - 1) * 24 + 12}px`,
                height: "24px",
                backgroundColor: errorLine === activeLine ? "rgba(244, 63, 94, 0.08)" : "rgba(99, 102, 241, 0.08)",
                borderLeft: errorLine === activeLine ? "3px solid #E11D48" : "3px solid #6366F1",
              }}
            />
          )}

          <textarea
            ref={textareaRef}
            data-testid="code-editor-textarea"
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full h-full p-3 font-mono text-[13px] leading-6 text-zinc-800 bg-transparent resize-none outline-none border-none focus:ring-0 whitespace-pre overflow-auto"
            placeholder="# Enter student Python code here..."
          />
        </div>
      </div>

      {/* Pane Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-200/70 bg-zinc-50/50 text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-3">
          <span>{lineCount} lines</span>
          <span>{code.length} chars</span>
        </div>

        <div className="flex items-center gap-2">
          {activeLine && (
            <span className="flex items-center gap-1 text-brand-700 font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              Inspecting line {activeLine}
            </span>
          )}
          {errorLine && (
            <span className="flex items-center gap-1 text-rose-700 font-sans font-medium">
              <AlertCircle className="w-3 h-3 text-rose-500" />
              Exception on line {errorLine}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
