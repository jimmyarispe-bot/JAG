/**
 * Emerging / weak signal detection (Sprint 065).
 */

import { clamp01 } from "@/lib/platform/intelligence/executive-predictive/confidence/confidence";
import { subjectSignals } from "@/lib/platform/intelligence/executive-predictive/forecasting/shared";
import type {
  BriefingResultLight,
  EmergingSignal,
  ForecastSubject,
  HistoricalSignal,
  PredictionEvidence,
} from "@/lib/platform/intelligence/executive-predictive/types";
import { FORECAST_SUBJECTS } from "@/lib/platform/intelligence/executive-predictive/types";

export interface SignalEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

const WEAK_PATTERNS: Array<{
  subject: ForecastSubject;
  title: string;
  test: (signals: HistoricalSignal[]) => boolean;
  narrative: string;
  trend: EmergingSignal["trend"];
}> = [
  {
    subject: "retention",
    title: "Gradual rise in absenteeism / retention pressure",
    test: (s) => {
      if (s.length < 2) return false;
      const sorted = [...s].sort((a, b) => a.at.localeCompare(b.at));
      return sorted[sorted.length - 1].value < sorted[0].value * 0.98;
    },
    narrative:
      "Retention-linked signals are easing downward — weak absenteeism / disengagement pressure may be forming.",
    trend: "falling",
  },
  {
    subject: "enrollment",
    title: "Inquiry-to-enrollment conversion softening",
    test: (s) => {
      if (s.length < 2) return false;
      const sorted = [...s].sort((a, b) => a.at.localeCompare(b.at));
      const first = sorted[0].value;
      const last = sorted[sorted.length - 1].value;
      return first > 0 && last / first < 0.95 && last < first;
    },
    narrative:
      "Enrollment funnel metrics show a slow conversion decline before it becomes a headcount miss.",
    trend: "falling",
  },
  {
    subject: "operations",
    title: "Rising support / operational workload",
    test: (s) => {
      if (s.length < 2) return false;
      const sorted = [...s].sort((a, b) => a.at.localeCompare(b.at));
      return sorted[sorted.length - 1].value > sorted[0].value * 1.05;
    },
    narrative:
      "Operational workload is creeping upward — support volume may become a capacity issue.",
    trend: "rising",
  },
  {
    subject: "staffing",
    title: "Increasing staff workload pressure",
    test: (s) => {
      if (s.length < 2) return s.some((x) => x.direction === "down");
      const sorted = [...s].sort((a, b) => a.at.localeCompare(b.at));
      return sorted[sorted.length - 1].value < sorted[0].value;
    },
    narrative:
      "Staffing capacity signals are thinning relative to demand — workload pressure is emerging.",
    trend: "falling",
  },
];

export class SignalEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: SignalEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
  }

  detect(input: {
    signals: HistoricalSignal[];
    briefing?: BriefingResultLight;
  }): EmergingSignal[] {
    const out: EmergingSignal[] = [];
    const at = this.now().toISOString();

    for (const pattern of WEAK_PATTERNS) {
      const relevant = subjectSignals(pattern.subject, input.signals);
      if (!pattern.test(relevant)) continue;

      const evidence: PredictionEvidence[] = relevant.slice(-3).map((h, i) => ({
        id: `sig-ev-${pattern.subject}-${i}`,
        statement: h.narrative ?? `${h.subject}=${h.value} (${h.direction})`,
        source: "history",
        supporting: true,
        weight: 0.65,
        domain: h.domain,
      }));

      out.push({
        id: this.createId(`emerging-${pattern.subject}`),
        title: pattern.title,
        subject: pattern.subject,
        narrative: pattern.narrative,
        strength: clamp01(0.35 + relevant.length * 0.08),
        trend: pattern.trend,
        domains: [pattern.subject],
        confidence: clamp01(0.4 + Math.min(relevant.length, 5) * 0.08),
        firstDetectedAt: relevant[0]?.at ?? at,
        evidence,
      });
    }

    // Briefing overnight risks as weak signals when history is sparse
    const newRisks = input.briefing?.overnight?.newRisks ?? [];
    for (const risk of newRisks.slice(0, 2)) {
      out.push({
        id: this.createId("emerging-brief"),
        title: risk.slice(0, 80),
        subject: "operations",
        narrative: risk,
        strength: 0.42,
        trend: "rising",
        domains: ["briefing", "operations"],
        confidence: 0.48,
        firstDetectedAt: at,
        evidence: [
          {
            id: this.createId("ev-brief"),
            statement: risk,
            source: "current_signal",
            supporting: true,
            weight: 0.5,
          },
        ],
      });
    }

    // Ensure subjects with contradictory sparse data still surface something when briefing has risks
    if (out.length === 0 && (input.briefing?.briefing?.sections?.topRisks?.length ?? 0) > 0) {
      const top = input.briefing!.briefing!.sections!.topRisks![0];
      out.push({
        id: this.createId("emerging-top-risk"),
        title: top.title ?? "Emerging organizational risk",
        subject: (top.domains?.[0] as ForecastSubject) ?? "operations",
        narrative: top.summary ?? top.title ?? "Risk signal from current briefing",
        strength: clamp01((top.severity ?? 40) / 100),
        trend: "rising",
        domains: top.domains ?? FORECAST_SUBJECTS.slice(0, 1),
        confidence: 0.5,
        firstDetectedAt: at,
        evidence: [
          {
            id: this.createId("ev-top"),
            statement: top.summary ?? top.title ?? "Top risk",
            source: "current_signal",
            supporting: true,
          },
        ],
      });
    }

    return out;
  }
}
