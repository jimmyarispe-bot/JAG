/** Parse section from URL search params — supports canonical `section` and legacy `tab`. */
export function parseProfileSectionParam(
  searchParams: { section?: string; tab?: string },
  legacyRedirects?: Record<string, string>
): string | undefined {
  if (searchParams.section) return searchParams.section;
  if (searchParams.tab) {
    return legacyRedirects?.[searchParams.tab] ?? searchParams.tab;
  }
  return undefined;
}

/** Redirect legacy `?tab=` bookmarks to canonical `?section=` URLs. */
export function buildLegacyProfileSectionRedirectUrl(
  basePath: string,
  entityId: string,
  searchParams: { section?: string; tab?: string },
  legacyRedirects?: Record<string, string>
): string | null {
  if (searchParams.section || !searchParams.tab) return null;
  const canonical = parseProfileSectionParam(searchParams, legacyRedirects);
  if (!canonical) return null;
  return `${basePath}/${entityId}?section=${encodeURIComponent(canonical)}`;
}
