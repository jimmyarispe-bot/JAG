"use client";

import { DecisionWizard } from "@/components/admissions/DecisionWizard";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function DecisionsSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    applicationId: string | null;
    studentName: string;
  } | null;
  if (!data || !env) return missing("Decisions");

  return (
    <DecisionWizard
      leadId={env.leadId}
      applicationId={data.applicationId}
      studentName={data.studentName}
    />
  );
}
