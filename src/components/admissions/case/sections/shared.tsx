import { ProfileSectionPlaceholder } from "@/components/platform/profile-workspace/ProfileSectionPlaceholder";

export function missing(title: string) {
  return <ProfileSectionPlaceholder title={title} status="live" />;
}
