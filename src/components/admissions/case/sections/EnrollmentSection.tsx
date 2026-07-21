"use client";

import { EnrollmentPacketPanel } from "@/components/admissions/EnrollmentPacketPanel";
import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";

export function EnrollmentSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    packet: Parameters<typeof EnrollmentPacketPanel>[0]["packet"] | null;
    applicationId: string | null;
    leadId: string;
    signerEmail: string;
    studentId?: string | null;
  } | null;
  if (!data?.packet || !data.applicationId) {
    return (
      <ProfileCard title="Enrollment">
        <ProfileEmpty>No enrollment packet generated</ProfileEmpty>
      </ProfileCard>
    );
  }

  return (
    <EnrollmentPacketPanel
      packet={data.packet}
      applicationId={data.applicationId}
      leadId={data.leadId}
      signerEmail={data.signerEmail}
      studentId={data.studentId}
    />
  );
}
