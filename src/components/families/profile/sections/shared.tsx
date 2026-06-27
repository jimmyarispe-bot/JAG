import { ProfileSectionPlaceholder } from "@/components/platform/profile-workspace/ProfileSectionPlaceholder";

export function formatLabel(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value).replace(/_/g, " ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function missingSection(title: string, status: "live" | "partial" | "placeholder" = "live") {
  return <ProfileSectionPlaceholder title={title} status={status} />;
}

export function nestedName(
  value: unknown,
  keys: { first?: string; last?: string } = { first: "first_name", last: "last_name" }
): string {
  const row = value as Record<string, unknown> | null;
  if (!row) return "—";
  const nested = row.students as Record<string, unknown> | Record<string, unknown>[] | null;
  const student = Array.isArray(nested) ? nested[0] : nested;
  if (student) {
    return `${student[keys.first ?? "first_name"] ?? ""} ${student[keys.last ?? "last_name"] ?? ""}`.trim();
  }
  return `${row[keys.first ?? "first_name"] ?? ""} ${row[keys.last ?? "last_name"] ?? ""}`.trim() || "—";
}

export function campusName(student: Record<string, unknown>): string {
  const campuses = student.campuses as { name?: string } | { name?: string }[] | null;
  return Array.isArray(campuses) ? (campuses[0]?.name ?? "—") : (campuses?.name ?? "—");
}

export function latestEnrollment(student: Record<string, unknown>): string {
  const enrollments = student.sis_enrollments as
    | Record<string, unknown>[]
    | Record<string, unknown>
    | null;
  const list = Array.isArray(enrollments) ? enrollments : enrollments ? [enrollments] : [];
  const latest = list[0];
  if (!latest) return formatLabel(student.enrollment_status);
  const year = latest.school_years as { name?: string } | { name?: string }[] | null;
  const yearName = Array.isArray(year) ? year[0]?.name : year?.name;
  return [formatLabel(latest.enrollment_status), formatLabel(latest.program), yearName]
    .filter((part) => part !== "—")
    .join(" · ");
}

export function jsonList(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "None recorded";
  return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join(", ");
}
