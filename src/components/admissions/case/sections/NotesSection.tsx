"use client";

import { ProfileNotesPanel } from "@/components/platform/profile-sections/ProfileNotesPanel";
import { NotesPanel } from "@/components/admissions/NotesPanel";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function NotesSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    platformNotes: Parameters<typeof ProfileNotesPanel>[0]["notes"];
    legacyNotes: Parameters<typeof NotesPanel>[0]["notes"];
  } | null;
  if (!data || !env) return missing("Notes");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileNotesPanel notes={data.platformNotes} title="Platform Notes" />
      <NotesPanel leadId={env.leadId} notes={data.legacyNotes} />
    </div>
  );
}
