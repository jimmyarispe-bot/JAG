import type { BriefingCard, BriefingTimelineEntry } from "@/lib/platform/intelligence/briefing/types";

export function buildWeeklyTimeline(
  cards: BriefingCard[],
  createId: (prefix: string) => string,
  now: () => Date
): BriefingTimelineEntry {
  const top = cards.slice(0, 8);
  return {
    id: createId("tl-week"),
    window: "last_7_days",
    label: "Last 7 days",
    summary:
      top.length > 0
        ? `Week in review: ${top.length} prioritized briefing items led by "${top[0].title}".`
        : "Week in review: no prioritized briefing items.",
    cardIds: top.map((c) => c.id),
    generatedAt: now().toISOString(),
  };
}
