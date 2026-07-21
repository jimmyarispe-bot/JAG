"use client";

import { CommandCenterWidget } from "@/components/executive-command-center/CommandCenterWidget";
import { RefreshBanner } from "@/components/executive-command-center/RefreshBanner";
import { RoleLayoutSwitcher } from "@/components/executive-command-center/RoleLayoutSwitcher";
import type {
  CommandCenterResult,
  CommandCenterRole,
  DrillDownAction,
  WidgetCard,
  WorkspaceWidget,
} from "@/lib/platform/intelligence/executive-command-center";
import { cn } from "@/components/workspace-design-system/utils";

export interface CommandCenterWorkspaceProps {
  result: CommandCenterResult;
  className?: string;
  onRoleChange?: (role: CommandCenterRole) => void;
  onRefresh?: () => void;
  onAction?: (
    action: DrillDownAction,
    card: WidgetCard,
    widget: WorkspaceWidget
  ) => void;
}

export function CommandCenterWorkspace({
  result,
  className,
  onRoleChange,
  onRefresh,
  onAction,
}: CommandCenterWorkspaceProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Executive Command Center
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">
              {result.layout.label} workspace
            </h1>
            <p className="mt-1 text-sm text-slate-600">{result.layout.description}</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Health {result.healthScore.label} ({result.healthScore.value})
          </div>
        </div>
        <RoleLayoutSwitcher role={result.role} onChange={onRoleChange} />
        <RefreshBanner result={result} onRefresh={onRefresh} />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {result.widgets.map((widget) => (
          <CommandCenterWidget
            key={widget.id}
            widget={widget}
            onAction={onAction}
            className={
              widget.kind === "briefing" || widget.kind === "decisions"
                ? "lg:col-span-2"
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
