import { resolveAdmissionsJagWork } from "@/lib/platform/jag-work/resolve-admissions-work";
import { resolveExecutiveJagWork } from "@/lib/platform/jag-work/resolve-executive-work";
import { resolveFinanceJagWork } from "@/lib/platform/jag-work/resolve-finance-work";
import { resolveHrJagWork } from "@/lib/platform/jag-work/resolve-hr-work";
import { resolveSchedulingJagWork } from "@/lib/platform/jag-work/resolve-scheduling-work";
import { resolveStudentsJagWork } from "@/lib/platform/jag-work/resolve-students-work";
import { resolveTeacherJagWork } from "@/lib/platform/jag-work/resolve-teacher-work";
import {
  WORKSPACE_WORK_PERSPECTIVES,
  type EnterpriseWorkspaceKey,
} from "@/lib/platform/jag-work/perspectives";
import type {
  JagWorkQueue,
  ResolveAdmissionsJagWorkInput,
  ResolveExecutiveJagWorkInput,
  ResolveFinanceJagWorkInput,
  ResolveHrJagWorkInput,
  ResolveSchedulingJagWorkInput,
  ResolveStudentsJagWorkInput,
  ResolveTeacherJagWorkInput,
} from "@/lib/platform/jag-work/types";

const LEGACY_PERSPECTIVE_MAP: Record<string, string> = {
  morning: "today",
  "my-day": "today",
  "todays-sessions": "today",
  instruction: "ready_to_teach",
  "session-delivery": "ready_to_teach",
  evidence: "ready_for_completion",
  artifacts: "ready_for_completion",
  workflow: "today",
};

export function resolveJagWorkPerspective(
  workspaceKey: EnterpriseWorkspaceKey,
  raw?: string | null
): string {
  const catalog = WORKSPACE_WORK_PERSPECTIVES[workspaceKey];
  const valid = new Set(catalog.map((p) => p.id));
  if (raw && valid.has(raw)) return raw;
  if (raw && LEGACY_PERSPECTIVE_MAP[raw]) return LEGACY_PERSPECTIVE_MAP[raw];
  return catalog[0]?.id ?? "today";
}

export type JagWorkQueueInput =
  | { workspaceKey: "teacher"; input: ResolveTeacherJagWorkInput }
  | { workspaceKey: "admissions"; input: ResolveAdmissionsJagWorkInput }
  | { workspaceKey: "students"; input: ResolveStudentsJagWorkInput }
  | { workspaceKey: "scheduling"; input: ResolveSchedulingJagWorkInput }
  | { workspaceKey: "finance"; input: ResolveFinanceJagWorkInput }
  | { workspaceKey: "hr"; input: ResolveHrJagWorkInput }
  | { workspaceKey: "executive"; input: ResolveExecutiveJagWorkInput };

/** Resolve JAG Work queue for any enterprise workspace. */
export async function resolveJagWorkQueue(request: JagWorkQueueInput): Promise<JagWorkQueue> {
  switch (request.workspaceKey) {
    case "teacher":
      return resolveTeacherJagWork(request.input);
    case "admissions":
      return resolveAdmissionsJagWork(request.input);
    case "students":
      return resolveStudentsJagWork(request.input);
    case "scheduling":
      return resolveSchedulingJagWork(request.input);
    case "finance":
      return resolveFinanceJagWork(request.input);
    case "hr":
      return resolveHrJagWork(request.input);
    case "executive":
      return resolveExecutiveJagWork(request.input);
    default:
      throw new Error(`Unsupported workspace for JAG Work: ${(request as { workspaceKey: string }).workspaceKey}`);
  }
}
