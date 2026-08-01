/**
 * Sprint 211 — Resolve organization brand from host / org id.
 */

import { BrandRegistry } from "./BrandRegistry";
import { platformDefaultBrand } from "./defaults";
import {
  DEFAULT_ROOT_DOMAIN,
  type OrganizationBrand,
} from "./types";

function parseHostInput(host: string): { hostname: string; search: string } {
  const trimmed = host.trim();
  if (!trimmed) return { hostname: "", search: "" };

  try {
    if (trimmed.includes("://")) {
      const u = new URL(trimmed);
      return {
        hostname: u.hostname.toLowerCase(),
        search: u.search.startsWith("?") ? u.search.slice(1) : u.search,
      };
    }
  } catch {
    // Fall through to host?query parsing.
  }

  const qIndex = trimmed.indexOf("?");
  const hostPart = (qIndex >= 0 ? trimmed.slice(0, qIndex) : trimmed).toLowerCase();
  const search = qIndex >= 0 ? trimmed.slice(qIndex + 1) : "";
  const hostname = hostPart.split(":")[0] ?? "";
  return { hostname, search };
}

/**
 * True for the JAG platform apex / www hosts (`thejag.org`, `www.thejag.org`).
 * Tenant subdomains (`academy.thejag.org`) and localhost/preview are false.
 */
export function isJagPlatformApexHost(host: string | null | undefined): boolean {
  if (!host?.trim()) return false;
  const { hostname: bare } = parseHostInput(host);
  if (!bare) return false;
  const root = DEFAULT_ROOT_DOMAIN;
  return bare === root || bare === `www.${root}`;
}

/**
 * Extract tenant subdomain from `*.thejag.org` hosts,
 * or from `?subdomain=` / `?org=` on localhost.
 */
export function extractSubdomainFromHost(host: string): string | null {
  const { hostname: bare, search } = parseHostInput(host);
  if (!bare) return null;

  const root = DEFAULT_ROOT_DOMAIN;
  if (isJagPlatformApexHost(bare)) return null;

  if (bare.endsWith(`.${root}`)) {
    const sub = bare.slice(0, -(root.length + 1));
    const first = sub.split(".")[0]?.trim();
    if (!first || first === "www" || first === "app") return null;
    return first;
  }

  if (
    bare === "localhost" ||
    bare === "127.0.0.1" ||
    bare.endsWith(".localhost")
  ) {
    if (search) {
      const params = new URLSearchParams(search);
      const fromQuery =
        params.get("subdomain") ?? params.get("org") ?? params.get("brand");
      if (fromQuery?.trim()) return fromQuery.trim().toLowerCase();
    }
    if (bare.endsWith(".localhost")) {
      const sub = bare.slice(0, -".localhost".length).split(".")[0];
      return sub || null;
    }
  }

  return null;
}

export function resolveFromHost(host: string): OrganizationBrand {
  const subdomain = extractSubdomainFromHost(host);
  if (subdomain) {
    const bySub = BrandRegistry.getBySubdomain(subdomain);
    if (bySub) return bySub;
  }

  // Reserved for future custom-domain mapping (apex / CNAME).
  const custom = resolveFromCustomDomain(host);
  if (custom) return custom;

  return resolveDefault();
}

export function resolveByOrganizationId(
  organizationId: string
): OrganizationBrand {
  return (
    BrandRegistry.getByOrganizationId(organizationId) ?? resolveDefault()
  );
}

/** Platform brand — The JAG™ itself (powered_by_enabled false). */
export function resolveDefault(): OrganizationBrand {
  return platformDefaultBrand();
}

/**
 * Future custom domains: map apex / CNAME hosts to organization brands.
 * Reserved hook — not implemented this sprint.
 */
export function resolveFromCustomDomain(_host: string): OrganizationBrand | null {
  // Reserved: look up verified custom domains → organization_id.
  return null;
}

export const BrandResolver = {
  resolveFromHost,
  resolveByOrganizationId,
  resolveDefault,
  resolveFromCustomDomain,
  extractSubdomainFromHost,
  isJagPlatformApexHost,
};
