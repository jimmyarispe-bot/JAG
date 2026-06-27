import type { ProfileEnvelopeBase } from "@/lib/platform/profile/types";

/** Employee-specific profile envelope — extends the generic platform envelope. */
export interface EmployeeProfileEnvelope extends ProfileEnvelopeBase {
  profileKind: "employee";
  employeeId: string;
  userId: string | null;
  employeeType: string;
  employmentStatus: string;
  hireDate: string | null;
  department: string | null;
  supervisorEmployeeId: string | null;
  jobTitle: string | null;
  contactEmail: string | null;
}

export function isEmployeeProfileEnvelope(
  envelope: ProfileEnvelopeBase
): envelope is EmployeeProfileEnvelope {
  return envelope.profileKind === "employee";
}
