import { notFound, redirect } from "next/navigation";

import "@/lib/platform/profile";

import { FamilyProfileWorkspace } from "@/components/families/profile/FamilyProfileWorkspace";
import {
  FAMILY_PROFILE_LEGACY_REDIRECTS,
  loadFamilySectionData,
  resolveFamilyProfile,
} from "@/lib/families/profile";
import { isFamilyProfileEnvelope } from "@/lib/families/profile/types";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { loadProfileContextData } from "@/lib/platform/profile/page-context";
import { buildLegacyProfileSectionRedirectUrl } from "@/lib/platform/profile/params";
import { loadProfileSectionContributions } from "@/lib/platform/profile/sections";
import { createAuthClient } from "@/lib/supabase/server-auth";

interface FamilyDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; tab?: string }>;
}

export default async function FamilyDetailPage({
  params,
  searchParams,
}: FamilyDetailPageProps) {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const { section, tab } = await searchParams;

  const legacyRedirect = buildLegacyProfileSectionRedirectUrl(
    "/dashboard/families",
    id,
    { section, tab },
    FAMILY_PROFILE_LEGACY_REDIRECTS
  );
  if (legacyRedirect) redirect(legacyRedirect);

  const supabase = await createAuthClient();
  const profile = await resolveFamilyProfile(supabase, id, { section, tab });

  if (!profile) notFound();

  const envelope = profile.envelope;
  if (!isFamilyProfileEnvelope(envelope)) notFound();

  const activeSection = profile.activeSection;

  const [activeSectionData, contextData] = await Promise.all([
    loadFamilySectionData(supabase, envelope, activeSection),
    loadProfileContextData(supabase, "family", id, envelope.organizationId),
  ]);

  const sectionContributions = await loadProfileSectionContributions(
    "family",
    activeSection,
    supabase,
    envelope,
    activeSectionData
  );

  return (
    <FamilyProfileWorkspace
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
