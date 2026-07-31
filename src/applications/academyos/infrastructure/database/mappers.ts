import type { DatabaseRow } from "@/applications/academyos/infrastructure/database/types";

export function toSnakeStudent(row: {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  schoolId?: string | null;
  familyId?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}): DatabaseRow {
  return {
    id: row.id,
    display_name: row.displayName,
    first_name: row.firstName,
    last_name: row.lastName,
    email: row.email ?? null,
    school_id: row.schoolId ?? null,
    family_id: row.familyId ?? null,
    status: row.status,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function fromSnakeStudent(row: DatabaseRow) {
  return {
    id: String(row.id),
    displayName: String(row.display_name ?? ""),
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    email: (row.email as string | null) ?? null,
    schoolId: (row.school_id as string | null) ?? null,
    familyId: (row.family_id as string | null) ?? null,
    status: String(row.status ?? "active"),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function pickString(row: DatabaseRow, key: string, fallback = ""): string {
  const value = row[key];
  return value == null ? fallback : String(value);
}

export function pickNullableString(
  row: DatabaseRow,
  key: string
): string | null {
  const value = row[key];
  return value == null ? null : String(value);
}
