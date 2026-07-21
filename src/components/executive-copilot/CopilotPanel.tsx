"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { ConversationView } from "@/components/executive-copilot/ConversationView";
import { DomainTrace } from "@/components/executive-copilot/DomainTrace";
import { EvidenceDrawer } from "@/components/executive-copilot/EvidenceDrawer";
import { FollowUpSuggestions } from "@/components/executive-copilot/FollowUpSuggestions";
import type { CopilotResult } from "@/lib/platform/intelligence/executive-copilot";
import { cn } from "@/components/workspace-design-system/utils";

export interface CopilotPanelProps {
  result: CopilotResult;
  className?: string;
  onAsk?: (question: string) => void;
  onAction?: (actionId: string) => void;
}

export function CopilotPanel({
  result,
  className,
  onAsk,
  onAction,
}: CopilotPanelProps) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Executive Copilot · {result.intent}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            {result.explainability.executiveSummary}
          </h2>
        </div>
        <ActionChip
          size="sm"
          variant="secondary"
          onClick={() => onAction?.("open_evidence")}
        >
          Evidence
        </ActionChip>
      </div>

      <ConversationView messages={result.messages} />

      <EvidenceDrawer explainability={result.explainability} />
      <DomainTrace trace={result.explainability.domainTrace} />

      {result.executionPlanRefs && result.executionPlanRefs.length > 0 ? (
        <p className="text-xs text-slate-600">
          {result.executionPlanRefs.length} Autonomous plan(s) referenced — human authorization
          required; auto-execute disabled.
        </p>
      ) : null}

      <FollowUpSuggestions
        followUps={result.followUps}
        onSelect={(f) => onAsk?.(f.prompt)}
      />
    </section>
  );
}
