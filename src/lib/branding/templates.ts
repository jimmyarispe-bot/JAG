import type { OrganizationBranding } from "@/lib/branding/types";

export type AdmissionsDecisionType = "accept" | "waitlist" | "deny" | "request_info";

export function buildAdmissionsDecisionEmail(
  decision: AdmissionsDecisionType,
  studentName: string,
  branding: OrganizationBranding,
  customNotes?: string
): { subject: string; body: string } {
  const school = branding.productName;
  const admissionsTeam = `${school} Admissions`;

  const templates: Record<AdmissionsDecisionType, { subject: string; body: string }> = {
    accept: {
      subject: `Welcome to ${school} — ${studentName} has been accepted`,
      body: `Dear Family,\n\nWe are delighted to inform you that ${studentName} has been accepted for enrollment at ${school}.\n\n${customNotes ?? "Our admissions team will contact you with next steps for enrollment."}\n\nWarm regards,\n${admissionsTeam}`,
    },
    waitlist: {
      subject: `${school} Admissions Update — ${studentName}`,
      body: `Dear Family,\n\nThank you for your interest in ${school}. ${studentName} has been placed on our waitlist.\n\n${customNotes ?? "We will notify you immediately if a seat becomes available."}\n\n${admissionsTeam}`,
    },
    deny: {
      subject: `${school} Admissions Decision — ${studentName}`,
      body: `Dear Family,\n\nThank you for applying to ${school}. After careful review, we are unable to offer enrollment to ${studentName} at this time.\n\n${customNotes ?? "We encourage you to reapply in a future enrollment period."}\n\n${admissionsTeam}`,
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
