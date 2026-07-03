"use client";

import { FounderHeader } from "./FounderHeader";
import { FounderHero } from "./FounderHero";
import { ExecutiveFocusRibbon } from "./ExecutiveFocusRibbon";
import { AIBriefCard } from "./AIBriefCard";
import { OrganizationHealthCard } from "./OrganizationHealthCard";
import { TodaysPrioritiesCard } from "./TodaysPrioritiesCard";
import { FinancialIntelligenceCard } from "./FinancialIntelligenceCard";
import { OrganizationMapCard } from "./OrganizationMapCard";
import { StrategicProjectsCard } from "./StrategicProjectsCard";
import { GovernanceQueueCard } from "./GovernanceQueueCard";
import { AIRecommendationsCard } from "./AIRecommendationsCard";
import { AskJAGPanel } from "./AskJAGPanel";

export function FounderOperatingCenter() {
  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-950">
      <FounderHeader />

      <main className="mx-auto max-w-[1600px] px-6 lg:px-10">
        <FounderHero />
        <ExecutiveFocusRibbon />

        <div className="grid grid-cols-12 gap-6 pb-6">
          <AIBriefCard />
          <OrganizationHealthCard />
          <TodaysPrioritiesCard />
          <FinancialIntelligenceCard />
          <OrganizationMapCard />
          <StrategicProjectsCard />
          <GovernanceQueueCard />
          <AIRecommendationsCard />
        </div>

        <AskJAGPanel />
      </main>
    </div>
  );
}
