import type { AdmissionsPipelineStageKey } from "@/lib/admissions/registry";
import type { ProfileEnvelopeBase } from "@/lib/platform/profile/types";
import type { LeadStageValue } from "@/lib/constants/admissions";

/** Admissions Case profile envelope — workflow container over admissions_leads. */
export interface AdmissionsCaseProfileEnvelope extends ProfileEnvelopeBase {
  profileKind: "admissions_case";
  caseId: string;
  leadId: string;
  leadStage: LeadStageValue | string;
  pipelineStage: AdmissionsPipelineStageKey | null;
  pipelineStageLabel: string;
  guardianEmail: string | null;
  program: string | null;
  inquiryDate: string | null;
  stageEnteredAt: string | null;
  /*
     The facts staff need on every screen, not just the one that happens to
     render them. Heather does not open a child's card to admire the stage
     badge - she opens it to call the parent, and the number was four tabs away
     on Prospective Family. These ride on the envelope so the header can show
     them beside the name whatever section is open.
  */
  schoolName: string | null;
  applyingForGrade: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  /** From the interest form's `desired_start_date` answer; no column holds it. */
  desiredStartDate: string | null;
}

export function isAdmissionsCaseProfileEnvelope(
  envelope: ProfileEnvelopeBase
): envelope is AdmissionsCaseProfileEnvelope {
  return envelope.profileKind === "admissions_case";
}
