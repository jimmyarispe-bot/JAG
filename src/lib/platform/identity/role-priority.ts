import type { EduRoleName } from "@/types/database";

/**
 * Prefer operating roles over the auth-trigger default TEAM_MEMBER
 * when selecting a display / primary role.
 */
const ROLE_PRIORITY: Record<string, number> = {
  FOUNDER: 100,
  CEO: 90,
  EXECUTIVE_DIRECTOR: 80,
  REGIONAL_DIRECTOR: 70,
  SCHOOL_LEADER: 60,
  ADMINISTRATOR: 55,
  ADMISSIONS: 50,
  FINANCE: 50,
  ACCOUNTING: 50,
  HR: 50,
  BOARD_MEMBER: 40,
  TEACHER: 30,
  EMPLOYEE: 20,
  PARENT: 15,
  STUDENT: 10,
  TEAM_MEMBER: 1,
};

export function pickPrimaryRole(roles: readonly EduRoleName[]): EduRoleName | null {
  if (!roles.length) return null;
  let best: EduRoleName = roles[0]!;
  let bestScore = ROLE_PRIORITY[best] ?? 0;
  for (const role of roles.slice(1)) {
    const score = ROLE_PRIORITY[role] ?? 0;
    if (score > bestScore) {
      best = role;
      bestScore = score;
    }
  }
  return best;
}
