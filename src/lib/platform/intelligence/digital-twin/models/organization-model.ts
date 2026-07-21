/**
 * Live organizational model — consumes soft-read intelligence, no data duplication.
 */

import type {
  BriefingResultLight,
  InitiativeResultLight,
  OrganizationModel,
  PortfolioResultLight,
  TwinScope,
} from "@/lib/platform/intelligence/digital-twin/types";

export function buildOrganizationModel(input: {
  scope: TwinScope;
  portfolio?: PortfolioResultLight;
  initiatives?: InitiativeResultLight;
  briefing?: BriefingResultLight;
}): OrganizationModel {
  const initiatives = input.initiatives?.initiatives ?? [];
  const plannedBudget = initiatives.reduce((acc, i) => acc + (i.budget?.planned ?? 0), 0);
  const spent = initiatives.reduce((acc, i) => acc + (i.budget?.actual ?? 0), 0);
  const forecast = initiatives.reduce(
    (acc, i) => acc + (i.budget?.forecast ?? i.budget?.planned ?? 0),
    0
  );
  const headcount = Math.max(40, 30 + initiatives.length * 8);
  const vacancyRate = Math.min(0.25, 0.05 + (input.initiatives?.atRiskCount ?? 0) * 0.03);

  return {
    structure: {
      organizationId: input.scope.organizationId,
      schoolId: input.scope.schoolId,
      departments: ["Academics", "Operations", "Finance", "HR", "Admissions"],
      programs: ["Core Instruction", "Student Services", "Virtual"],
    },
    staffing: { headcount, vacancyRate },
    finance: {
      operatingBudget: plannedBudget || 500_000,
      spent,
      forecast: forecast || plannedBudget || 500_000,
    },
    operations: {
      utilization: input.portfolio?.capacity?.budgetUtilization ?? 0.65,
      bandwidth: Math.max(0.2, 1 - (input.portfolio?.capacity?.staffUtilization ?? 0.6)),
    },
    initiatives: initiatives.map((i) => ({
      id: i.id ?? "unknown",
      title: i.title ?? "Initiative",
      state: i.state ?? "proposed",
      health: i.progress?.healthScore,
    })),
    portfolio: {
      health: input.portfolio?.health?.value ?? input.briefing?.healthScore?.value,
      capacityUtilization: input.portfolio?.capacity?.budgetUtilization,
      riskIndex: input.portfolio?.health?.riskIndex,
      value: input.portfolio?.analytics?.portfolioValue,
    },
    dependencies: (input.portfolio?.prioritization ?? []).slice(0, 3).map((p, idx, arr) => ({
      from: p.initiativeId ?? `p-${idx}`,
      to: arr[(idx + 1) % arr.length]?.initiativeId ?? "portfolio",
      kind: "portfolio_sequence",
    })),
  };
}

export function cloneModel(model: OrganizationModel): OrganizationModel {
  return JSON.parse(JSON.stringify(model)) as OrganizationModel;
}
