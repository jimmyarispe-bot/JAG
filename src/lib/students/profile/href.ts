/** Canonical student profile section URL — use instead of legacy ?tab= links. */
export function buildStudentProfileSectionHref(studentId: string, section: string): string {
  return `/dashboard/students/${studentId}?section=${encodeURIComponent(section)}`;
}
