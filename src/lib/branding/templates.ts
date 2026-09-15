import type { OrganizationBranding } from "@/lib/branding/types";

export type AdmissionsDecisionType = "accept" | "waitlist" | "deny" | "request_info";

/**
 * THERE IS NO DECLINE LETTER HERE, AND THAT IS DELIBERATE.
 *
 * This file used to carry one:
 *
 *   "After careful review, we are unable to offer enrollment to {studentName}
 *    at this time. We encourage you to reapply in a future enrollment period."
 *
 * Nobody approved it. It was a third copy of a letter that already existed
 * twice in the database — one of those also unapproved (student_declined_email,
 * deleted in migration 366) and one written for this school and signed off
 * (application_declined_email, migration 247).
 *
 * Three versions of the hardest email in the process, two of them written by
 * nobody in particular, and the good one reachable from only one of the two
 * gates that decline a family.
 *
 * Deleted 15 September 2026 on Jimmy's instruction. `deny` now returns null,
 * and the caller must record that no approved letter exists rather than
 * inventing wording at the moment it matters most. A missing letter is a gap
 * somebody notices; a plausible one is a gap nobody ever does.
 */
export function buildAdmissionsDecisionEmail(
  decision: AdmissionsDecisionType,
  studentName: string,
  branding: OrganizationBranding,
  customNotes?: string
): { subject: string; body: string } | null {
  const school = branding.productName;
  const admissionsTeam = `${school} Admissions`;

  if (decision === "deny") return null;

  const templates: Record<Exclude<AdmissionsDecisionType, "deny">, { subject: string; body: string }> = {
    accept: {
      subject: `Welcome to ${school} — ${studentName} has been accepted`,
      body: `Dear Family,\n\nWe are delighted to inform you that ${studentName} has been accepted for enrollment at ${school}.\n\n${customNotes ?? "Our admissions team will contact you with next steps for enrollment."}\n\nWarm regards,\n${admissionsTeam}`,
    },
    waitlist: {
      subject: `${school} Admissions Update — ${studentName}`,
      body: `Dear Family,\n\nThank you for your interest in ${school}. ${studentName} has been placed on our waitlist.\n\n${customNotes ?? "We will notify you immediately if a seat becomes available."}\n\n${admissionsTeam}`,
    },
    request_info: {
      subject: `Additional Information Needed — ${studentName}`,
      body: `Dear Family,\n\nWe are reviewing ${studentName}'s application and need additional information before we can proceed.\n\n${customNotes ?? "Please log in to your admissions portal to upload the requested documents."}\n\n${admissionsTeam}`,
    },
  };

  return templates[decision];
}

export function buildBoardReportHeader(branding: OrganizationBranding): string {
  return `# ${branding.productName} Executive Board Report`;
}

export function buildFamilyCalendarName(branding: OrganizationBranding): string {
  return `${branding.productName} Family Calendar`;
}

export function buildCalendarProdId(branding: OrganizationBranding, component: string): string {
  const slug = branding.productName.replace(/[^a-zA-Z0-9]/g, "");
  return `PRODID:-//${slug}//${component}//EN`;
}
