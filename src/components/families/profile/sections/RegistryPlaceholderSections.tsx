import { ProfileSectionPlaceholder } from "@/components/platform/profile-workspace/ProfileSectionPlaceholder";
import { getProfileSection } from "@/lib/platform/profile/registry";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";

/** Registry-phase placeholder — replaced by real section modules in Phase 3. */
export function FamilyRegistrySection({ sectionKey }: ProfileSectionViewProps) {
  const definition = getProfileSection("family", sectionKey);
  return (
    <ProfileSectionPlaceholder
      title={definition?.label ?? sectionKey}
      status={definition?.status ?? "placeholder"}
    />
  );
}
