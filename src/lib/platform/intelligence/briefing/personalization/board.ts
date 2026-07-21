import type { BriefingPersonalizer } from "@/lib/platform/intelligence/briefing/types";

export function createBoardPersonalizer(): BriefingPersonalizer {
  return {
    id: "board",
    name: "Board Briefing Profile",
    version: "0.1.0",
    personalize(briefing, preferences) {
      return {
        ...briefing,
        role: "board",
        greeting: `Board Briefing — ${preferences.greetingName}`,
        sections: {
          ...briefing.sections,
          greeting: `Board Briefing — ${preferences.greetingName}`,
          topRisks: briefing.sections.topRisks.slice(0, preferences.maxRisks ?? 4),
          topOpportunities: briefing.sections.topOpportunities.slice(
            0,
            preferences.maxOpportunities ?? 4
          ),
          decisionsWaiting: briefing.sections.decisionsWaiting.slice(
            0,
            preferences.maxDecisions ?? 3
          ),
          recommendedActions: briefing.sections.recommendedActions.slice(0, 4),
        },
        metadata: {
          ...briefing.metadata,
          personalization: "board",
          tone: "governance",
        },
      };
    },
  };
}
