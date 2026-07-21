import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function VisitsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    tours: Record<string, unknown>[];
    interviews: Record<string, unknown>[];
  } | null;
  if (!data) return missing("Tours & Interviews");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileCard title="Tours">
        {data.tours.length === 0 ? (
          <ProfileEmpty>No tours scheduled</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.tours.map((t) => (
              <li key={String(t.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {String(t.scheduled_at)} — {String(t.tour_type)}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
      <ProfileCard title="Interviews">
        {data.interviews.length === 0 ? (
          <ProfileEmpty>No interviews scheduled</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.interviews.map((i) => (
              <li key={String(i.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {String(i.scheduled_at)} — {String(i.interview_status)}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
    </div>
  );
}
