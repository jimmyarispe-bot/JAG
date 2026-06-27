import type { ProfileEnvelopeBase } from "@/lib/platform/profile/types";

/** Student-specific profile envelope — extends the generic platform envelope. */
export interface StudentProfileEnvelope extends ProfileEnvelopeBase {
  profileKind: "student";
  studentId: string;
  familyId: string | null;
  gradeLevel: string | null;
  program: string | null;
  enrollmentStatus: string;
  lifecycleStage: string | null;
  photoUrl: string | null;
  preferredName: string | null;
}

export function isStudentProfileEnvelope(
  envelope: ProfileEnvelopeBase
): envelope is StudentProfileEnvelope {
  return envelope.profileKind === "student";
}
