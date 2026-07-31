/**
 * Departments, teams, people — structural facets of the universal model.
 */

import { randomUUID } from "node:crypto";
import { getOrganization, upsertOrganization } from "../store";
import type { OrgDepartment, OrgPersonRef, OrgTeam } from "../types";

export function addDepartment(input: {
  organizationId: string;
  name: string;
  parentDepartmentId?: string | null;
  leaderPersonRef?: string | null;
}): OrgDepartment | { error: string } {
  const org = getOrganization(input.organizationId);
  if (!org) return { error: "Organization not found." };
  const dept: OrgDepartment = {
    id: `dept:${randomUUID()}`,
    organizationId: input.organizationId,
    name: input.name,
    parentDepartmentId: input.parentDepartmentId ?? null,
    leaderPersonRef: input.leaderPersonRef ?? null,
  };
  upsertOrganization({
    ...org,
    departments: Object.freeze([...org.departments, dept]),
    updatedAt: new Date().toISOString(),
  });
  return dept;
}

export function addTeam(input: {
  organizationId: string;
  name: string;
  departmentId?: string | null;
  leadPersonRef?: string | null;
}): OrgTeam | { error: string } {
  const org = getOrganization(input.organizationId);
  if (!org) return { error: "Organization not found." };
  const team: OrgTeam = {
    id: `team:${randomUUID()}`,
    organizationId: input.organizationId,
    departmentId: input.departmentId ?? null,
    name: input.name,
    leadPersonRef: input.leadPersonRef ?? null,
  };
  upsertOrganization({
    ...org,
    teams: Object.freeze([...org.teams, team]),
    updatedAt: new Date().toISOString(),
  });
  return team;
}

export function addPerson(input: {
  organizationId: string;
  displayName: string;
  roleTitle?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  stakeholderKind?: OrgPersonRef["stakeholderKind"];
  leadership?: boolean;
}): OrgPersonRef | { error: string } {
  const org = getOrganization(input.organizationId);
  if (!org) return { error: "Organization not found." };
  const person: OrgPersonRef = {
    id: `person:${randomUUID()}`,
    organizationId: input.organizationId,
    displayName: input.displayName,
    roleTitle: input.roleTitle ?? null,
    departmentId: input.departmentId ?? null,
    teamId: input.teamId ?? null,
    stakeholderKind: input.stakeholderKind ?? "employee",
  };
  const customers =
    person.stakeholderKind === "customer" ||
    person.stakeholderKind === "member" ||
    person.stakeholderKind === "student" ||
    person.stakeholderKind === "client"
      ? Object.freeze([...org.customers, person])
      : org.customers;
  upsertOrganization({
    ...org,
    people: Object.freeze([...org.people, person]),
    customers,
    leadershipPersonRefs: input.leadership
      ? Object.freeze([...org.leadershipPersonRefs, person.id])
      : org.leadershipPersonRefs,
    updatedAt: new Date().toISOString(),
  });
  return person;
}
