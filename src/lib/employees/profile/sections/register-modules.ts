import { registerProfileSectionModule } from "@/lib/platform/profile/sections";
import type { ProfileSectionComponent } from "@/lib/platform/profile/sections/types";
import {
  CompensationSection,
  EmploymentInformationSection,
  BenefitsSection,
  NotesSection,
  OverviewSection,
} from "@/components/employees/profile/sections/overview-employment";
import {
  DepartmentSection,
  PositionSection,
  ScheduleSection,
  SchoolsSection,
  SupervisorSection,
  WorkAssignmentsSection,
} from "@/components/employees/profile/sections/employment-placement";
import {
  AiInsightsSection,
  CertificationsSection,
  LicensesSection,
  PayrollSection,
  PerformanceReviewsSection,
  ProfessionalDevelopmentSection,
  PtoSection,
} from "@/components/employees/profile/sections/hr-intelligence";
import {
  ActivitySection,
  AuditSection,
  ClassesSection,
  CommunicationsSection,
  ComplianceSection,
  DirectReportsSection,
  DocumentsSection,
  StudentsSection,
  TeamsSection,
  TimesheetsSection,
} from "@/components/employees/profile/sections/operations-relationships";
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

const SECTION_COMPONENTS: Record<string, ProfileSectionComponent> = {
  overview: OverviewSection,
  "employment-information": EmploymentInformationSection,
  position: PositionSection,
  department: DepartmentSection,
  supervisor: SupervisorSection,
  schools: SchoolsSection,
  schedule: ScheduleSection,
  "work-assignments": WorkAssignmentsSection,
  compensation: CompensationSection,
  payroll: PayrollSection,
  pto: PtoSection,
  benefits: BenefitsSection,
  "performance-reviews": PerformanceReviewsSection,
  certifications: CertificationsSection,
  licenses: LicensesSection,
  "professional-development": ProfessionalDevelopmentSection,
  timesheets: TimesheetsSection,
  documents: DocumentsSection,
  compliance: ComplianceSection,
  notes: NotesSection,
  activity: ActivitySection,
  communications: CommunicationsSection,
  "direct-reports": DirectReportsSection,
  teams: TeamsSection,
  classes: ClassesSection,
  students: StudentsSection,
  "ai-insights": AiInsightsSection,
  audit: AuditSection,
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
    const component = SECTION_COMPONENTS[def.key];
    if (!component) continue;

    registerProfileSectionModule({
      kind: "employee",
      definition: {
        ...def,
        version: SECTION_VERSION,
        componentId: `employee:${def.key}`,
        loadContributions: SECTION_CONTRIBUTIONS[def.key],
      },
      component,
    });
  }
}
