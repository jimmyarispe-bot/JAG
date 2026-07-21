"use client";

import { AdmissionsChecklistPanel } from "@/components/admissions/AdmissionsChecklistPanel";
import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function ApplicationsSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    applications: Record<string, unknown>[];
    checklist: { items: unknown[]; percentComplete: number } | null;
    primaryApplicationId: string | null;
  } | null;
  if (!data || !env) return missing("Applications");

  return (
    <div className="space-y-6">
      {data.primaryApplicationId && data.checklist ? (
        <AdmissionsChecklistPanel
          applicationId={data.primaryApplicationId}
          leadId={env.leadId}
          items={data.checklist.items as Parameters<typeof AdmissionsChecklistPanel>[0]["items"]}
          percentComplete={data.checklist.percentComplete}
        />
      ) : (
        <ProfileCard title="Applications">
          <ProfileEmpty>No application on file</ProfileEmpty>
        </ProfileCard>
      )}
    </div>
  );
}
