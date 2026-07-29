import { decisionGroupLabel } from "@/lib/jag-command-center/decision-center/catalog";
import {
  JAG_DECISION_GROUPS,
  type JagDecisionCenterModel,
} from "@/lib/jag-command-center/decision-center/types";
import { JagEmptyState } from "../JagEmptyState";
import { JagSection } from "../JagSection";
import { JagDecisionCardView } from "./JagDecisionCard";
import { JagDecisionFilters } from "./JagDecisionFilters";

export function JagDecisionCenterView({
  model,
}: {
  readonly model: JagDecisionCenterModel;
}) {
  return (
    <div className="space-y-6">
      <JagSection
        title="Decision Center"
        description="Every contributor action proposal in one executive queue. Nothing is invented — empty means no proposals are bound yet."
      >
        <div className="mb-4 flex flex-wrap gap-3 text-xs text-[var(--jag-muted)]">
          <span className="font-[family-name:var(--font-jag-mono)]">
            {model.counts.total} total
          </span>
          <span className="font-[family-name:var(--font-jag-mono)]">
            {model.decisions.length} shown
          </span>
          <span>
            Open {model.metrics.openDecisions} · Assigned{" "}
            {model.metrics.assigned} · Overdue {model.metrics.overdue} · Done
            this week {model.metrics.completedThisWeek}
          </span>
        </div>

        <JagDecisionFilters model={model} />
      </JagSection>

      {model.counts.total === 0 ? (
        <JagEmptyState
          title="No decisions in the queue"
          description="No action proposals are bound yet. Run Education intelligence contributors, then record the execution snapshot with recordEducationExecutionSnapshot. Each suggested action becomes a decision card here."
        />
      ) : model.decisions.length === 0 ? (
        <JagEmptyState
          title="No matching decisions"
          description="No decisions match the current filters. Clear filters or broaden search."
        />
      ) : (
        <div className="space-y-8">
          {JAG_DECISION_GROUPS.map((group) => {
            const items = model.grouped[group];
            if (items.length === 0) return null;
            return (
              <section key={group} className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-medium text-[var(--jag-text)]">
                    {decisionGroupLabel(group)}
                  </h2>
                  <span className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted)]">
                    {items.length}
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((decision) => (
                    <JagDecisionCardView
                      key={decision.id}
                      decision={decision}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
