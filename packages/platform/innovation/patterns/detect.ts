/**
 * Pattern detection across collected innovation signals.
 */

import { randomUUID } from "node:crypto";
import { listSignals, replacePatterns } from "../store";
import type { InnovationPattern, PatternKind } from "../types";

function kindForTheme(theme: string, strength: number): PatternKind {
  const t = theme.toLowerCase();
  if (
    t.includes("recurring") ||
    (t.includes("evolution") && strength >= 60)
  ) {
    return "frequently_requested";
  }
  if (t.includes("bottleneck") || t.includes("workflow") || t.includes("payroll") || t.includes("attendance")) {
    return "workflow_bottleneck";
  }
  if (t.includes("training") || t.includes("academy") || t.includes("drop")) {
    return "training_gap";
  }
  if (t.includes("usage") || t.includes("abandon")) {
    return "feature_abandonment";
  }
  if (t.includes("perf") || t.includes("error") || t.includes("p95")) {
    return "performance_degradation";
  }
  if (t.includes("ops") || t.includes("risk") || t.includes("coach.open")) {
    return "operational_inefficiency";
  }
  return "emerging_opportunity";
}

export function detectInnovationPatterns(input?: {
  organizationId?: string;
}): readonly InnovationPattern[] {
  const signals = listSignals({
    organizationId: input?.organizationId,
    limit: 200,
  });
  const byTheme = new Map<string, typeof signals>();
  for (const s of signals) {
    const key = s.theme.replace(/^help\.recurring\./, "help.");
    const arr = byTheme.get(key) ?? [];
    byTheme.set(key, Object.freeze([...arr, s]) as typeof signals);
  }

  const patterns: InnovationPattern[] = [];
  for (const [theme, group] of byTheme) {
    const strength = Math.min(
      100,
      Math.round(
        group.reduce((a, s) => a + s.strength, 0) / Math.max(1, group.length) +
          Math.min(30, group.length * 8)
      )
    );
    if (strength < 35 && group.length < 2) continue;
    const kind = kindForTheme(theme, strength);
    const title =
      kind === "frequently_requested"
        ? `Frequently requested: ${theme}`
        : kind === "workflow_bottleneck"
          ? `Workflow bottleneck: ${theme}`
          : kind === "training_gap"
            ? `Training gap: ${theme}`
            : kind === "feature_abandonment"
              ? `Feature abandonment: ${theme}`
              : kind === "performance_degradation"
                ? `Performance degradation: ${theme}`
                : kind === "operational_inefficiency"
                  ? `Operational inefficiency: ${theme}`
                  : `Emerging opportunity: ${theme}`;

    patterns.push({
      id: `pat:${randomUUID()}`,
      kind,
      title,
      summary: group
        .slice(0, 3)
        .map((s) => s.evidence)
        .join(" · "),
      theme,
      signalIds: Object.freeze(group.map((s) => s.id)),
      strength,
      detectedAt: new Date().toISOString(),
    });
  }

  patterns.sort((a, b) => b.strength - a.strength);
  const top = patterns.slice(0, 24);
  replacePatterns(top);
  return Object.freeze(top);
}
