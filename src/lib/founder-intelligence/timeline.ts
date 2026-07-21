import type { EiEventSignal } from "./events";
import { domainForEvent } from "./events";
import type { FounderDecisionRecord, TimelineEntry } from "./types";

const CATEGORY_LABELS: Record<string, string> = {
  finance: "Financial",
  human_capital: "HR",
  admissions: "Admissions",
  students: "Student",
  families: "Family",
  workflows: "Workflow",
  calendar: "Calendar",
  documents: "Documents",
  communications: "Communications",
  enrollment: "Enrollment",
  technology: "Technology",
  organization: "Organization",
};

export function buildExecutiveTimeline(
  signals: EiEventSignal[],
  decisions: FounderDecisionRecord[],
  insightTitles: Array<{ id: string; title: string; at: string }> = []
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const s of signals.slice(0, 40)) {
    const domain = domainForEvent(s.eventType, s.moduleKey);
    entries.push({
      id: s.id,
      occurredAt: s.occurredAt,
      category: CATEGORY_LABELS[domain] ?? domain,
      title: s.title,
      summary: s.summary,
      eventType: s.eventType,
      moduleKey: s.moduleKey,
      source: "ei",
    });
  }

  for (const d of decisions.slice(0, 15)) {
    entries.push({
      id: `decision-${d.id}`,
      occurredAt: d.updatedAt || d.createdAt,
      category: "Founder Decisions",
      title: d.title,
      summary: `${d.status}${d.impact ? ` · ${d.impact}` : ""}`,
      eventType: `founder.decision.${d.status}`,
      moduleKey: "founder",
      source: "founder_decision",
    });
  }

  for (const i of insightTitles) {
    entries.push({
      id: `insight-${i.id}`,
      occurredAt: i.at,
      category: "AI Insights",
      title: i.title,
      summary: null,
      eventType: "founder.insight.created",
      moduleKey: "founder",
      source: "founder_insight",
    });
  }

  return entries.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}
