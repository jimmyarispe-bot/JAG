import { registerProfileSectionModule } from "@/lib/platform/profile/sections";
import type { ProfileSectionComponent } from "@/lib/platform/profile/sections/types";
import {
  AdmissionsSection,
  AcademicsSection,
  AiInsightsSection,
  AttendanceSection,
  AuditSection,
  BehaviorSection,
  BillingSection,
  CommunicationsSection,
  ComplianceSection,
  DocumentsSection,
  EnrollmentSection,
  FamilySection,
  IdentitySection,
  MapNweaSection,
  MedicalSection,
  OverviewSection,
  ParentEngagementSection,
  ProgressSection,
  SchedulingSection,
  ScholarshipsSection,
  SpecialEdSection,
  TherapySection,
  TimelineSection,
  TransportationSection,
} from "@/components/students/profile/sections/StudentSectionViews";
import { STUDENT_PROFILE_SECTIONS } from "@/lib/students/profile/sections";

const SECTION_VERSION = "1.0.0";

const SECTION_COMPONENTS: Record<string, ProfileSectionComponent> = {
  overview: OverviewSection,
  identity: IdentitySection,
  admissions: AdmissionsSection,
  enrollment: EnrollmentSection,
  academics: AcademicsSection,
  progress: ProgressSection,
  "map-nwea": MapNweaSection,
  attendance: AttendanceSection,
  behavior: BehaviorSection,
  scheduling: SchedulingSection,
  "special-ed": SpecialEdSection,
  therapy: TherapySection,
  medical: MedicalSection,
  family: FamilySection,
  billing: BillingSection,
  scholarships: ScholarshipsSection,
  transportation: TransportationSection,
  documents: DocumentsSection,
  compliance: ComplianceSection,
  communications: CommunicationsSection,
  "parent-engagement": ParentEngagementSection,
  "ai-insights": AiInsightsSection,
  timeline: TimelineSection,
  audit: AuditSection,
};

/** Register all student profile section modules (metadata + loader + component). */
export function registerStudentProfileSectionModules(): void {
  for (const def of STUDENT_PROFILE_SECTIONS) {
    const component = SECTION_COMPONENTS[def.key];
    if (!component) continue;

    registerProfileSectionModule({
      kind: "student",
      definition: {
        ...def,
        version: SECTION_VERSION,
        componentId: `student:${def.key}`,
      },
      component,
    });
  }
}
