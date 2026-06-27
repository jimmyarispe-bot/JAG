import { notFound, redirect } from "next/navigation";

import "@/lib/platform/profile";

import { AdmissionsCaseProfileWorkspace } from "@/components/admissions/case/AdmissionsCaseProfileWorkspace";
import {
  ADMISSIONS_CASE_LEGACY_REDIRECTS,
  loadAdmissionsCaseSectionData,
  resolveAdmissionsCaseProfile,
} from "@/lib/admissions/profile";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { loadProfileContextData } from "@/lib/platform/profile/page-context";
import { buildLegacyProfileSectionRedirectUrl } from "@/lib/platform/profile/params";
import { loadProfileSectionContributions } from "@/lib/platform/profile/sections";
import { processCommunicationQueue } from "@/lib/admissions/communications/engine";
import { processWorkflowQueue } from "@/lib/admissions/automation/queue";
import { createAuthClient } from "@/lib/supabase/server-auth";

interface AdmissionsCasePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; tab?: string }>;
}

export default async function AdmissionsCasePage({
  params,
  searchParams,
}: AdmissionsCasePageProps) {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const { section, tab } = await searchParams;

  const legacyRedirect = buildLegacyProfileSectionRedirectUrl(
    "/dashboard/admissions/cases",
    id,
    { section, tab },
    ADMISSIONS_CASE_LEGACY_REDIRECTS
  );
  if (legacyRedirect) redirect(legacyRedirect);

  const supabase = await createAuthClient();
  await processWorkflowQueue(supabase);
  await processCommunicationQueue(supabase);

  const profile = await resolveAdmissionsCaseProfile(supabase, id, { section, tab });
  if (!profile) notFound();

  const envelope = profile.envelope;
  if (!isAdmissionsCaseProfileEnvelope(envelope)) notFound();

  const activeSection = profile.activeSection;

  const [activeSectionData, contextData] = await Promise.all([
    loadAdmissionsCaseSectionData(supabase, envelope, activeSection),
    loadProfileContextData(supabase, "admissions_lead", id, envelope.organizationId),
  ]);

  const sectionContributions = await loadProfileSectionContributions(
    "admissions_case",
    activeSection,
    supabase,
    envelope,
    activeSectionData
  );

  return (
    <AdmissionsCaseProfileWorkspace
      envelope={envelope}
      navigation={profile.navigation}
      activeSection={activeSection}
      activeSectionData={activeSectionData}
      pinnedNotes={contextData.notesForContext}
      entityTags={contextData.entityTags}
      sectionContributions={sectionContributions}
    />
  );
}
