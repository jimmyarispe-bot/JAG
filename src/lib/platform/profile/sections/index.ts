export type {
  ProfileSectionComponent,
  ProfileSectionContributions,
  ProfileSectionModuleDefinition,
  ProfileSectionViewProps,
  RegisterProfileSectionModuleInput,
} from "@/lib/platform/profile/sections/types";
export {
  registerProfileSectionModule,
  getProfileSectionComponent,
  getProfileSectionComponentLoader,
  loadProfileSectionComponent,
  loadProfileSectionContributions,
  isProfileSectionModuleRegistered,
} from "@/lib/platform/profile/sections/register-module";
