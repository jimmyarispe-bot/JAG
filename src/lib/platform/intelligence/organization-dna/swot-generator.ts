/**
 * SWOTGenerator (Sprint 030).
 */

import type { SwotGenerator as SwotGeneratorContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import { priorityFromScore } from "@/lib/platform/intelligence/organization-dna/models";
import type {
  CompanyBuilderSeed,
  OrganizationCapabilities,
  OrganizationConstraints,
  OrganizationDnaBaseline,
  OrganizationStage,
  SwotAnalysis,
} from "@/lib/platform/intelligence/organization-dna/types";

export class SwotGeneratorImpl implements SwotGeneratorContract {
  generate(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    capabilities: OrganizationCapabilities;
    constraints: OrganizationConstraints;
    now: Date;
  }): SwotAnalysis {
    void input.now;
    const b = input.baseline;
    const topCapabilities = [...input.capabilities.capabilities]
      .sort((a, c) => c.maturity - a.maturity)
      .slice(0, 3)
      .map((c) => c.name);

    const strengths = [
      ...topCapabilities.map((n) => `Capability strength: ${n}`),
      b.missionClarity >= 70 ? "Clear mission signal" : "Emerging mission clarity",
      input.seed.solutionSummary
        ? "Defined solution thesis"
        : "Willingness to explore solution space",
    ];

    const weaknesses = [
      ...input.constraints.constraints
        .filter((c) => c.severity === "critical" || c.severity === "high")
        .map((c) => c.description),
      b.modelClarity < 60 ? "Business model still forming" : null,
      b.capitalAdequacy < 55 ? "Capital adequacy pressure" : null,
      b.teamSize < 5 ? "Limited team bandwidth" : null,
    ].filter((x): x is string => Boolean(x));

    const opportunities = [
      `Serve ${input.seed.targetCustomer ?? "beachhead customers"} in ${input.seed.geography ?? "local markets"}`,
      "Integrate with executive and board intelligence workflows",
      input.stage === "idea" || input.stage === "startup"
        ? "First-mover clarity in organizational OS category"
        : "Expand into adjacent segments",
      ...(input.seed.competitorHints?.length
        ? [`Differentiate vs ${input.seed.competitorHints.join(", ")}`]
        : []),
    ];

    const threats = [
      b.riskScore >= 0.55 ? "Elevated operational risk" : "Market imitation risk",
      "Capital markets or tuition/funding cyclicality",
      "Execution drift without shared DNA",
    ];

    const priorityActions = [
      weaknesses[0]
        ? `Address: ${weaknesses[0]}`
        : "Protect current strengths while clarifying model",
      `Advance ${input.stage} → next stage readiness`,
      "Instrument KPIs recommended by DNA scoring",
    ];

    return {
      strengths,
      weaknesses: weaknesses.length
        ? weaknesses
        : ["Normal early-stage ambiguity"],
      opportunities,
      threats,
      priorityActions,
      narrative: `SWOT calibrated to ${input.stage} (priority band ${priorityFromScore(b.executionReadiness)}).`,
    };
  }
}

export { SwotGeneratorImpl as SwotGenerator };
