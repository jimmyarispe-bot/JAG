/**
 * Risk tracking & escalation heuristics.
 */

import type { InitiativeRisk } from "@/lib/platform/intelligence/initiative-intelligence/types";

export function buildRisk(
  createId: (prefix: string) => string,
  input: {
    title: string;
    summary: string;
    severity: number;
    likelihood: number;
    status?: InitiativeRisk["status"];
  }
): InitiativeRisk {
  const severity = Math.max(0, Math.min(100, input.severity));
  const likelihood = Math.max(0, Math.min(100, input.likelihood));
  return {
    id: createId("risk"),
    title: input.title,
    summary: input.summary,
    severity,
    likelihood,
    status: input.status ?? "open",
    escalationRequired: severity >= 70 && likelihood >= 50,
  };
}

export function openRiskScore(risks: InitiativeRisk[]): number {
  const open = risks.filter((r) => r.status !== "closed");
  if (open.length === 0) return 0;
  const avg =
    open.reduce((acc, r) => acc + (r.severity * r.likelihood) / 100, 0) / open.length;
  return Math.round(avg);
}
