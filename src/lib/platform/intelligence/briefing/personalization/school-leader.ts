import type { BriefingPersonalizer } from "@/lib/platform/intelligence/briefing/types";

export function createSchoolLeaderPersonalizer(): BriefingPersonalizer {
  return {
    id: "school_leader",
    name: "School Leader Briefing Profile",
    version: "0.1.0",
    personalize(briefing, preferences) {
      const campusDomains = new Set(
        (preferences.emphasizeDomains ?? []).map((d) => d.toLowerCase())
      );
      const boost = <T extends { domains: string[]; strategicAlignment: number }>(cards: T[]) =>
        [...cards].sort((a, b) => {
          const aHit = a.domains.some((d) => campusDomains.has(d.toLowerCase())) ? 1 : 0;
          const bHit = b.domains.some((d) => campusDomains.has(d.toLowerCase())) ? 1 : 0;
          if (bHit !== aHit) return bHit - aHit;
          return b.strategicAlignment - a.strategicAlignment;
        });

      return {
        ...briefing,
        role: "school_leader",
        greeting: `Good Morning, ${preferences.greetingName}`,
        sections: {
          ...briefing.sections,
          greeting: `Good Morning, ${preferences.greetingName}`,
          topRisks: boost(briefing.sections.topRisks),
          todaysFocus: boost(briefing.sections.todaysFocus),
        },
        metadata: {
          ...briefing.metadata,
          personalization: "school_leader",
        },
      };
    },
  };
}
