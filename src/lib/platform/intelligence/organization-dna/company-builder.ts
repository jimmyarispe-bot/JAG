/**
 * CompanyBuilder — artifact envelope generator (Sprint 030).
 */

import type { CompanyBuilder as CompanyBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import { resolveArtifactKinds } from "@/lib/platform/intelligence/organization-dna/models";
import type {
  CompanyBuilderArtifact,
  CompanyBuilderSeed,
  OrganizationDNA,
  OrganizationDnaBaseline,
  OrganizationDnaRequest,
  OrganizationProfile,
  OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna/types";

export class CompanyBuilderImpl implements CompanyBuilderContract {
  private readonly createId: (prefix: string) => string;

  constructor(options: { createId?: (prefix: string) => string } = {}) {
    this.createId =
      options.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  build(input: {
    request: OrganizationDnaRequest;
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    profile: OrganizationProfile;
    dna: OrganizationDNA;
    now: Date;
  }): CompanyBuilderArtifact[] {
    const kinds = resolveArtifactKinds(input.request.artifactKinds);
    const generatedAt = input.now.toISOString();
    const dna = input.dna;

    const builders: Record<
      (typeof kinds)[number],
      () => CompanyBuilderArtifact
    > = {
      organizational_dna: () =>
        this.artifact(
          "organizational_dna",
          "Organizational DNA",
          `Stage ${dna.stage} DNA for ${input.profile.name}`,
          { dnaId: dna.id, stage: dna.stage, score: dna.score.overall },
          generatedAt
        ),
      executive_blueprint: () =>
        this.artifact(
          "executive_blueprint",
          "Executive Blueprint",
          dna.blueprint.title,
          { blueprint: dna.blueprint },
          generatedAt
        ),
      organizational_roadmap: () =>
        this.artifact(
          "organizational_roadmap",
          "Organizational Roadmap",
          dna.roadmap.narrative,
          { roadmap: dna.roadmap },
          generatedAt
        ),
      business_model: () =>
        this.artifact(
          "business_model",
          "Business Model",
          dna.businessModel.narrative,
          { businessModel: dna.businessModel },
          generatedAt
        ),
      lean_canvas: () =>
        this.artifact(
          "lean_canvas",
          "Lean Canvas",
          dna.leanCanvas.uniqueValueProposition,
          { leanCanvas: dna.leanCanvas },
          generatedAt
        ),
      swot: () =>
        this.artifact(
          "swot",
          "SWOT Analysis",
          dna.swot.narrative,
          { swot: dna.swot },
          generatedAt
        ),
      value_proposition: () =>
        this.artifact(
          "value_proposition",
          "Value Proposition",
          dna.valueProposition.statement,
          { valueProposition: dna.valueProposition },
          generatedAt
        ),
      customer_personas: () =>
        this.artifact(
          "customer_personas",
          "Customer Personas",
          `${dna.profile.personas.length} personas`,
          { personas: dna.profile.personas },
          generatedAt
        ),
      company_readiness_report: () =>
        this.artifact(
          "company_readiness_report",
          "Company Readiness Report",
          dna.readiness.narrative,
          { readiness: dna.readiness, scoring: dna.scoring },
          generatedAt
        ),
      executive_priorities: () =>
        this.artifact(
          "executive_priorities",
          "Executive Priorities",
          `${dna.priorities.length} priorities`,
          { priorities: dna.priorities },
          generatedAt
        ),
      organizational_score: () =>
        this.artifact(
          "organizational_score",
          "Organizational Score",
          dna.score.narrative,
          { score: dna.score },
          generatedAt
        ),
      kpi_recommendations: () =>
        this.artifact(
          "kpi_recommendations",
          "Initial KPI Recommendations",
          `${dna.kpiRecommendations.length} KPIs`,
          { kpis: dna.kpiRecommendations },
          generatedAt
        ),
    };

    return kinds.map((kind) => builders[kind]());
  }

  private artifact(
    kind: CompanyBuilderArtifact["kind"],
    title: string,
    summary: string,
    payload: CompanyBuilderArtifact["payload"],
    generatedAt: string
  ): CompanyBuilderArtifact {
    return {
      id: this.createId(`artifact-${kind}`),
      kind,
      title,
      status: "generated",
      generatedAt,
      summary,
      payload,
    };
  }
}

export { CompanyBuilderImpl as CompanyBuilder };
