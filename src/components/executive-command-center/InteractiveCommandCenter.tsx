"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { CommandCenterWorkspace } from "@/components/executive-command-center/CommandCenterWorkspace";
import type {
  CommandCenterResult,
  CommandCenterRole,
  DrillDownAction,
  WidgetCard,
  WorkspaceWidget,
} from "@/lib/platform/intelligence/executive-command-center";

export interface InteractiveCommandCenterProps {
  result: CommandCenterResult;
  className?: string;
}

export function InteractiveCommandCenter({
  result,
  className,
}: InteractiveCommandCenterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const onRoleChange = useCallback(
    (role: CommandCenterRole) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("view", "command-center");
      next.set("role", role);
      startTransition(() => {
        router.replace(`/dashboard/executive?${next.toString()}`);
      });
    },
    [router, searchParams]
  );

  const onRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const onAction = useCallback(
    (action: DrillDownAction, card: WidgetCard, widget: WorkspaceWidget) => {
      const params = new URLSearchParams({
        view: "command-center",
        action,
        card: card.id,
        widget: widget.id,
        domain: widget.sourceDomain,
      });
      startTransition(() => {
        router.push(`/dashboard/executive?${params.toString()}`);
      });
    },
    [router]
  );

  return (
    <div className={pending ? "opacity-80 transition-opacity" : undefined}>
      <CommandCenterWorkspace
        result={result}
        className={className}
        onRoleChange={onRoleChange}
        onRefresh={onRefresh}
        onAction={onAction}
      />
    </div>
  );
}
