import { notFound } from "next/navigation";

import "@/lib/platform/profile";

import { StudentProfileWorkspace } from "@/components/students/profile/StudentProfileWorkspace";
import { getEntityTags } from "@/lib/platform/tags";
import { getPinnedNotes, getStudentNotes } from "@/lib/platform/notes";
import { loadProfileSectionContributions } from "@/lib/platform/profile/sections";
import {
  loadStudentSectionData,
  resolveStudentProfile,
} from "@/lib/students/profile";
import { getStudentById } from "@/lib/students/queries";
import { getStudentExecutiveSummary } from "@/lib/ssis/queries";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { isStudentProfileEnvelope } from "@/lib/students/profile/types";

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; tab?: string }>;
}

export default async function StudentDetailPage({ params, searchParams }: StudentDetailPageProps) {
  const { id } = await params;
  const { section, tab } = await searchParams;

  const supabase = await createAuthClient();
  const profile = await resolveStudentProfile(supabase, id, { section, tab });

  if (!profile) notFound();

  const envelope = profile.envelope;
  if (!isStudentProfileEnvelope(envelope)) notFound();

  const student = await getStudentById(id);
  if (!student) notFound();

  const activeSection = profile.activeSection;

  const summary = await getStudentExecutiveSummary(id);

  const [activeSectionData, pinnedNotes, recentNotes, entityTags] = await Promise.all([
    loadStudentSectionData(supabase, envelope, activeSection, { student, summary }),
    getPinnedNotes(supabase, "student", id),
    getStudentNotes(supabase, id, { limit: 10 }),
    envelope.organizationId
      ? getEntityTags(supabase, "student", id)
      : Promise.resolve([]),
  ]);

  const sectionContributions = await loadProfileSectionContributions(
    "student",
    activeSection,
    supabase,
    envelope,
    activeSectionData
  );

  const notesForContext = pinnedNotes.length > 0 ? pinnedNotes : recentNotes;

  return (
    <StudentProfileWorkspace
      envelope={envelope}
      navigation={profile.navigation}
      student={student}
      summary={summary}
      activeSection={activeSection}
      activeSectionData={activeSectionData}
      pinnedNotes={notesForContext}
      entityTags={entityTags}
      sectionContributions={sectionContributions}
    />
  );
}
