import { registerProfileSectionModule } from "@/lib/platform/profile/sections";
import type { ProfileSectionComponent } from "@/lib/platform/profile/sections/types";
import type { ProfileSectionModuleDefinition } from "@/lib/platform/profile/sections/types";
import { FAMILY_PROFILE_SECTIONS } from "@/lib/families/profile/sections";
import {
  loadActivityContributions,
  loadCommunicationsContributions,
  loadDocumentsContributions,
  loadNotesContributions,
  loadOverviewContributions,
  loadTuitionContributions,
} from "@/components/families/profile/sections/section-contributions";

const SECTION_VERSION = "1.0.0";

const SECTION_COMPONENT_LOADERS: Record<string, () => Promise<ProfileSectionComponent>> = {
  overview: () =>
    import("@/components/families/profile/sections/FamilyOverviewSection").then(
      (module) => module.FamilyOverviewSection
    ),
  household: () =>
    import("@/components/families/profile/sections/FamilyRelationshipSections").then(
      (module) => module.HouseholdSection
    ),
  "parents-guardians": () =>
    import("@/components/families/profile/sections/FamilyRelationshipSections").then(
      (module) => module.ParentsGuardiansSection
    ),
  students: () =>
    import("@/components/families/profile/sections/FamilyRelationshipSections").then(
      (module) => module.StudentsSection
    ),
  "emergency-contacts": () =>
    import("@/components/families/profile/sections/FamilySupportSections").then(
      (module) => module.EmergencyContactsSection
    ),
  "authorized-pickup": () =>
    import("@/components/families/profile/sections/FamilySupportSections").then(
      (module) => module.AuthorizedPickupSection
    ),
  transportation: () =>
    import("@/components/families/profile/sections/FamilySupportSections").then(
      (module) => module.TransportationSection
    ),
  medical: () =>
    import("@/components/families/profile/sections/FamilySupportSections").then(
      (module) => module.MedicalSection
    ),
  "financial-responsibility": () =>
    import("@/components/families/profile/sections/FamilyFinancialSections").then(
      (module) => module.FinancialResponsibilitySection
    ),
  tuition: () =>
    import("@/components/families/profile/sections/FamilyFinancialSections").then(
      (module) => module.TuitionSection
    ),
  scholarships: () =>
    import("@/components/families/profile/sections/FamilyFinancialSections").then(
      (module) => module.ScholarshipsSection
    ),
  communications: () =>
    import("@/components/families/profile/sections/FamilyPlatformSections").then(
      (module) => module.CommunicationsSection
    ),
  documents: () =>
    import("@/components/families/profile/sections/FamilyOperationsSections").then(
      (module) => module.DocumentsSection
    ),
  forms: () =>
    import("@/components/families/profile/sections/FamilyOperationsSections").then(
      (module) => module.FormsSection
    ),
  calendar: () =>
    import("@/components/families/profile/sections/FamilyOperationsSections").then(
      (module) => module.CalendarSection
    ),
  notes: () =>
    import("@/components/families/profile/sections/FamilyPlatformSections").then(
      (module) => module.NotesSection
    ),
  activity: () =>
    import("@/components/families/profile/sections/FamilyPlatformSections").then(
      (module) => module.ActivitySection
    ),
  "ai-insights": () =>
    import("@/components/families/profile/sections/FamilyPlatformSections").then(
      (module) => module.AiInsightsSection
    ),
  audit: () =>
    import("@/components/families/profile/sections/FamilyPlatformSections").then(
      (module) => module.AuditSection
    ),
};

const SECTION_CONTRIBUTIONS: Partial<
  Record<string, ProfileSectionModuleDefinition["loadContributions"]>
> = {
  overview: loadOverviewContributions,
  documents: loadDocumentsContributions,
  notes: loadNotesContributions,
  activity: loadActivityContributions,
  communications: loadCommunicationsContributions,
  tuition: loadTuitionContributions,
};

/** Register all family profile section modules with lazy-loaded UI. */
export function registerFamilyProfileSectionModules(): void {
  for (const def of FAMILY_PROFILE_SECTIONS) {
    const componentLoader = SECTION_COMPONENT_LOADERS[def.key];
    if (!componentLoader) continue;

    registerProfileSectionModule({
      kind: "family",
      definition: {
        ...def,
        version: SECTION_VERSION,
        componentId: `family:${def.key}`,
        loadContributions: SECTION_CONTRIBUTIONS[def.key],
      },
      componentLoader,
    });
  }
}
