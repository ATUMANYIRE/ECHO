"use client";

import React from "react";
import { Activity, ShieldCheck, Cpu } from "lucide-react";
import { HealthResponse } from "@/lib/types";

interface WorkspaceHeaderProps {
  health: HealthResponse | null;
  isLoadingHealth: boolean;
  healthError: string | null;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  health,
  isLoadingHealth,
  healthError,
}) => {
  return (
    <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm px-4 lg:px-6 py-2.5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white font-mono font-bold text-sm shadow-subtle">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 tracking-tight text-sm">
                ECHO
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/60">
                GLITCHATHON 2026
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                Milestone 1: Foundation
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden md:block">
              Don&apos;t just fix the mistake. Understand the moment it was made.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {/* Backend health status badge */}
        <div
          data-testid="backend-status-indicator"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors ${
            isLoadingHealth
              ? "bg-zinc-50 text-zinc-500 border-zinc-200"
              : health?.status === "healthy"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
          title={
            healthError
              ? `Backend unreachable: ${healthError}`
              : health
              ? `Backend v${health.version} (${health.environment}) — Sandbox: ${health.sandbox_available ? "Docker Ready" : "Host Only"}`
              : "Checking backend health..."
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLoadingHealth
                ? "bg-zinc-400 animate-pulse"
                : health?.status === "healthy"
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}
          />
          <Activity className="w-3 h-3 opacity-70" />
          <span>
            {isLoadingHealth
              ? "Probing API..."
              : health?.status === "healthy"
              ? `API Online (v${health.version})`
              : "API Degraded / Offline"}
          </span>
        </div>

        {/* Sandbox status indicator */}
        <div
          data-testid="sandbox-status-chip"
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 text-[11px]"
          title="Sandbox isolation active in Milestone 2. Code execution is currently restricted."
        >
          <ShieldCheck className="w-3 h-3 text-zinc-500" />
          <span>Sandbox: Guarded (M1)</span>
        </div>
      </div>
    </header>
  );
};
