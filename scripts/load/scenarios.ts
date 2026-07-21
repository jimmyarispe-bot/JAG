/**
 * RC-2 — repeatable load scenarios by product domain.
 */

export type ScenarioDef = {
  id: string;
  name: string;
  domain: string;
  path: string;
  /** When true, 302/401 without session is acceptable for infra measurement. */
  allowUnauthGate?: boolean;
  /** Prefer authenticated cookie when available. */
  requiresAuth?: boolean;
  weight?: number;
};

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "auth.login",
    name: "Authentication — login page",
    domain: "authentication",
    path: "/login",
  },
  {
    id: "auth.health",
    name: "Authentication — health canary",
    domain: "authentication",
    path: "/api/health",
  },
  {
    id: "exec.home",
    name: "Executive Command Center",
    domain: "executive_command_center",
    path: "/exec",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "exec.brief",
    name: "ECC Brief",
    domain: "executive_command_center",
    path: "/exec/brief",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "intel.executive",
    name: "Executive Intelligence",
    domain: "executive_intelligence",
    path: "/dashboard/executive",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "intel.decisions",
    name: "Executive Decisions",
    domain: "executive_intelligence",
    path: "/dashboard/executive/decisions",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "admissions.home",
    name: "Admissions",
    domain: "admissions",
    path: "/dashboard/admissions",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "sis.students",
    name: "SIS — Students",
    domain: "sis",
    path: "/dashboard/students",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "scheduling.home",
    name: "Scheduling",
    domain: "scheduling",
    path: "/dashboard/scheduling",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "teacher.home",
    name: "Teacher Workspace",
    domain: "teacher",
    path: "/dashboard/teacher",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "finance.home",
    name: "Finance",
    domain: "finance",
    path: "/dashboard/finance",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "hr.home",
    name: "HR",
    domain: "hr",
    path: "/dashboard/hr",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "integrations.home",
    name: "Integrations",
    domain: "integrations",
    path: "/dashboard/integrations",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "integrations.exec",
    name: "Exec Integrations",
    domain: "integrations",
    path: "/exec/integrations",
    allowUnauthGate: true,
    requiresAuth: true,
  },
  {
    id: "ops.ready",
    name: "Readiness probe",
    domain: "ops",
    path: "/api/ready",
  },
];

/** Concurrency ramp levels (Phase 2). Cap via LOAD_MAX_VUS. */
export const CONCURRENCY_LEVELS = [10, 50, 100, 250, 500] as const;

export function maxVus(): number {
  const raw = Number(process.env.LOAD_MAX_VUS ?? "100");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 100;
}

export function scenarioDurationMs(): number {
  const raw = Number(process.env.LOAD_SCENARIO_MS ?? "8000");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 8000;
}

export function rampDurationMs(): number {
  const raw = Number(process.env.LOAD_RAMP_MS ?? "10000");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 10000;
}
