import type { JagExecutiveOverviewModel } from "@/lib/jag-command-center";
import { JagCapabilityPacksSection } from "./JagCapabilityPacksSection";
import { JagDecisionExecutionSection } from "./JagDecisionExecutionSection";
import { JagDomainsSection } from "./JagDomainsSection";
import { JagExecutiveBriefSection } from "./JagExecutiveBriefSection";
import { JagForecastsSection } from "./JagForecastsSection";
import { JagOrgHealthSection } from "./JagOrgHealthSection";
import { JagPrioritiesSection } from "./JagPrioritiesSection";
import { JagRecentIntelligenceSection } from "./JagRecentIntelligenceSection";
import { JagRecommendedDecisionsSection } from "./JagRecommendedDecisionsSection";
import { JagRuntimeStatusSection } from "./JagRuntimeStatusSection";

export function JagExecutiveOverview({
  model,
}: {
  readonly model: JagExecutiveOverviewModel;
}) {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-medium tracking-tight text-[var(--jag-text)]">
          JAG Executive Command Center
        </h1>
        <p className="text-sm text-[var(--jag-muted)]">
          {model.organizationName
            ? `Overview for ${model.organizationName}`
            : "Executive overview — select an organization when available."}
          {" · "}
          Real services only. Empty means unbound — never fabricated.
          {" · "}
          Forecasts are advisory.
        </p>
      </header>

      <JagOrgHealthSection health={model.organizationHealth} />
      <JagForecastsSection forecasts={model.forecasts} />
      <JagDecisionExecutionSection metrics={model.decisionExecution} />
      <JagPrioritiesSection priorities={model.priorities} />
      <JagExecutiveBriefSection brief={model.executiveBrief} />

      <div className="grid gap-8 xl:grid-cols-2">
        <JagCapabilityPacksSection packs={model.capabilityPacks} />
        <JagDomainsSection domains={model.domains} />
      </div>

      <JagRuntimeStatusSection services={model.runtimeStatus} />
      <JagRecentIntelligenceSection items={model.recentIntelligence} />
      <JagRecommendedDecisionsSection groups={model.recommendedDecisions} />
    </div>
  );
}
