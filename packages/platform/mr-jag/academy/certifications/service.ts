/**
 * Certifications — course / persona / role / platform awards.
 */

import { randomUUID } from "node:crypto";
import {
  appendCertification,
  getPath,
  listCertifications,
  listLessons,
} from "../store";
import type { CertificationAward, CertificationKind } from "../types";
import type { MrJagPersona } from "../../types";

export function awardCertification(input: {
  kind: CertificationKind;
  title: string;
  persona?: MrJagPersona | null;
  userId: string;
  organizationId: string;
  lessonIds?: readonly string[];
  version?: string;
  expiresAt?: string | null;
}): CertificationAward {
  const award: CertificationAward = {
    id: `cert-award:${randomUUID()}`,
    kind: input.kind,
    title: input.title,
    persona: input.persona ?? null,
    userId: input.userId,
    organizationId: input.organizationId,
    lessonIds: Object.freeze([...(input.lessonIds ?? [])]),
    version: input.version ?? "1.0.0",
    completedAt: new Date().toISOString(),
    expiresAt: input.expiresAt ?? null,
  };
  return appendCertification(award);
}

export function awardPathCertification(input: {
  pathId: string;
  userId: string;
  organizationId: string;
  completedLessonIds: readonly string[];
}): CertificationAward | { error: string } {
  const path = getPath(input.pathId);
  if (!path) return { error: "Learning path not found." };
  const required = path.lessons.filter((l) => l.required).map((l) => l.lessonId);
  const missing = required.filter((id) => !input.completedLessonIds.includes(id));
  if (missing.length > 0) {
    return { error: `Missing required lessons: ${missing.join(", ")}` };
  }
  return awardCertification({
    kind: "persona",
    title: `${path.title} Certificate`,
    persona: path.persona,
    userId: input.userId,
    organizationId: input.organizationId,
    lessonIds: required,
    version: "1.0.0",
  });
}

export function listUserCertifications(
  organizationId: string,
  userId: string
): readonly CertificationAward[] {
  return listCertifications(organizationId, userId);
}

export function platformCertificationCandidates(): readonly string[] {
  return Object.freeze(
    listLessons()
      .filter((l) => l.certificationId)
      .map((l) => l.certificationId!)
  );
}
