/**
 * RC-5 — staging persona env contract (no passwords in repo).
 *
 * Per-role credentials:
 *   RC5_FOUNDER_EMAIL / RC5_FOUNDER_PASSWORD
 *   RC5_CEO_EMAIL / RC5_CEO_PASSWORD
 *   RC5_SCHOOL_LEADER_EMAIL / RC5_SCHOOL_LEADER_PASSWORD
 *   RC5_TEACHER_EMAIL / RC5_TEACHER_PASSWORD
 *   RC5_PARENT_EMAIL / RC5_PARENT_PASSWORD
 *   RC5_STUDENT_EMAIL / RC5_STUDENT_PASSWORD
 *   RC5_EMPLOYEE_EMAIL / RC5_EMPLOYEE_PASSWORD
 *
 * Optional shared cookie (single-role HTTP smoke): RC4_E2E_COOKIE / LOAD_TEST_COOKIE
 */

import type { RoleId } from "../acceptance/roles";

export type PersonaCreds = {
  role: RoleId;
  email: string;
  password: string;
};

const ROLE_ENV: Record<RoleId, { email: string; password: string }> = {
  founder: { email: "RC5_FOUNDER_EMAIL", password: "RC5_FOUNDER_PASSWORD" },
  ceo: { email: "RC5_CEO_EMAIL", password: "RC5_CEO_PASSWORD" },
  school_leader: {
    email: "RC5_SCHOOL_LEADER_EMAIL",
    password: "RC5_SCHOOL_LEADER_PASSWORD",
  },
  teacher: { email: "RC5_TEACHER_EMAIL", password: "RC5_TEACHER_PASSWORD" },
  parent: { email: "RC5_PARENT_EMAIL", password: "RC5_PARENT_PASSWORD" },
  student: { email: "RC5_STUDENT_EMAIL", password: "RC5_STUDENT_PASSWORD" },
  employee: { email: "RC5_EMPLOYEE_EMAIL", password: "RC5_EMPLOYEE_PASSWORD" },
};

export const RC5_ROLES: RoleId[] = [
  "founder",
  "ceo",
  "school_leader",
  "teacher",
  "parent",
  "student",
  "employee",
];

export function resolvePersonasFromEnv(
  env: NodeJS.ProcessEnv = process.env
): PersonaCreds[] {
  const out: PersonaCreds[] = [];
  for (const role of RC5_ROLES) {
    const keys = ROLE_ENV[role];
    const email = env[keys.email]?.trim();
    const password = env[keys.password]?.trim();
    if (email && password) out.push({ role, email, password });
  }
  return out;
}

export function authConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.RC4_E2E_COOKIE?.trim() || env.LOAD_TEST_COOKIE?.trim()) return true;
  return resolvePersonasFromEnv(env).length > 0;
}

export function storageStatePath(role: RoleId): string {
  return `playwright/.auth/${role}.json`;
}
