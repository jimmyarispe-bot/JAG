/**
 * Organizational Constitution™ — evolve operating rules.
 */

import { normalizeGovernanceProfileId } from "../profiles/catalog";
import { getOrganization, upsertConstitution } from "../store";
import type { OrganizationalConstitution } from "../types";

export function getConstitution(
  organizationId: string
): OrganizationalConstitution | null {
  return getOrganization(organizationId)?.constitution ?? null;
}

export function updateConstitution(
  organizationId: string,
  patch: Partial<
    Omit<OrganizationalConstitution, "organizationId" | "updatedAt">
  >
): OrganizationalConstitution | { error: string } {
  const org = getOrganization(organizationId);
  if (!org) return { error: "Organization not found." };
  const legalStructure = normalizeGovernanceProfileId(
    patch.legalStructure ?? org.constitution.legalStructure
  );
  const next: OrganizationalConstitution = {
    ...org.constitution,
    ...patch,
    organizationId,
    legalStructure,
    ownership: patch.ownership ?? org.constitution.ownership,
    board: patch.board
      ? Object.freeze([...patch.board])
      : org.constitution.board,
    committees: patch.committees
      ? Object.freeze([...patch.committees])
      : org.constitution.committees,
    delegationOfAuthority: patch.delegationOfAuthority
      ? Object.freeze([...patch.delegationOfAuthority])
      : org.constitution.delegationOfAuthority,
    approvalThresholds: patch.approvalThresholds
      ? Object.freeze([...patch.approvalThresholds])
      : org.constitution.approvalThresholds,
    spendingAuthority: patch.spendingAuthority
      ? Object.freeze([...patch.spendingAuthority])
      : org.constitution.spendingAuthority,
    hiringAuthority: patch.hiringAuthority
      ? Object.freeze([...patch.hiringAuthority])
      : org.constitution.hiringAuthority,
    financialPolicies: patch.financialPolicies
      ? Object.freeze([...patch.financialPolicies])
      : org.constitution.financialPolicies,
    complianceObligations: patch.complianceObligations
      ? Object.freeze([...patch.complianceObligations])
      : org.constitution.complianceObligations,
    decisionMakingRules: patch.decisionMakingRules
      ? Object.freeze([...patch.decisionMakingRules])
      : org.constitution.decisionMakingRules,
    version: patch.version ?? bumpPatch(org.constitution.version),
    updatedAt: new Date().toISOString(),
  };
  return upsertConstitution(next);
}

function bumpPatch(version: string): string {
  const parts = version.split(".").map((n) => Number(n) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] = (parts[2] ?? 0) + 1;
  return parts.join(".");
}
