/**
 * Studio Insight Provider — registered on Platform SDK registry.
 * Does not modify EI core; pack-local evaluation only (PER-EI-InsightProviders).
 */

import type {
  InsightDescriptor,
  InsightEvaluationContext,
  InsightProvider,
  InsightRule,
} from "@/lib/platform-sdk";
import { buildStudioDashboard, buildStudioInsightsSummary } from "./dashboard";

const rules: readonly InsightRule[] = Object.freeze([
  {
    id: "studio.architecture.health",
    domain: "studio",
    version: "1.0.0",
    evaluate(ctx) {
      const health = Number(ctx.signals.architectureHealth ?? 100);
      if (health >= 85) return null;
      return {
        severity: health < 60 ? "Warning" : "Info",
        title: "Architecture health below target",
        description: `Architecture health score is ${health}.`,
        suggestedNextStep: "Review Studio Architecture Workspace violations.",
      };
    },
  },
  {
    id: "studio.per.open",
    domain: "studio",
    version: "1.0.0",
    evaluate(ctx) {
      const open = Number(ctx.signals.openPers ?? 0);
      if (open <= 0) return null;
      return {
        severity: open >= 10 ? "Warning" : "Info",
        title: "Open Platform Enhancement Requests",
        description: `${open} PER(s) remain open or accepted.`,
        suggestedNextStep: "Triage PERs and promote multi-pack candidates.",
      };
    },
  },
  {
    id: "studio.release.readiness",
    domain: "studio",
    version: "1.0.0",
    evaluate(ctx) {
      const readiness = Number(ctx.signals.releaseReadiness ?? 100);
      if (readiness >= 70) return null;
      return {
        severity: "Info",
        title: "Release readiness lagging",
        description: `Aggregate release readiness is ${readiness}%.`,
        suggestedNextStep: "Advance product releases through RC → Certified.",
      };
    },
  },
  {
    id: "studio.docs.coverage",
    domain: "studio",
    version: "1.0.0",
    evaluate(ctx) {
      const coverage = Number(ctx.signals.documentationCoverage ?? 100);
      if (coverage >= 80) return null;
      return {
        severity: "Info",
        title: "Documentation coverage gap",
        description: `Documentation coverage is ${coverage}%.`,
        suggestedNextStep: "Complete missing Studio and pack docs.",
      };
    },
  },
  {
    id: "studio.dependency.risk",
    domain: "studio",
    version: "1.0.0",
    evaluate(ctx) {
      const risk = Number(ctx.signals.dependencyRisk ?? 0);
      if (risk < 35) return null;
      return {
        severity: risk >= 70 ? "Warning" : "Info",
        title: "Dependency risk elevated",
        description: `Dependency risk score is ${risk}.`,
        suggestedNextStep:
          "Review circular dependencies, unused APIs, and orphaned modules in Studio.",
      };
    },
  },
  {
    id: "studio.recommendations.severity",
    domain: "studio",
    version: "1.0.0",
    evaluate(ctx) {
      const critical = Number(ctx.signals.recommendationCritical ?? 0);
      const errors = Number(ctx.signals.recommendationError ?? 0);
      if (critical + errors <= 0) return null;
      return {
        severity: critical > 0 ? "Warning" : "Info",
        title: "High-severity architecture recommendations",
        description: `${critical} Critical and ${errors} Error recommendation(s) open.`,
        suggestedNextStep: "Open Studio Recommendations workspace and remediate Evidence-backed items.",
      };
    },
  },
]);

export function createStudioInsightProvider(): InsightProvider {
  return {
    id: "studio.platform-insights",
    version: "1.0.0",
    rules: () => rules,
    evaluate(ctx: InsightEvaluationContext): readonly InsightDescriptor[] {
      const summary = buildStudioInsightsSummary();
      const dash = buildStudioDashboard();
      const enriched: InsightEvaluationContext = {
        ...ctx,
        signals: {
          ...ctx.signals,
          architectureHealth: summary.architectureHealth,
          productCompletion: summary.productCompletion,
          releaseReadiness: summary.releaseReadiness,
          testHealth: summary.testHealth,
          technicalDebt: summary.technicalDebt,
          documentationCoverage: summary.documentationCoverage,
          perGrowth: summary.perGrowth,
          sdkAdoption: summary.sdkAdoption,
          connectorHealth: summary.connectorHealth,
          openPers: summary.openPers,
          platformHealth: dash.platformHealth,
          dependencyRisk: summary.dependencyRisk,
          apiReuse: summary.apiReuse,
          connectorReuse: summary.connectorReuse,
          technicalDebtTrend: summary.technicalDebtTrend,
          recommendationCritical:
            summary.recommendationCountBySeverity.Critical,
          recommendationError: summary.recommendationCountBySeverity.Error,
          recommendationWarning:
            summary.recommendationCountBySeverity.Warning,
          recommendationInfo: summary.recommendationCountBySeverity.Info,
        },
      };
      const now = ctx.asOf || new Date().toISOString();
      const out: InsightDescriptor[] = [];
      for (const rule of rules) {
        const hit = rule.evaluate(enriched);
        if (!hit) continue;
        out.push({
          id: `${rule.id}:${ctx.organizationId}:${now}`,
          organizationId: ctx.organizationId,
          ruleId: rule.id,
          severity: hit.severity,
          title: hit.title,
          description: hit.description,
          domain: rule.domain,
          createdAt: now,
        });
      }
      return Object.freeze(out);
    },
    format(insight: InsightDescriptor): string {
      return `[${insight.severity}] ${insight.title} — ${insight.description}`;
    },
  };
}
