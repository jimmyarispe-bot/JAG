import type { BriefingCard, BriefingTimelineEntry } from "@/lib/platform/intelligence/briefing/types";

export function buildMonthlyTimeline(
  cards: BriefingCard[],
  createId: (prefix: string) => string,
  now: () => Date
): BriefingTimelineEntry {
  const top = cards.slice(0, 12);
  return {
    id: createId("tl-month"),
    window: "last_30_days",
    label: "Last 30 days",
    summary:
      top.length > 0
        ? `30-day arc: ${top.filter((c) => c.kind === "risk").length} risks and ${top.filter((c) => c.kind === "opportunity").length} opportunities remain in focus.`
        : "30-day arc: synthesis has not yet produced briefing cards.",
    cardIds: top.map((c) => c.id),
    generatedAt: now().toISOString(),
  };
}
