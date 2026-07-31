/**
 * Strategy Execution Engine™ — goals_only | strategy_assisted | strategy_driven.
 */

import { randomUUID } from "node:crypto";
import { getOrganization, setStrategicPlan, upsertGoal } from "../store";
import { updateConstitution } from "../governance/constitution";
import type {
  OrgGoal,
  StrategicInitiative,
  StrategicObjective,
  StrategicPlan,
  StrategyMode,
} from "../types";

export function setStrategyMode(
  organizationId: string,
  mode: StrategyMode
): ReturnType<typeof updateConstitution> {
  const framework =
    mode === "goals_only" ? null : "mission-vision-objectives-initiatives-goals";
  return updateConstitution(organizationId, {
    strategyMode: mode,
    strategicPlanningFramework: framework,
  });
}

export function upsertStrategicPlan(input: {
  organizationId: string;
  title: string;
  horizonStart?: string | null;
  horizonEnd?: string | null;
  objectives?: readonly { title: string; description?: string }[];
  initiatives?: readonly {
    title: string;
    description?: string;
    objectiveIndex?: number;
  }[];
  activate?: boolean;
}): StrategicPlan | { error: string } {
  const org = getOrganization(input.organizationId);
  if (!org) return { error: "Organization not found." };

  const objectives: StrategicObjective[] = (input.objectives ?? []).map(
    (o, order) =>
      Object.freeze({
        id: `obj:${randomUUID()}`,
        organizationId: input.organizationId,
        title: o.title,
        description: o.description ?? o.title,
        order,
      })
  );

  const initiatives: StrategicInitiative[] = (input.initiatives ?? []).map(
    (i) => {
      const objectiveId =
        i.objectiveIndex != null && objectives[i.objectiveIndex]
          ? objectives[i.objectiveIndex]!.id
          : objectives[0]?.id ?? null;
      return Object.freeze({
        id: `init:${randomUUID()}`,
        organizationId: input.organizationId,
        objectiveId,
        title: i.title,
        description: i.description ?? i.title,
      });
    }
  );

  const plan: StrategicPlan = {
    id: `plan:${randomUUID()}`,
    organizationId: input.organizationId,
    title: input.title,
    horizonStart: input.horizonStart ?? null,
    horizonEnd: input.horizonEnd ?? null,
    objectives: Object.freeze(objectives),
    initiatives: Object.freeze(initiatives),
    active: input.activate !== false,
  };
  setStrategicPlan(input.organizationId, plan);

  // Strategy-driven orgs should not be stuck in goals_only after plan creation
  if (org.constitution.strategyMode === "goals_only" && objectives.length > 0) {
    setStrategyMode(input.organizationId, "strategy_assisted");
  }

  return plan;
}

export function createGoal(input: {
  organizationId: string;
  title: string;
  description?: string;
  level?: OrgGoal["level"];
  ownerPersonRef?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  parentGoalId?: string | null;
  strategicObjectiveId?: string | null;
  dueAt?: string | null;
}): OrgGoal | { error: string } {
  const org = getOrganization(input.organizationId);
  if (!org) return { error: "Organization not found." };

  const mode = org.constitution.strategyMode;
  let strategicObjectiveId = input.strategicObjectiveId ?? null;

  if (mode === "strategy_driven") {
    if (!org.strategicPlan?.active) {
      return {
        error:
          "Strategy-driven mode requires an active strategic plan before creating goals.",
      };
    }
    if (
      !strategicObjectiveId &&
      (org.strategicPlan.objectives?.length ?? 0) > 0
    ) {
      strategicObjectiveId = org.strategicPlan.objectives[0]!.id;
    }
  }

  if (mode === "strategy_assisted" && !strategicObjectiveId) {
    // optional alignment — leave null
  }

  const now = new Date().toISOString();
  const goal: OrgGoal = {
    id: `goal:${randomUUID()}`,
    organizationId: input.organizationId,
    title: input.title,
    description: input.description ?? input.title,
    level: input.level ?? "organizational",
    ownerPersonRef: input.ownerPersonRef ?? null,
    departmentId: input.departmentId ?? null,
    teamId: input.teamId ?? null,
    parentGoalId: input.parentGoalId ?? null,
    strategicObjectiveId,
    kpiIds: Object.freeze([]),
    milestoneIds: Object.freeze([]),
    dependencyGoalIds: Object.freeze([]),
    status: "active",
    progressPercent: 0,
    dueAt: input.dueAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
  return upsertGoal(goal);
}

export function describeStrategyChain(organizationId: string): {
  readonly mode: StrategyMode;
  readonly chain: readonly string[];
} {
  const org = getOrganization(organizationId);
  if (!org) {
    return { mode: "goals_only", chain: Object.freeze([]) };
  }
  const mode = org.constitution.strategyMode;
  if (mode === "goals_only") {
    return {
      mode,
      chain: Object.freeze(["Goals", "Tasks"]),
    };
  }
  if (mode === "strategy_assisted") {
    return {
      mode,
      chain: Object.freeze([
        "Goals",
        "Optional Strategic Objectives",
        "Tasks",
      ]),
    };
  }
  return {
    mode,
    chain: Object.freeze([
      "Mission",
      "Vision",
      "Strategic Plan",
      "Strategic Objectives",
      "Initiatives",
      "Goals",
      "Tasks",
    ]),
  };
}
