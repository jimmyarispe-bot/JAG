import { isKnownActivityEventType } from "@/lib/platform/activity/catalog";
import type { RecordActivityInput } from "@/lib/platform/activity/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateRecordActivityInput(
  input: RecordActivityInput
): { ok: true } | { ok: false; error: string } {
  if (!input.eventType?.trim()) {
    return { ok: false, error: "Activity events require eventType" };
  }

  if (!isKnownActivityEventType(input.eventType)) {
    return { ok: false, error: `Unknown activity event type: ${input.eventType}` };
  }

  if (!input.entityType?.trim()) {
    return { ok: false, error: "Activity events require entityType" };
  }

  if (!input.entityId?.trim()) {
    return { ok: false, error: "Activity events require entityId" };
  }

  if (!UUID_RE.test(input.entityId)) {
    return { ok: false, error: "Activity events require a valid entityId UUID" };
  }

  if (!input.title?.trim()) {
    return { ok: false, error: "Activity events require title" };
  }

  if (!input.schoolId && !input.organizationId) {
    return { ok: false, error: "Activity events require schoolId or organizationId" };
  }

  if (input.schoolId && !UUID_RE.test(input.schoolId)) {
    return { ok: false, error: "Activity events require a valid schoolId UUID" };
  }

  if (input.organizationId && !UUID_RE.test(input.organizationId)) {
    return { ok: false, error: "Activity events require a valid organizationId UUID" };
  }

  if (input.relatedEntityId && !UUID_RE.test(input.relatedEntityId)) {
    return { ok: false, error: "Activity events require a valid relatedEntityId UUID" };
  }

  if (input.sourceId && !UUID_RE.test(input.sourceId)) {
    return { ok: false, error: "Activity events require a valid sourceId UUID" };
  }

  return { ok: true };
}
