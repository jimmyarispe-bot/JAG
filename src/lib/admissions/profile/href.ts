/** Canonical admissions case profile section URL. */
export function buildAdmissionsCaseSectionHref(caseId: string, section: string): string {
  return `/dashboard/admissions/cases/${caseId}?section=${encodeURIComponent(section)}`;
}

/** Canonical admissions case workspace URL. */
export function buildAdmissionsCaseHref(caseId: string): string {
  return `/dashboard/admissions/cases/${caseId}`;
}
