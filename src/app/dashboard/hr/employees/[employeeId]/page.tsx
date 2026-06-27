import { notFound, redirect } from "next/navigation";

import "@/lib/platform/profile";

import { EmployeeProfileWorkspace } from "@/components/employees/profile/EmployeeProfileWorkspace";
import { loadProfileContextData } from "@/lib/platform/profile/page-context";
import { loadProfileSectionContributions } from "@/lib/platform/profile/sections";
import {
  loadEmployeeSectionData,
  resolveEmployeeProfile,
} from "@/lib/employees/profile";
import { isEmployeeProfileEnvelope } from "@/lib/employees/profile/types";
import { canAccessHrAdmin } from "@/lib/hr/access";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

interface EmployeeDetailPageProps {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ section?: string; tab?: string }>;
}

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: EmployeeDetailPageProps) {
  const ctx = await getIdentityContext();
  if (!ctx || !canAccessHrAdmin(ctx)) redirect("/dashboard");

  const { employeeId } = await params;
  const { section, tab } = await searchParams;

  const supabase = await createAuthClient();
  const profile = await resolveEmployeeProfile(supabase, employeeId, { section, tab });

  if (!profile) notFound();

  const envelope = profile.envelope;
  if (!isEmployeeProfileEnvelope(envelope)) notFound();

  const activeSection = profile.activeSection;

  const [activeSectionData, contextData] = await Promise.all([
    loadEmployeeSectionData(supabase, envelope, activeSection),
    loadProfileContextData(supabase, "employee", employeeId, envelope.organizationId),
  ]);

  const sectionContributions = await loadProfileSectionContributions(
    "employee",
    activeSection,
    supabase,
    envelope,
    activeSectionData
  );

  return (
    <EmployeeProfileWorkspace
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
