import type {
  IntelligenceBriefSection,
  IntelligenceBriefSectionId,
  IntelligenceDomain,
  IntelligencePriorityLevel,
  IntelligenceRecommendation,
  PrioritizedInsight,
} from "@/lib/platform/intelligence/executive-layer/types";

const SECTION_DEFS: ReadonlyArray<{
  id: IntelligenceBriefSectionId;
  title: string;
  domains: IntelligenceDomain[];
}> = [
  { id: "platform_status", title: "Platform Status", domains: ["platform"] },
  { id: "admissions", title: "Admissions", domains: ["admissions"] },
  { id: "enrollment", title: "Enrollment", domains: ["students"] },
  { id: "attendance", title: "Attendance", domains: ["students"] },
  { id: "finance", title: "Finance", domains: ["finance"] },
  { id: "staffing", title: "Staffing", domains: ["staff"] },
  { id: "technology", title: "Technology", domains: ["technology"] },
  { id: "security", title: "Security", domains: ["technology", "platform"] },
  {
    id: "critical_issues",
    title: "Critical Issues",
    domains: ["admissions", "students", "finance", "staff", "technology", "platform"],
  },
  { id: "ai_summary", title: "AI Summary", domains: [] },
];

const PRIORITY_RANK: Record<IntelligencePriorityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function bestPriority(
  items: PrioritizedInsight[]
): IntelligencePriorityLevel | null {
  if (!items.length) return null;
  return items.reduce<IntelligencePriorityLevel>(
    (acc, i) =>
      PRIORITY_RANK[i.priority] > PRIORITY_RANK[acc] ? i.priority : acc,
    "low"
  );
}

function filterInsights(
  sectionId: IntelligenceBriefSectionId,
  domains: IntelligenceDomain[],
  priorities: PrioritizedInsight[]
): PrioritizedInsight[] {
  if (sectionId === "critical_issues") {
    return priorities.filter(
      (p) => p.priority === "critical" || p.priority === "high"
    );
  }
  if (sectionId === "attendance") {
    return priorities.filter((p) =>
      p.supportingMetrics.some((m) => m.key === "students.attendance_rate")
    );
  }
  if (sectionId === "enrollment") {
    return priorities.filter((p) =>
      p.supportingMetrics.some((m) => m.key === "students.enrollment_change")
    );
  }
  if (sectionId === "security") {
    return priorities.filter((p) =>
      p.supportingMetrics.some(
        (m) =>
          m.key === "technology.auth_failures" ||
          m.key === "platform.migration_pending"
      )
    );
  }
  return priorities.filter((p) => domains.includes(p.domain));
}

/**
 * Build executive brief sections from prioritized insights + recommendations.
 * Each section: key insight · supporting metrics · recommended actions.
 */
export function buildIntelligenceBrief(input: {
  priorities: PrioritizedInsight[];
  recommendations: IntelligenceRecommendation[];
}): { sections: IntelligenceBriefSection[]; summary: string } {
  const sections: IntelligenceBriefSection[] = SECTION_DEFS.map((def) => {
    if (def.id === "ai_summary") {
      return {
        id: def.id,
        title: def.title,
        keyInsight: null,
        supportingMetrics: [],
        recommendedActions: [],
        insightIds: [],
        recommendationIds: [],
        priority: null,
      };
    }

    const insights = filterInsights(def.id, def.domains, input.priorities);
    const insightIds = new Set(insights.map((i) => i.id));
    const recs = input.recommendations.filter((r) =>
      r.insightIds.some((id) => insightIds.has(id))
    );

    const top = insights[0] ?? null;
    const metrics = top?.supportingMetrics ?? [];

    return {
      id: def.id,
      title: def.title,
      keyInsight: top?.statement ?? null,
      supportingMetrics: metrics,
      recommendedActions: recs.map((r) => r.action).slice(0, 3),
      insightIds: insights.map((i) => i.id),
      recommendationIds: recs.map((r) => r.id),
      priority: bestPriority(insights),
    };
  });

  const critical = sections.find((s) => s.id === "critical_issues");
  const topActions = input.recommendations
    .filter((r) => r.priority === "critical" || r.priority === "high")
    .slice(0, 3)
    .map((r) => r.action);

  const summaryParts = [
    critical?.keyInsight ?? "No critical or high insights from current signals.",
    topActions.length ? `Next: ${topActions.join(" ")}` : "No high-priority actions.",
  ];
  const summary = `Executive intelligence (rules-based): ${summaryParts.join(" ")}`;

  const withSummary = sections.map((s) =>
    s.id === "ai_summary"
      ? {
          ...s,
          keyInsight: summary,
          recommendedActions: topActions,
          priority: bestPriority(
            input.priorities.filter(
              (p) => p.priority === "critical" || p.priority === "high"
            )
          ),
        }
      : s
  );

  return { sections: withSummary, summary };
}
