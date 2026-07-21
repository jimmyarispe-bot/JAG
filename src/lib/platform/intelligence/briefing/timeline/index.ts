import type {
  BriefingCard,
  BriefingTimelineEntry,
  OvernightIntelligence,
} from "@/lib/platform/intelligence/briefing/types";
import { buildWeeklyTimeline } from "@/lib/platform/intelligence/briefing/timeline/weekly";
import { buildMonthlyTimeline } from "@/lib/platform/intelligence/briefing/timeline/monthly";
import { buildQuarterlyTimeline } from "@/lib/platform/intelligence/briefing/timeline/quarterly";

export { buildOvernightIntelligence } from "@/lib/platform/intelligence/briefing/timeline/overnight";
export { buildWeeklyTimeline } from "@/lib/platform/intelligence/briefing/timeline/weekly";
export { buildMonthlyTimeline } from "@/lib/platform/intelligence/briefing/timeline/monthly";
export { buildQuarterlyTimeline } from "@/lib/platform/intelligence/briefing/timeline/quarterly";

export function buildExecutiveTimeline(
  cards: BriefingCard[],
  overnight: OvernightIntelligence,
  createId: (prefix: string) => string,
  now: () => Date
): BriefingTimelineEntry[] {
  const stamp = now().toISOString();
  const todayIds = cards.slice(0, 6).map((c) => c.id);

  return [
    {
      id: createId("tl-today"),
      window: "today",
      label: "Today",
      summary: overnight.summary,
      cardIds: todayIds,
      generatedAt: stamp,
    },
    {
      id: createId("tl-yesterday"),
      window: "yesterday",
      label: "Yesterday",
      summary:
        overnight.newRisks.length || overnight.newOpportunities.length
          ? `Carry-forward: ${overnight.newRisks.length} risk(s), ${overnight.newOpportunities.length} opportunity(ies) from overnight synthesis.`
          : "No material overnight deltas to carry forward.",
      cardIds: todayIds.slice(0, 3),
      generatedAt: stamp,
    },
    buildWeeklyTimeline(cards, createId, now),
    buildMonthlyTimeline(cards, createId, now),
    buildQuarterlyTimeline(cards, createId, now),
    {
      id: createId("tl-year"),
      window: "year",
      label: "Year",
      summary:
        cards.length > 0
          ? `Year-to-date briefing memory anchored on ${cards.length} current prioritized cards from synthesis.`
          : "Year-to-date briefing memory empty — no synthesis cards yet.",
      cardIds: cards.slice(0, 20).map((c) => c.id),
      generatedAt: stamp,
    },
  ];
}
