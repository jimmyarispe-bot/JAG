import type { PlatformActivityEvent } from "@/lib/platform/activity/types";
import { ProfileCard, ProfileEmpty } from "@/components/platform/profile-workspace/ProfilePrimitives";

interface ActivityTimelineFeedProps {
  events: PlatformActivityEvent[];
  title?: string;
  emptyMessage?: string;
  limit?: number;
}

export function ActivityTimelineFeed({
  events,
  title = "Activity Timeline",
  emptyMessage = "No activity recorded",
  limit = 50,
}: ActivityTimelineFeedProps) {
  const visible = events.slice(0, limit);

  return (
    <ProfileCard title={title}>
      {visible.length === 0 ? (
        <ProfileEmpty>{emptyMessage}</ProfileEmpty>
      ) : (
        <ul className="space-y-3">
          {visible.map((event) => (
            <li key={event.id} className="border-l-2 border-brand-200 pl-3 text-sm">
              <div className="flex flex-wrap gap-2 text-xs uppercase text-slate-400">
                <span>{event.classification}</span>
                <span>{event.event_type.replace(/_/g, " ")}</span>
                <span>{new Date(event.occurred_at).toLocaleString()}</span>
              </div>
              <p className="font-medium text-slate-900">{event.title}</p>
              {event.summary && <p className="text-slate-500 line-clamp-2">{event.summary}</p>}
              {event.body && !event.summary && (
                <p className="text-slate-500 line-clamp-2">{event.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}
