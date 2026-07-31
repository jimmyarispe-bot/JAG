/**
 * UniversalOrganizationEngine — canonical org model orchestrator (P-007).
 */

import { buildOrganizationDashboard } from "../dashboard/build";
import {
  getConstitution,
  updateConstitution,
} from "../governance/constitution";
import { bootstrapUniversalOrganization } from "../identity/bootstrap";
import { adviseWithConstitution } from "../mr-jag/constitution-advice";
import {
  createKpi,
  createMilestone,
  performanceAnalytics,
  recordOneOnOne,
  recordReview,
  updateGoalProgress,
} from "../performance/engine";
import {
  getGovernanceProfile,
  listGovernanceProfiles,
  normalizeGovernanceProfileId,
} from "../profiles/catalog";
import {
  createGoal,
  describeStrategyChain,
  setStrategyMode,
  upsertStrategicPlan,
} from "../strategy/engine";
import { addDepartment, addPerson, addTeam } from "../structure/mutate";
import {
  getOrganization,
  listGoals,
  listOrganizations,
} from "../store";
import { linkDigitalTwin } from "../twin/project";
import { GOVERNANCE_PROFILE_IDS } from "../types";

export class UniversalOrganizationEngine {
  readonly profileIds = GOVERNANCE_PROFILE_IDS;
  readonly isUniversalModel = true as const;

  listProfiles = listGovernanceProfiles;
  getProfile = getGovernanceProfile;
  normalizeProfileId = normalizeGovernanceProfileId;

  bootstrap = bootstrapUniversalOrganization;
  get = getOrganization;
  list = listOrganizations;

  getConstitution = getConstitution;
  updateConstitution = updateConstitution;
  advise = adviseWithConstitution;

  setStrategyMode = setStrategyMode;
  upsertStrategicPlan = upsertStrategicPlan;
  createGoal = createGoal;
  describeStrategyChain = describeStrategyChain;
  listGoals = listGoals;
  updateGoalProgress = updateGoalProgress;

  createKpi = createKpi;
  createMilestone = createMilestone;
  recordReview = recordReview;
  recordOneOnOne = recordOneOnOne;
  performanceAnalytics = performanceAnalytics;

  addDepartment = addDepartment;
  addTeam = addTeam;
  addPerson = addPerson;

  linkDigitalTwin = linkDigitalTwin;
  dashboard = buildOrganizationDashboard;
}

export function createUniversalOrganizationEngine(): UniversalOrganizationEngine {
  return new UniversalOrganizationEngine();
}

/** Alias matching product naming. */
export const createOrganizationModelEngine = createUniversalOrganizationEngine;
