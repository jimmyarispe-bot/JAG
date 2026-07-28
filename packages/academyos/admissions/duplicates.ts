import { listApplicants } from "./store";
import type { DuplicateMatch, GuardianInfo, StudentInfo } from "./types";

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function phoneNorm(s: string): string {
  return s.replace(/\D/g, "");
}

export function findDuplicateApplicants(input: {
  organizationId: string;
  student: StudentInfo;
  guardian: GuardianInfo;
  excludeApplicantId?: string;
}): readonly DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const first = norm(input.student.firstName);
  const last = norm(input.student.lastName);
  const dob = input.student.dateOfBirth.trim();
  const email = norm(input.guardian.email);
  const phone = phoneNorm(input.guardian.phone);

  for (const a of listApplicants(input.organizationId)) {
    if (input.excludeApplicantId && a.id === input.excludeApplicantId) continue;
    const matchedOn: string[] = [];
    let score = 0;

    const nameMatch =
      norm(a.student.firstName) === first && norm(a.student.lastName) === last;
    if (nameMatch) {
      matchedOn.push("Name");
      score += 40;
    }
    if (dob && a.student.dateOfBirth === dob) {
      matchedOn.push("Date of Birth");
      score += 30;
    }
    if (email && norm(a.guardian.email) === email) {
      matchedOn.push("Parent Email");
      score += 20;
    }
    if (phone && phoneNorm(a.guardian.phone) === phone) {
      matchedOn.push("Parent Phone");
      score += 20;
    }

    if (matchedOn.length === 0) continue;
    // Require at least name+something or two strong signals
    if (score < 50 && !(nameMatch && matchedOn.length >= 2)) continue;

    matches.push({
      applicantId: a.id,
      score: Math.min(100, score),
      matchedOn: Object.freeze(matchedOn),
      studentName: `${a.student.firstName} ${a.student.lastName}`,
      stage: a.stage,
    });
  }

  return Object.freeze(matches.sort((a, b) => b.score - a.score));
}
