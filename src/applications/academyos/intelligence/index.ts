/**
 * Academy-specific intelligence packs — registrations only.
 * Platform Forecasting / Intelligence engines execute them later.
 */

export type AcademyIntelligenceDomain =
  | "admissions"
  | "enrollment"
  | "attendance"
  | "staffing"
  | "finance"
  | "academics"
  | "behavior"
  | "compliance";

export type AcademyIntelligencePack = {
  id: string;
  applicationId: string;
  title: string;
  domain: AcademyIntelligenceDomain;
  kpiKeys: string[];
  entityTypes: string[];
  version: string;
  metadata?: Record<string, unknown>;
};

const registry = new Map<string, AcademyIntelligencePack>();

export function resetAcademyIntelligenceForTests(): void {
  registry.clear();
}

function pack(input: {
  id: string;
  title: string;
  domain: AcademyIntelligenceDomain;
  kpiKeys: string[];
  entityTypes: string[];
}): AcademyIntelligencePack {
  return {
    ...input,
    applicationId: "academyos",
    version: "1.1.0",
    metadata: { deterministic: true, phase: "domain-completion" },
  };
}

/** Deterministic intelligence definitions (platform packs execute later). */
export const ACADEMYOS_INTELLIGENCE_PACKS: AcademyIntelligencePack[] = [
  pack({
    id: "academyos.intelligence.admissions",
    title: "Admissions Intelligence",
    domain: "admissions",
    kpiKeys: ["conversion_rate", "time_in_stage", "lost_opportunities"],
    entityTypes: ["Inquiry", "Application", "Student"],
  }),
  pack({
    id: "academyos.intelligence.enrollment",
    title: "Enrollment Intelligence",
    domain: "enrollment",
    kpiKeys: ["growth", "retention", "capacity"],
    entityTypes: ["Enrollment", "Student", "Section"],
  }),
  pack({
    id: "academyos.intelligence.attendance",
    title: "Attendance Intelligence",
    domain: "attendance",
    kpiKeys: ["attendance_rate", "chronic_absence", "present_today"],
    entityTypes: ["AttendanceRecord", "Student"],
  }),
  pack({
    id: "academyos.intelligence.finance",
    title: "Finance Intelligence",
    domain: "finance",
    kpiKeys: ["revenue", "outstanding_tuition", "scholarship_exposure"],
    entityTypes: ["Invoice", "Payment", "Scholarship", "LedgerEntry"],
  }),
  pack({
    id: "academyos.intelligence.staffing",
    title: "HR / Staffing Intelligence",
    domain: "staffing",
    kpiKeys: ["staffing_coverage", "pto", "payroll_trends"],
    entityTypes: ["Employee", "Teacher", "StaffAssignment", "PayrollBatch"],
  }),
  pack({
    id: "academyos.intelligence.academics",
    title: "Academics Intelligence",
    domain: "academics",
    kpiKeys: ["reading_mastery", "math_mastery", "attendance_correlation"],
    entityTypes: ["Assessment", "Gradebook", "AttendanceRecord", "Student"],
  }),
  pack({
    id: "academyos.intelligence.behavior",
    title: "Behavior Intelligence",
    domain: "behavior",
    kpiKeys: ["incident_rate", "open_incidents", "intervention_completion"],
    entityTypes: ["BehaviorIncident", "Intervention"],
  }),
  pack({
    id: "academyos.intelligence.compliance",
    title: "Compliance Intelligence",
    domain: "compliance",
    kpiKeys: ["iep_on_time", "plan504_on_time", "accommodation_coverage"],
    entityTypes: ["IEP", "Plan504", "Accommodation"],
  }),
];

export function registerAcademyIntelligence(): AcademyIntelligencePack[] {
  registry.clear();
  for (const item of ACADEMYOS_INTELLIGENCE_PACKS) {
    registry.set(item.id, {
      ...item,
      kpiKeys: [...item.kpiKeys],
      entityTypes: [...item.entityTypes],
      metadata: { ...(item.metadata ?? {}) },
    });
  }
  return listAcademyIntelligencePacks();
}

export function listAcademyIntelligencePacks(): AcademyIntelligencePack[] {
  return [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
}
