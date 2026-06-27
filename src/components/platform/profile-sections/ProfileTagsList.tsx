import type { PlatformEntityTag } from "@/lib/platform/tags/types";
import { ProfileBadge } from "@/components/platform/profile-workspace/ProfilePrimitives";

interface ProfileTagsListProps {
  tags: PlatformEntityTag[];
  title?: string;
}

export function ProfileTagsList({ tags, title = "Tags" }: ProfileTagsListProps) {
  if (tags.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase text-slate-400">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((entityTag) => {
          const tag = entityTag.platform_tags;
          const label = tag?.label ?? entityTag.tag_id;
          const tone =
            tag?.category === "medical" || tag?.category === "compliance"
              ? "rose"
              : tag?.category === "priority"
                ? "amber"
                : "brand";
          return <ProfileBadge key={entityTag.id} label={label} tone={tone} />;
        })}
      </div>
    </div>
  );
}
