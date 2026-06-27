import { registerProfileSectionModule } from "@/lib/platform/profile/sections";
import type { ProfileSectionComponent } from "@/lib/platform/profile/sections/types";
import {
  loadActivityContributions,
  loadCertificationsContributions,
  loadComplianceContributions,
  loadNotesContributions,
  loadOverviewContributions,
} from "@/components/employees/profile/sections/section-contributions";
import { EMPLOYEE_PROFILE_SECTIONS } from "@/lib/employees/profile/sections";
import type { ProfileSectionModuleDefinition } from "@/lib/platform/profile/sections/types";

const SECTION_VERSION = "1.0.0";

const SECTION_COMPONENT_LOADERS: Record<string, () => Promise<ProfileSectionComponent>> = {
  overview: () =>
    import("@/components/employees/profile/sections/overview-employment").then(
      (module) => module.OverviewSection
    ),
  "employment-information": () =>
    import("@/components/employees/profile/sections/overview-employment").then(
      (module) => module.EmploymentInformationSection
    ),
  compensation: () =>
    import("@/components/employees/profile/sections/overview-employment").then(
      (module) => module.CompensationSection
    ),
  benefits: () =>
    import("@/components/employees/profile/sections/overview-employment").then(
      (module) => module.BenefitsSection
    ),
  notes: () =>
    import("@/components/employees/profile/sections/overview-employment").then(
      (module) => module.NotesSection
    ),
  position: () =>
    import("@/components/employees/profile/sections/employment-placement").then(
      (module) => module.PositionSection
    ),
  department: () =>
    import("@/components/employees/profile/sections/employment-placement").then(
      (module) => module.DepartmentSection
    ),
  supervisor: () =>
    import("@/components/employees/profile/sections/employment-placement").then(
      (module) => module.SupervisorSection
    ),
  schools: () =>
    import("@/components/employees/profile/sections/employment-placement").then(
      (module) => module.SchoolsSection
    ),
  schedule: () =>
    import("@/components/employees/profile/sections/employment-placement").then(
      (module) => module.ScheduleSection
    ),
  "work-assignments": () =>
    import("@/components/employees/profile/sections/employment-placement").then(
      (module) => module.WorkAssignmentsSection
    ),
  payroll: () =>
    import("@/components/employees/profile/sections/hr-intelligence").then(
      (module) => module.PayrollSection
    ),
  pto: () =>
    import("@/components/employees/profile/sections/hr-intelligence").then(
      (module) => module.PtoSection
    ),
  "performance-reviews": () =>
    import("@/components/employees/profile/sections/hr-intelligence").then(
      (module) => module.PerformanceReviewsSection
    ),
  certifications: () =>
    import("@/components/employees/profile/sections/hr-intelligence").then(
      (module) => module.CertificationsSection
    ),
  licenses: () =>
    import("@/components/employees/profile/sections/hr-intelligence").then(
      (module) => module.LicensesSection
    ),
  "professional-development": () =>
    import("@/components/employees/profile/sections/hr-intelligence").then(
      (module) => module.ProfessionalDevelopmentSection
    ),
  "ai-insights": () =>
    import("@/components/employees/profile/sections/hr-intelligence").then(
      (module) => module.AiInsightsSection
    ),
  timesheets: () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.TimesheetsSection
    ),
  documents: () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.DocumentsSection
    ),
  compliance: () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.ComplianceSection
    ),
  activity: () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.ActivitySection
    ),
  communications: () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.CommunicationsSection
    ),
  "direct-reports": () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.DirectReportsSection
    ),
  teams: () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.TeamsSection
    ),
  classes: () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.ClassesSection
    ),
  students: () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.StudentsSection
    ),
  audit: () =>
    import("@/components/employees/profile/sections/operations-relationships").then(
      (module) => module.AuditSection
    ),
};

const SECTION_CONTRIBUTIONS: Partial<
  Record<string, ProfileSectionModuleDefinition["loadContributions"]>
> = {
  overview: loadOverviewContributions,
  certifications: loadCertificationsContributions,
  compliance: loadComplianceContributions,
  notes: loadNotesContributions,
  activity: loadActivityContributions,
};

/** Register all employee profile section modules (metadata + loader + component). */
export function registerEmployeeProfileSectionModules(): void {
  for (const def of EMPLOYEE_PROFILE_SECTIONS) {
    const componentLoader = SECTION_COMPONENT_LOADERS[def.key];
    if (!componentLoader) continue;

    registerProfileSectionModule({
      kind: "employee",
      definition: {
        ...def,
        version: SECTION_VERSION,
        componentId: `employee:${def.key}`,
        loadContributions: SECTION_CONTRIBUTIONS[def.key],
      },
      componentLoader,
    });
  }
}
