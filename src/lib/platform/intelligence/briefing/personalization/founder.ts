import type { BriefingPersonalizer, ExecutiveBriefing } from "@/lib/platform/intelligence/briefing/types";

export function createFounderPersonalizer(): BriefingPersonalizer {
  return {
    id: "founder",
    name: "Founder Briefing Profile",
    version: "0.1.0",
    personalize(briefing, preferences) {
      return {
        ...briefing,
        role: "founder",
        greeting: `Good Morning, ${preferences.greetingName}`,
        sections: {
          ...briefing.sections,
          greeting: `Good Morning, ${preferences.greetingName}`,
          todaysFocus: prioritizeStrategic(briefing.sections.todaysFocus),
        },
        metadata: {
          ...briefing.metadata,
          personalization: "founder",
          emphasize: preferences.emphasizeDomains,
        },
      };
    },
  };
}

function prioritizeStrategic(cards: ExecutiveBriefing["sections"]["todaysFocus"]) {
  return [...cards].sort((a, b) => b.strategicAlignment - a.strategicAlignment);
}
