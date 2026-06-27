import { ProfileCard, ProfileEmpty } from "@/components/platform/profile-workspace/ProfilePrimitives";

interface ProfilePlaceholderPanelProps {
  title: string;
  message: string;
}

export function ProfilePlaceholderPanel({ title, message }: ProfilePlaceholderPanelProps) {
  return (
    <ProfileCard title={title}>
      <ProfileEmpty>{message}</ProfileEmpty>
    </ProfileCard>
  );
}
