/**
 * AcademyOS seed metadata — no platform assumptions, no DB writes here.
 * Bootstrap data definitions only; loaders may consume later.
 */

export type AcademySeedBundle = {
  id: string;
  applicationId: string;
  version: string;
  description: string;
  entities: Array<{
    entityType: string;
    records: Array<Record<string, unknown>>;
  }>;
};

const registry = new Map<string, AcademySeedBundle>();

export function resetAcademySeedForTests(): void {
  registry.clear();
}

export const ACADEMYOS_SEED: AcademySeedBundle = {
  id: "academyos.seed.demo",
  applicationId: "academyos",
  version: "1.0.0",
  description: "Minimal demo seed for AcademyOS (definitions only)",
  entities: [
    {
      entityType: "Organization",
      records: [
        {
          id: "seed-org-1",
          displayName: "Demo Academy Network",
          status: "active",
        },
      ],
    },
    {
      entityType: "School",
      records: [
        {
          id: "seed-school-1",
          displayName: "Demo Academy",
          code: "DEMO-01",
          organizationId: "seed-org-1",
          status: "active",
        },
      ],
    },
    {
      entityType: "Program",
      records: [
        {
          id: "seed-program-1",
          displayName: "Core Academics",
          schoolId: "seed-school-1",
          code: "CORE",
          status: "active",
        },
      ],
    },
  ],
};

export function registerAcademySeed(): AcademySeedBundle {
  registry.set(ACADEMYOS_SEED.id, structuredClone(ACADEMYOS_SEED));
  return getAcademySeed()!;
}

export function getAcademySeed(): AcademySeedBundle | null {
  return registry.get("academyos.seed.demo") ?? null;
}
