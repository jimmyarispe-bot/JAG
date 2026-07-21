"use client";

import { TasksPanel } from "@/components/admissions/TasksPanel";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function TasksSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as { tasks: Parameters<typeof TasksPanel>[0]["tasks"] } | null;
  if (!data || !env) return missing("Tasks");
  return <TasksPanel leadId={env.leadId} tasks={data.tasks} />;
}
