import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { evaluateMetrics, metricValue } from "../metrics";
import { computeRunway } from "../runway";
import { listRecommendations, upsertRecommendation } from "../store";
import type { CfoRecommendation, RecommendationKind } from "../types";

function issue(input: {
  organizationId: string;
  kind: RecommendationKind;
  title: string;
  summary: string;
  evidence: CfoRecommendation["supportingEvidence"];
  confidence: number;
  financialImpact: number;
  assumptions: string[];
  alternatives: string[];
}): CfoRecommendation {
  const rec = upsertRecommendation({
    id: newId("crec"),
    organizationId: input.organizationId,
    kind: input.kind,
    title: input.title,
    summary: input.summary,
    supportingEvidence: Object.freeze([...input.evidence]),
    confidence: input.confidence,
    financialImpact: input.financialImpact,
    assumptions: Object.freeze([...input.assumptions]),
    alternatives: Object.freeze([...input.alternatives]),
    generatedAt: nowIso(),
  });
  publishCfoEvent({
    type: "cfo.recommendation_issued",
    organizationId: input.organizationId,
    recordType: "cfo_recommendation",
    recordId: rec.id,
    payload: {
      kind: rec.kind,
      confidence: rec.confidence,
      financialImpact: rec.financialImpact,
    },
  });
  return rec;
}

export function generateRecommendations(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
}): readonly CfoRecommendation[] {
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
  });
  const cash = metricValue(snap, "cash") ?? 0;
  const margin = metricValue(snap, "operating_margin");
  const revenue = metricValue(snap, "revenue") ?? 0;
  const runway = computeRunway({
    organizationId: input.organizationId,
    userId: input.userId,
    periodKey: input.periodKey,
  });
  const out: CfoRecommendation[] = [];

  if (runway.runwayMonths != null && runway.runwayMonths < 9) {
    out.push(
      issue({
        organizationId: input.organizationId,
        kind: "cash_preservation",
        title: "Preserve cash / defer discretionary spend",
        summary: `Runway is ${runway.runwayMonths.toFixed(1)} months; prioritize liquidity.`,
        evidence: [
          {
            recordType: "cash_runway",
            recordId: runway.id,
            note: `Monthly burn ${runway.monthlyBurn.toFixed(0)}`,
          },
          {
            recordType: "metric",
            recordId: "cash",
            note: `Cash ${cash.toFixed(0)}`,
          },
        ],
        confidence: 0.82,
        financialImpact: -runway.monthlyBurn * 0.1,
        assumptions: [
          "Burn continues near expected scenario",
          "No new financing",
        ],
        alternatives: [
          "Accelerate collections",
          "Negotiate vendor terms",
          "Temporary hiring freeze",
        ],
      })
    );
    out.push(
      issue({
        organizationId: input.organizationId,
        kind: "hiring_delay",
        title: "Delay non-critical hiring",
        summary: "Extend runway by deferring incremental headcount.",
        evidence: [
          {
            recordType: "cash_runway",
            recordId: runway.id,
            note: "Runway below 9 months",
          },
        ],
        confidence: 0.75,
        financialImpact: runway.monthlyBurn * 0.15,
        assumptions: ["Average fully-loaded hire ≈ 15% of monthly burn"],
        alternatives: ["Part-time / contractor coverage", "Staggered start dates"],
      })
    );
  } else if (margin != null && margin > 15 && cash > 50000) {
    out.push(
      issue({
        organizationId: input.organizationId,
        kind: "hiring_expansion",
        title: "Consider measured hiring expansion",
        summary: "Healthy margin and cash support selective growth hires.",
        evidence: [
          {
            recordType: "metric",
            recordId: "operating_margin",
            note: `Margin ${margin.toFixed(1)}%`,
          },
          {
            recordType: "metric",
            recordId: "cash",
            note: `Cash ${cash.toFixed(0)}`,
          },
        ],
        confidence: 0.68,
        financialImpact: -revenue * 0.03,
        assumptions: ["New hire ROI within 2 quarters"],
        alternatives: ["Invest in program expansion instead", "Build cash buffer further"],
      })
    );
    out.push(
      issue({
        organizationId: input.organizationId,
        kind: "program_expansion",
        title: "Evaluate program / campus expansion",
        summary: "Strong operating position may support growth investment.",
        evidence: [
          {
            recordType: "metric",
            recordId: "revenue",
            note: `Revenue ${revenue.toFixed(0)}`,
          },
        ],
        confidence: 0.55,
        financialImpact: revenue * 0.1,
        assumptions: ["Enrollment demand exists", "Capital within board appetite"],
        alternatives: ["Pilot program first", "Partner / shared facility model"],
      })
    );
  }

  if ((metricValue(snap, "ap_days") ?? 0) > 45) {
    out.push(
      issue({
        organizationId: input.organizationId,
        kind: "vendor_optimization",
        title: "Optimize vendor payment terms",
        summary: "Elevated AP days suggest renegotiation or payment scheduling.",
        evidence: [
          {
            recordType: "metric",
            recordId: "ap_days",
            note: `AP days ${metricValue(snap, "ap_days")?.toFixed(1)}`,
          },
        ],
        confidence: 0.7,
        financialImpact: (metricValue(snap, "working_capital") ?? 0) * 0.05,
        assumptions: ["Vendors will accept revised terms"],
        alternatives: ["Early-pay discounts", "Consolidate vendors"],
      })
    );
  }

  if (out.length === 0) {
    out.push(
      issue({
        organizationId: input.organizationId,
        kind: "revenue_opportunity",
        title: "Review pricing and grant mix",
        summary: "No acute liquidity risk; focus on revenue quality opportunities.",
        evidence: [
          {
            recordType: "metric",
            recordId: "revenue",
            note: `Revenue ${revenue.toFixed(0)}`,
          },
        ],
        confidence: 0.5,
        financialImpact: revenue * 0.02,
        assumptions: ["Pricing elasticity moderate"],
        alternatives: ["Cost reduction program", "Scholarship strategy review"],
      })
    );
  }

  void input.userId;
  return Object.freeze(out);
}

export { listRecommendations };
