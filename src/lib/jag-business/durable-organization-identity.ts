/**
 * Process-local cache of durable org_organizations identity.
 * Primed by async loaders that reuse getOrganizationById — not a second org store.
 */

export type DurableOrganizationIdentity = {
  readonly id: string;
  readonly name: string;
  readonly slug: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const byId = new Map<string, DurableOrganizationIdentity>();

/** True when an id looks like a durable org_organizations UUID. */
export function isDurableOrganizationId(
  organizationId: string | null | undefined
): boolean {
  const id = organizationId?.trim() ?? "";
  return Boolean(id && UUID_RE.test(id));
}

/**
 * Remember a durable organization identity already loaded from org_organizations.
 * Rejects empty / generic temporary labels — never caches "Organization".
 */
export function rememberDurableOrganizationIdentity(input: {
  readonly id: string;
  readonly name: string;
  readonly slug?: string | null;
}): DurableOrganizationIdentity | null {
  const id = input.id.trim();
  const name = input.name.trim();
  if (!id || !isDurableOrganizationId(id)) return null;
  if (!name || name === "Organization" || name === id) return null;
  const next: DurableOrganizationIdentity = {
    id,
    name,
    slug: input.slug?.trim() || null,
  };
  byId.set(id, next);
  return next;
}

export function getDurableOrganizationIdentity(
  organizationId: string
): DurableOrganizationIdentity | null {
  const id = organizationId.trim();
  if (!id) return null;
  return byId.get(id) ?? null;
}

export function clearDurableOrganizationIdentitiesForTests(): void {
  byId.clear();
}
