import type { BriefingPersonalizer } from "@/lib/platform/intelligence/briefing/types";

export function createCeoPersonalizer(): BriefingPersonalizer {
  return {
    id: "ceo",
    name: "CEO Briefing Profile",
    version: "0.1.0",
    personalize(briefing, preferences) {
      return {
        ...briefing,
        role: "ceo",
        greeting: `Good Morning, ${preferences.greetingName}`,
        sections: {
          ...briefing.sections,
          greeting: `Good Morning, ${preferences.greetingName}`,
          decisionsWaiting: briefing.sections.decisionsWaiting.slice(
            0,
            preferences.maxDecisions ?? 5
          ),
        },
        metadata: {
          ...briefing.metadata,
          personalization: "ceo",
          focus: "decision_velocity",
        },
      };
    },
  };
}
