"use client";

import { ActivityTimelineFeed } from "@/components/platform/profile-sections/ActivityTimelineFeed";
import { StaffTimelinePanel } from "@/components/admissions/StaffTimelinePanel";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function ActivitySection(props: ProfileSectionViewProps) {
  const data = props.data as {
    activity: Parameters<typeof ActivityTimelineFeed>[0]["events"];
    stageHistory: unknown[];
    audit: Parameters<typeof StaffTimelinePanel>[0]["entries"];
  } | null;
  if (!data) return missing("Activity");

  return (
    <div className="space-y-6">
      <ActivityTimelineFeed events={data.activity} title="Platform Activity" />
      <StaffTimelinePanel entries={data.audit} />
    </div>
  );
}
