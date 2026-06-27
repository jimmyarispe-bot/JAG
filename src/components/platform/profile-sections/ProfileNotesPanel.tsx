import type { PlatformNote } from "@/lib/platform/notes/types";
import { ProfileCard, ProfileEmpty } from "@/components/students/profile/shared/ProfilePrimitives";

interface ProfileNotesPanelProps {
  notes: PlatformNote[];
  title?: string;
  limit?: number;
}

export function ProfileNotesPanel({
  notes,
  title = "Notes",
  limit = 10,
}: ProfileNotesPanelProps) {
  const visible = notes.slice(0, limit);

  return (
    <ProfileCard title={title}>
      {visible.length === 0 ? (
        <ProfileEmpty>No notes on file</ProfileEmpty>
      ) : (
        <ul className="space-y-3">
          {visible.map((note) => (
            <li key={note.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {note.is_pinned && (
                  <span className="text-xs font-medium text-brand-600">Pinned</span>
                )}
                <span className="text-xs capitalize text-slate-400">{note.category}</span>
              </div>
              <p className="mt-1 font-medium text-slate-900 line-clamp-2">{note.body}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}
