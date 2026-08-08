/**
 * Phase 65E — Resolve workspace/org query values from searchParams-capable surfaces.
 *
 * Source of truth for the query string is NextRequest / page `searchParams`.
 * Middleware mirrors those values onto dedicated request headers so the /jag
 * shell layout can read them without reconstructing URLs via `x-url`.
 */

import { JAG_WORKSPACE_QUERY_PARAM } from "@/lib/jag-platform/workspace-mode";

/** Dedicated request header — value is the raw `workspace` query (e.g. "platform"). */
export const JAG_WORKSPACE_HEADER = "x-jag-workspace" as const;

/** Dedicated request header — value is the raw `org` query. */
export const JAG_ORG_HEADER = "x-jag-org" as const;

function firstString(
  value: string | string[] | undefined | null
): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry !== "string") continue;
      const trimmed = entry.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
}

/** Read workspace from a page/server `searchParams` object or URLSearchParams. */
export function workspaceParamFromSearchParams(
  searchParams:
    | URLSearchParams
    | Readonly<Record<string, string | string[] | undefined>>
): string | null {
  if (searchParams instanceof URLSearchParams) {
    return firstString(searchParams.get(JAG_WORKSPACE_QUERY_PARAM));
  }
  return firstString(searchParams[JAG_WORKSPACE_QUERY_PARAM]);
}

/** Read org from a page/server `searchParams` object or URLSearchParams. */
export function orgParamFromSearchParams(
  searchParams:
    | URLSearchParams
    | Readonly<Record<string, string | string[] | undefined>>
): string | null {
  if (searchParams instanceof URLSearchParams) {
    return firstString(searchParams.get("org"));
  }
  return firstString(searchParams.org);
}

/** Read mirrored workspace query from request headers (set by middleware). */
export function workspaceParamFromRequestHeaders(
  headerStore: Headers
): string | null {
  return firstString(headerStore.get(JAG_WORKSPACE_HEADER));
}

/** Read mirrored org query from request headers (set by middleware). */
export function orgParamFromRequestHeaders(headerStore: Headers): string | null {
  return firstString(headerStore.get(JAG_ORG_HEADER));
}
