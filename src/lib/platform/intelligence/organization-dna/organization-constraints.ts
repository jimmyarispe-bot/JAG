/**
 * OrganizationConstraints builder (Sprint 030).
 */

import type { OrganizationConstraintsBuilder as OrganizationConstraintsBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import { priorityFromRisk } from "@/lib/platform/intelligence/organization-dna/models";
import type {
  CompanyBuilderSeed,
  OrganizationConstraints,
  OrganizationDnaBaseline,
  OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationConstraintsBuilderImpl
  implements OrganizationConstraintsBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationConstraints {
    void input.now;
    const hints = input.seed.constraintHints ?? [];
    const defaults = [
      {
        id: input.createId("constraint"),
        category: "capital",
        description:
          input.baseline.capitalAdequacy < 60
            ? "Limited capital runway relative to ambitions"
            : "Capital allocation must stay disciplined",
        severity: priorityFromRisk(
          input.baseline.capitalAdequacy < 60 ? 0.65 : 0.35
        ),
        mitigation: "Tie spend to stage milestones and KPI gates",
      },
      {
        id: input.createId("constraint"),
        category: "talent",
        description:
          input.baseline.teamSize < 5
            ? "Small team bandwidth limits parallel initiatives"
            : "Hiring quality and onboarding capacity",
        severity: (input.baseline.teamSize < 5 ? "high" : "medium") as
          | "critical"
          | "high"
          | "medium"
          | "low"
          | "monitor",
        mitigation: "Sequence work; hire against critical capabilities",
      },
      {
        id: input.createId("constraint"),
        category: "risk",
        description: "Operational and market risk concentration",
        severity: priorityFromRisk(input.baseline.riskScore),
        mitigation: "Maintain risk register and early warning KPIs",
      },
    ];

    const constraints =
      hints.length > 0
        ? hints.map((description) => ({
            id: input.createId("constraint"),
            category: "stated",
            description,
            severity: "medium" as const,
            mitigation: "Address in near-term roadmap",
          }))
        : defaults;

    return {
      constraints,
      narrative: `Constraints framed for ${input.stage} stage execution.`,
    };
  }
}

export { OrganizationConstraintsBuilderImpl as OrganizationConstraints };
export { OrganizationConstraintsBuilderImpl as OrganizationConstraintsBuilder };
