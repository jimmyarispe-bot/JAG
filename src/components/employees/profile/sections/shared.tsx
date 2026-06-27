import { ProfileSectionPlaceholder } from "@/components/platform/profile-workspace/ProfileSectionPlaceholder";

export function pickEmployeeProfile(employee: Record<string, unknown> | null | undefined) {
  if (!employee) return null;
  const ep = employee.employee_profiles;
  return (Array.isArray(ep) ? ep[0] : ep) as Record<string, unknown> | null;
}

export function employeeSchoolName(employee: Record<string, unknown> | null | undefined): string {
  if (!employee) return "—";
  const school = employee.schools as { name?: string } | { name?: string }[] | null;
  return Array.isArray(school) ? (school[0]?.name ?? "—") : (school?.name ?? "—");
}

export function formatLabel(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value).replace(/_/g, " ");
}

export function missingSection(title: string, status: "live" | "partial" | "placeholder" = "live") {
  return <ProfileSectionPlaceholder title={title} status={status} />;
}

export function positionTitle(row: Record<string, unknown>): string {
  const positions = row.positions as { title?: string; department?: string } | null;
  return positions?.title ?? "—";
}

export function courseSectionLabel(row: Record<string, unknown>): string {
  const courses = row.courses as { name?: string } | null;
  const code = row.section_code as string | undefined;
  return [courses?.name, code].filter(Boolean).join(" · ") || "Section";
}

export function sessionLabel(row: Record<string, unknown>): string {
  const sections = row.course_sections as
    | { section_code?: string; courses?: { name?: string } }
    | { section_code?: string; courses?: { name?: string } }[]
    | null;
  const section = Array.isArray(sections) ? sections[0] : sections;
  const course = section?.courses;
  const courseName = course && !Array.isArray(course) ? course.name : undefined;
  const start = row.scheduled_start as string | undefined;
  return [courseName, section?.section_code, start ? new Date(start).toLocaleString() : null]
    .filter(Boolean)
    .join(" · ");
}
