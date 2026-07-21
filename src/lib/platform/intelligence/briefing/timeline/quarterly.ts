import type { BriefingCard, BriefingTimelineEntry } from "@/lib/platform/intelligence/briefing/types";

export function buildQuarterlyTimeline(
  cards: BriefingCard[],
  createId: (prefix: string) => string,
  now: () => Date
): BriefingTimelineEntry {
  const top = cards.slice(0, 16);
  return {
    id: createId("tl-quarter"),
    window: "quarter",
    label: "Quarter",
    summary:
      top.length > 0
        ? `Quarterly briefing spine: ${top.length} ranked items spanning decisions, risks, and opportunities.`
        : "Quarterly briefing spine: awaiting synthesis inputs.",
    cardIds: top.map((c) => c.id),
    generatedAt: now().toISOString(),
  };
}
