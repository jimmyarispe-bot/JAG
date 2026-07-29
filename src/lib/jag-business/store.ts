/**
 * In-process provisioned organization store (Phase 1).
 * Replace with durable persistence when billing lands.
 */

import type { ProvisionedOrganization } from "@/lib/jag-business/types";

const globalStore = globalThis as typeof globalThis & {
  __jagBusinessOrgs?: Map<string, ProvisionedOrganization>;
  __jagBusinessEmailIndex?: Map<string, string>;
};

function orgs(): Map<string, ProvisionedOrganization> {
  if (!globalStore.__jagBusinessOrgs) {
    globalStore.__jagBusinessOrgs = new Map();
  }
  return globalStore.__jagBusinessOrgs;
}

function emailIndex(): Map<string, string> {
  if (!globalStore.__jagBusinessEmailIndex) {
    globalStore.__jagBusinessEmailIndex = new Map();
  }
  return globalStore.__jagBusinessEmailIndex;
}

export function resetJagBusinessStoreForTests(): void {
  orgs().clear();
  emailIndex().clear();
}

export function listProvisionedOrganizations(): readonly ProvisionedOrganization[] {
  return Object.freeze(
    [...orgs().values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    )
  );
}

export function getProvisionedOrganization(
  organizationId: string
): ProvisionedOrganization | undefined {
  return orgs().get(organizationId);
}

export function findOrganizationByFounderEmail(
  email: string
): ProvisionedOrganization | undefined {
  const id = emailIndex().get(email.trim().toLowerCase());
  if (!id) return undefined;
  return orgs().get(id);
}

export function findFounderCredentials(
  email: string
): { organization: ProvisionedOrganization; password: string } | undefined {
  const organization = findOrganizationByFounderEmail(email);
  if (!organization) return undefined;
  return {
    organization,
    password: organization.founder.password,
  };
}

export function saveProvisionedOrganization(
  organization: ProvisionedOrganization
): void {
  orgs().set(organization.organizationId, organization);
  emailIndex().set(
    organization.founder.email.toLowerCase(),
    organization.organizationId
  );
}
