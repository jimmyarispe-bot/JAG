/**
 * JAG Global Search — server-side, authorization-aware.
 *
 * Catalog is built from session-scoped sources (loadJagSearchCatalog).
 * Query matching and financial gating run on the server before results
 * are returned to the client. Never trust client-side filtering alone.
 */

import {
  authorize,
  type AuthzSnapshot,
} from "@/lib/platform/identity/authorization-service";
import { authorizeJagEntry } from "@/lib/platform/identity/founder-protection";
import {
  FINANCE_ENTRY_PERMISSION,
  isFinancialSecurityRoute,
} from "@/lib/platform/identity/financial-security";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import type { JagWorkspaceMode } from "@/lib/jag-platform/workspace-mode";
import { loadJagSearchCatalog } from "./search-catalog";
import {
  filterJagSearchCatalog,
  type JagSearchItem,
  type JagSearchItemKind,
} from "./search-filter";

/** Minimum characters before non-empty search executes (empty → nav defaults). */
export const JAG_GLOBAL_SEARCH_MIN_QUERY_LENGTH = 1;
export const JAG_GLOBAL_SEARCH_MAX_QUERY_LENGTH = 120;
export const JAG_GLOBAL_SEARCH_RESULT_LIMIT = 24;

export type JagSearchResult = {
  readonly id: string;
  readonly title: string;
  readonly type: JagSearchItemKind;
  readonly domain: string;
  readonly href: string;
  readonly description?: string;
};

export type JagSearchResultGroup = {
  readonly domain: string;
  readonly results: readonly JagSearchResult[];
};

export type JagGlobalSearchSuccess = {
  readonly ok: true;
  readonly query: string;
  readonly results: readonly JagSearchResult[];
  readonly groups: readonly JagSearchResultGroup[];
};

export type JagGlobalSearchFailure = {
  readonly ok: false;
  readonly error: "unauthorized" | "invalid_query";
};

export type JagGlobalSearchResponse =
  | JagGlobalSearchSuccess
  | JagGlobalSearchFailure;

const DOMAIN_BY_KIND: Record<JagSearchItemKind, string> = {
  navigation: "Navigate",
  decision: "Decisions",
  briefing: "Briefings",
  organization: "Organization",
  capability_pack: "Capabilities",
  capability: "Capabilities",
  domain: "Domains",
  contributor: "Intelligence",
  knowledge: "Knowledge",
  policy: "Policies",
  reasoning: "Intelligence",
  evidence: "Intelligence",
  goal: "Strategy",
};

export function domainForJagSearchKind(kind: JagSearchItemKind): string {
  return DOMAIN_BY_KIND[kind] ?? "JAG";
}

export function sanitizeJagSearchQuery(raw: string): string | null {
  if (typeof raw !== "string") return null;
  // Strip control characters; keep readable text.
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (cleaned.length > JAG_GLOBAL_SEARCH_MAX_QUERY_LENGTH) return null;
  return cleaned;
}

function itemTouchesFinance(item: JagSearchItem): boolean {
  const href = item.href ?? "";
  const qIndex = href.indexOf("?");
  const path = qIndex >= 0 ? href.slice(0, qIndex) : href;
  const search = qIndex >= 0 ? href.slice(qIndex) : "";
  if (isFinancialSecurityRoute(path, search)) return true;
  const hay = `${item.title} ${item.subtitle} ${item.href}`.toLowerCase();
  // Defense in depth for finance surfaces that may not match route helpers yet.
  return (
    hay.includes("/dashboard/finance") ||
    hay.includes("/accounting") ||
    hay.includes("/payroll") ||
    hay.includes("/banking")
  );
}

export function toJagSearchResult(item: JagSearchItem): JagSearchResult {
  return {
    id: item.id,
    title: item.title,
    type: item.kind,
    domain: domainForJagSearchKind(item.kind),
    href: item.href,
    description: item.subtitle || undefined,
  };
}

export function groupJagSearchResults(
  results: readonly JagSearchResult[]
): readonly JagSearchResultGroup[] {
  const order: string[] = [];
  const map = new Map<string, JagSearchResult[]>();
  for (const result of results) {
    const key = result.domain;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(result);
  }
  return order.map((domain) => ({
    domain,
    results: map.get(domain) ?? [],
  }));
}

/**
 * Apply financial security: drop finance-touching items unless FINANCE_ACCESS.
 * Fail closed when authz is unavailable.
 */
export function applyJagSearchFinanceGate(
  items: readonly JagSearchItem[],
  authz: AuthzSnapshot | null | undefined
): readonly JagSearchItem[] {
  const maySeeFinance =
    authz != null && authorize(authz, FINANCE_ENTRY_PERMISSION);
  if (maySeeFinance) return items;
  return items.filter((item) => !itemTouchesFinance(item));
}

/**
 * Canonical JAG global search. Authorization before results.
 */
export function searchJagGlobal(input: {
  readonly session: JagPlatformSession | null;
  readonly query: string;
  readonly workspaceMode?: JagWorkspaceMode;
  /** When provided, must pass authorizeJagEntry; also drives FINANCE_ACCESS. */
  readonly authz?: AuthzSnapshot | null;
  readonly limit?: number;
}): JagGlobalSearchResponse {
  const session = input.session;
  if (!session?.userId) {
    return { ok: false, error: "unauthorized" };
  }

  if (input.authz) {
    if (!authorizeJagEntry(input.authz)) {
      return { ok: false, error: "unauthorized" };
    }
  }

  const sanitized = sanitizeJagSearchQuery(input.query);
  if (sanitized === null) {
    return { ok: false, error: "invalid_query" };
  }

  const workspaceMode =
    input.workspaceMode ??
    (session.authority === "platform" ? "platform" : "customer");

  const catalog = loadJagSearchCatalog(session, workspaceMode);
  const financeSafe = applyJagSearchFinanceGate(catalog, input.authz ?? null);
  const matched = filterJagSearchCatalog(
    financeSafe,
    sanitized,
    input.limit ?? JAG_GLOBAL_SEARCH_RESULT_LIMIT
  );

  // Deduplicate by id + href.
  const seen = new Set<string>();
  const results: JagSearchResult[] = [];
  for (const item of matched) {
    const key = `${item.id}|${item.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // Never return non-/jag destinations from JAG global search.
    if (!item.href.startsWith("/jag")) continue;
    results.push(toJagSearchResult(item));
  }

  return {
    ok: true,
    query: sanitized,
    results,
    groups: groupJagSearchResults(results),
  };
}
