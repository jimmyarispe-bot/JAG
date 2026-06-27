/** Canonical employee profile section URL. */
export function buildEmployeeProfileSectionHref(
  employeeId: string,
  section: string
): string {
  return `/dashboard/hr/employees/${employeeId}?section=${encodeURIComponent(section)}`;
}
