/** Canonical family profile section URL. */
export function buildFamilyProfileSectionHref(familyId: string, section: string): string {
  return `/dashboard/families/${familyId}?section=${encodeURIComponent(section)}`;
}
