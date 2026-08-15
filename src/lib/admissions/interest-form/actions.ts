"use server";

import { listPublicProgramsForSchool } from "@/lib/admissions/interest-form/load";
import { resolveInterestFormOrganization } from "@/lib/admissions/interest-form/org-resolve";
import { submitPublishedInterestForm } from "@/lib/admissions/interest-form/submit";
import type { InterestProgramOption } from "@/lib/admissions/interest-form/types";

export async function submitInterestFormAction(formData: FormData) {
  return submitPublishedInterestForm(formData);
}

/**
 * Public program options for the selected school — org resolved server-side.
 */
export async function listInterestProgramsAction(
  schoolId: string
): Promise<InterestProgramOption[]> {
  if (!schoolId?.trim()) return [];
  const org = await resolveInterestFormOrganization();
  if (!org) return [];
  return listPublicProgramsForSchool({
    organizationId: org.organizationId,
    schoolId: schoolId.trim(),
  });
}
