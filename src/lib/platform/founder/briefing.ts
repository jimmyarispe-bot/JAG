import {
  aggregateOverallHealth,
  metricStatusToBand,
} from "@/lib/platform/founder/health";
import type {
  FounderAlert,
  FounderBriefingSection,
  FounderBriefingSectionId,
  FounderHealthBand,
  FounderMetric,
  FounderMetricKey,
  FounderMorningBrief,
  FounderNavScope,
} from "@/lib/platform/founder/types";
import type { ExecutiveIntelligenceResult } from "@/lib/platform/intelligence/executive-layer";

const SECTION_DEFS: ReadonlyArray<{
  id: FounderBriefingSectionId;
  title: string;
  metricKeys: FounderMetricKey[];
  domains: Array<FounderAlert["domain"]>;
}> = [
  {
    id: "platform_status",
    title: "Platform Status",
    metricKeys: ["system_health", "open_risks"],
    domains: ["platform", "operations", "technology"],
  },
  {
    id: "admissions",
    title: "Admissions",
    metricKeys: ["new_applications"],
    domains: ["admissions"],
  },
  {
    id: "enrollment",
    title: "Enrollment",
    metricKeys: ["active_students", "enrollment_trend"],
    domains: ["enrollment"],
  },
  {
    id: "attendance",
    title: "Attendance",
    metricKeys: ["attendance"],
    domains: ["operations"],
  },
  {
    id: "finance",
    title: "Finance",
    metricKeys: ["tuition_collected", "outstanding_balances"],
    domains: ["finance"],
  },
  {
    id: "staffing",
    title: "Staffing",
    metricKeys: ["active_staff"],
    domains: ["staffing"],
  },
  {
    id: "technology",
    title: "Technology",
    metricKeys: ["system_health"],
    domains: ["technology", "platform"],
  },
  {
    id: "security",
    title: "Security",
    metricKeys: ["open_risks"],
    domains: ["security"],
  },
  {
    id: "critical_issues",
    title: "Critical Issues",
    metricKeys: ["open_risks", "pending_approvals"],
    domains: ["operations", "security", "finance", "admissions", "platform"],
  },
  {
    id: "ai_summary",
    title: "AI Summary",
    metricKeys: [],
    domains: [],
  },
];

function metricByKey(
  metrics: FounderMetric[],
  key: FounderMetricKey
): FounderMetric | undefined {
  return metrics.find((m) => m.key === key);
}

function formatMetricLine(m: FounderMetric): string {
  if (m.value == null) return `${m.label}: unavailable`;
  const unit = m.unit && m.unit !== "%" && m.unit !== "score" ? ` ${m.unit}` : m.unit === "%" ? "%" : "";
  return `${m.label}: ${m.value}${unit} (${m.status})`;
}

/**
 * Deterministic executive summary from sections — not LLM-generated.
 */
export function buildDeterministicAiSummary(sections: FounderBriefingSection[]): string {
  const critical = sections.find((s) => s.id === "critical_issues");
  const platform = sections.find((s) => s.id === "platform_status");
  const issues = critical?.highlights.length
    ? critical.highlights.slice(0, 3).join(" ")
    : "No critical issues highlighted from current metrics.";
  const platformLine = platform?.summary ?? "Platform status unavailable.";
  return `Morning brief (rules-based): ${platformLine} ${issues}`;
}

function priorityToBand(
  priority: string | null | undefined
): FounderHealthBand | null {
  if (priority === "critical") return "critical";
  if (priority === "high") return "watch";
  if (priority === "medium") return "watch";
  if (priority === "low") return "healthy";
  return null;
}

/**
 * Overlay Sprint 064 intelligence sections onto a Morning Brief.
 * Replaces static section copy with key insight / metrics / actions when present.
 */
