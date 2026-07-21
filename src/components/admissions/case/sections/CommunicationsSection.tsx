"use client";

import { CommunicationTimeline } from "@/components/admissions/CommunicationTimeline";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function CommunicationsSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    timeline: Parameters<typeof CommunicationTimeline>[0]["timeline"];
    communications: Parameters<typeof CommunicationTimeline>[0]["communications"];
    pendingQueue: Parameters<typeof CommunicationTimeline>[0]["pendingQueue"];
    applicationId: string | null;
    guardianEmail: string | null;
  } | null;
  if (!data || !env) return missing("Communications");

  return (
    <CommunicationTimeline
      leadId={env.leadId}
      applicationId={data.applicationId ?? null}
      guardianEmail={data.guardianEmail ?? null}
      timeline={data.timeline}
      communications={data.communications}
      pendingQueue={data.pendingQueue}
    />
  );
}
