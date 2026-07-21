import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function DocumentsSection(props: ProfileSectionViewProps) {
  const data = props.data as { items: unknown[]; percentComplete: number } | null;
  if (!data) return missing("Documents");
  return (
    <ProfileCard title="Document Checklist">
      {data.items.length === 0 ? (
        <ProfileEmpty>No checklist items</ProfileEmpty>
      ) : (
        <p className="text-sm text-slate-600">{data.percentComplete}% complete</p>
      )}
    </ProfileCard>
  );
}
