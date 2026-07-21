import { registerProfileSectionModule } from "@/lib/platform/profile/sections";
import type { ProfileSectionComponent } from "@/lib/platform/profile/sections/types";
import type { ProfileSectionModuleDefinition } from "@/lib/platform/profile/sections/types";
import { ADMISSIONS_CASE_PROFILE_SECTIONS } from "@/lib/admissions/profile/sections";

const SECTION_VERSION = "1.0.0";

const SECTION_COMPONENT_LOADERS: Record<string, () => Promise<ProfileSectionComponent>> = {
  overview: () =>
    import("@/components/admissions/case/sections/OverviewSection").then(
      (m) => m.OverviewSection
    ),
  prospect: () =>
    import("@/components/admissions/case/sections/ProspectSection").then(
      (m) => m.ProspectSection
    ),
  pipeline: () =>
    import("@/components/admissions/case/sections/PipelineSection").then(
      (m) => m.PipelineSection
    ),
  applications: () =>
    import("@/components/admissions/case/sections/ApplicationsSection").then(
      (m) => m.ApplicationsSection
    ),
  documents: () =>
    import("@/components/admissions/case/sections/DocumentsSection").then(
      (m) => m.DocumentsSection
    ),
  visits: () =>
    import("@/components/admissions/case/sections/VisitsSection").then(
      (m) => m.VisitsSection
    ),
  communications: () =>
    import("@/components/admissions/case/sections/CommunicationsSection").then(
      (m) => m.CommunicationsSection
    ),
  tasks: () =>
    import("@/components/admissions/case/sections/TasksSection").then(
      (m) => m.TasksSection
    ),
  scholarships: () =>
    import("@/components/admissions/case/sections/ScholarshipsSection").then(
      (m) => m.ScholarshipsSection
    ),
  decisions: () =>
    import("@/components/admissions/case/sections/DecisionsSection").then(
      (m) => m.DecisionsSection
    ),
  enrollment: () =>
    import("@/components/admissions/case/sections/EnrollmentSection").then(
      (m) => m.EnrollmentSection
    ),
  notes: () =>
    import("@/components/admissions/case/sections/NotesSection").then(
      (m) => m.NotesSection
    ),
  activity: () =>
    import("@/components/admissions/case/sections/ActivitySection").then(
      (m) => m.ActivitySection
    ),
  relationships: () =>
    import("@/components/admissions/case/sections/RelationshipsSection").then(
      (m) => m.RelationshipsSection
    ),
};

/** Register all admissions case profile section modules with lazy-loaded UI. */
export function registerAdmissionsCaseProfileSectionModules(): void {
  for (const def of ADMISSIONS_CASE_PROFILE_SECTIONS) {
    const componentLoader = SECTION_COMPONENT_LOADERS[def.key];
    if (!componentLoader) continue;

    registerProfileSectionModule({
      kind: "admissions_case",
      definition: {
        ...def,
        version: SECTION_VERSION,
        componentId: `admissions_case:${def.key}`,
      },
      componentLoader,
    });
  }
}
