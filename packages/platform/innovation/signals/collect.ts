/**
 * Signal collection — read-only from Evolution, Help, Coach, Academy + host KPIs.
 * Does not mutate source systems or Evolution proposal behavior.
 */

import { randomUUID } from "node:crypto";
import {
  buildEvolutionAnalytics,
  listProposals,
  listRequests,
} from "@evolution";
import { listIncidents } from "../../mr-jag";
import { getAcademyAnalytics } from "../../mr-jag/academy";
import { buildCoachAnalytics, listEvents } from "../../mr-jag/coach";
import { replaceSignals, setLastScanAt } from "../store";
import type { HostInnovationSignals, InnovationSignal } from "../types";

function sig(partial: Omit<InnovationSignal, "id" | "observedAt"> & {
  id?: string;
}): InnovationSignal {
  return {
    id: partial.id ?? `sig:${randomUUID()}`,
    source: partial.source,
    theme: partial.theme,
    strength: Math.min(100, Math.max(0, partial.strength)),
    organizationId: partial.organizationId,
    evidence: partial.evidence,
    observedAt: new Date().toISOString(),
    metadata: partial.metadata,
  };
}

export function collectInnovationSignals(input: {
  organizationId: string;
  userId?: string;
  host?: HostInnovationSignals;
}): readonly InnovationSignal[] {
  const org = input.organizationId;
  const signals: InnovationSignal[] = [];

  // Evolution proposals / requests
  try {
    const proposals = listProposals({ organizationId: org, limit: 100 });
    const requests = listRequests({ organizationId: org, limit: 100 });
    const analytics = buildEvolutionAnalytics(org);
    const themeCount = new Map<string, number>();
    for (const p of proposals) {
      const theme = p.understanding.affectedWorkflow || p.classification;
      themeCount.set(theme, (themeCount.get(theme) ?? 0) + 1);
      signals.push(
        sig({
          source: "evolution_proposals",
          theme,
          strength: Math.min(100, 40 + p.priority.total * 0.4),
          organizationId: org,
          evidence: `${p.classification}: ${p.executiveSummary}`,
          metadata: {
            proposalId: p.proposalId,
            classification: p.classification,
          },
        })
      );
    }
    for (const [theme, count] of themeCount) {
      if (count < 2) continue;
      signals.push(
        sig({
          source: "evolution_proposals",
          theme,
          strength: Math.min(100, 50 + count * 15),
          organizationId: org,
          evidence: `${count} evolution proposals share theme "${theme}"`,
          metadata: { frequency: count },
        })
      );
    }
    signals.push(
      sig({
        source: "evolution_proposals",
        theme: "evolution.volume",
        strength: Math.min(100, requests.length * 8),
        organizationId: org,
        evidence: `${analytics.captureCount} captures, ${analytics.proposalCount} proposals`,
      })
    );
  } catch {
    // Evolution optional in partial installs
  }

  // Help incidents
  try {
    const incidents = listIncidents({ organizationId: org, limit: 50 });
    const byIntent = new Map<string, number>();
    for (const i of incidents) {
      const theme =
        i.diagnosis?.intent ??
        i.question.toLowerCase().split(/\s+/).slice(0, 4).join(" ");
      byIntent.set(theme, (byIntent.get(theme) ?? 0) + 1);
      signals.push(
        sig({
          source: "help_incidents",
          theme: `help.${theme}`,
          strength: i.status === "Open" || i.status === "Diagnosed" ? 70 : 45,
          organizationId: org,
          evidence: `Help incident: ${i.question.slice(0, 120)}`,
          metadata: { incidentId: i.id, status: i.status },
        })
      );
    }
    for (const [theme, count] of byIntent) {
      if (count < 2) continue;
      signals.push(
        sig({
          source: "help_incidents",
          theme: `help.recurring.${theme}`,
          strength: Math.min(100, 55 + count * 12),
          organizationId: org,
          evidence: `${count} recurring help signals for ${theme}`,
          metadata: { frequency: count },
        })
      );
    }
  } catch {
    // optional
  }

  // Coach analytics
  try {
    const userId = input.userId ?? "innovation-scan";
    const coach = buildCoachAnalytics(org, userId);
    signals.push(
      sig({
        source: "coach_analytics",
        theme: "coach.open_risks",
        strength: Math.min(100, coach.openRiskCount * 20),
        organizationId: org,
        evidence: `${coach.openRiskCount} open coach risks`,
        metadata: { openRiskCount: coach.openRiskCount },
      })
    );
    signals.push(
      sig({
        source: "coach_analytics",
        theme: "coach.goals",
        strength: Math.max(10, 100 - coach.goalsCompletionPercent),
        organizationId: org,
        evidence: `Coach goals completion ${coach.goalsCompletionPercent}%`,
        metadata: { goalsCompletionPercent: coach.goalsCompletionPercent },
      })
    );
    for (const [kind, count] of Object.entries(coach.eventsByKind)) {
      if (count < 1) continue;
      signals.push(
        sig({
          source: "coach_analytics",
          theme: `coach.event.${kind}`,
          strength: Math.min(100, Number(count) * 10),
          organizationId: org,
          evidence: `Coach observed ${count}× ${kind}`,
        })
      );
    }
    const events = listEvents({ organizationId: org, limit: 50 });
    if (events.length > 0) {
      signals.push(
        sig({
          source: "coach_analytics",
          theme: "coach.activity",
          strength: Math.min(100, events.length * 5),
          organizationId: org,
          evidence: `${events.length} recent coach events`,
        })
      );
    }
  } catch {
    // optional
  }

  // Academy analytics
  try {
    const academy = getAcademyAnalytics();
    const dropOff = academy.dropOffLessonIds.length;
    signals.push(
      sig({
        source: "academy_analytics",
        theme: "academy.training_gap",
        strength: Math.min(100, dropOff * 18 + 20),
        organizationId: org,
        evidence: `${dropOff} lessons with high drop-off; low-quiz: ${academy.leastUnderstoodWorkflows.length}`,
        metadata: { dropOff, leastUnderstood: academy.leastUnderstoodWorkflows.length },
      })
    );
    for (const lessonId of academy.mostViewedLessonIds.slice(0, 5)) {
      signals.push(
        sig({
          source: "academy_analytics",
          theme: `academy.view.${lessonId}`,
          strength: 40,
          organizationId: org,
          evidence: `Frequently viewed lesson ${lessonId}`,
        })
      );
    }
  } catch {
    // optional
  }

  // Host-provided signals
  const host = input.host;
  if (host?.usageAnalytics) {
    for (const u of host.usageAnalytics) {
      const abandon = u.abandonmentRate ?? 0;
      signals.push(
        sig({
          source: "usage_analytics",
          theme: `usage.${u.featureId}`,
          strength: Math.min(100, abandon * 100),
          organizationId: org,
          evidence: `Feature ${u.featureId} abandonment ${(abandon * 100).toFixed(0)}%`,
          metadata: {
            featureId: u.featureId,
            abandonmentRate: abandon,
            activeUsers: u.activeUsers ?? 0,
          },
        })
      );
    }
  }
  if (host?.performanceMetrics) {
    for (const p of host.performanceMetrics) {
      const slow = (p.p95Ms ?? 0) > 1500 ? 70 : 30;
      const err = Math.min(100, (p.errorRate ?? 0) * 200);
      signals.push(
        sig({
          source: "performance_metrics",
          theme: `perf.${p.route}`,
          strength: Math.max(slow, err),
          organizationId: org,
          evidence: `Route ${p.route} p95=${p.p95Ms ?? 0}ms err=${p.errorRate ?? 0}`,
        })
      );
    }
  }
  if (host?.repositoryMetrics) {
    for (const r of host.repositoryMetrics) {
      signals.push(
        sig({
          source: "repository_metrics",
          theme: `repo.${r.metric}`,
          strength: Math.min(100, r.value),
          organizationId: org,
          evidence: `Repository metric ${r.metric}=${r.value}`,
        })
      );
    }
  }
  if (host?.customerFeedback) {
    for (const c of host.customerFeedback) {
      signals.push(
        sig({
          source: "customer_feedback",
          theme: `feedback.${c.theme}`,
          strength: Math.min(100, (c.count ?? 1) * 15 + (c.sentiment ?? 50)),
          organizationId: org,
          evidence: `Customer feedback on ${c.theme} (n=${c.count ?? 1})`,
        })
      );
    }
  }
  if (host?.operationalKpis) {
    for (const k of host.operationalKpis) {
      const gap =
        k.target != null && k.target > 0
          ? Math.max(0, ((k.target - k.value) / k.target) * 100)
          : Math.min(100, k.value);
      signals.push(
        sig({
          source: "operational_kpis",
          theme: `ops.${k.name}`,
          strength: Math.min(100, gap),
          organizationId: org,
          evidence: `KPI ${k.name}=${k.value}` + (k.target != null ? ` target=${k.target}` : ""),
        })
      );
    }
  }
  if (host?.financialKpis) {
    for (const k of host.financialKpis) {
      signals.push(
        sig({
          source: "financial_kpis",
          theme: `finance.${k.name}`,
          strength: Math.min(100, Math.abs(k.value) / 1000),
          organizationId: org,
          evidence: `Financial KPI ${k.name}=${k.value}`,
          metadata: { value: k.value },
        })
      );
    }
  }

  // Baseline emerging opportunity if sparse signals
  if (signals.length < 3) {
    signals.push(
      sig({
        source: "operational_kpis",
        theme: "ops.onboarding_time",
        strength: 55,
        organizationId: org,
        evidence:
          "Baseline scan: onboarding time is a standing strategic opportunity across personas.",
      })
    );
  }

  replaceSignals(signals);
  setLastScanAt(new Date().toISOString());
  return Object.freeze(signals);
}
