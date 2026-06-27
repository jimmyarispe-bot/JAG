import type { ProfileSectionContext } from "@/lib/platform/profile/types";
import type { StudentRecord } from "@/lib/students/queries";
import type { ExecutiveSummary } from "@/lib/ssis/queries";

/** Shared page-level data passed to section loaders to avoid duplicate queries. */
export interface StudentSectionLoadContext extends ProfileSectionContext {
  student?: StudentRecord;
  summary?: ExecutiveSummary;
}

export function studentFromContext(ctx: ProfileSectionContext): StudentRecord | undefined {
  return ctx.student as StudentRecord | undefined;
}

export function summaryFromContext(ctx: ProfileSectionContext): ExecutiveSummary | undefined {
  return ctx.summary as ExecutiveSummary | undefined;
}
