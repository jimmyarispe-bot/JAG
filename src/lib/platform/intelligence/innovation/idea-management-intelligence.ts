/**
 * Idea Management Intelligence — ideation pipeline and backlog health.
 */

import type { IdeaManagementIntelligence as IdeaManagementIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  IdeaManagementSuite,
  IdeaRecord,
  IdeaStatus,
  InnovationBaseline,
  InnovationHorizon,
} from "@/lib/platform/intelligence/innovation/types";

const IDEA_TEMPLATES: Array<{
  title: string;
  status: IdeaStatus;
  horizon: InnovationHorizon;
  owner: string;
}> = [
  { title: "AI-assisted lesson planning assistant", status: "experimenting", horizon: "h2_adjacent", owner: "academics" },
  { title: "Family portal self-service enrollment", status: "validated", horizon: "h1_core", owner: "operations" },
  { title: "Micro-credential pathways for staff", status: "screening", horizon: "h2_adjacent", owner: "people" },
  { title: "Predictive enrollment yield model", status: "submitted", horizon: "h2_adjacent", owner: "strategy" },
  { title: "Campus energy optimization program", status: "validated", horizon: "h1_core", owner: "facilities" },
  { title: "Immersive AR campus tours", status: "parked", horizon: "h3_transformational", owner: "advancement" },
  { title: "Cross-school shared services marketplace", status: "screening", horizon: "h3_transformational", owner: "finance" },
  { title: "Continuous improvement kaizen boards", status: "scaling", horizon: "h1_core", owner: "operations" },
];

export class IdeaManagementIntelligence implements IdeaManagementIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): IdeaManagementSuite {
    const { baseline, createId } = input;
    void input.now;
    const count = Math.max(5, Math.min(IDEA_TEMPLATES.length, baseline.ideaCount));
    const ideas: IdeaRecord[] = IDEA_TEMPLATES.slice(0, count).map((template, index) => {
      const score = clamp(
        baseline.ideaVelocity + (index % 4) * 4 - (template.status === "parked" ? 12 : 0)
      );
      const impactEstimate = Math.round(score * 2_800 + index * 1_200);
      const investmentEstimate = Math.round(score * 1_100 + index * 800);
      return {
        id: createId("inn-idea"),
        title: template.title,
        status: template.status,
        horizon: template.horizon,
        score,
        impactEstimate,
        investmentEstimate,
        owner: template.owner,
        narrative: `${template.title} (${template.status}) score ${Math.round(score)}.`,
        lenses: buildLens({
          innovationOpportunityExists: template.title,
          evidenceSupports: `Idea velocity ${Math.round(baseline.ideaVelocity)}; opportunity density ${Math.round(baseline.opportunityDensity)}.`,
          problemSolved: `Advances ${template.horizon} innovation capacity.`,
          expectedImpact: `Impact ~$${impactEstimate.toLocaleString()}.`,
          investmentRequired: `Investment ~$${investmentEstimate.toLocaleString()}.`,
          experimentsValidate: template.status === "experimenting" || template.status === "validated"
            ? "Validation experiments underway or complete."
            : "Experiments not yet started.",
          risksExist: "Adoption friction and capacity constraints.",
          capabilitiesRequired: `${template.owner}, innovation ops`,
        }),
      };
    });
    const velocityScore = clamp(
      ideas.reduce((sum, idea) => sum + idea.score, 0) / Math.max(1, ideas.length)
    );
    const advancing = ideas.filter((idea) =>
      ["validated", "experimenting", "scaling"].includes(idea.status)
    ).length;
    const backlogHealth = clamp(velocityScore * 0.6 + (advancing / Math.max(1, ideas.length)) * 40);
    const screeningThroughput = clamp(
      (ideas.filter((idea) => idea.status === "screening" || idea.status === "submitted").length /
        Math.max(1, ideas.length)) *
        100
    );

    return {
      ideas,
      velocityScore,
      backlogHealth,
      screeningThroughput,
      narrative: `Idea velocity ${Math.round(velocityScore)} across ${ideas.length} ideas; backlog health ${Math.round(backlogHealth)}.`,
    };
  }
}
