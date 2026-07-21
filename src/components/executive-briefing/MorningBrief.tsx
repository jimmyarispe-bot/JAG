"use client";

import { AlertCard } from "@/components/executive-briefing/AlertCard";
import { BriefCard } from "@/components/executive-briefing/BriefCard";
import { DecisionCard } from "@/components/executive-briefing/DecisionCard";
import { ExecutiveSummary } from "@/components/executive-briefing/ExecutiveSummary";
import { OpportunityCard } from "@/components/executive-briefing/OpportunityCard";
import { RiskCard } from "@/components/executive-briefing/RiskCard";
import type { ExecutiveBriefing } from "@/lib/platform/intelligence/briefing";
import { cn } from "@/components/workspace-design-system/utils";

export interface MorningBriefProps {
  briefing: ExecutiveBriefing;
  className?: string;
}

export function MorningBrief({ briefing, className }: MorningBriefProps) {
  const { sections } = briefing;

  return (
    <div className={cn("space-y-6", className)}>
      <header className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">{briefing.role.replace("_", " ")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {sections.greeting}
        </h1>
        {sections.organizationHealth ? (
          <p className="mt-2 text-sm text-slate-600">
            Organization Health: {sections.organizationHealth.value}/100 (
            {sections.organizationHealth.label})
          </p>
        ) : null}
        <p className="mt-3 text-sm text-slate-700">{sections.overnight.summary}</p>
      </header>

      <ExecutiveSummary summary={sections.executiveSummary} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Focus</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.todaysFocus.map((card) => (
            <BriefCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Top Risks</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {sections.topRisks.map((card) => (
            <RiskCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Top Opportunities</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {sections.topOpportunities.map((card) => (
            <OpportunityCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Decisions Waiting</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {sections.decisionsWaiting.map((card) => (
            <DecisionCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Critical Alerts</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {sections.criticalAlerts.map((card) => (
            <AlertCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Recommended Actions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {sections.recommendedActions.map((card) => (
            <BriefCard key={card.id} card={card} />
          ))}
        </div>
      </section>
    </div>
  );
}
