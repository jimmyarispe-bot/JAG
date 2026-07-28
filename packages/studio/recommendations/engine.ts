/**
 * Recommendation Engine — evidence-based actions from catalog + dependency issues.
 */

import { createCatalogService } from "../catalog/indexer";
import { analyzeDependencies } from "../dependencies/analyzer";
import type { DependencyIssueSeverity } from "../dependencies/analyzer";
import { createPerEngine } from "../per/engine";

export type RecommendationSeverity = DependencyIssueSeverity;

export type StudioRecommendation = {
  readonly id: string;
  readonly severity: RecommendationSeverity;
  readonly title: string;
  readonly detail: string;
  readonly evidence: readonly string[];
  readonly relatedNodeIds: readonly string[];
  readonly score: number;
};

export type RecommendationReport = {
  readonly root: string;
  readonly generatedAt: string;
  readonly recommendations: readonly StudioRecommendation[];
  readonly countsBySeverity: Readonly<Record<RecommendationSeverity, number>>;
};

function scoreSeverity(s: RecommendationSeverity): number {
  return { Info: 10, Warning: 40, Error: 70, Critical: 95 }[s];
}

export function generateRecommendations(input?: {
  root?: string;
  force?: boolean;
}): RecommendationReport {
  const root = input?.root ?? process.cwd();
  const catalog = createCatalogService().index({ root, force: input?.force });
  const deps = analyzeDependencies({ root, force: false });
  const pers = createPerEngine().list();
  const recs: StudioRecommendation[] = [];

  // From dependency issues (measurable)
  for (const issue of deps.issues) {
    recs.push({
      id: `rec:${issue.id}`,
      severity: issue.severity,
      title: issue.title,
      detail: issue.detail,
      evidence: issue.evidence,
      relatedNodeIds: issue.nodeIds,
      score: scoreSeverity(issue.severity),
    });
  }

  // Multi-pack PERs → Foundation review
  for (const per of pers.filter((p) => p.promoteToFoundation)) {
    recs.push({
      id: `rec:per.promote:${per.id}`,
      severity: "Warning",
      title: `${per.id} appears in multiple products and should be reviewed for Foundation`,
      detail: per.recommendation,
      evidence: Object.freeze([
        ...per.packsMentioning,
        per.description,
      ]),
      relatedNodeIds: Object.freeze([`per:${per.id}`]),
      score: 55,
    });
  }

  // Similar notification logic across packs (evidence: multiple notification services)
  const notifServices = catalog.entries.filter(
    (e) =>
      e.kind === "service" &&
      /notif/i.test(e.name) &&
      e.ownerPackage != null
  );
  const notifPacks = [
    ...new Set(notifServices.map((s) => s.ownerPackage!).filter(Boolean)),
  ];
  if (notifPacks.length >= 2) {
    recs.push({
      id: "rec:notif.dedupe",
      severity: "Info",
      title: `${notifPacks.length} packs implement notification-related services`,
      detail:
        "Consider consolidating shared notification patterns via Foundation (document as PER).",
      evidence: Object.freeze(notifServices.map((s) => s.path)),
      relatedNodeIds: Object.freeze(notifServices.map((s) => s.id)),
      score: 25,
    });
  }

  // Payroll / workforce without integration-style tests
  for (const svc of catalog.entries.filter(
    (e) =>
      e.kind === "service" &&
      /payroll|timekeeping/i.test(e.name)
  )) {
    const hasIntegration = svc.tests.some((t) =>
      /integration|e2e|hardening|validation/i.test(t)
    );
    if (!hasIntegration) {
      recs.push({
        id: `rec:payroll.test:${svc.id}`,
        severity: "Warning",
        title: `${svc.name} has no integration test link`,
        detail: `Service at ${svc.path} is not linked to integration/validation tests in the catalog.`,
        evidence: Object.freeze([svc.path, ...svc.tests]),
        relatedNodeIds: Object.freeze([svc.id]),
        score: 45,
      });
    }
  }

  // Deduplicate by id
  const map = new Map<string, StudioRecommendation>();
  for (const r of recs) map.set(r.id, r);
  const recommendations = [...map.values()].sort((a, b) => b.score - a.score);

  const countsBySeverity: Record<RecommendationSeverity, number> = {
    Info: 0,
    Warning: 0,
    Error: 0,
    Critical: 0,
  };
  for (const r of recommendations) countsBySeverity[r.severity] += 1;

  return {
    root,
    generatedAt: new Date().toISOString(),
    recommendations: Object.freeze(recommendations),
    countsBySeverity: Object.freeze(countsBySeverity),
  };
}

export function createRecommendationEngine() {
  return {
    generate: generateRecommendations,
  };
}