export function applyIntelligenceToMorningBrief(
  brief: FounderMorningBrief,
  intelligence: ExecutiveIntelligenceResult
): FounderMorningBrief {
  const byId = new Map(intelligence.brief.sections.map((s) => [s.id, s]));
  const sections = brief.sections.map((section) => {
    const intel = byId.get(section.id);
    if (!intel) return section;
    if (section.id === "ai_summary") {
      const summary = intelligence.brief.summary;
      return {
        ...section,
        summary,
        highlights: [summary],
        keyInsight: intel.keyInsight,
        supportingMetrics: intel.supportingMetrics,
        recommendedActions: intel.recommendedActions,
        status: priorityToBand(intel.priority) ?? section.status,
      };
    }
    if (!intel.keyInsight && !intel.recommendedActions.length) {
      return {
        ...section,
        keyInsight: intel.keyInsight,
        supportingMetrics: intel.supportingMetrics,
        recommendedActions: intel.recommendedActions,
      };
    }
    return {
      ...section,
      summary: intel.keyInsight ?? section.summary,
      highlights: [
        ...(intel.keyInsight ? [intel.keyInsight] : []),
        ...intel.supportingMetrics.map(
          (m) => `${m.label}: ${m.value ?? "n/a"}${m.unit === "%" ? "%" : m.unit ? ` ${m.unit}` : ""}`
        ),
        ...intel.recommendedActions,
      ].slice(0, 6),
      keyInsight: intel.keyInsight,
      supportingMetrics: intel.supportingMetrics,
      recommendedActions: intel.recommendedActions,
      status: priorityToBand(intel.priority) ?? section.status,
    };
  });

  const aiSummary =
    intelligence.brief.summary || buildDeterministicAiSummary(sections);

  return {
    ...brief,
    sections,
    aiSummary,
    intelligenceSummary: intelligence.brief.summary,
  };
}

export function buildFounderMorningBrief(input: {
  metrics: FounderMetric[];
  alerts: FounderAlert[];
  scope: FounderNavScope;
  generatedAt?: string;
  asOfDate?: string;
  /** Sprint 064 — when provided, sections are enriched from intelligence. */
  intelligence?: ExecutiveIntelligenceResult | null;
}): FounderMorningBrief {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const asOfDate = input.asOfDate ?? generatedAt.slice(0, 10);
  const overall = aggregateOverallHealth(input.metrics);

  const sections: FounderBriefingSection[] = SECTION_DEFS.map((def) => {
    if (def.id === "ai_summary") {
      return {
        id: def.id,
        title: def.title,
        summary: "",
        status: overall.band,
        highlights: [],
        metricKeys: [],
        alertIds: [],
      };
    }

    const sectionMetrics = def.metricKeys
      .map((k) => metricByKey(input.metrics, k))
      .filter((m): m is FounderMetric => Boolean(m));

    const relatedAlerts = input.alerts.filter((a) => {
      if (def.id === "critical_issues") {
        return a.category === "critical" || a.category === "high";
      }
      return def.domains.includes(a.domain);
    });

    const worstStatus = sectionMetrics.reduce<FounderMetric["status"]>(
      (acc, m) => {
        const rank = { critical: 4, at_risk: 3, watch: 2, healthy: 1, unknown: 0 };
        return rank[m.status] > rank[acc] ? m.status : acc;
      },
      "unknown"
    );

    const alertBand =
      relatedAlerts.some((a) => a.category === "critical")
        ? ("critical" as const)
        : relatedAlerts.some((a) => a.category === "high")
          ? ("watch" as const)
          : metricStatusToBand(worstStatus);

    const highlights = [
      ...sectionMetrics.map(formatMetricLine),
      ...relatedAlerts.slice(0, 3).map((a) => a.title),
    ].slice(0, 6);

    const summary =
      def.id === "critical_issues"
        ? relatedAlerts.length
          ? `${relatedAlerts.length} critical/high alert(s) require attention.`
          : "No critical or high alerts open."
        : sectionMetrics.length
          ? sectionMetrics.map((m) => `${m.label}=${m.value ?? "n/a"}`).join(" · ")
          : `${def.title} data not yet available from platform services.`;

    return {
      id: def.id,
      title: def.title,
      summary,
      status: alertBand,
      highlights,
      metricKeys: [...def.metricKeys],
      alertIds: relatedAlerts.map((a) => a.id),
    };
  });

  const aiSummary = buildDeterministicAiSummary(sections);
  const withAi = sections.map((s) =>
    s.id === "ai_summary"
      ? { ...s, summary: aiSummary, highlights: [aiSummary] }
      : s
  );

  const base: FounderMorningBrief = {
    generatedAt,
    asOfDate,
    scope: input.scope,
    sections: withAi,
    aiSummary,
  };

  if (input.intelligence) {
    return applyIntelligenceToMorningBrief(base, input.intelligence);
  }
  return base;
}
