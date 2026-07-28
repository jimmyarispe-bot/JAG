import { randomUUID } from "node:crypto";
import type { AcademyOsEntityBase } from "../store";

export function baseEntity(
  organizationId: string,
  createdBy: string,
  twinEntityId: string | null = null
): AcademyOsEntityBase {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    organizationId,
    createdAt: now,
    updatedAt: now,
    createdBy,
    twinEntityId,
  };
}
