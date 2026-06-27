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
}

export function isAdmissionsCaseProfileEnvelope(
  envelope: ProfileEnvelopeBase
): envelope is AdmissionsCaseProfileEnvelope {
  return envelope.profileKind === "admissions_case";
}
