import { ProfileRelationshipsList } from "@/components/platform/profile-sections/ProfileRelationshipsList";
import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import type { CaseDerivedLink } from "@/lib/admissions/case/orchestration";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import type { PlatformRelationship } from "@/lib/platform/relationships/types";
import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { missing } from "./shared";

function DerivedRelationshipsList({ links }: { links: CaseDerivedLink[] }) {
  return (
    <ProfileCard title="Case Links">
      {links.length === 0 ? (
        <ProfileEmpty>No linked entities</ProfileEmpty>
      ) : (
        <ul className="space-y-2 text-sm">
          {links.map((link) => (
            <li key={link.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-medium capitalize">
                {link.relationshipType.replace(/\./g, " · ").replace(/_/g, " ")}
              </span>
              {link.href ? (
                <ActionChip href={link.href} size="sm" className="mt-1">
                  {link.label}
                </ActionChip>
              ) : (
                <p className="mt-1 text-slate-600">{link.label}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}

export function RelationshipsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    platformRelationships: PlatformRelationship[];
    derived: CaseDerivedLink[];
  } | null;
  if (!data) return missing("Relationships");

  return (
    <div className="space-y-6">
      <DerivedRelationshipsList links={data.derived} />
      <ProfileRelationshipsList relationships={data.platformRelationships} title="Platform Relationships" />
    </div>
  );
}
