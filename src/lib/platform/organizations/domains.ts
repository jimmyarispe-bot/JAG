import type { OrganizationSettingsJson } from "@/lib/platform/organizations/types";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/** Normalize Host header → hostname (lowercase, no port). */
export function normalizeHost(host: string | null | undefined): string | null {
  if (!host?.trim()) return null;
  const trimmed = host.trim().toLowerCase();
  const withoutPort = trimmed.split(":")[0] ?? trimmed;
  return withoutPort || null;
}

/**
 * Optional env map: JSON object of hostname → organization slug.
 * Example: {"academy.theacademyway.org":"the-academy-way","ga.theacademyway.org":"the-academy-way"}
 */
export function parseOrganizationDomainMap(
  raw: string | undefined = process.env.ORGANIZATION_DOMAIN_MAP
): Record<string, string> {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    const record = asRecord(parsed);
    const out: Record<string, string> = {};
    for (const [host, slug] of Object.entries(record)) {
      const nHost = normalizeHost(host);
      if (nHost && typeof slug === "string" && slug.trim()) {
        out[nHost] = slug.trim();
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function extractDomainsFromSettings(settings: unknown): string[] {
  const record = asRecord(settings) as OrganizationSettingsJson;
  const domains = record.domains;
  if (!Array.isArray(domains)) return [];
  return domains
    .filter((d): d is string => typeof d === "string" && Boolean(d.trim()))
    .map((d) => normalizeHost(d)!)
    .filter(Boolean);
}

export function hostMatchesOrganization(
  host: string | null | undefined,
  settings: unknown,
  orgSlug: string
): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;

  const domains = extractDomainsFromSettings(settings);
  if (domains.includes(normalized)) return true;

  const map = parseOrganizationDomainMap();
  const mappedSlug = map[normalized];
  return Boolean(mappedSlug && mappedSlug === orgSlug);
}

/** Resolve organization slug from host via env map only (no DB). */
export function resolveSlugFromHostMap(host: string | null | undefined): string | null {
  const normalized = normalizeHost(host);
  if (!normalized) return null;
  return parseOrganizationDomainMap()[normalized] ?? null;
}
