import { registerProfileSectionModule } from "@/lib/platform/profile/sections";
import type { ProfileSectionComponent } from "@/lib/platform/profile/sections/types";
import { ADMISSIONS_CASE_PROFILE_SECTIONS } from "@/lib/admissions/profile/sections";

// Static imports only. These section views are "use client" modules; a dynamic
// import() from a Server Component yields the SSR module rather than a client
// reference, and rendering it throws "Attempted to call X() from the server but
// X is on the client." Static imports let the bundler emit proper client
// references. Client-side code splitting is still handled by Next.
import { OverviewSection } from "@/components/admissions/case/sections/OverviewSection";
import { ProspectSection } from "@/components/admissions/case/sections/ProspectSection";
import { InterestFormSection } from "@/components/admissions/case/sections/InterestFormSection";
import { StudentQuestionnaireSection } from "@/components/admissions/case/sections/StudentQuestionnaireSection";
import { PipelineSection } from "@/components/admissions/case/sections/PipelineSection";
import { ApplicationsSection } from "@/components/admissions/case/sections/ApplicationsSection";
import { DocumentsSection } from "@/components/admissions/case/sections/DocumentsSection";
import { VisitsSection } from "@/components/admissions/case/sections/VisitsSection";
import { CommunicationsSection } from "@/components/admissions/case/sections/CommunicationsSection";
import { TasksSection } from "@/components/admissions/case/sections/TasksSection";
import { ScholarshipsSection } from "@/components/admissions/case/sections/ScholarshipsSection";
import { DecisionsSection } from "@/components/admissions/case/sections/DecisionsSection";
import { EnrollmentSection } from "@/components/admissions/case/sections/EnrollmentSection";
import { NotesSection } from "@/components/admissions/case/sections/NotesSection";
import { ActivitySection } from "@/components/admissions/case/sections/ActivitySection";
import { RelationshipsSection } from "@/components/admissions/case/sections/RelationshipsSection";

const SECTION_VERSION = "1.0.0";

const SECTION_COMPONENTS: Record<string, ProfileSectionComponent> = {
  overview: OverviewSection,
  prospect: ProspectSection,
  interest_form: InterestFormSection,
  student_questionnaire: StudentQuestionnaireSection,
  pipeline: PipelineSection,
  applications: ApplicationsSection,
  documents: DocumentsSection,
  visits: VisitsSection,
  communications: CommunicationsSection,
  tasks: TasksSection,
  scholarships: ScholarshipsSection,
  decisions: DecisionsSection,
  enrollment: EnrollmentSection,
  notes: NotesSection,
  activity: ActivitySection,
  relationships: RelationshipsSection,
};

/** Register all admissions case profile section modules. */
export function registerAdmissionsCaseProfileSectionModules(): void {
  for (const def of ADMISSIONS_CASE_PROFILE_SECTIONS) {
    const component = SECTION_COMPONENTS[def.key];

    /*
     * A defined section with no component here is skipped SILENTLY, and that
     * silence is expensive.
     *
     * 17 September 2026: the Interest Form section was defined in
     * ADMISSIONS_CASE_PROFILE_SECTIONS and given a case in
     * AdmissionsCaseSectionSwitch, shipped, deployed Ready to production - and
     * did not exist. No tab, no error, no warning. getProfileSections reads this
     * registry, this loop skipped the section because SECTION_COMPONENTS had no
     * entry, and nothing anywhere said so.
     *
     * There are THREE lists that must agree, not the two the comment in the
     * switch describes. case-sections-registered.test.ts now checks all three,
     * which is the real guard. This warning is for the case where something
     * reaches production anyway: a line in the log beats a silent skip.
     */
    if (!component) {
      console.warn(
        `[admissions-case] section "${def.key}" is defined but has no component in ` +
          "SECTION_COMPONENTS (register-modules.ts). It will not appear as a tab."
      );
      continue;
    }

    registerProfileSectionModule({
      kind: "admissions_case",
      definition: {
        ...def,
        version: SECTION_VERSION,
        componentId: `admissions_case:${def.key}`,
      },
      component,
    });
  }
}
