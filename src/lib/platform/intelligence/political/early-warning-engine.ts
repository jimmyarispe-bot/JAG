import type { EarlyWarningEngineContract } from "@/lib/platform/intelligence/political/contracts";
import { priorityFromScore } from "@/lib/platform/intelligence/political/models";
import type { EarlyWarningSuite } from "@/lib/platform/intelligence/political/types";

export class EarlyWarningEngine implements EarlyWarningEngineContract {
  assess(input: Parameters<EarlyWarningEngineContract["assess"]>[0]): EarlyWarningSuite {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    const highProb = input.scenarios.scenarios.filter(s => s.probability >= 0.4);
    const alerts = [
      ...worsening.slice(0, 4).map(t => ({
        id: input.createId("pol-alert"),
        title: `Worsening trend: ${t.title}`,
        severity: priorityFromScore(100 - t.magnitude),
        source: t.area,
        score: t.magnitude,
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...highProb.slice(0, 4).map(s => ({
        id: input.createId("pol-alert"),
        title: `Elevated scenario: ${s.title}`,
        severity: s.severity,
        source: s.kind,
        score: s.probability * 100,
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = alerts.length ? 100 - alerts.reduce((s, a) => s + a.score, 0) / alerts.length : 72;
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: `Early warning suite: ${alerts.length} alerts from worsening trends and high-probability scenarios.`,
    };
  }
}
