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
