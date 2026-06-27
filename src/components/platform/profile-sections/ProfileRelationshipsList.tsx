import type { PlatformRelationship } from "@/lib/platform/relationships/types";
import { ProfileCard, ProfileEmpty } from "@/components/platform/profile-workspace/ProfilePrimitives";

interface ProfileRelationshipsListProps {
  relationships: PlatformRelationship[];
  title?: string;
}

export function ProfileRelationshipsList({
  relationships,
  title = "Platform Relationships",
}: ProfileRelationshipsListProps) {
  const active = relationships.filter((r) => r.status === "active");

  return (
    <ProfileCard title={title}>
      {active.length === 0 ? (
        <ProfileEmpty>No active relationships recorded</ProfileEmpty>
      ) : (
        <ul className="space-y-2 text-sm">
          {active.map((rel) => (
            <li key={rel.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-medium capitalize">
                {rel.relationship_type.replace(/\./g, " · ").replace(/_/g, " ")}
              </span>
              {rel.is_primary && <span className="ml-2 text-xs text-brand-600">Primary</span>}
              <p className="text-xs text-slate-500">
                {rel.from_entity_type} → {rel.to_entity_type}
              </p>
              {rel.notes && <p className="mt-1 text-slate-600">{rel.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}
