import type { ReactNode } from "react";
import { PROFILE_CONTEXT_PANEL_SECTIONS } from "@/lib/platform/profile/workspace/types";

interface ProfileContextPanelProps {
  title?: string;
  context?: {
    widgets?: ReactNode;
    quickActions?: ReactNode;
    aiRecommendations?: ReactNode;
    notifications?: ReactNode;
    tasks?: ReactNode;
    approvals?: ReactNode;
  };
}

function ContextBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ProfileContextPanel({ title = "Context", context }: ProfileContextPanelProps) {
  if (!context) return null;

  const contentMap: Record<string, ReactNode | undefined> = {
    quick_actions: context.quickActions,
    widgets: context.widgets,
    ai_recommendations: context.aiRecommendations,
    notifications: context.notifications,
    tasks: context.tasks,
    approvals: context.approvals,
  };

  const blocks = PROFILE_CONTEXT_PANEL_SECTIONS.filter(
    (s) => contentMap[s.key]
  );

  if (!blocks.length) return null;

  return (
    <aside
      className="w-full shrink-0 space-y-4 lg:w-80 xl:w-96"
      aria-label={title}
    >
      <p className="hidden text-xs font-semibold uppercase tracking-wide text-slate-400 lg:block">
        {title}
      </p>
      {blocks.map((block) => (
        <ContextBlock key={block.key} label={block.label}>
          {contentMap[block.key]}
        </ContextBlock>
      ))}
    </aside>
  );
}
