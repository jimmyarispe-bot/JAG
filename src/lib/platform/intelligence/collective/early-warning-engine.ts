import type { EarlyWarningEngineContract } from "@/lib/platform/intelligence/collective/contracts";
import { clamp, priorityFromScore } from "@/lib/platform/intelligence/collective/models";
import type { EarlyWarningSuite } from "@/lib/platform/intelligence/collective/types";

export class EarlyWarningEngine implements EarlyWarningEngineContract {
  assess(input: Parameters<EarlyWarningEngineContract["assess"]>[0]): EarlyWarningSuite {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening").slice(0, 4);
    const hot = input.scenarios.scenarios.slice(0, 3);
    const alerts = [
      ...worsening.map(t => ({
        id: input.createId("col-alert"),
        title: `Trend alert: ${t.area}`,
        severity: priorityFromScore(100 - t.magnitude),
        source: "trends",
        score: clamp(100 - t.magnitude),
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...hot.map(s => ({
        id: input.createId("col-alert"),
        title: `Scenario alert: ${s.kind}`,
        severity: s.severity,
        source: "scenarios",
        score: clamp(100 - s.organizationalImpact),
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = clamp(alerts.length ? alerts.reduce((s, a) => s + a.score, 0) / alerts.length : input.baseline.longTermCollectiveValue);
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: `Collective intelligence early warning suite with ${alerts.length} alerts.`,
    };
  }
}
