import type { ProfileEnvelopeBase } from "@/lib/platform/profile/types";

/** Family-specific profile envelope — extends the generic platform envelope. */
export interface FamilyProfileEnvelope extends ProfileEnvelopeBase {
  profileKind: "family";
  familyId: string;
  familyName: string;
  billingEmail: string | null;
  status: string;
}

export function isFamilyProfileEnvelope(
  envelope: ProfileEnvelopeBase
): envelope is FamilyProfileEnvelope {
  return envelope.profileKind === "family";
}
