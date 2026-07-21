"use client";

import type { ConnectorLifecycleState } from "@/lib/platform/integrations/types";
import { cn } from "@/components/workspace-design-system/utils";

const STATUS_STYLES: Record<ConnectorLifecycleState, string> = {
  installing: "bg-slate-100 text-slate-700",
  authenticating: "bg-amber-50 text-amber-800",
  connected: "bg-sky-50 text-sky-800",
  syncing: "bg-indigo-50 text-indigo-800",
  healthy: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-900",
  error: "bg-rose-50 text-rose-800",
  disabled: "bg-slate-100 text-slate-500",
  disconnected: "bg-slate-50 text-slate-500",
};

export function ConnectorStatus({
  state,
  className,
}: {
  state: ConnectorLifecycleState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[state],
        className
      )}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}
