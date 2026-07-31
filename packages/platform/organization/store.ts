/**
 * In-process Universal Organization store (tests / single-process).
 */

import type {
  OrgGoal,
  OrgKpi,
  OrgMilestone,
  OrganizationalConstitution,
  PerformanceReview,
  OneOnOneRecord,
  StrategicPlan,
  UniversalOrganization,
} from "./types";

type OrgStore = {
  orgs: Map<string, UniversalOrganization>;
  milestones: Map<string, OrgMilestone>;
  reviews: Map<string, PerformanceReview>;
  oneOnOnes: Map<string, OneOnOneRecord>;
};

const g = globalThis as typeof globalThis & {
  __jagOrganizationStore?: OrgStore;
};

function empty(): OrgStore {
  return {
    orgs: new Map(),
    milestones: new Map(),
    reviews: new Map(),
    oneOnOnes: new Map(),
  };
}

function store(): OrgStore {
  if (!g.__jagOrganizationStore) g.__jagOrganizationStore = empty();
  return g.__jagOrganizationStore;
}

export function resetOrganizationStoreForTests(): void {
  g.__jagOrganizationStore = empty();
}

export function upsertOrganization(
  org: UniversalOrganization
): UniversalOrganization {
  store().orgs.set(org.identity.organizationId, org);
  return org;
}

export function getOrganization(
  organizationId: string
): UniversalOrganization | null {
  return store().orgs.get(organizationId) ?? null;
}

export function listOrganizations(): readonly UniversalOrganization[] {
  return Object.freeze([...store().orgs.values()]);
}

export function upsertConstitution(
  constitution: OrganizationalConstitution
): OrganizationalConstitution {
  const org = getOrganization(constitution.organizationId);
  if (!org) return constitution;
  upsertOrganization({
    ...org,
    constitution,
    identity: {
      ...org.identity,
      governanceProfileId: constitution.legalStructure,
    },
    updatedAt: constitution.updatedAt,
  });
  return constitution;
}

export function setStrategicPlan(
  organizationId: string,
  plan: StrategicPlan | null
): UniversalOrganization | null {
  const org = getOrganization(organizationId);
  if (!org) return null;
  return upsertOrganization({
    ...org,
    strategicPlan: plan,
    updatedAt: new Date().toISOString(),
  });
}

export function upsertGoal(goal: OrgGoal): OrgGoal {
  const org = getOrganization(goal.organizationId);
  if (!org) return goal;
  const others = org.goals.filter((g) => g.id !== goal.id);
  upsertOrganization({
    ...org,
    goals: Object.freeze([...others, goal]),
    updatedAt: goal.updatedAt,
  });
  return goal;
}

export function listGoals(organizationId: string): readonly OrgGoal[] {
  return getOrganization(organizationId)?.goals ?? Object.freeze([]);
}

export function upsertKpi(kpi: OrgKpi): OrgKpi {
  const org = getOrganization(kpi.organizationId);
  if (!org) return kpi;
  const others = org.kpis.filter((k) => k.id !== kpi.id);
  upsertOrganization({
    ...org,
    kpis: Object.freeze([...others, kpi]),
    updatedAt: new Date().toISOString(),
  });
  return kpi;
}

export function upsertMilestone(m: OrgMilestone): OrgMilestone {
  store().milestones.set(m.id, m);
  return m;
}

export function listMilestones(
  organizationId: string,
  goalId?: string
): readonly OrgMilestone[] {
  return Object.freeze(
    [...store().milestones.values()].filter(
      (m) =>
        m.organizationId === organizationId &&
        (!goalId || m.goalId === goalId)
    )
  );
}

export function upsertReview(r: PerformanceReview): PerformanceReview {
  store().reviews.set(r.id, r);
  return r;
}

export function listReviews(
  organizationId: string
): readonly PerformanceReview[] {
  return Object.freeze(
    [...store().reviews.values()].filter(
      (r) => r.organizationId === organizationId
    )
  );
}

export function upsertOneOnOne(r: OneOnOneRecord): OneOnOneRecord {
  store().oneOnOnes.set(r.id, r);
  return r;
}

export function listOneOnOnes(
  organizationId: string
): readonly OneOnOneRecord[] {
  return Object.freeze(
    [...store().oneOnOnes.values()].filter(
      (r) => r.organizationId === organizationId
    )
  );
}
