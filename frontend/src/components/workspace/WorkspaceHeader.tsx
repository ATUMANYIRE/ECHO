"use client";

import React from "react";
import { HealthResponse } from "@/lib/types";
import { EchoLogo } from "@/components/EchoLogo";

interface WorkspaceHeaderProps {
  health: HealthResponse | null;
  isLoadingHealth: boolean;
  healthError: string | null;
  /** Centre slot (journey progress). */
  children?: React.ReactNode;
}

/** Compact product header: identity on the left, connection state on the right. */
export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  health,
  isLoadingHealth,
  healthError,
  children,
}) => {
  const isSandboxReady = !!(health?.sandbox_available && health?.execution_enabled);
  const isOnline = health?.status === "healthy" || health?.status === "degraded";

  let label = "Connecting…";
  let dot = "bg-text-secondary/50 animate-pulse";
  let title = "Checking the ECHO backend…";

  if (!isLoadingHealth) {
    if (!isOnline) {
      label = "Offline";
      dot = "bg-error";
      title = healthError
        ? `The ECHO backend is unreachable: ${healthError}`
        : "The ECHO backend is unreachable.";
    } else if (!isSandboxReady) {
      label = "Runner offline";
      dot = "bg-[#C98A1B]";
      title =
        "The backend is reachable, but the isolated Docker runner is not available. Code execution is paused.";
    } else {
      label = "Connected";
      dot = "bg-success";
      title = `Backend v${health?.version} is connected and the isolated runner is ready.`;
    }
  }

  return (
    <header className="h-14 flex-shrink-0 border-b border-border bg-surface px-4 lg:px-6 grid grid-cols-[auto_1fr_auto] items-center gap-4 sticky top-0 z-20">
      <EchoLogo showTagline={false} />
      <div className="flex justify-center min-w-0 overflow-hidden">{children}</div>

      <div
        data-testid="backend-status-indicator"
        role="status"
        aria-live="polite"
        title={title}
        className="flex items-center gap-2 text-[13px] text-text-secondary"
      >
        <span aria-hidden="true" className={`w-2 h-2 rounded-full ${dot}`} />
        <span>{label}</span>
      </div>
    </header>
  );
};
