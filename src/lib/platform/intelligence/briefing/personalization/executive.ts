import type { BriefingPersonalizer } from "@/lib/platform/intelligence/briefing/types";

export function createExecutivePersonalizer(): BriefingPersonalizer {
  return {
    id: "executive",
    name: "Executive Briefing Profile",
    version: "0.1.0",
    personalize(briefing, preferences) {
      return {
        ...briefing,
        role: "executive",
        greeting: `Good Morning, ${preferences.greetingName}`,
        sections: {
          ...briefing.sections,
          greeting: `Good Morning, ${preferences.greetingName}`,
        },
        metadata: {
          ...briefing.metadata,
          personalization: "executive",
        },
      };
    },
  };
}
