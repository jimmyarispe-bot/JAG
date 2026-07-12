/**
 * Innovation Portfolio Intelligence — H1/H2/H3 balance and allocation.
 */

import type { InnovationPortfolioIntelligence as InnovationPortfolioIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildLens, clamp, clamp01 } from "@/lib/platform/intelligence/innovation/models";
import type {
  IdeaManagementSuite,
  InnovationBaseline,
  InnovationHorizon,
  InnovationPortfolioSuite,
  PortfolioItemRecord,
  ProductServiceInnovationSuite,
  ResearchDevelopmentSuite,
} from "@/lib/platform/intelligence/innovation/types";

const PORTFOLIO_TEMPLATES: Array<{ name: string; horizon: InnovationHorizon }> = [
  { name: "Core enrollment experience upgrades", horizon: "h1_core" },
  { name: "Staff productivity suite", horizon: "h1_core" },
  { name: "Adjacent family services expansion", horizon: "h2_adjacent" },
  { name: "AI-enabled academic support", horizon: "h2_adjacent" },
  { name: "Transformational learning platform bet", horizon: "h3_transformational" },
  { name: "Shared services marketplace venture", horizon: "h3_transformational" },
];

export class InnovationPortfolioIntelligence implements InnovationPortfolioIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    ideaManagement: IdeaManagementSuite;
    researchDevelopment: ResearchDevelopmentSuite;
    productServiceInnovation: ProductServiceInnovationSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): InnovationPortfolioSuite {
    const { baseline, ideaManagement, researchDevelopment, productServiceInnovation, createId } = input;
    void input.now;
    const items: PortfolioItemRecord[] = PORTFOLIO_TEMPLATES.map((template, index) => {
      const health = clamp(
        baseline.portfolioBalance +
          (template.horizon === "h1_core" ? 6 : template.horizon === "h2_adjacent" ? 2 : -4) +
          (index % 2) * 3
      );
      const allocation = clamp01(
        template.horizon === "h1_core"
          ? baseline.h1Share / 2
          : template.horizon === "h2_adjacent"
            ? baseline.h2Share / 2
            : baseline.h3Share / 2
      );
      return {
        id: createId("inn-portfolio"),
        name: template.name,
        horizon: template.horizon,
        allocation,
        health,
        narrative: `${template.name} (${template.horizon}) health ${Math.round(health)}.`,
        lenses: buildLens({
          innovationOpportunityExists: template.name,
          evidenceSupports: `Portfolio balance ${Math.round(baseline.portfolioBalance)}; idea backlog health ${Math.round(ideaManagement.backlogHealth)}.`,
          problemSolved: `Balances ${template.horizon} bets with core delivery.`,
          expectedImpact: `Allocation ${(allocation * 100).toFixed(0)}% at health ${Math.round(health)}.`,
          investmentRequired: "Horizon-aligned capital and capacity.",
          experimentsValidate: "Stage-gate reviews and kill/scale criteria.",
          risksExist: "Overweight core or underfunded transformational bets.",
          capabilitiesRequired: "Portfolio governance, finance, innovation ops",
        }),
      };
    });
    const h1Share = clamp01(
      items.filter((item) => item.horizon === "h1_core").reduce((sum, item) => sum + item.allocation, 0) ||
        baseline.h1Share
    );
    const h2Share = clamp01(
      items.filter((item) => item.horizon === "h2_adjacent").reduce((sum, item) => sum + item.allocation, 0) ||
        baseline.h2Share
    );
    const h3Share = clamp01(
      items.filter((item) => item.horizon === "h3_transformational").reduce((sum, item) => sum + item.allocation, 0) ||
        baseline.h3Share
    );
    const balanceScore = clamp(
      items.reduce((sum, item) => sum + item.health, 0) / items.length * 0.55 +
        researchDevelopment.pipelineDepth * 0.2 +
        productServiceInnovation.innovationScore * 0.15 +
        (1 - Math.abs(h1Share - 0.5)) * 20
    );

    return {
      items,
      balanceScore,
      h1Share,
      h2Share,
      h3Share,
      narrative: `Portfolio balance ${Math.round(balanceScore)} (H1 ${(h1Share * 100).toFixed(0)}% / H2 ${(h2Share * 100).toFixed(0)}% / H3 ${(h3Share * 100).toFixed(0)}%).`,
    };
  }
}
